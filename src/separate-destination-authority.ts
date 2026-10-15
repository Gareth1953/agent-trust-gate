import type { DatabaseSync as SqliteDatabase } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, lstatSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { LocalDurableLifecycleStore, DEFAULT_AGGREGATE_EXPOSURE_RULE, createOperatorAuthorityEvidence, type AggregateExposureRule, type DurableStoreSnapshot, type OperatorAuthorityEvidence } from "./durable-action-lifecycle.js";
import { McpExactActionGateway, validateMcpBusinessPolicyRequest, type EvaluationLifecycleStore, type McpBusinessPolicyResult } from "./mcp-exact-action-gateway.js";
import { createPurchaseOrderStateBinding, validatePurchaseOrderBusinessState, type PurchaseOrderBusinessState } from "./purchase-order-state-binding.js";
import { createCanonicalPayloadHash as hash } from "./local-signed-proof.js";
import { PURCHASING_DEMO_EXECUTION_TIME as AT } from "./local-purchasing-lifecycle-demo.js";
import { verifyDestinationApproval, verifyDestinationEvidence, validateDestinationTrust, DESTINATION_CLOCK_ID, type DestinationApproval, type DestinationLookup, type DestinationTrust } from "./destination-evidence.js";
import { SyntheticDestinationProcess } from "./destination-process-client.js";

if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("ATG_SHARED_WORKER_REQUIRES_NODE_24: optional Mission 03 authority requires Node 24; legacy plugin and public-key verifier support Node 20.");
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
const VERSION = "atg.separate-destination-authority.synthetic.v1";
interface Entry { approval: DestinationApproval; token: string | null; registered: boolean; sent: boolean; blocked: boolean; pending: DestinationLookup | null }
interface State { version: string; trust: DestinationTrust; rule: AggregateExposureRule; core: DurableStoreSnapshot | null; entries: Entry[] }
export interface SeparateDestinationClaim { approvalId: string; token: string }
export interface SeparateDestinationResult { outcome: "EXECUTED" | "NOT_EXECUTED" | "REJECTED" | "UNKNOWN"; reason: string; automaticRetryPermitted: false }
const result = (outcome: SeparateDestinationResult["outcome"], reason: string): SeparateDestinationResult => ({ outcome, reason, automaticRetryPermitted: false });

/** Shared authority SQLite only. No destination records or private key are opened here.
 * No authority transaction/SQLite lock is held across an IPC await.
 */
export class SeparateDestinationAuthority {
  readonly #db: SqliteDatabase;
  readonly #trust: DestinationTrust;
  readonly #rule: AggregateExposureRule;
  readonly #destination: SyntheticDestinationProcess;
  static initialise(directory: string, trust: DestinationTrust, rule=DEFAULT_AGGREGATE_EXPOSURE_RULE): void {
    validateDestinationTrust(trust); validateRule(rule);
    if (!isAbsolute(directory)) throw new Error("ABSOLUTE_AUTHORITY_DIRECTORY_REQUIRED");
    mkdirSync(directory, { mode: 0o700 });
    const db=new DatabaseSync(join(directory,"authority.sqlite"));
    try {
      db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; CREATE TABLE snapshot (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, digest TEXT NOT NULL) STRICT");
      const state:State={ version:VERSION, trust:structuredClone(trust), rule:structuredClone(rule), core:null, entries:[] };
      db.prepare("INSERT INTO snapshot VALUES(1,?,?)").run(JSON.stringify(state),hash(state));
      writeFileSync(join(directory,"ready"),VERSION,{flag:"wx"});
    } finally { db.close(); }
  }
  constructor(options: { stateDirectory: string; destination: SyntheticDestinationProcess; trust: DestinationTrust }) {
    validateDestinationTrust(options.trust);
    const dir=options.stateDirectory;
    if (!isAbsolute(dir) || lstatSync(dir).isSymbolicLink() || lstatSync(join(dir,"authority.sqlite")).isSymbolicLink()
      || readFileSync(join(dir,"ready"),"utf8")!==VERSION) throw new Error("AUTHORITY_STORE_NOT_READY");
    if (!(options.destination instanceof SyntheticDestinationProcess)) throw new Error("FIXED_SYNTHETIC_IPC_CLIENT_REQUIRED");
    this.#trust=structuredClone(options.trust); this.#destination=options.destination;
    this.#db=new DatabaseSync(join(dir,"authority.sqlite"));
    try {
      this.#db.exec("PRAGMA busy_timeout=5000; PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA");
      const state=this.#load(); validateRule(state.rule); this.#rule=structuredClone(state.rule);
      this.#tx(()=>undefined);
    } catch(e) { this.#db.close(); throw e; }
  }
  #load(): State {
    if (this.#db.prepare("PRAGMA quick_check").get()?.quick_check!=="ok") throw new Error("AUTHORITY_CORRUPT");
    const row=this.#db.prepare("SELECT payload,digest FROM snapshot WHERE id=1").get();
    if (!row || typeof row.payload!=="string") throw new Error("AUTHORITY_MISSING");
    const s=JSON.parse(row.payload) as State;
    if (s.version!==VERSION || hash(s)!==row.digest || hash(s.trust)!==hash(this.#trust) || !Array.isArray(s.entries)) throw new Error("AUTHORITY_OR_TRUST_CHANGED");
    return s;
  }
  #tx<T>(fn: (s:State, core:LocalDurableLifecycleStore)=>T): T {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const s=this.#load(); if(hash(s.rule)!==hash(this.#rule)) throw new Error("AUTHORITY_RULE_CHANGED");
      const ids=new Set();
      for (const entry of s.entries) {
        if (!verifyDestinationApproval(entry.approval,this.#trust) || ids.has(entry.approval.approvalId)
          || ![entry.registered,entry.sent,entry.blocked].every(v=>typeof v==='boolean')) throw new Error("APPROVAL_INVALID");
        ids.add(entry.approval.approvalId);
      }
      const core=new LocalDurableLifecycleStore({transactionalSnapshot:{state:s.core,persist:value=>{s.core=value;}}});
      const v=fn(s,core); if(v instanceof Promise) throw new Error("ASYNC_TRANSACTION_REFUSED");
      s.core=core.snapshot(); this.#db.prepare("UPDATE snapshot SET payload=?,digest=? WHERE id=1").run(JSON.stringify(s),hash(s));
      this.#db.exec("COMMIT"); return v;
    } catch(e) { this.#db.exec("ROLLBACK"); throw e; }
  }
  async approve(value:unknown): Promise<{ approvalId: string | null; decision: McpBusinessPolicyResult }> {
    const request=structuredClone(validateMcpBusinessPolicyRequest(value));
    const state=await this.#destination.request({op:"state"}) as PurchaseOrderBusinessState;
    validatePurchaseOrderBusinessState(state);
    const binding=createPurchaseOrderStateBinding(state,request);
    const adapter:EvaluationLifecycleStore={
      issue:input=>this.#tx((_s,c)=>c.issue(input)), previewExposure:input=>this.#tx((_s,c)=>c.previewExposure(input)),
      isEmergencyStopActive:()=>this.#tx((_s,c)=>c.isEmergencyStopActive()), recordNonAuthorisingDecision:input=>this.#tx((_s,c)=>c.recordNonAuthorisingDecision(input)),
    };
    const decision=await new McpExactActionGateway({durableStore:adapter,exposureRule:this.#rule}).evaluateAction(request,{approvedPurchaseOrderStateBinding:binding}) as McpBusinessPolicyResult;
    if(!decision.authorising || !decision.gatePass || !decision.policyDecisionReceipt || request.mode!=="enforced") return {approvalId:null,decision};
    const approval:DestinationApproval={approvalId:decision.gatePass.gatePassId,request,binding,gatePass:decision.gatePass,decisionReceipt:decision.policyDecisionReceipt};
    if(!verifyDestinationApproval(approval,this.#trust)) throw new Error("APPROVAL_INVALID");
    this.#tx(s=>s.entries.push({approval,token:null,registered:false,sent:false,blocked:false,pending:null}));
    // A crash between issuance and handle persistence leaves outstanding exposure; no reconstruction/reset.
    return {approvalId:approval.approvalId,decision};
  }
  async claim(id:string,value:unknown): Promise<SeparateDestinationClaim | null> {
    const request=validateMcpBusinessPolicyRequest(value);
    const prepared=this.#tx((s,c)=>{
      const e=s.entries.find(e=>e.approval.approvalId===id);
      if(!e || e.token || e.blocked || hash(e.approval.request)!==hash(request)) return null;
      const life=c.getLifecycleByGatePassId(id);
      if(!life || !c.reserve(e.approval.gatePass,life.lifecycleRevision,AT).changed) return null;
      e.token=randomUUID(); return {approval:structuredClone(e.approval),token:e.token};
    });
    if(!prepared) return null;
    try {
      await this.#destination.request({op:"register",...prepared});
      return this.#tx((s,c)=>{
        const e=s.entries.find(e=>e.approval.approvalId===id)!;
        if(e.token!==prepared.token || e.blocked || c.isEmergencyStopActive() || c.getLifecycleByGatePassId(id)?.status!=="RESERVED") return null;
        e.registered=true; return {approvalId:id,token:prepared.token};
      });
    } catch { this.#unknown(id); return null; }
  }
  #unknown(id:string): void { this.#tx((_s,c)=>c.markPossibleExternalEffect(id,AT)); }
  #lookup(fence:boolean): DestinationLookup { return {requestId:randomUUID(),challenge:randomUUID(),requestedAt:AT,clockId:DESTINATION_CLOCK_ID,fenceId:fence?randomUUID():null}; }
  /** Durable one-shot send intent precedes IPC; even rejection/timeout requires reconciliation. */
  async submit(claim:SeparateDestinationClaim): Promise<SeparateDestinationResult> {
    try {
      const prepared=this.#tx((s,c)=>{
        const e=s.entries.find(e=>e.approval.approvalId===claim.approvalId);
        if(!e || e.blocked || e.token!==claim.token || !e.registered || e.sent || c.isEmergencyStopActive() || c.getLifecycleByGatePassId(claim.approvalId)?.status!=="RESERVED") return null;
        e.sent=true; e.pending=this.#lookup(false); c.markPossibleExternalEffect(claim.approvalId,AT);
        return {op:"submit",approval:structuredClone(e.approval),token:claim.token,lookup:structuredClone(e.pending)};
      });
      if(!prepared) return result("REJECTED","STALE_OR_CONSUMED_AUTHORITY");
      const evidence=await this.#destination.request(prepared);
      return this.acceptEvidence(claim.approvalId,evidence);
    } catch { return result("UNKNOWN","DESTINATION_OR_AUTHORITY_UNAVAILABLE_HOLD_RETAINED"); }
  }
  /** Export a fresh expected request for separate retrieval/verification. It is persisted and single-use. */
  beginLookup(id:string,fenced=true,evidence=createOperatorAuthorityEvidence()): {approval:DestinationApproval;lookup:DestinationLookup} {
    return this.#tx((s,c)=>{
      const e=s.entries.find(e=>e.approval.approvalId===id);
      const status=c.getLifecycleByGatePassId(id)?.status;
      if(!e || (!['RESERVED','UNKNOWN'].includes(status??'') && !(e.blocked && status==='ISSUED'))) throw new Error("RECONCILIATION_NOT_ELIGIBLE");
      const check=c.reconcile({gatePassId:id,finding:"still_unknown",evidenceReference:"fixture://mission03/lookup-intent",reconciledAt:AT,authorityEvidence:evidence});
      if(check.reasonCode==="OPERATOR_AUTHORITY_INVALID") throw new Error("OPERATOR_AUTHORITY_INVALID");
      e.pending=this.#lookup(fenced);
      return {approval:structuredClone(e.approval),lookup:structuredClone(e.pending)};
    });
  }
  acceptEvidence(id:string,input:unknown,evidence:OperatorAuthorityEvidence=createOperatorAuthorityEvidence()): SeparateDestinationResult {
    try { return this.#tx((s,c)=>{
      const e=s.entries.find(e=>e.approval.approvalId===id);
      if(!e || !e.pending) return result("UNKNOWN","NO_PENDING_LOOKUP_OR_ALREADY_CONSUMED");
      const verified=verifyDestinationEvidence(input,e.approval,this.#trust,e.pending,AT);
      if(!verified.verified) { c.markPossibleExternalEffect(id,AT); return result("UNKNOWN",verified.reason); }
      // Even an unclaimed signed approval can be held by a delayed worker.
      // Never release ISSUED exposure on revocation until a destination fence
      // proves absence. If stop prevented reservation, preserve the issued hold
      // until that signed absence allows the ordinary core revocation.
      const issuedBlocked=e.blocked && c.getLifecycleByGatePassId(id)?.status==='ISSUED';
      if(issuedBlocked && verified.outcome!=='ABSENT') return result('UNKNOWN','UNEXPECTED_ISSUED_EXECUTION_HOLD_RETAINED');
      const changed=issuedBlocked
        ? c.revoke({gatePass:e.approval.gatePass,reason:'signed destination fenced absence',revokedAt:AT,authorityEvidence:evidence})
        : c.reconcile({gatePassId:id,finding:verified.outcome==="EXECUTED"?"confirmed_executed":"confirmed_not_executed",
          evidenceReference:"fixture://mission03/"+hash(input).slice(7),reconciledAt:AT,authorityEvidence:evidence});
      if(!changed.changed) return result("UNKNOWN",changed.reasonCode);
      e.pending=null; e.token=null;
      return result(verified.outcome==="EXECUTED"?"EXECUTED":"NOT_EXECUTED","SIGNED_DESTINATION_RECONCILED_NO_RETRY");
    }); } catch { return result("UNKNOWN","EVIDENCE_OR_AUTHORITY_INVALID_HOLD_RETAINED"); }
  }
  async reconcile(id:string,evidence=createOperatorAuthorityEvidence()): Promise<SeparateDestinationResult> {
    try {
      const q=this.beginLookup(id,true,evidence);
      const receipt=await this.#destination.request({op:"fence_lookup",...q});
      return this.acceptEvidence(id,receipt,evidence);
    } catch { return result("UNKNOWN","RECONCILIATION_UNAVAILABLE_HOLD_RETAINED"); }
  }
  async revoke(id:string,evidence=createOperatorAuthorityEvidence()): Promise<SeparateDestinationResult> {
    try {
      const terminal=this.#tx((s,c)=>{
        const e=s.entries.find(e=>e.approval.approvalId===id); if(!e) throw new Error("APPROVAL_MISSING");
        const check=c.reconcile({gatePassId:id,finding:'still_unknown',evidenceReference:'fixture://mission03/revoke-preflight',reconciledAt:AT,authorityEvidence:evidence});
        if(check.reasonCode==='OPERATOR_AUTHORITY_INVALID') throw new Error('OPERATOR_AUTHORITY_INVALID');
        const life=c.getLifecycleByGatePassId(id);if(!life)throw new Error('LIFECYCLE_MISSING');
        if(life.status==='EXECUTED')return 'GATEPASS_REVOCATION_AFTER_EXECUTION_REFUSED';
        if(!['ISSUED','RESERVED','UNKNOWN'].includes(life.status))return 'LIFECYCLE_TERMINAL';
        e.blocked=true;
        if(life.status==='ISSUED') { c.reserve(e.approval.gatePass,life.lifecycleRevision,AT); c.markPossibleExternalEffect(id,AT); }
        return null;
      });
      if(terminal)return result('REJECTED',terminal);
      return this.reconcile(id,evidence);
    } catch {return result('UNKNOWN','REVOCATION_FAILED_HOLD_RETAINED');}
  }
  async emergencyStop(evidence=createOperatorAuthorityEvidence()): Promise<SeparateDestinationResult> {
    const stopped=this.#tx((_s,c)=>c.setEmergencyStop({active:true,reason:"synthetic host stop",recordedAt:AT,authorityEvidence:evidence}));
    // An operator may explicitly finish an interrupted destination stop. The
    // authority's already-active flag must not prevent completion after restart.
    if(!stopped.changed && stopped.reasonCode!=="EMERGENCY_STOP_ALREADY_ACTIVE") return result("UNKNOWN","STOP_REFUSED");
    try { await this.#destination.request({op:"stop"}); return result("REJECTED","AUTHORITY_AND_DESTINATION_STOPPED_RECONCILE_INFLIGHT"); }
    catch { return result("UNKNOWN","DESTINATION_STOP_UNCONFIRMED_AUTHORITY_REMAINS_STOPPED"); }
  }
  approval(id:string):DestinationApproval { return this.#tx(s=>{const e=s.entries.find(e=>e.approval.approvalId===id);if(!e)throw new Error("APPROVAL_MISSING");return structuredClone(e.approval);}); }
  snapshot():DurableStoreSnapshot { return this.#tx((_s,c)=>c.snapshot()); }
  close():void { this.#db.close(); }
}
function validateRule(r:AggregateExposureRule):void {
  if(!r || !Number.isSafeInteger(r.maximumAggregateMinorUnits) || r.maximumAggregateMinorUnits<0 || (r.maximumActionCount!==null && (!Number.isSafeInteger(r.maximumActionCount)||r.maximumActionCount<1))
    || hash({...r,maximumAggregateMinorUnits:DEFAULT_AGGREGATE_EXPOSURE_RULE.maximumAggregateMinorUnits,maximumActionCount:DEFAULT_AGGREGATE_EXPOSURE_RULE.maximumActionCount})!==hash(DEFAULT_AGGREGATE_EXPOSURE_RULE)) throw new Error("SHARED_RULE_INVALID");
}
