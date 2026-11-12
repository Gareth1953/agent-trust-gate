import { createHash, createPublicKey, verify } from "node:crypto";
import { closeSync, lstatSync, openSync } from "node:fs";
import { isAbsolute } from "node:path";
import type { DatabaseSync as SqliteDatabase } from "node:sqlite";

/**
 * Standalone, opt-in synthetic evaluation. It is NOT wired into the public
 * plugin, real payment rails or the existing OpenShell broker. This module
 * deliberately accepts host-verified caller identity as an external trust
 * input; production authentication and anti-rollback custody are NOT supplied.
 */
export const DELEGATED_BUDGET_SCHEMA = "atg.delegated-budget.synthetic.v1" as const;
const MAX_MINOR = 1_000_000_000_000;
const MAX_HOPS = 4;
const SIGNED_MANDATE_DOMAIN = "ATG_SYNTHETIC_ROOT_MANDATE_V1:";
const SIGNED_DELEGATION_DOMAIN = "ATG_SYNTHETIC_DELEGATION_V1:";
const SIGNED_ACTION_DOMAIN = "ATG_SYNTHETIC_EXACT_ACTION_V1:";
const SIGNED_OUTCOME_DOMAIN = "ATG_SYNTHETIC_OUTCOME_WITNESS_V1:";

export interface BudgetTrust {
  schema: typeof DELEGATED_BUDGET_SCHEMA;
  domainId: string;
  rootPrincipalId: string;
  rootPublicKeyPem: string;
  outcomeWitnessId: string;
  outcomeWitnessPublicKeyPem: string;
  agentPublicKeys: Record<string, string>;
  tenantId: string;
  accountId: string;
  currency: string;
  accountCeilingMinor: number;
}
export interface BudgetScope {
  tenantId: string;
  accountId: string;
  missionId: string;
  toolId: string;
  destinationId: string;
  payeeId: string;
  currency: string;
  maxPerActionMinor: number;
  expiresAt: string;
}
export interface RootMandate extends BudgetScope {
  schema: "atg.root-mandate.synthetic.v1";
  mandateId: string;
  domainId: string;
  rootPrincipalId: string;
  maxTotalMinor: number;
  notBefore: string;
  maxDelegationDepth: number;
}
export interface Delegation extends BudgetScope {
  parentId: string;
  childId: string;
  remainingHops: number;
}
export interface SyntheticAction {
  actionId: string;
  tenantId: string;
  accountId: string;
  missionId: string;
  toolId: string;
  destinationId: string;
  payeeId: string;
  currency: string;
  amountMinor: number;
  resourceId: string;
}
export interface Signed<T> { body: T; signature: string }
export interface DelegatedRequest {
  mandate: Signed<RootMandate>;
  delegations: Array<Signed<Delegation>>;
  action: SyntheticAction;
  leafSignature: string;
}
/** Only this separately pinned signer may classify a synthetic UNKNOWN hold. */
export interface SignedSyntheticOutcome {
  schema: "atg.signed-outcome.synthetic.v1";
  witnessId: string;
  eventId: string;
  actionId: string;
  actionDigest: string;
  outcome: "COMMITTED" | "NO_EFFECT";
  observedAt: string;
}
export interface HostVerifiedCaller {
  /** Both values MUST originate from independently authenticated host transport. */
  agentId: string;
  transportCredentialFingerprint: string;
}
export interface BudgetResult {
  syntheticOnly: true;
  productionReady: false;
  outcome: "COMMITTED" | "REJECTED" | "UNKNOWN" | "NOT_RECORDED" | "RELEASED";
  reason: string;
  automaticRetryPermitted: false;
  actionId: string | null;
  receipt: null | { actionDigest: string; mandateId: string; rootPrincipalId: string; amountMinor: number; };
}
type ActionRecord = { action_id: string; mandate_id: string; amount: number; status: string; action_digest: string; principal_id: string };
const keyPattern = /^[a-zA-Z0-9:._-]{1,120}$/;
const fingerprintPattern = /^[a-f0-9]{64}$/;
const scopeKeys = ["accountId","currency","destinationId","expiresAt","maxPerActionMinor","missionId","payeeId","tenantId","toolId"];
const actionKeys = ["accountId","actionId","amountMinor","currency","destinationId","missionId","payeeId","resourceId","tenantId","toolId"];
const mandateKeys = [...scopeKeys, "schema","mandateId","domainId","rootPrincipalId","maxTotalMinor","notBefore","maxDelegationDepth"].sort();
const delegationKeys = [...scopeKeys, "parentId","childId","remainingHops"].sort();
const trustKeys = ["schema","domainId","rootPrincipalId","rootPublicKeyPem","outcomeWitnessId","outcomeWitnessPublicKeyPem","agentPublicKeys","tenantId","accountId","currency","accountCeilingMinor"].sort();
const outcomeKeys = ["schema","witnessId","eventId","actionId","actionDigest","outcome","observedAt"];
const fields = (v: unknown, keys: string[]): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join("|") === keys.slice().sort().join("|");
const id = (s: unknown): s is string => typeof s === "string" && keyPattern.test(s);
const minor = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= MAX_MINOR;
const iso = (s: unknown): s is string => typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s) &&
  Number.isFinite(Date.parse(s)) && new Date(s).toISOString() === s;
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Sorted, JSON-only canonical bytes; never authorise by an LLM-generated description. */
export function canonicalBudgetEvidence(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isSafeInteger(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalBudgetEvidence).join(",") + "]";
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) throw Error("NON_CANONICAL_INPUT");
  const o = value as Record<string, unknown>;
  return "{" + Object.keys(o).sort().map(k => JSON.stringify(k) + ":" + canonicalBudgetEvidence(o[k])).join(",") + "}";
}
const hash = (v: unknown): string => createHash("sha256").update(canonicalBudgetEvidence(v)).digest("hex");
const publicKey = (s: unknown): string => {
  if (typeof s !== "string" || s.length > 4096 || createPublicKey(s).asymmetricKeyType !== "ed25519")
    throw Error("PUBLIC_KEY_INVALID");
  return s;
};
export function budgetPublicKeyFingerprint(key: string): string {
  return createHash("sha256").update(createPublicKey(publicKey(key)).export({ type: "spki", format: "der" })).digest("hex");
}
function checkTrust(t: BudgetTrust): BudgetTrust {
  if (!fields(t, trustKeys) || t.schema !== DELEGATED_BUDGET_SCHEMA ||
      ![t.domainId,t.rootPrincipalId,t.outcomeWitnessId,t.tenantId,t.accountId,t.currency].every(id) ||
      !minor(t.accountCeilingMinor) || !t.agentPublicKeys || typeof t.agentPublicKeys !== "object" ||
      Array.isArray(t.agentPublicKeys) || Object.getPrototypeOf(t.agentPublicKeys) !== Object.prototype) throw Error("BUDGET_TRUST_INVALID");
  publicKey(t.rootPublicKeyPem); publicKey(t.outcomeWitnessPublicKeyPem);
  const witnessFingerprint = budgetPublicKeyFingerprint(t.outcomeWitnessPublicKeyPem);
  if (witnessFingerprint === budgetPublicKeyFingerprint(t.rootPublicKeyPem)) throw Error("OUTCOME_WITNESS_MUST_BE_DISTINCT");
  const names = Object.keys(t.agentPublicKeys);
  if (names.length < 1 || names.length > 24 || names.includes(t.rootPrincipalId)) throw Error("AGENT_REGISTRY_INVALID");
  for (const n of names) {
    if (!id(n)) throw Error("AGENT_ID_INVALID"); publicKey(t.agentPublicKeys[n]);
    if (budgetPublicKeyFingerprint(t.agentPublicKeys[n]!) === witnessFingerprint) throw Error("OUTCOME_WITNESS_AGENT_KEY_FORBIDDEN");
  }
  return copy(t);
}
function checkScope(s: unknown): asserts s is BudgetScope {
  if (!s || typeof s !== "object") throw Error("SCOPE_INVALID");
  const p = s as unknown as BudgetScope;
  if (![p.tenantId,p.accountId,p.missionId,p.toolId,p.destinationId,p.payeeId,p.currency].every(id) ||
     !minor(p.maxPerActionMinor) || !iso(p.expiresAt)) throw Error("SCOPE_INVALID");
}
function equalIdentityScope(a: BudgetScope, b: BudgetScope): boolean {
  return a.tenantId === b.tenantId && a.accountId === b.accountId &&
    a.missionId === b.missionId && a.toolId === b.toolId &&
    a.destinationId === b.destinationId && a.payeeId === b.payeeId && a.currency === b.currency;
}
function safeSignature(sig: unknown): Buffer {
  if (typeof sig !== "string" || !/^[A-Za-z0-9_-]{86}$/.test(sig)) throw Error("SIGNATURE_INVALID");
  const b = Buffer.from(sig, "base64url");
  if (b.length !== 64 || b.toString("base64url") !== sig) throw Error("SIGNATURE_INVALID");
  return b;
}
function signed<T>(item: unknown, keys: string[], signerPem: string, domain: string): T {
  if (!fields(item, ["body","signature"])) throw Error("SIGNED_RECORD_INVALID");
  const entry = item as unknown as Signed<T>;
  if (!fields(entry.body, keys) ||
      !verify(null, Buffer.from(domain + canonicalBudgetEvidence(entry.body)), signerPem, safeSignature(entry.signature)))
    throw Error("SIGNATURE_OR_SHAPE_INVALID");
  return entry.body;
}
function parseRequest(req: unknown, t: BudgetTrust, caller: HostVerifiedCaller, ms: number): { mandate: RootMandate; action: SyntheticAction; actionDigest: string } {
  if (!fields(req, ["mandate","delegations","action","leafSignature"])) throw Error("REQUEST_SHAPE_INVALID");
  const r = req as unknown as DelegatedRequest;
  const mandate = signed<RootMandate>(r.mandate,mandateKeys,t.rootPublicKeyPem,SIGNED_MANDATE_DOMAIN);
  checkScope(mandate);
  if (mandate.schema !== "atg.root-mandate.synthetic.v1" || !id(mandate.mandateId) ||
    mandate.domainId !== t.domainId ||
    mandate.rootPrincipalId !== t.rootPrincipalId || mandate.tenantId !== t.tenantId ||
    mandate.accountId !== t.accountId || mandate.currency !== t.currency ||
    !minor(mandate.maxTotalMinor) || mandate.maxTotalMinor > t.accountCeilingMinor ||
    !iso(mandate.notBefore) || Date.parse(mandate.notBefore) >= Date.parse(mandate.expiresAt) ||
    !Number.isSafeInteger(mandate.maxDelegationDepth) ||
    mandate.maxDelegationDepth < 1 || mandate.maxDelegationDepth > MAX_HOPS ||
    ms < Date.parse(mandate.notBefore) || ms >= Date.parse(mandate.expiresAt)) throw Error("ROOT_MANDATE_INVALID");
  if (!Array.isArray(r.delegations) || r.delegations.length < 1 ||
      r.delegations.length > mandate.maxDelegationDepth) throw Error("DELEGATION_DEPTH_INVALID");
  let parentId = t.rootPrincipalId;
  let scope: BudgetScope = mandate;
  let remaining = mandate.maxDelegationDepth;
  for (const record of r.delegations) {
    const signerKey = parentId === t.rootPrincipalId ? t.rootPublicKeyPem : t.agentPublicKeys[parentId];
    if (!signerKey) throw Error("UNPINNED_DELEGATOR");
    const link = signed<Delegation>(record,delegationKeys,signerKey,SIGNED_DELEGATION_DOMAIN);
    checkScope(link);
    if (link.parentId !== parentId || !id(link.childId) || !t.agentPublicKeys[link.childId] ||
        link.childId === parentId || !Number.isSafeInteger(link.remainingHops) ||
        link.remainingHops !== remaining - 1 ||
        !equalIdentityScope(link,scope) || link.maxPerActionMinor > scope.maxPerActionMinor ||
        Date.parse(link.expiresAt) > Date.parse(scope.expiresAt) || ms >= Date.parse(link.expiresAt))
      throw Error("DELEGATION_EXPANDS_OR_MISMATCHES");
    parentId = link.childId;
    scope = link;
    remaining = link.remainingHops;
  }
  if (!caller || caller.agentId !== parentId ||
      caller.transportCredentialFingerprint !== budgetPublicKeyFingerprint(t.agentPublicKeys[parentId]!))
    throw Error("CALLER_NOT_HOST_VERIFIED");
  if (!fields(r.action,actionKeys)) throw Error("ACTION_SHAPE_INVALID");
  const action = r.action;
  if (![action.actionId,action.resourceId].every(id) || !minor(action.amountMinor) ||
      action.amountMinor > scope.maxPerActionMinor || action.amountMinor > mandate.maxPerActionMinor ||
      !equalIdentityScope({ ...action, maxPerActionMinor: action.amountMinor, expiresAt: scope.expiresAt }, scope))
    throw Error("ACTION_OUTSIDE_DELEGATION");
  const toSign = { mandateId: mandate.mandateId, delegationDigest: hash(r.delegations), action };
  if (!verify(null,Buffer.from(SIGNED_ACTION_DOMAIN + canonicalBudgetEvidence(toSign)),t.agentPublicKeys[parentId]!,safeSignature(r.leafSignature)))
    throw Error("LEAF_ACTION_SIGNATURE_INVALID");
  return {mandate,action,actionDigest:hash(toSign)};
}
const dbClass = () => {
  if (Number(process.versions.node.split(".")[0]) < 24) throw Error("BUDGET_WRITER_REQUIRES_NODE_24");
  return (require("node:sqlite") as typeof import("node:sqlite")).DatabaseSync;
};
const result = (outcome: BudgetResult["outcome"], reason: string, actionId: string | null = null, receipt: BudgetResult["receipt"] = null): BudgetResult =>
  ({syntheticOnly:true,productionReady:false,outcome,reason,automaticRetryPermitted:false,actionId,receipt});

/** One authoritative synthetic SQLite writer. Does not protect against writer-admin or whole-state restore. */
export class SyntheticDelegatedBudgetWriter {
  readonly #db: SqliteDatabase;
  readonly #trust: BudgetTrust;
  readonly #now: () => Date;
  #closed = false;
  static create(path: string, input: BudgetTrust): void {
    const t = checkTrust(input);
    if (!isAbsolute(path)) throw Error("ABSOLUTE_BUDGET_PATH_REQUIRED");
    const fd = openSync(path, "wx", 0o600); closeSync(fd);
    const db = new (dbClass())(path);
    try {
      db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; " +
        "CREATE TABLE metadata(id INTEGER PRIMARY KEY CHECK(id=1), trust_digest TEXT NOT NULL, stopped INTEGER NOT NULL CHECK(stopped IN(0,1)), last_clock_ms INTEGER NOT NULL) STRICT;" +
        "CREATE TABLE account(id INTEGER PRIMARY KEY CHECK(id=1), ceiling INTEGER NOT NULL, committed INTEGER NOT NULL, held INTEGER NOT NULL) STRICT;" +
        "CREATE TABLE mandates(id TEXT PRIMARY KEY, body_digest TEXT NOT NULL, ceiling INTEGER NOT NULL, committed INTEGER NOT NULL, held INTEGER NOT NULL) STRICT;" +
        "CREATE TABLE revocations(id TEXT PRIMARY KEY) STRICT;" +
        "CREATE TABLE actions(action_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN('COMMITTED','UNKNOWN','RELEASED')), action_digest TEXT NOT NULL, principal_id TEXT NOT NULL) STRICT;");
      db.prepare("INSERT INTO metadata VALUES(1,?,0,0)").run(hash(t));
      db.prepare("INSERT INTO account VALUES(1,?,0,0)").run(t.accountCeilingMinor);
    } finally { db.close(); }
  }
  constructor(options: {path:string;trust:BudgetTrust;now?:()=>Date}) {
    this.#trust = checkTrust(options.trust);
    this.#now = options.now ?? (()=>new Date());
    if (!isAbsolute(options.path) || !lstatSync(options.path).isFile() ||
      lstatSync(options.path).isSymbolicLink()) throw Error("BUDGET_PATH_INVALID");
    this.#db = new (dbClass())(options.path);
    this.#db.exec("PRAGMA busy_timeout=5000;");
    const meta = this.#db.prepare("SELECT trust_digest FROM metadata WHERE id=1").get();
    if (!meta || meta.trust_digest !== hash(this.#trust)) {
      this.#db.close(); this.#closed = true; throw Error("BUDGET_TRUST_OR_STATE_CHANGED");
    }
  }
  #tx<T>(cb:()=>T):T {
    if (this.#closed) throw Error("BUDGET_WRITER_CLOSED");
    this.#db.exec("BEGIN IMMEDIATE");
    try { const v=cb(); this.#db.exec("COMMIT"); return v; }
    catch(e) { try{this.#db.exec("ROLLBACK");}catch{} throw e; }
  }
  #clock(ms:number): void {
    if (!Number.isSafeInteger(ms) || ms <= 0) throw Error("CLOCK_INVALID");
    const state=this.#db.prepare("SELECT last_clock_ms FROM metadata WHERE id=1").get();
    if (!state || ms < Number(state.last_clock_ms)) throw Error("CLOCK_ROLLBACK_OR_UNAVAILABLE");
    this.#db.prepare("UPDATE metadata SET last_clock_ms=? WHERE id=1").run(ms);
  }
  #effect(req:unknown,caller:HostVerifiedCaller,mode:"COMMITTED"|"UNKNOWN"):BudgetResult {
    try {
      return this.#tx(()=>{
        const ms=this.#now().getTime();
        this.#clock(ms);
        let parsed: {mandate:RootMandate;action:SyntheticAction;actionDigest:string};
        try { parsed=parseRequest(req,this.#trust,caller,ms); }
        catch { return result("REJECTED","INVALID_OR_EXPANDED_DELEGATION"); }
        const {mandate,action,actionDigest}=parsed;
        const status=this.#db.prepare("SELECT stopped FROM metadata WHERE id=1").get();
        if (status?.stopped!==0) return result("REJECTED","WRITER_STOPPED",action.actionId);
        if (this.#db.prepare("SELECT id FROM revocations WHERE id=?").get(mandate.mandateId))
          return result("REJECTED","MANDATE_REVOKED",action.actionId);
        if (this.#db.prepare("SELECT action_id FROM actions WHERE action_id=?").get(action.actionId))
          return result("REJECTED","ACTION_ALREADY_RECORDED",action.actionId);
        const mandateDigest=hash(mandate);
        const existing=this.#db.prepare("SELECT * FROM mandates WHERE id=?").get(mandate.mandateId);
        if (existing && existing.body_digest!==mandateDigest)
          return result("REJECTED","MANDATE_REISSUE_CHANGED",action.actionId);
        if (!existing) this.#db.prepare("INSERT INTO mandates VALUES(?,?,?,0,0)").run(mandate.mandateId,mandateDigest,mandate.maxTotalMinor);
        const m=this.#db.prepare("SELECT * FROM mandates WHERE id=?").get(mandate.mandateId)!;
        const a=this.#db.prepare("SELECT * FROM account WHERE id=1").get()!;
        const amount=action.amountMinor;
        if (amount===0 || amount > Number(m.ceiling)-Number(m.committed)-Number(m.held) ||
            amount > Number(a.ceiling)-Number(a.committed)-Number(a.held))
          return result("REJECTED","ROOT_OR_MANDATE_BUDGET_EXCEEDED",action.actionId);
        this.#db.prepare("INSERT INTO actions VALUES(?,?,?,?,?,?)").run(action.actionId,mandate.mandateId,amount,mode,actionDigest,caller.agentId);
        const column=mode==="COMMITTED"?"committed":"held";
        this.#db.prepare("UPDATE account SET "+column+"="+column+"+? WHERE id=1").run(amount);
        this.#db.prepare("UPDATE mandates SET "+column+"="+column+"+? WHERE id=?").run(amount,mandate.mandateId);
        return result(mode,mode==="UNKNOWN"?"SYNTHETIC_OUTCOME_HELD_AWAITING_RECONCILIATION":"ONE_SYNTHETIC_EFFECT_COMMITTED",
          action.actionId,mode==="COMMITTED"?{actionDigest,mandateId:mandate.mandateId,rootPrincipalId:this.#trust.rootPrincipalId,amountMinor:amount}:null);
      });
    } catch {
      return result("UNKNOWN","TRUST_WRITER_OR_CLOCK_UNAVAILABLE");
    }
  }
  execute(req:unknown,caller:HostVerifiedCaller):BudgetResult { return this.#effect(req,caller,"COMMITTED"); }
  /** Protected host-only synthetic simulation of external outcome uncertainty. */
  holdUnknown(req:unknown,caller:HostVerifiedCaller):BudgetResult { return this.#effect(req,caller,"UNKNOWN"); }
  /** Protected controller only: never expose as an agent's arbitrary claim of payment success. */
  reconcileUnknown(actionId:string, signedEvidence:Signed<SignedSyntheticOutcome>):BudgetResult {
    if (!id(actionId)) return result("REJECTED","INVALID_RECONCILIATION");
    try {
      return this.#tx(()=>{
        const row=this.#db.prepare("SELECT * FROM actions WHERE action_id=?").get(actionId) as ActionRecord | undefined;
        if (!row || row.status!=="UNKNOWN") return result("REJECTED","NO_UNCERTAIN_ACTION",actionId);
        let evidence: SignedSyntheticOutcome;
        try {evidence=signed<SignedSyntheticOutcome>(signedEvidence,outcomeKeys,this.#trust.outcomeWitnessPublicKeyPem,SIGNED_OUTCOME_DOMAIN);}
        catch {return result("REJECTED","WITNESS_SIGNATURE_INVALID",actionId);}
        if (evidence.schema !== "atg.signed-outcome.synthetic.v1" || evidence.witnessId !== this.#trust.outcomeWitnessId ||
            evidence.actionId !== actionId || evidence.actionDigest !== row.action_digest ||
            !fingerprintPattern.test(evidence.actionDigest) || !id(evidence.eventId) || !iso(evidence.observedAt) ||
            !["COMMITTED","NO_EFFECT"].includes(evidence.outcome))
          return result("REJECTED","WITNESS_ACTION_BINDING_INVALID",actionId);
        const column=evidence.outcome==="COMMITTED"?"committed":null;
        this.#db.prepare("UPDATE account SET held=held-?"+(column?", committed=committed+?":"")+" WHERE id=1")
          .run(...(column?[row.amount,row.amount]:[row.amount]));
        this.#db.prepare("UPDATE mandates SET held=held-?"+(column?", committed=committed+?":"")+" WHERE id=?")
          .run(...(column?[row.amount,row.amount,row.mandate_id]:[row.amount,row.mandate_id]));
        const state=column?"COMMITTED":"RELEASED";
        this.#db.prepare("UPDATE actions SET status=? WHERE action_id=?").run(state,actionId);
        return result(state,"TRUSTED_SYNTHETIC_RECONCILIATION",actionId,
          column?{actionDigest:row.action_digest,mandateId:row.mandate_id,rootPrincipalId:this.#trust.rootPrincipalId,amountMinor:row.amount}:null);
      });
    } catch { return result("UNKNOWN","RECONCILIATION_OUTCOME_UNKNOWN",actionId); }
  }
  /** Non-authorising lookup. Never a permission to retry after UNKNOWN. */
  lookup(actionId:string):BudgetResult {
    if (!id(actionId)) return result("REJECTED","ACTION_ID_INVALID");
    try {
      const row=this.#db.prepare("SELECT * FROM actions WHERE action_id=?").get(actionId) as ActionRecord | undefined;
      if (!row) return result("NOT_RECORDED","NO_RECORD_NOT_RETRY_PERMISSION",actionId);
      return result(row.status as BudgetResult["outcome"],"AUTHORITATIVE_SYNTHETIC_STATE",actionId,
        row.status==="COMMITTED"?{actionDigest:row.action_digest,mandateId:row.mandate_id,rootPrincipalId:this.#trust.rootPrincipalId,amountMinor:row.amount}:null);
    } catch {return result("UNKNOWN","LOOKUP_UNAVAILABLE",actionId);}
  }
  revoke(mandateId:string):void {
    if (!id(mandateId)) throw Error("MANDATE_ID_INVALID");
    this.#tx(()=>this.#db.prepare("INSERT OR IGNORE INTO revocations(id) VALUES(?)").run(mandateId));
  }
  stop():void { this.#tx(()=>this.#db.prepare("UPDATE metadata SET stopped=1 WHERE id=1").run()); }
  close():void { if (!this.#closed) {this.#db.close();this.#closed=true;} }
}
