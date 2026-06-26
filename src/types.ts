export type RiskLevel = "low" | "medium" | "high" | "blocked";

export type HumanApprovalStatus = "not_requested" | "requested" | "approved" | "rejected";

export interface VerifyBeforeActionInput {
  action_type: string;
  description: string;
  actor: string;
  target: string;
  estimated_cost_gbp?: number;
  public_action?: boolean;
  external_commitment?: boolean;
  money_movement?: boolean;
  legal_or_compliance_sensitive?: boolean;
  customer_or_user_facing?: boolean;
  evidence?: string[];
  rollback_plan?: string;
  human_approval_status?: HumanApprovalStatus;
}

export interface VerificationCheck {
  check: string;
  passed: boolean;
  severity: Exclude<RiskLevel, "blocked">;
  message: string;
}

export interface InputSummary {
  action_type: string;
  description: string;
  actor: string;
  target: string;
  estimated_cost_gbp: number;
  public_action: boolean;
  external_commitment: boolean;
  money_movement: boolean;
  legal_or_compliance_sensitive: boolean;
  customer_or_user_facing: boolean;
  evidence_count: number;
  has_rollback_plan: boolean;
  human_approval_status: HumanApprovalStatus;
}

export interface VerificationReceipt {
  allowed: boolean;
  risk_level: RiskLevel;
  human_approval_required: boolean;
  approval_reason: string | null;
  checks: VerificationCheck[];
  receipt_id: string;
  timestamp: string;
  input_summary: InputSummary;
  recommended_next_step: string;
  limitations: string[];
}

export interface RiskEvaluation {
  risk_level: RiskLevel;
  human_approval_required: boolean;
  approval_reasons: string[];
  checks: VerificationCheck[];
}
