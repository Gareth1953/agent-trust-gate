import { createHash } from "node:crypto";

export const PRIVATE_SANDBOX_DECISION_GATE_VERSION = "atg.private-sandbox-decision-gate.v1" as const;
export type PrivateSandboxReadinessStatus = "ready_for_private_sandbox_review" | "caution" | "blocked" | "not_ready" | "unknown";
export interface PrivateSandboxDecisionGateInput {
  [key:string]:unknown;
  decision_gate_id?:string;
  source_id:string;
  profit_demo_result:Record<string,unknown>;
  controlled_sandbox_result:Record<string,unknown>;
  sandbox_smoke_test_result:Record<string,unknown>;
  safety_flags:Record<string,unknown>;
  required_approvals:Record<string,unknown>;
  created_at:string;
}
export interface PrivateSandboxDecisionGateResult {
  decision_gate_id:string; decision_gate_type:"local_private_sandbox_decision_gate"; source_id:string;
  private_sandbox_ready:boolean; readiness_status:PrivateSandboxReadinessStatus; readiness_score:number;
  profit_demo_ready:boolean; controlled_sandbox_ready:boolean; sandbox_smoke_test_passed:boolean;
  entitlement_gate_verified:boolean; non_allowlisted_agent_denied:boolean; missing_entitlement_denied:boolean;
  engine_allowed_case_verified:boolean; safety_flags_verified:boolean; gareth_final_approval_required:true;
  required_approvals_present:boolean; blocking_reasons:string[]; caution_reasons:string[];
  go_no_go_recommendation:string; plain_english_result:string; recommended_next_steps:string[];
  private_data_included:false; network_lookup_performed:false; external_lookup_performed:false;
  public_api_enabled:false; tracking_triggered:false; analytics_triggered:false;
  payment_or_fee_triggered:false; billing_triggered:false; settlement_triggered:false;
  machine_to_machine_fee_triggered:false; action_executed:false; deployed:false; published:false;
  status:"sandbox_only"; created_at:string;
}
export type PrivateSandboxDecisionGateSummary=Omit<PrivateSandboxDecisionGateResult,"recommended_next_steps"|"created_at">;

const SAFETY_KEYS=["private_data_included","network_lookup_performed","external_lookup_performed","public_api_enabled","tracking_triggered","analytics_triggered","payment_or_fee_triggered","billing_triggered","settlement_triggered","machine_to_machine_fee_triggered","action_executed","deployed","published"] as const;

export function runPrivateSandboxDecisionGate(input:PrivateSandboxDecisionGateInput):PrivateSandboxDecisionGateResult {
 const profit=input.profit_demo_result,sandbox=input.controlled_sandbox_result,smoke=input.sandbox_smoke_test_result;
 const profitReady=profit.entitled_use_passed===true&&profit.missing_entitlement_denied===true&&number(profit.total_hypothetical_revenue_events)>0;
 const controlledReady=sandbox.sandbox_access_status==="sandbox_clearing_allowed"&&sandbox.requesting_agent_allowlisted===true&&sandbox.sandbox_entitlement_present===true&&typeof sandbox.engine_run_id==="string";
 const smokePassed=smoke.smoke_test_passed===true;
 const entitlement=profit.entitled_use_passed===true&&sandbox.sandbox_entitlement_present===true;
 const nonAllowlisted=smoke.denied_sandbox_agent_blocked===true;
 const missingEntitlement=smoke.missing_entitlement_blocked===true&&profit.missing_entitlement_denied===true;
 const engineAllowed=smoke.allowed_sandbox_agent_passed===true&&number(smoke.engine_ran_count)>=1&&typeof sandbox.engine_run_id==="string";
 const safetyVerified=SAFETY_KEYS.every(k=>input.safety_flags[k]===false)&&SAFETY_KEYS.every(k=>smoke[k]===false||smoke[k]===undefined)&&SAFETY_KEYS.every(k=>sandbox[k]===false||sandbox[k]===undefined);
 const gareth=input.required_approvals.requires_gareth_final_approval===true;
 const approvalsPresent=Object.keys(input.required_approvals).length>0&&Object.values(input.required_approvals).every(v=>v===true);
 let score=100;if(!profitReady)score-=20;if(!controlledReady)score-=20;if(!smokePassed)score-=20;if(!entitlement)score-=15;if(!nonAllowlisted||!missingEntitlement)score-=15;if(!safetyVerified)score-=30;if(!gareth)score-=10;score=Math.max(0,Math.min(100,score));
 const blocking:string[]=[];if(!profitReady)blocking.push("profit_demo_not_ready");if(!controlledReady)blocking.push("controlled_sandbox_not_ready");if(!smokePassed)blocking.push("sandbox_smoke_test_failed");if(!entitlement)blocking.push("entitlement_gate_not_verified");if(!nonAllowlisted)blocking.push("non_allowlisted_denial_not_verified");if(!missingEntitlement)blocking.push("missing_entitlement_denial_not_verified");if(!engineAllowed)blocking.push("engine_allowed_case_not_verified");if(!safetyVerified)blocking.push("safety_flag_violation");if(!gareth)blocking.push("gareth_final_approval_gate_missing");if(!approvalsPresent)blocking.push("required_approvals_incomplete");
 const ready=blocking.length===0;const status:PrivateSandboxReadinessStatus=ready?"ready_for_private_sandbox_review":score===0?"blocked":score>=70?"caution":"not_ready";
 const cautions=ready?["readiness_is_local_only_not_certification","gareth_review_required_before_private_external_test"]:[];
 return {decision_gate_id:createPrivateSandboxDecisionGateId(input.decision_gate_id??input.source_id),decision_gate_type:"local_private_sandbox_decision_gate",source_id:safeId(input.source_id),private_sandbox_ready:ready,readiness_status:status,readiness_score:score,profit_demo_ready:profitReady,controlled_sandbox_ready:controlledReady,sandbox_smoke_test_passed:smokePassed,entitlement_gate_verified:entitlement,non_allowlisted_agent_denied:nonAllowlisted,missing_entitlement_denied:missingEntitlement,engine_allowed_case_verified:engineAllowed,safety_flags_verified:safetyVerified,gareth_final_approval_required:true,required_approvals_present:approvalsPresent,blocking_reasons:blocking,caution_reasons:cautions,go_no_go_recommendation:ready?"GO for Gareth private sandbox review only; do not activate external access.":"NO-GO. Resolve blocking reasons before private sandbox review.",plain_english_result:ready?"Private sandbox decision gate passed locally. Profit demo, controlled sandbox, and sandbox smoke test are ready. Entitlement gating works. Non-allowlisted and non-entitled agents are denied. All live, payment, network, tracking, and action flags remain false. Recommendation: ready for Gareth review before any future private sandbox test.":"Private sandbox decision gate blocked locally. One or more required readiness checks failed. Do not proceed to private sandbox review.",recommended_next_steps:ready?["gareth_review_required","keep_all_live_capabilities_disabled"]:["resolve_blocking_reasons","rerun_local_smoke_test","keep_all_live_capabilities_disabled"],private_data_included:false,network_lookup_performed:false,external_lookup_performed:false,public_api_enabled:false,tracking_triggered:false,analytics_triggered:false,payment_or_fee_triggered:false,billing_triggered:false,settlement_triggered:false,machine_to_machine_fee_triggered:false,action_executed:false,deployed:false,published:false,status:"sandbox_only",created_at:safeTimestamp(input.created_at)};
}
export function createPrivateSandboxDecisionGateId(sourceId:string):string{return"private_sandbox_decision_gate_"+createHash("sha256").update(sourceId,"utf8").digest("hex").slice(0,24)}
export function summarisePrivateSandboxDecisionGate(result:PrivateSandboxDecisionGateResult):PrivateSandboxDecisionGateSummary{const{recommended_next_steps:_n,created_at:_c,...summary}=result;return summary}
function number(v:unknown):number{return typeof v==="number"&&Number.isFinite(v)?v:0}
function safeId(v:string):string{return"source_"+createHash("sha256").update(v,"utf8").digest("hex").slice(0,20)}
function safeTimestamp(v:string):string{const d=new Date(v);return Number.isNaN(d.valueOf())?"1970-01-01T00:00:00.000Z":d.toISOString()}
