import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { CONTRACT_VERSION } from "./contract.js";
import { readLocalMachinePurchasePolicy, type LocalMachinePurchasePolicyResult } from "./machine-purchase-policy.js";

export const MACHINE_PURCHASE_POLICY_READINESS_VERSION = "atg.machine-purchase-policy-readiness.v1" as const;
export const MACHINE_PURCHASE_POLICY_READINESS_SAFETY_STATEMENT = "Machine-to-machine purchase policy readiness is a local planning snapshot only. It does not enable automatic purchase, bill customers, process payments, collect payment details, create real purchases, expose a public service, or execute actions.";
export interface MachinePurchasePolicyReadinessCheck { id:string; label:string; status:"pass"|"partial"|"not_started"|"future"; severity:"info"|"warning"|"critical"; evidence:string[]; recommendation:string; }
export interface MachinePurchasePolicyReadinessReport {
  [key:string]:unknown; contract_version:typeof CONTRACT_VERSION; machine_purchase_policy_readiness_version:typeof MACHINE_PURCHASE_POLICY_READINESS_VERSION; generated_at:string; local_only:true;
  machine_purchase_policy_available:true; automatic_purchase_enabled:false; payment_execution_enabled:false; purchase_endpoint_enabled:false; real_charges_enabled:false;
  overall:{machine_purchase_policy_readiness_percent:25;status:"local_machine_purchase_policy_planning_only";next_gate:"define_payment_provider_and_human_approval_controls_before_automatic_purchase"};
  policy_model:Record<string,boolean>; spending_control_model:{spending_limits_required:true;per_purchase_limit_required:true;daily_limit_required:true;monthly_limit_required:true;currency:"GBP";real_limits_configured:false;default_policy:"deny_automatic_purchase";automatic_purchase_limit:0};
  approval_model:{human_approval_required:true;approval_record_required:true;approval_pack_required:true;evidence_bundle_required:true;agent_self_approval_allowed:false;approval_before_payment_required:true;approval_after_payment_allowed:false};
  purchase_evidence_model:Record<string,boolean>; local_policy:LocalMachinePurchasePolicyResult; checks:MachinePurchasePolicyReadinessCheck[]; required_before_automatic_purchase:string[]; recommended_machine_purchase_controls:string[]; safety_statement:string;
}

export function createMachinePurchasePolicyReadinessReport(options:{now?:Date;policyFile?:string}={}):MachinePurchasePolicyReadinessReport {
  return {
    contract_version:CONTRACT_VERSION,machine_purchase_policy_readiness_version:MACHINE_PURCHASE_POLICY_READINESS_VERSION,generated_at:(options.now??new Date()).toISOString(),local_only:true,
    machine_purchase_policy_available:true,automatic_purchase_enabled:false,payment_execution_enabled:false,purchase_endpoint_enabled:false,real_charges_enabled:false,
    overall:{machine_purchase_policy_readiness_percent:25,status:"local_machine_purchase_policy_planning_only",next_gate:"define_payment_provider_and_human_approval_controls_before_automatic_purchase"},
    policy_model:{purchase_requests_supported_in_future:true,purchase_request_evaluation_available:true,automatic_purchase_enabled:false,payment_execution_enabled:false,purchase_endpoint_available:false,upgrade_request_signal_available:true,entitlement_over_limit_signal_available:true,billing_payment_readiness_available:true,customer_tenant_readiness_available:true,human_approval_required_before_enabling:true},
    spending_control_model:{spending_limits_required:true,per_purchase_limit_required:true,daily_limit_required:true,monthly_limit_required:true,currency:"GBP",real_limits_configured:false,default_policy:"deny_automatic_purchase",automatic_purchase_limit:0},
    approval_model:{human_approval_required:true,approval_record_required:true,approval_pack_required:true,evidence_bundle_required:true,agent_self_approval_allowed:false,approval_before_payment_required:true,approval_after_payment_allowed:false},
    purchase_evidence_model:{purchase_attempt_logging_required:true,request_id_required:true,client_id_required:true,tenant_id_required_before_production:true,account_id_required_before_production:true,plan_code_required:true,entitlement_status_required:true,billing_status_required:true,payment_receipt_required_if_payments_enabled:true,evidence_bundle_required_for_high_value_purchase:true},
    local_policy:readLocalMachinePurchasePolicy(options.policyFile),
    checks:[
      check("deny_policy_available","Default deny policy available","pass","info",["Automatic purchase defaults to denied with zero limits."],"Keep deny-by-default until every payment and authorization gate is approved."),
      check("human_approval_required","Human approval required","pass","info",["Self-approval is prohibited and approval must precede any future payment."],"Use immutable approval records tied to exact scope and limits."),
      check("purchase_evidence_required","Purchase evidence required","partial","warning",["Request, client, ownership, plan, entitlement, billing, approval, and evidence requirements are defined."],"Implement durable evidence and financial receipts only after payment design."),
      check("payment_execution_missing","Payment execution missing","not_started","critical",["No provider, payment execution, purchase endpoint, or real charges exist."],"Complete provider, legal, security, tax, fraud, and incident controls first."),
      check("automatic_purchase_disabled","Automatic purchase disabled","pass","info",["No policy may enable automatic purchase or positive spending limits."],"Require explicit Gareth approval before any future enabling change."),
    ],
    required_before_automatic_purchase:["payment provider and payment execution architecture","reviewed billing and payment terms","per-purchase, daily, and monthly spending limits","production customer and tenant ownership","entitlement-to-plan mapping","immutable approval records","purchase evidence and financial receipt policy","fraud and abuse controls","payment failure and incident process","legal and tax review","explicit Gareth approval before enabling automatic purchase"],
    recommended_machine_purchase_controls:["deny automatic purchase by default","explicit Gareth approval before enabling automatic purchase","human approval before payment","agent self-approval prohibited","zero default spending limits","per-client and per-tenant limits","idempotent purchase intent identifiers","immutable decision and evidence records","fraud and abuse monitoring","revocation and emergency disable controls"],
    safety_statement:MACHINE_PURCHASE_POLICY_READINESS_SAFETY_STATEMENT,
  };
}
function check(id:string,label:string,status:MachinePurchasePolicyReadinessCheck["status"],severity:MachinePurchasePolicyReadinessCheck["severity"],evidence:string[],recommendation:string):MachinePurchasePolicyReadinessCheck{return{id,label,status,severity,evidence,recommendation};}
export function formatMachinePurchasePolicyReadinessForConsole(r:MachinePurchasePolicyReadinessReport):string{return ["Agent Trust Gate machine-to-machine purchase policy readiness",`machine_purchase_policy_readiness_version: ${r.machine_purchase_policy_readiness_version}`,`machine_purchase_policy_readiness_percent: ${r.overall.machine_purchase_policy_readiness_percent}`,`status: ${r.overall.status}`,`automatic_purchase_enabled: ${r.automatic_purchase_enabled}`,`payment_execution_enabled: ${r.payment_execution_enabled}`,`purchase_endpoint_enabled: ${r.purchase_endpoint_enabled}`,`real_charges_enabled: ${r.real_charges_enabled}`,"",r.safety_statement].join("\n");}
export function writeMachinePurchasePolicyReadinessReport(path:string,r=createMachinePurchasePolicyReadinessReport()):string{const p=resolve(path);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,`${JSON.stringify(r,null,2)}\n`,"utf8");return p;}
