import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface LocalMachinePurchasePolicy {
  policy_version: "atg.machine-purchase-policy.example.v1";
  local_only: true;
  automatic_purchase_enabled: false;
  payment_execution_enabled: false;
  default_decision: "deny_automatic_purchase";
  currency: "GBP";
  per_purchase_limit: 0;
  daily_limit: 0;
  monthly_limit: 0;
  human_approval_required: true;
  approval_pack_required: true;
  evidence_bundle_required: true;
  allowed_plan_codes: string[];
  safety_statement: string;
}

export interface LocalMachinePurchasePolicyResult {
  policy_file_provided: boolean;
  policy_file_found: boolean;
  policy_file_path: string | null;
  policy: LocalMachinePurchasePolicy;
}

export class MachinePurchasePolicyError extends Error {
  readonly code = "INVALID_MACHINE_PURCHASE_POLICY";
  constructor(message: string) { super(message); this.name = "MachinePurchasePolicyError"; }
}

export function defaultMachinePurchasePolicy(): LocalMachinePurchasePolicy {
  return {
    policy_version: "atg.machine-purchase-policy.example.v1",
    local_only: true,
    automatic_purchase_enabled: false,
    payment_execution_enabled: false,
    default_decision: "deny_automatic_purchase",
    currency: "GBP",
    per_purchase_limit: 0,
    daily_limit: 0,
    monthly_limit: 0,
    human_approval_required: true,
    approval_pack_required: true,
    evidence_bundle_required: true,
    allowed_plan_codes: [],
    safety_statement: "This example policy does not enable payments, billing, or automatic purchase.",
  };
}

export function readLocalMachinePurchasePolicy(policyFile?: string): LocalMachinePurchasePolicyResult {
  if (policyFile === undefined) return { policy_file_provided: false, policy_file_found: false, policy_file_path: null, policy: defaultMachinePurchasePolicy() };
  const path = resolve(policyFile);
  if (!existsSync(path)) throw new MachinePurchasePolicyError(`Local machine purchase policy was not found at "${path}".`);
  let parsed: unknown;
  try { parsed = JSON.parse(readFileSync(path, "utf8")) as unknown; } catch (error) { throw new MachinePurchasePolicyError(`Unable to read local machine purchase policy: ${error instanceof Error ? error.message : String(error)}`); }
  if (!isPolicy(parsed)) throw new MachinePurchasePolicyError("Policy must deny automatic purchase, disable payment execution, require human approval, and keep all spending limits at zero.");
  return { policy_file_provided: true, policy_file_found: true, policy_file_path: path, policy: parsed };
}

function isPolicy(value: unknown): value is LocalMachinePurchasePolicy {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const p = value as Partial<LocalMachinePurchasePolicy>;
  return p.policy_version === "atg.machine-purchase-policy.example.v1" && p.local_only === true &&
    p.automatic_purchase_enabled === false && p.payment_execution_enabled === false &&
    p.default_decision === "deny_automatic_purchase" && p.currency === "GBP" &&
    p.per_purchase_limit === 0 && p.daily_limit === 0 && p.monthly_limit === 0 &&
    p.human_approval_required === true && p.approval_pack_required === true && p.evidence_bundle_required === true &&
    Array.isArray(p.allowed_plan_codes) && p.allowed_plan_codes.every((code) => typeof code === "string") &&
    typeof p.safety_statement === "string";
}
