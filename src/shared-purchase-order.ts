import type { DatabaseSync as SqliteDatabase } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { LocalDurableLifecycleStore, DEFAULT_AGGREGATE_EXPOSURE_RULE, createOperatorAuthorityEvidence, type AggregateExposureRule, type DurableStoreSnapshot, type OperatorAuthorityEvidence } from "./durable-action-lifecycle.js";
import { McpExactActionGateway, validateMcpBusinessPolicyRequest, type EvaluationLifecycleStore, type McpBusinessPolicyRequest, type McpBusinessPolicyResult } from "./mcp-exact-action-gateway.js";
import { createPurchaseOrderStateBinding, purchaseOrderStateBindingMatches, validatePurchaseOrderBusinessState, type PurchaseOrderBusinessState, type PurchaseOrderStateBinding } from "./purchase-order-state-binding.js";
import { signedStateAuthorityMatches } from "./purchase-order-connector.js";
import { createCanonicalPayloadHash as hash } from "./local-signed-proof.js";
import { PURCHASING_DEMO_EXECUTION_TIME as AT } from "./local-purchasing-lifecycle-demo.js";

if (Number(process.versions.node.split(".")[0]) < 24) {
  throw new Error("ATG_SHARED_WORKER_REQUIRES_NODE_24: the optional shared-worker export requires Node 24+; use the legacy plugin root on Node 20.");
}
// Load only after the runtime check; legacy imports never reach this optional module.
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
const VERSION = "atg.shared-purchase-order.local.v2";
type SharedFaultStage = "authority_before_commit" | "issuance_committed" | "fence_registered" | "destination_committed" | "destination_fenced";
interface Approval { id: string; request: McpBusinessPolicyRequest; binding: PurchaseOrderStateBinding; decision: McpBusinessPolicyResult; token: string | null }
interface Authority { version: string; storeId: string; rule: AggregateExposureRule; core: DurableStoreSnapshot | null; approvals: Approval[] }
interface RecordEntry { approvalId: string; gatePassId: string; nonce: string; actionDigest: string; requestDigest: string; proposedAction: McpBusinessPolicyRequest["proposedAction"]; binding: PurchaseOrderStateBinding }
interface Destination { version: string; storeId: string; state: PurchaseOrderBusinessState; fences: { gatePassId: string; token: string | null }[]; records: RecordEntry[] }
export interface WorkerClaim { approvalId: string; token: string }
export interface SharedResult { outcome: "EXECUTED" | "NOT_EXECUTED" | "REJECTED" | "UNKNOWN"; reason: string; automaticRetryPermitted: false }
function result(outcome: SharedResult["outcome"], reason: string): SharedResult { return { outcome, reason, automaticRetryPermitted: false }; }

/** Two independent databases. Every operation uses authority -> destination lock order. */
export class SharedPurchaseOrder {
  readonly #storeId: string;
  readonly #authority: SqliteDatabase;
  readonly #destination: SqliteDatabase;
  readonly #rule: AggregateExposureRule;
  readonly #faultInjector: ((stage: SharedFaultStage) => void) | undefined;
  readonly capabilities = Object.freeze({ localOnly: true, syntheticOnly: true, productionReady: false, automaticRetry: false, multipleProcesses: true });

  static initialise(directory: string, rule = DEFAULT_AGGREGATE_EXPOSURE_RULE): void {
    if (!isAbsolute(directory)) throw new Error("ABSOLUTE_DIRECTORY_REQUIRED");
    validateRule(rule);
    // Exclusive directory creation: partial initialisation is never silently repaired.
    mkdirSync(directory, { mode: 0o700 });
    const authority = openDatabase(join(directory, "authority.sqlite"), true);
    let destination: SqliteDatabase | undefined;
    try {
      destination = openDatabase(join(directory, "destination.sqlite"), true);
      authority.exec("CREATE TABLE snapshot (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, digest TEXT NOT NULL) STRICT");
      destination.exec("CREATE TABLE snapshot (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, digest TEXT NOT NULL) STRICT");
      const storeId = randomUUID();
      save(authority, { version: VERSION, storeId, rule, core: null, approvals: [] });
      save(destination, { version: VERSION, storeId, state: { orderId: "PO-SYNTHETIC-001", orderVersion: 1, supplierBankVersion: 1, supplierBankReference: "fixture-bank-A", revision: 1 }, fences: [], records: [] });
      writeFileSync(join(directory, "ready"), VERSION, { flag: "wx" });
    } finally { authority.close(); destination?.close(); }
  }

  constructor(options: { stateDirectory: string; rule?: AggregateExposureRule; syntheticFaultInjector?: (stage: SharedFaultStage) => void }) {
    this.#faultInjector = options.syntheticFaultInjector;
    const dir = options.stateDirectory;
    if (!isAbsolute(dir) || lstatSync(dir).isSymbolicLink() || readFileSync(join(dir, "ready"), "utf8") !== VERSION) throw new Error("SHARED_STORE_NOT_READY");
    this.#authority = openDatabase(join(dir, "authority.sqlite"));
    try { this.#destination = openDatabase(join(dir, "destination.sqlite")); }
    catch (error) { this.#authority.close(); throw error; }
    try {
      const a = load<Authority>(this.#authority); validateRule(a.rule);
      if (typeof a.storeId !== "string" || !/^[a-f0-9-]{36}$/.test(a.storeId)) throw new Error("SHARED_STORE_ID_INVALID");
      this.#storeId = a.storeId;
      this.#rule = structuredClone(a.rule);
      if (options.rule && hash(options.rule) !== hash(a.rule)) throw new Error("SHARED_POLICY_MISMATCH");
      this.#tx(() => undefined); this.getBusinessState();
    } catch (error) { this.close(); throw error; }
  }

  #tx<T>(operation: (a: Authority, core: LocalDurableLifecycleStore) => T): T {
    return transaction(this.#authority, () => {
      const a = load<Authority>(this.#authority);
      if (a.storeId !== this.#storeId || hash(a.rule) !== hash(this.#rule) || !Array.isArray(a.approvals)) throw new Error("SHARED_POLICY_OR_APPROVALS_INVALID");
      const core = new LocalDurableLifecycleStore({ transactionalSnapshot: { state: a.core, persist: state => { a.core = state; } } });
      for (const approval of a.approvals) validateApproval(approval);
      const value = operation(a, core);
      if (value instanceof Promise) throw new Error("ASYNC_TRANSACTION_REFUSED");
      a.core = core.snapshot(); save(this.#authority, a);
      this.#faultInjector?.("authority_before_commit");
      return value;
    });
  }

  async approve(value: unknown): Promise<{ approvalId: string | null; decision: McpBusinessPolicyResult }> {
    const request = structuredClone(validateMcpBusinessPolicyRequest(value));
    const binding = createPurchaseOrderStateBinding(this.getBusinessState(), request);
    // Core issuance (including budget check and OUTSTANDING exposure) is one SQLite transaction.
    const adapter: EvaluationLifecycleStore = {
      issue: input => {
        const issued = this.#tx((_a, core) => core.issue(input));
        if (issued.issued) this.#faultInjector?.("issuance_committed");
        return issued;
      },
      previewExposure: input => this.#tx((_a, core) => core.previewExposure(input)),
      isEmergencyStopActive: () => this.#tx((_a, core) => core.isEmergencyStopActive()),
      recordNonAuthorisingDecision: input => this.#tx((_a, core) => core.recordNonAuthorisingDecision(input)),
    };
    const decision = await new McpExactActionGateway({ durableStore: adapter, exposureRule: this.#rule }).evaluateAction(request, { approvedPurchaseOrderStateBinding: binding }) as McpBusinessPolicyResult;
    if (!decision.gatePass || !decision.policyDecisionReceipt || !decision.authorising || request.mode !== "enforced") return { approvalId: null, decision };
    const id = randomUUID();
    this.#tx(a => { a.approvals.push({ id, request, binding, decision: structuredClone(decision), token: null }); });
    // A crash between issuance and approval storage retains exposure; never recreates an approval.
    return { approvalId: id, decision };
  }

  claim(approvalId: string, value: unknown): WorkerClaim | null {
    const request = validateMcpBusinessPolicyRequest(value);
    return this.#tx((a, core) => {
      const approval = a.approvals.find(x => x.id === approvalId);
      if (!approval || hash(request) !== hash(approval.request)) return null;
      validateApproval(approval);
      const pass = approval.decision.gatePass!;
      const life = core.getLifecycleByGatePassId(pass.gatePassId);
      if (!life || approval.token || !purchaseOrderStateBindingMatches(approval.binding, this.getBusinessState(), request)) return null;
      const reserved = core.reserve(pass, life.lifecycleRevision, AT);
      if (!reserved.changed) return null;
      const token = randomUUID(); approval.token = token;
      transaction(this.#destination, () => {
        const d = destination(this.#destination, this.#storeId);
        if (d.fences.some(f => f.gatePassId === pass.gatePassId)) throw new Error("DESTINATION_FENCE_EXISTS");
        d.fences.push({ gatePassId: pass.gatePassId, token }); save(this.#destination, d);
      });
      this.#faultInjector?.("fence_registered");
      return { approvalId, token };
    });
  }

  submit(claim: WorkerClaim): SharedResult {
    try { return this.#tx((a, core) => {
      const approval = a.approvals.find(x => x.id === claim.approvalId);
      if (!approval || !claim.token || approval.token !== claim.token) return result("REJECTED", "STALE_AUTHORITY");
      validateApproval(approval);
      const pass = approval.decision.gatePass!;
      if (core.isEmergencyStopActive() || core.getLifecycleByGatePassId(pass.gatePassId)?.status !== "RESERVED") return result("REJECTED", "AUTHORITY_BLOCKED");
      // Authority lock remains held through the independent destination commit, ordering stop/revoke/recovery.
      const committed = transaction(this.#destination, () => {
        const d = destination(this.#destination, this.#storeId);
        if (d.fences.find(f => f.gatePassId === pass.gatePassId)?.token !== claim.token) return result("REJECTED", "DESTINATION_FENCED");
        // Reverify Mission 01 signatures, request, destination, and current state at commit.
        if (!signedStateAuthorityMatches(pass, approval.decision.policyDecisionReceipt!, approval.request, approval.binding)
          || !purchaseOrderStateBindingMatches(approval.binding, d.state, approval.request)) return result("REJECTED", "DESTINATION_STATE_OR_SIGNATURE_CHANGED");
        if (d.records.some(r => r.gatePassId === pass.gatePassId || r.nonce === pass.action.nonce || r.binding.businessState.orderId === d.state.orderId)) return result("REJECTED", "DESTINATION_ALREADY_RECORDED");
        d.records.push({ approvalId: approval.id, gatePassId: pass.gatePassId, nonce: pass.action.nonce, actionDigest: pass.action.actionDigest, requestDigest: hash(approval.request), proposedAction: structuredClone(approval.request.proposedAction), binding: approval.binding });
        save(this.#destination, d);
        return result("EXECUTED", "DESTINATION_COMMITTED_ACK_PENDING");
      });
      if (committed.outcome === "EXECUTED") this.#faultInjector?.("destination_committed");
      return committed;
    }); } catch { return result("UNKNOWN", "SHARED_STORAGE_FAILED_CLOSED"); }
  }

  acknowledge(claim: WorkerClaim): SharedResult {
    return this.reconcile(claim.approvalId);
  }

  reconcile(approvalId: string, evidence: OperatorAuthorityEvidence = createOperatorAuthorityEvidence()): SharedResult {
    try { return this.#tx((a, core) => {
      const approval = a.approvals.find(x => x.id === approvalId);
      if (!approval) return result("UNKNOWN", "APPROVAL_MISSING");
      validateApproval(approval);
      const pass = approval.decision.gatePass!;
      const life = core.getLifecycleByGatePassId(pass.gatePassId);
      if (!life || !["RESERVED", "UNKNOWN", "EXECUTED", "ABANDONED"].includes(life.status)) return result("REJECTED", "RECONCILIATION_NOT_ELIGIBLE");
      // Validate operator evidence through the existing core before any destination change.
      const checked = core.reconcile({ gatePassId: pass.gatePassId, finding: "still_unknown", evidenceReference: "fixture://preflight", reconciledAt: AT, authorityEvidence: evidence });
      if (checked.reasonCode === "OPERATOR_AUTHORITY_INVALID") return result("UNKNOWN", "OPERATOR_AUTHORITY_INVALID");
      const record = transaction(this.#destination, () => {
        const d = destination(this.#destination, this.#storeId);
        const fence = d.fences.find(f => f.gatePassId === pass.gatePassId);
        if (fence) fence.token = null;
        else d.fences.push({ gatePassId: pass.gatePassId, token: null });
        // Validate every record before inferring absence, so retagged identifiers cannot hide a write.
        for (const recorded of d.records) {
          const original = a.approvals.find(x => x.id === recorded.approvalId);
          if (!original || !destinationRecordMatches(recorded, original)) throw new Error("DESTINATION_EVIDENCE_INVALID");
        }
        const found = d.records.find(r => r.approvalId === approval.id || r.gatePassId === pass.gatePassId || r.nonce === pass.action.nonce || r.actionDigest === pass.action.actionDigest) ?? null;
        if (found && !destinationRecordMatches(found, approval)) throw new Error("DESTINATION_EVIDENCE_INVALID");
        save(this.#destination, d); return found;
      });
      this.#faultInjector?.("destination_fenced");
      // Destination fencing + lookup committed before exposure can be released. Crash here retains UNKNOWN.
      approval.token = null;
      const current = core.getLifecycleByGatePassId(pass.gatePassId)!;
      if (["RESERVED", "UNKNOWN"].includes(current.status)) {
        const changed = core.reconcile({ gatePassId: pass.gatePassId, finding: record ? "confirmed_executed" : "confirmed_not_executed", evidenceReference: "fixture://sqlite/" + hash(record), reconciledAt: AT, authorityEvidence: evidence });
        if (!changed.changed) throw new Error("CORE_RECONCILIATION_REFUSED");
      } else if (current.status !== (record ? "EXECUTED" : "ABANDONED")) throw new Error("DESTINATION_LIFECYCLE_CONFLICT");
      return result(record ? "EXECUTED" : "NOT_EXECUTED", "DESTINATION_RECONCILED_FRESH_APPROVAL_REQUIRED");
    }); } catch { return result("UNKNOWN", "RECONCILIATION_FAILED_CLOSED"); }
  }

  revoke(approvalId: string, evidence = createOperatorAuthorityEvidence()) {
    return this.#tx((a, core) => {
      const approval = a.approvals.find(x => x.id === approvalId);
      if (!approval) throw new Error("APPROVAL_MISSING");
      const pass = approval.decision.gatePass!;
      const lifecycle = core.getLifecycleByGatePassId(pass.gatePassId);
      if (lifecycle?.status === "ISSUED" && destination(this.#destination, this.#storeId).fences.some(f => f.gatePassId === pass.gatePassId)) {
        return { changed: false, reasonCode: "GATEPASS_REVOCATION_REQUIRES_RECONCILIATION" as const, lifecycle, receipt: null };
      }
      return core.revoke({ gatePass: approval.decision.gatePass!, reason: "synthetic host revocation", revokedAt: AT, authorityEvidence: evidence });
    });
  }
  emergencyStop(active: boolean, evidence = createOperatorAuthorityEvidence()) {
    return this.#tx((_a, core) => core.setEmergencyStop({ active, reason: "synthetic host stop", recordedAt: AT, authorityEvidence: evidence }));
  }
  snapshot() { return this.#tx((_a, core) => core.snapshot()); }
  getBusinessState() { return structuredClone(destination(this.#destination, this.#storeId).state); }
  getDestinationRecords() { return structuredClone(destination(this.#destination, this.#storeId).records); }
  updateBusinessState(): void { transaction(this.#destination, () => { const d = destination(this.#destination, this.#storeId); d.state.orderVersion++; d.state.revision++; save(this.#destination, d); }); }
  close(): void { this.#destination.close(); this.#authority.close(); }
}

function validateRule(rule: AggregateExposureRule): void {
  if (!rule || !Number.isSafeInteger(rule.maximumAggregateMinorUnits) || rule.maximumAggregateMinorUnits < 0
    || (rule.maximumActionCount !== null && (!Number.isSafeInteger(rule.maximumActionCount) || rule.maximumActionCount < 1))
    || hash({ ...rule, maximumAggregateMinorUnits: DEFAULT_AGGREGATE_EXPOSURE_RULE.maximumAggregateMinorUnits, maximumActionCount: DEFAULT_AGGREGATE_EXPOSURE_RULE.maximumActionCount }) !== hash(DEFAULT_AGGREGATE_EXPOSURE_RULE)) throw new Error("SHARED_RULE_INVALID");
}
function validateApproval(a: Approval): void {
  validateMcpBusinessPolicyRequest(a.request);
  if (!a.decision.gatePass || !a.decision.policyDecisionReceipt || !a.decision.authorising || a.request.mode !== "enforced"
    || !signedStateAuthorityMatches(a.decision.gatePass, a.decision.policyDecisionReceipt, a.request, a.binding)) throw new Error("SHARED_APPROVAL_SIGNATURE_INVALID");
}
function openDatabase(path: string, create = false): SqliteDatabase {
  if (!create && (!existsSync(path) || lstatSync(path).isSymbolicLink())) throw new Error("SHARED_DATABASE_MISSING_OR_SYMLINK");
  const db = new DatabaseSync(path);
  try {
    db.exec("PRAGMA busy_timeout=5000; PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA");
    const check = db.prepare("PRAGMA quick_check").get();
    if (check?.quick_check !== "ok") throw new Error("SHARED_DATABASE_CORRUPT");
    return db;
  } catch (error) { db.close(); throw error; }
}
function transaction<T>(db: SqliteDatabase, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try { const value = fn(); if (value instanceof Promise) throw new Error("ASYNC_TRANSACTION_REFUSED"); db.exec("COMMIT"); return value; }
  catch (error) { try { db.exec("ROLLBACK"); } catch { /* preserve original failure */ } throw error; }
}
function load<T>(db: SqliteDatabase): T {
  const row = db.prepare("SELECT payload,digest FROM snapshot WHERE id=1").get();
  if (!row || typeof row.payload !== "string") throw new Error("SHARED_SNAPSHOT_MISSING");
  const value = JSON.parse(row.payload);
  if (value.version !== VERSION || hash(value) !== row.digest) throw new Error("SHARED_SNAPSHOT_CORRUPT");
  return value as T;
}
function save(db: SqliteDatabase, value: unknown): void {
  db.prepare("INSERT INTO snapshot VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,digest=excluded.digest").run(JSON.stringify(value), hash(value));
}
function destination(db: SqliteDatabase, storeId: string): Destination {
  const d = load<Destination>(db);
  if (d.storeId !== storeId) throw new Error("SHARED_DESTINATION_ID_MISMATCH"); validatePurchaseOrderBusinessState(d.state);
  if (!Array.isArray(d.fences) || !Array.isArray(d.records) || d.records.length > 1) throw new Error("DESTINATION_INVALID");
  return d;
}

function destinationRecordMatches(record: RecordEntry, approval: Approval): boolean {
  const pass = approval.decision.gatePass!;
  return record.approvalId === approval.id && record.gatePassId === pass.gatePassId
    && record.nonce === pass.action.nonce && record.actionDigest === pass.action.actionDigest
    && record.requestDigest === hash(approval.request)
    && hash(record.proposedAction) === hash(approval.request.proposedAction)
    && hash(record.binding) === hash(approval.binding);
}
