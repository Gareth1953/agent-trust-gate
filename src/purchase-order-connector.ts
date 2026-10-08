import { randomUUID } from "node:crypto";
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { LocalDurableLifecycleStore, createOperatorAuthorityEvidence } from "./durable-action-lifecycle.js";
import { InMemoryNonceStore, createFixedTrustedClock, createVerifierContext, verifyAndExecuteSimulatedAction,
  type ExecutionReceipt, type PolicyDecisionReceipt } from "./exact-action-gatepass.js";
import { McpExactActionGateway, validateMcpBusinessPolicyRequest, type McpBusinessPolicyRequest,
  type McpBusinessPolicyResult } from "./mcp-exact-action-gateway.js";
import { createCanonicalPayloadHash } from "./local-signed-proof.js";
import { PURCHASING_DEMO_EXECUTION_TIME } from "./local-purchasing-lifecycle-demo.js";

export const PURCHASE_ORDER_CONNECTOR_VERSION = "atg.purchase-order-connector.local.v1" as const;
export const PURCHASE_ORDER_CONNECTOR_BOUNDARY = Object.freeze({ localOnly: true, syntheticOnly: true,
  liveConnector: false, productionReady: false, independentExecutionCapture: false,
  automaticRetry: false, learningEnabled: false });

export interface PurchaseOrderBusinessState {
  orderId: "PO-SYNTHETIC-001";
  orderVersion: number;
  supplierBankVersion: number;
  supplierBankReference: string;
  revision: number;
}
interface DestinationRecord {
  orderId: "PO-SYNTHETIC-001";
  evaluationId: string;
  gatePassId: string;
  actionDigest: string;
  requestDigest: string;
  businessState: PurchaseOrderBusinessState;
  proposedAction: McpBusinessPolicyRequest["proposedAction"];
  amountMinorUnits: number;
}
interface DestinationState { version: typeof PURCHASE_ORDER_CONNECTOR_VERSION; businessState: PurchaseOrderBusinessState; records: DestinationRecord[] }
interface Attempt {
  approvedRequest: McpBusinessPolicyRequest;
  evaluationId: string;
  gatePassId: string;
  actionDigest: string;
  requestDigest: string;
  businessStateDigest: string;
  decisionReceipt: PolicyDecisionReceipt;
  status: "PREPARED" | "UNKNOWN" | "EXECUTED" | "NOT_EXECUTED";
  executionReceipt: ExecutionReceipt | null;
}
interface Journal { version: typeof PURCHASE_ORDER_CONNECTOR_VERSION; attempts: Attempt[] }
interface Approval { request: McpBusinessPolicyRequest; requestDigest: string; businessState: PurchaseOrderBusinessState; decision: McpBusinessPolicyResult }
export interface PurchaseOrderEvidence {
  version: typeof PURCHASE_ORDER_CONNECTOR_VERSION;
  evaluationId: string;
  gatePassId: string;
  actionDigest: string;
  approvedRequestDigest: string;
  approvedBusinessStateDigest: string;
  decisionReceiptDigest: string;
  executionReceiptDigest: string | null;
  destinationRecord: DestinationRecord | null;
  destinationRecordDigest: string | null;
  authorisedRequestMatchesRecordedOutcome: boolean;
  evidenceDigest: string;
  localOnly: true;
  syntheticOnly: true;
  independentExecutionCapture: false;
}
export interface PurchaseOrderResult {
  outcome: "EXECUTED" | "REJECTED" | "UNKNOWN" | "NOT_EXECUTED";
  reason: string;
  destinationReached: boolean;
  automaticRetryPermitted: false;
  evidence: PurchaseOrderEvidence | null;
}

/** Host-owned synthetic destination, not an arbitrary executor or live ERP client. */
export class AtgPurchaseOrderConnector {
  readonly capabilities = PURCHASE_ORDER_CONNECTOR_BOUNDARY;
  readonly #directory: string;
  readonly #lockToken = randomUUID();
  readonly #store: LocalDurableLifecycleStore;
  readonly #gateway: McpExactActionGateway;
  readonly #approvals = new Map<string, Approval>();
  #busy = false;
  #closed = false;

  constructor(options: { stateDirectory: string }) {
    if (!isAbsolute(options.stateDirectory)) throw new TypeError("An absolute host-owned stateDirectory is required.");
    this.#directory = options.stateDirectory;
    mkdirSync(this.#directory, { recursive: true, mode: 0o700 });
    if (lstatSync(this.#directory).isSymbolicLink()) throw new Error("CONNECTOR_DIRECTORY_SYMLINK");
    const lock = openSync(this.#path("connector.lock"), "wx", 0o600);
    try { writeFileSync(lock, this.#lockToken); fsyncSync(lock); } finally { closeSync(lock); }
    try {
      const destinationExists = existsSync(this.#path("destination.json"));
      const journalExists = existsSync(this.#path("journal.json"));
      if (destinationExists !== journalExists) throw new Error("CONNECTOR_STATE_INCOMPLETE");
      if (!destinationExists) {
        if (existsSync(this.#path("authority.json"))) throw new Error("CONNECTOR_DESTINATION_MISSING");
        this.#write("destination.json", { version: PURCHASE_ORDER_CONNECTOR_VERSION,
          businessState: { orderId: "PO-SYNTHETIC-001", orderVersion: 1, supplierBankVersion: 1,
            supplierBankReference: "fixture-bank-A", revision: 1 }, records: [] });
        this.#write("journal.json", { version: PURCHASE_ORDER_CONNECTOR_VERSION, attempts: [] });
      }
      this.#destination(); this.#journal();
      this.#store = new LocalDurableLifecycleStore({ statePath: this.#path("authority.json") });
      this.#gateway = new McpExactActionGateway({ durableStore: this.#store });
    } catch (error) { this.#releaseLock(); throw error; }
  }

  getBusinessState(): PurchaseOrderBusinessState { this.#assertOpen(); return structuredClone(this.#destination().businessState); }
  getDestinationRecords(): readonly DestinationRecord[] { this.#assertOpen(); return structuredClone(this.#destination().records); }

  /** Explicit host test operation; cannot be called during approval or execution. */
  updateBusinessState(change: { orderVersion?: number; supplierBankReference?: string }): PurchaseOrderBusinessState {
    this.#assertIdle();
    if (change === null || typeof change !== "object" || Array.isArray(change)
      || Object.keys(change).length === 0 || Object.keys(change).some(k => !["orderVersion", "supplierBankReference"].includes(k))) {
      throw new TypeError("BUSINESS_STATE_CHANGE_INVALID");
    }
    const destination = this.#destination();
    const next = structuredClone(destination.businessState);
    if (change.orderVersion !== undefined) {
      if (!Number.isSafeInteger(change.orderVersion) || change.orderVersion <= next.orderVersion) throw new TypeError("ORDER_VERSION_MUST_INCREASE");
      next.orderVersion = change.orderVersion;
    }
    if (change.supplierBankReference !== undefined) {
      if (!/^fixture-bank-[A-Z]$/.test(change.supplierBankReference)) throw new TypeError("SYNTHETIC_BANK_REFERENCE_REQUIRED");
      next.supplierBankReference = change.supplierBankReference;
      next.supplierBankVersion += 1;
    }
    next.revision += 1;
    validateBusinessState(next);
    destination.businessState = next;
    this.#write("destination.json", destination);
    return structuredClone(next);
  }

  async approve(value: unknown): Promise<{ evaluationId: string; decision: McpBusinessPolicyResult; businessState: PurchaseOrderBusinessState }> {
    this.#assertIdle(); this.#busy = true;
    try {
      if (this.#approvals.size >= 100) throw new Error("CONNECTOR_APPROVAL_CAPACITY_REACHED");
      const request = structuredClone(validateMcpBusinessPolicyRequest(value));
      const destination = this.#destination();
      if (destination.records.length > 0) throw new Error("ORDER_ALREADY_RECORDED");
      if (this.#journal().attempts.some(a => a.status === "UNKNOWN" || a.status === "PREPARED")) throw new Error("RECONCILIATION_REQUIRED");
      if (this.#store.snapshot().lifecycles.some(a => a.status === "RESERVED" || a.status === "UNKNOWN")) throw new Error("RECONCILIATION_REQUIRED");
      const decision = await this.#gateway.evaluateAction(request) as McpBusinessPolicyResult;
      const evaluationId = randomUUID();
      const businessState = structuredClone(destination.businessState);
      this.#approvals.set(evaluationId, { request, requestDigest: createCanonicalPayloadHash(request), businessState, decision: structuredClone(decision) });
      return { evaluationId, decision: structuredClone(decision), businessState: structuredClone(businessState) };
    } finally { this.#busy = false; }
  }

  async execute(evaluationId: string, value: unknown, options: { fault?: "none" | "timeout_before_commit" | "timeout_after_commit" } = {}): Promise<PurchaseOrderResult> {
    this.#assertIdle(); this.#busy = true;
    try {
      if (options === null || typeof options !== "object" || Array.isArray(options)
        || Object.keys(options).some(k => k !== "fault")
        || ![undefined, "none", "timeout_before_commit", "timeout_after_commit"].includes(options.fault)) return result("REJECTED", "EXECUTION_OPTIONS_INVALID");
      const approval = this.#approvals.get(evaluationId);
      if (!approval) return result("REJECTED", "APPROVAL_UNKNOWN");
      let request: McpBusinessPolicyRequest;
      try { request = structuredClone(validateMcpBusinessPolicyRequest(value)); }
      catch { return result("REJECTED", "REQUEST_INVALID"); }
      if (createCanonicalPayloadHash(request) !== approval.requestDigest) return result("REJECTED", "APPROVED_REQUEST_CHANGED");
      const destination = this.#destination();
      if (destination.records.length) return result("REJECTED", "ORDER_ALREADY_RECORDED");
      if (createCanonicalPayloadHash(destination.businessState) !== createCanonicalPayloadHash(approval.businessState)) return result("REJECTED", "BUSINESS_STATE_CHANGED_REAPPROVAL_REQUIRED");
      const decision = approval.decision;
      if (decision.mode !== "enforced" || decision.outcome !== "ACCEPT" || !decision.authorising || !decision.gatePass || !decision.policyDecisionReceipt) return result("REJECTED", "EXECUTION_AUTHORITY_MISSING");
      const journal = this.#journal();
      if (journal.attempts.some(a => a.evaluationId === evaluationId)) return result("REJECTED", "ATTEMPT_ALREADY_RECORDED_NO_RETRY");
      if (journal.attempts.some(a => a.status === "UNKNOWN" || a.status === "PREPARED")) return result("REJECTED", "RECONCILIATION_REQUIRED");
      if (this.#store.snapshot().lifecycles.some(a => a.status === "RESERVED" || a.status === "UNKNOWN")) return result("REJECTED", "RECONCILIATION_REQUIRED");
      const gatePass = decision.gatePass;
      const lifecycle = this.#store.getLifecycleByGatePassId(gatePass.gatePassId);
      if (!lifecycle) return result("REJECTED", "LIFECYCLE_MISSING");
      const reserved = this.#store.reserve(gatePass, lifecycle.lifecycleRevision, PURCHASING_DEMO_EXECUTION_TIME);
      if (!reserved.changed) return result("REJECTED", reserved.reasonCode);
      const attempt: Attempt = { approvedRequest: structuredClone(request), evaluationId, gatePassId: gatePass.gatePassId, actionDigest: gatePass.action.actionDigest,
        requestDigest: approval.requestDigest, businessStateDigest: createCanonicalPayloadHash(approval.businessState),
        decisionReceipt: structuredClone(decision.policyDecisionReceipt), status: "PREPARED", executionReceipt: null };
      journal.attempts.push(attempt);
      this.#write("journal.json", journal);
      const nonceStore = new InMemoryNonceStore(); nonceStore.registerUnused(gatePass);
      const { actionEnvelopeVersion: _v, canonicalizationVersion: _c, digestAlgorithm: _d, actionDigest: _h, ...action } = gatePass.action;
      let reached = false;
      const execution = await verifyAndExecuteSimulatedAction(gatePass, action,
        createVerifierContext({ gatePass, decisionReceipt: decision.policyDecisionReceipt }, nonceStore,
          { trustedClock: createFixedTrustedClock(PURCHASING_DEMO_EXECUTION_TIME) }), () => {
          reached = true;
          if (options.fault === "timeout_before_commit") throw new Error("SYNTHETIC_TIMEOUT");
          // Re-read and compare at the synchronous local commit boundary; no intervening await.
          const current = this.#destination();
          if (current.records.length || createCanonicalPayloadHash(current.businessState) !== attempt.businessStateDigest) throw new Error("DESTINATION_CONFLICT");
          current.records.push({ orderId: current.businessState.orderId, evaluationId, gatePassId: gatePass.gatePassId,
            actionDigest: attempt.actionDigest, requestDigest: attempt.requestDigest, businessState: structuredClone(current.businessState),
            proposedAction: structuredClone(request.proposedAction), amountMinorUnits: request.amountMinorUnits });
          this.#write("destination.json", current);
          if (options.fault === "timeout_after_commit") throw new Error("SYNTHETIC_ACK_LOST");
          return { acknowledged: true, simulatedSideEffectReference: `fixture-purchase://${evaluationId}` };
        });
      attempt.executionReceipt = execution;
      if (execution.resultStatus !== "executed") {
        attempt.status = "UNKNOWN"; this.#write("journal.json", journal);
        this.#store.markPossibleExternalEffect(gatePass.gatePassId, PURCHASING_DEMO_EXECUTION_TIME);
        return result("UNKNOWN", "OUTCOME_REQUIRES_DESTINATION_RECONCILIATION", reached);
      }
      const committed = this.#store.markExecuted(gatePass.gatePassId, PURCHASING_DEMO_EXECUTION_TIME);
      if (!committed.changed) throw new Error("LIFECYCLE_COMMIT_FAILED");
      attempt.status = "EXECUTED"; this.#write("journal.json", journal);
      return result("EXECUTED", "EXACT_ORDER_RECORDED", reached, makeEvidence(attempt, this.#destination().records[0] ?? null));
    } catch {
      // Durable PREPARED, UNKNOWN or RESERVED state must be reconciled, never blindly retried.
      return result("UNKNOWN", "CONNECTOR_FAILED_CLOSED_RECONCILIATION_REQUIRED");
    } finally { this.#busy = false; }
  }

  /** Derives the finding from the local destination; never accepts a caller-supplied finding. */
  reconcile(evaluationId: string, options: { simulateLookupUnavailable?: boolean } = {}): PurchaseOrderResult {
    this.#assertIdle();
    if (options === null || typeof options !== "object" || Array.isArray(options)
      || Object.keys(options).some(k => k !== "simulateLookupUnavailable")
      || (options.simulateLookupUnavailable !== undefined && typeof options.simulateLookupUnavailable !== "boolean")) return result("UNKNOWN", "RECONCILIATION_OPTIONS_INVALID");
    if (options.simulateLookupUnavailable) return result("UNKNOWN", "DESTINATION_LOOKUP_UNAVAILABLE");
    try {
      const journal = this.#journal(); const attempt = journal.attempts.find(a => a.evaluationId === evaluationId);
      if (!attempt) return result("REJECTED", "ATTEMPT_UNKNOWN");
      const record = this.#destination().records.find(r => r.evaluationId === evaluationId) ?? null;
      const evidence = makeEvidence(attempt, record);
      if (record && !evidence.authorisedRequestMatchesRecordedOutcome) return result("UNKNOWN", "DESTINATION_EVIDENCE_MISMATCH");
      const outcome = record ? "EXECUTED" as const : "NOT_EXECUTED" as const;
      const lifecycle = this.#store.getLifecycleByGatePassId(attempt.gatePassId);
      if (!lifecycle) return result("UNKNOWN", "LIFECYCLE_MISSING");
      if (lifecycle.status === "RESERVED" || lifecycle.status === "UNKNOWN") {
        const change = this.#store.reconcile({ gatePassId: attempt.gatePassId,
          finding: record ? "confirmed_executed" : "confirmed_not_executed",
          evidenceReference: `fixture://purchase-order/${evaluationId}/${evidence.evidenceDigest.slice(-64)}`,
          reconciledAt: PURCHASING_DEMO_EXECUTION_TIME, authorityEvidence: createOperatorAuthorityEvidence() });
        if (!change.changed) return result("UNKNOWN", "LIFECYCLE_RECONCILIATION_FAILED");
      } else if (lifecycle.status !== (record ? "EXECUTED" : "ABANDONED")) return result("UNKNOWN", "LIFECYCLE_DESTINATION_CONFLICT");
      attempt.status = outcome; this.#write("journal.json", journal);
      return result(outcome, record ? "DESTINATION_CONFIRMED_EXECUTED_NO_RETRY" : "DESTINATION_CONFIRMED_NOT_EXECUTED_FRESH_APPROVAL_REQUIRED", false, evidence);
    } catch { return result("UNKNOWN", "RECONCILIATION_FAILED_CLOSED"); }
  }

  close(): void { if (this.#closed) return; this.#assertIdle(); this.#releaseLock(); this.#closed = true; this.#approvals.clear(); }
  #path(name: string): string { return join(this.#directory, name); }
  #assertOpen(): void { if (this.#closed) throw new Error("CONNECTOR_CLOSED"); }
  #assertIdle(): void { this.#assertOpen(); if (this.#busy) throw new Error("CONNECTOR_BUSY"); }
  #releaseLock(): void { if (readFileSync(this.#path("connector.lock"), "utf8") !== this.#lockToken) throw new Error("CONNECTOR_LOCK_CHANGED"); unlinkSync(this.#path("connector.lock")); }
  #write(name: string, value: unknown): void {
    const path = this.#path(name);
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error("CONNECTOR_FILE_SYMLINK");
    const temporary = `${path}.${randomUUID()}.tmp`; const fd = openSync(temporary, "wx", 0o600);
    try { writeFileSync(fd, JSON.stringify({ payload: value, digest: createCanonicalPayloadHash(value) }) + "\n"); fsyncSync(fd); }
    finally { closeSync(fd); }
    renameSync(temporary, path);
  }
  #read(name: string): unknown {
    const path = this.#path(name);
    if (lstatSync(path).isSymbolicLink()) throw new Error("CONNECTOR_FILE_SYMLINK");
    const wrapper = JSON.parse(readFileSync(path, "utf8")) as { payload: unknown; digest: string };
    if (wrapper.digest !== createCanonicalPayloadHash(wrapper.payload)) throw new Error("CONNECTOR_STATE_DIGEST_INVALID");
    return wrapper.payload;
  }
  #destination(): DestinationState {
    const d = this.#read("destination.json") as DestinationState;
    if (d.version !== PURCHASE_ORDER_CONNECTOR_VERSION || !Array.isArray(d.records) || d.records.length > 1) throw new Error("DESTINATION_INVALID");
    validateBusinessState(d.businessState);
    for (const r of d.records) {
      validateBusinessState(r.businessState);
      if (r.orderId !== "PO-SYNTHETIC-001" || !validId(r.evaluationId) || !validText(r.gatePassId)
        || !validDigest(r.actionDigest) || !validDigest(r.requestDigest) || !Number.isSafeInteger(r.amountMinorUnits)
        || r.amountMinorUnits < 0 || !r.proposedAction || r.amountMinorUnits !== r.proposedAction.totalAmount * 100) throw new Error("DESTINATION_RECORD_INVALID");
    }
    return d;
  }
  #journal(): Journal {
    const j = this.#read("journal.json") as Journal;
    if (j.version !== PURCHASE_ORDER_CONNECTOR_VERSION || !Array.isArray(j.attempts) || j.attempts.length > 1000) throw new Error("JOURNAL_INVALID");
    const seen = new Set<string>();
    for (const a of j.attempts) {
      validateMcpBusinessPolicyRequest(a.approvedRequest);
      if (createCanonicalPayloadHash(a.approvedRequest) !== a.requestDigest) throw new Error("JOURNAL_REQUEST_BINDING_INVALID");
      if (!validId(a.evaluationId) || seen.has(a.evaluationId) || !validText(a.gatePassId) || !validDigest(a.actionDigest)
        || !validDigest(a.requestDigest) || !validDigest(a.businessStateDigest) || !a.decisionReceipt
        || a.decisionReceipt.gatePassIssuance?.gatePassId !== a.gatePassId
        || a.decisionReceipt.gatePassIssuance.actionDigest !== a.actionDigest
        || !["PREPARED", "UNKNOWN", "EXECUTED", "NOT_EXECUTED"].includes(a.status)) throw new Error("JOURNAL_ATTEMPT_INVALID");
      seen.add(a.evaluationId);
    }
    return j;
  }
}

function validId(x: unknown): x is string { return typeof x === "string" && /^[a-f0-9-]{36}$/.test(x); }
function validText(x: unknown): x is string { return typeof x === "string" && x.length > 0 && x.length <= 240; }
function validDigest(x: unknown): x is string { return typeof x === "string" && /^sha256:[a-f0-9]{64}$/.test(x); }
function validateBusinessState(s: PurchaseOrderBusinessState): void {
  if (!s || s.orderId !== "PO-SYNTHETIC-001" || !/^fixture-bank-[A-Z]$/.test(s.supplierBankReference)
    || ![s.orderVersion, s.supplierBankVersion, s.revision].every(v => Number.isSafeInteger(v) && v >= 1)) throw new Error("BUSINESS_STATE_INVALID");
}
function result(outcome: PurchaseOrderResult["outcome"], reason: string, destinationReached = false, evidence: PurchaseOrderEvidence | null = null): PurchaseOrderResult {
  return { outcome, reason, destinationReached, automaticRetryPermitted: false, evidence };
}
function makeEvidence(a: Attempt, record: DestinationRecord | null): PurchaseOrderEvidence {
  const matches = record !== null && record.gatePassId === a.gatePassId && record.actionDigest === a.actionDigest
    && record.requestDigest === a.requestDigest && createCanonicalPayloadHash(record.businessState) === a.businessStateDigest
    && createCanonicalPayloadHash(record.proposedAction) === createCanonicalPayloadHash(a.approvedRequest.proposedAction)
    && record.amountMinorUnits === a.approvedRequest.amountMinorUnits
    && record.evaluationId === a.evaluationId;
  const body = { version: PURCHASE_ORDER_CONNECTOR_VERSION, evaluationId: a.evaluationId, gatePassId: a.gatePassId,
    actionDigest: a.actionDigest, approvedRequestDigest: a.requestDigest, approvedBusinessStateDigest: a.businessStateDigest,
    decisionReceiptDigest: createCanonicalPayloadHash(a.decisionReceipt), executionReceiptDigest: a.executionReceipt ? createCanonicalPayloadHash(a.executionReceipt) : null,
    destinationRecord: structuredClone(record), destinationRecordDigest: record ? createCanonicalPayloadHash(record) : null,
    authorisedRequestMatchesRecordedOutcome: matches, localOnly: true as const, syntheticOnly: true as const, independentExecutionCapture: false as const };
  return { ...body, evidenceDigest: createCanonicalPayloadHash(body) };
}
