export const CONTRACT_VERSION = "atg.v1" as const;

export const REQUIRED_INPUT_FIELDS = [
  "action_type",
  "actor",
  "target",
  "description",
] as const;

export const DECISION_OUTPUT_FIELDS = [
  "contract_version",
  "allowed",
  "risk_level",
  "human_approval_required",
  "action_type",
  "actor",
  "target",
  "policy_profile",
  "regulated_policy",
  "approval_reason",
  "reasons",
  "receipt_id",
  "receipt_saved",
  "receipt_path",
  "timestamp",
  "checked_at",
] as const;

export const SUPPORTED_POLICY_PROFILES = ["standard", "strict", "regulated"] as const;

export const EXIT_CODES = {
  "0": "Command completed. When --fail-on-block is used, the action was allowed.",
  "1": "Input or configuration error.",
  "2": "Action was not allowed when --fail-on-block was used.",
} as const;

export const SAFETY_STATEMENT =
  "Agent Trust Gate returns a local trust decision. It does not execute actions.";

export interface ContractDescription {
  contract_version: typeof CONTRACT_VERSION;
  required_input_fields: string[];
  optional_input_fields: string[];
  decision_output_fields: string[];
  supported_policy_profiles: string[];
  exit_codes: Record<string, string>;
  safety_statement: string;
}

export function getContractDescription(): ContractDescription {
  return {
    contract_version: CONTRACT_VERSION,
    required_input_fields: [...REQUIRED_INPUT_FIELDS],
    optional_input_fields: [
      "estimated_cost_gbp",
      "public_action",
      "external_commitment",
      "money_movement",
      "legal_or_compliance_sensitive",
      "customer_or_user_facing",
      "evidence",
      "rollback_plan",
      "human_approval_status",
    ],
    decision_output_fields: [...DECISION_OUTPUT_FIELDS],
    supported_policy_profiles: [...SUPPORTED_POLICY_PROFILES],
    exit_codes: { ...EXIT_CODES },
    safety_statement: SAFETY_STATEMENT,
  };
}

export function formatContractForConsole(): string {
  const contract = getContractDescription();

  return [
    `Agent Trust Gate contract ${contract.contract_version}`,
    "",
    "Required input fields:",
    ...contract.required_input_fields.map((field) => `- ${field}`),
    "",
    "Key decision output fields:",
    ...contract.decision_output_fields.map((field) => `- ${field}`),
    "",
    "Supported policy profiles:",
    ...contract.supported_policy_profiles.map((profile) => `- ${profile}`),
    "",
    "Exit codes:",
    ...Object.entries(contract.exit_codes).map(([code, meaning]) => `- ${code}: ${meaning}`),
    "",
    contract.safety_statement,
  ].join("\n");
}
