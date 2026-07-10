import { createHash } from "node:crypto";

import type { LocalGatePassDemoInput, LocalGatePassVerdict } from "./local-gate-pass-demo.js";
import {
  createLocalGatePassAuditReceipt,
  type LocalGatePassAuditReceipt,
} from "./local-gate-pass-receipt.js";
import { LocalGatePassReplayStore } from "./local-gate-pass-protection.js";
import {
  simulateLocalSettlementBlocker,
  type LocalSettlementBlockerDecision,
} from "./local-settlement-blocker.js";
import {
  verifyLocalTrustReceipt,
  type LocalTrustReceiptVerificationDecision,
} from "./local-trust-receipt-verifier.js";

export const LOCAL_END_TO_END_MONEY_GATE_PROOF_VERSION =
  "atg.local-end-to-end-money-gate-proof.v1" as const;

export type LocalMoneyGateProofScenarioType =
  | "approved_first_use"
  | "replay_attempt"
  | "missing_mandate"
  | "missing_evidence"
  | "missing_verified_intent"
  | "over_limit"
  | "approval_pending"
  | "expired_gate_pass"
  | "scope_mismatch"
  | "autonomous_execution_prohibited";

export type LocalMoneyGateSettlementOutcome = "simulated_eligible" | "blocked";

export interface LocalEndToEndMoneyGateProofInput extends LocalGatePassDemoInput {
  proof_id?: string;
}

export interface LocalMoneyGateProofScenarioResult {
  scenario_type: LocalMoneyGateProofScenarioType;
  request_id: string;
  gate_verdict: LocalGatePassVerdict;
  receipt_id: string;
  receipt_type: string;
  gate_checks: {
    mandate: boolean;
    evidence: boolean;
    verified_intent: boolean;
    limits: boolean;
    approval: boolean;
  };
  receipt_verified_for_settlement: boolean;
  receipt_structurally_valid: boolean;
  receipt_fresh: boolean;
  replay_safe: boolean;
  verification_reason_codes: string[];
  settlement_blocker_invoked: boolean;
  settlement_outcome: LocalMoneyGateSettlementOutcome;
  settlement_block_reason_codes: string[];
  control_proven: boolean;
  action_executed: false;
  payment_triggered: false;
  settlement_executed: false;
}

export interface LocalMoneyGateProofControls {
  approved_in_scope_request_allowed_once: boolean;
  replay_blocked: boolean;
  no_mandate_blocked: boolean;
  no_evidence_blocked: boolean;
  no_verified_intent_blocked: boolean;
  over_limit_blocked: boolean;
  missing_approval_blocked: boolean;
  expired_gate_pass_blocked: boolean;
  scope_mismatch_blocked: boolean;
  autonomous_execution_blocked: boolean;
}

export interface LocalMoneyGateProofMetadata {
  schema_version: "atg.local-proof-metadata.v1";
  proof_purpose: "pre_settlement_money_gate";
  proof_status: "passed" | "failed";
  issuer_ref: string;
  verifier_ref: string;
  created_at: string;
  expires_at: string;
  nonce: string;
  local_only: true;
  replay_freshness: {
    nonce: string;
    single_use: true;
    freshness_window_seconds: number;
    replay_protection: "local_in_memory_single_use";
  };
}

export interface LocalEndToEndMoneyGateProofResult {
  proof_version: typeof LOCAL_END_TO_END_MONEY_GATE_PROOF_VERSION;
  proof_id: string;
  proof_type: "local_end_to_end_money_gate";
  request_id: string;
  proof_metadata: LocalMoneyGateProofMetadata;
  rule: "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
  proof_status: "passed" | "failed";
  proof_passed: boolean;
  scenario_count: number;
  controls_proven: number;
  simulated_settlement_eligible_count: number;
  failure_reasons: string[];
  controls: LocalMoneyGateProofControls;
  scenarios: LocalMoneyGateProofScenarioResult[];
  local_only: true;
  input_data_retained: false;
  private_data_included: false;
  network_call_performed: false;
  external_agent_contacted: false;
  credential_created: false;
  cryptographic_signature_created: false;
  payment_triggered: false;
  settlement_executed: false;
  action_executed: false;
  note: "Local proof simulation only; no real payment, settlement, API call, signing, or action execution occurred.";
  checked_at: string;
}

export type LocalEndToEndMoneyGateProofSummary = Omit<
  LocalEndToEndMoneyGateProofResult,
  "scenarios"
>;

const RULE = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement." as const;
const NOTE = "Local proof simulation only; no real payment, settlement, API call, signing, or action execution occurred." as const;

export function runLocalEndToEndMoneyGateProof(
  input: LocalEndToEndMoneyGateProofInput,
): LocalEndToEndMoneyGateProofResult {
  const replayStore = new LocalGatePassReplayStore();
  const approvedInput = scenarioInput(input, "approved_first_use");
  const approvedReceipt = createLocalGatePassAuditReceipt(approvedInput);
  const approved = evaluateScenario(
    "approved_first_use",
    approvedInput,
    approvedReceipt,
    approvedReceipt.checked_at,
    replayStore,
  );
  approved.control_proven = approved.gate_verdict === "allow_signed_gate_pass"
    && approved.receipt_verified_for_settlement
    && approved.settlement_outcome === "simulated_eligible"
    && approved.settlement_blocker_invoked;

  const replay = evaluateScenario(
    "replay_attempt",
    approvedInput,
    approvedReceipt,
    approvedReceipt.checked_at,
    replayStore,
  );
  replay.control_proven = replay.gate_verdict === "allow_signed_gate_pass"
    && !replay.receipt_verified_for_settlement
    && replay.verification_reason_codes.includes("replay_risk_detected")
    && replay.settlement_outcome === "blocked"
    && !replay.settlement_blocker_invoked;

  const missingMandate = gateFailureScenario(input, replayStore, "missing_mandate", (value) => {
    value.mandate = { ...value.mandate, present: false };
  }, "refuse_no_mandate");
  const missingEvidence = gateFailureScenario(input, replayStore, "missing_evidence", (value) => {
    value.evidence = { ...value.evidence, present: false, fresh: false };
  }, "refuse_no_evidence");
  const missingIntent = gateFailureScenario(input, replayStore, "missing_verified_intent", (value) => {
    value.verified_intent = { ...value.verified_intent, present: false };
  }, "refuse_no_verified_intent");
  const overLimit = gateFailureScenario(input, replayStore, "over_limit", (value) => {
    const maximum = safeAmount(value.limits?.max_allowed_gbp);
    value.limits = { ...value.limits, spend_amount_gbp: maximum + 1, max_allowed_gbp: maximum };
  }, "refuse_over_limit");
  const approvalPending = gateFailureScenario(input, replayStore, "approval_pending", (value) => {
    value.approval = { ...value.approval, required: true, status: "pending" };
  }, "review_required");

  const expiredInput = scenarioInput(input, "expired_gate_pass");
  const expiredReceipt = createLocalGatePassAuditReceipt(expiredInput);
  const expiry = expiredReceipt.gate_pass_validity?.expires_at ?? expiredReceipt.checked_at;
  const expired = evaluateScenario(
    "expired_gate_pass",
    expiredInput,
    expiredReceipt,
    expiry,
    replayStore,
  );
  expired.control_proven = expired.gate_verdict === "allow_signed_gate_pass"
    && !expired.receipt_verified_for_settlement
    && expired.verification_reason_codes.includes("expired_receipt")
    && expired.settlement_outcome === "blocked";

  const scopedInput = scenarioInput(input, "scope_mismatch");
  const scopedReceipt = createLocalGatePassAuditReceipt(scopedInput);
  const tamperedReceipt = structuredClone(scopedReceipt);
  tamperedReceipt.requested_action = `${tamperedReceipt.requested_action} [scope changed]`;
  const scopeMismatch = evaluateScenario(
    "scope_mismatch",
    scopedInput,
    tamperedReceipt,
    tamperedReceipt.checked_at,
    replayStore,
  );
  scopeMismatch.control_proven = !scopeMismatch.receipt_verified_for_settlement
    && scopeMismatch.verification_reason_codes.includes("requested_action_mismatch")
    && scopeMismatch.settlement_outcome === "blocked"
    && !scopeMismatch.settlement_blocker_invoked;

  const autonomous = gateFailureScenario(
    input,
    replayStore,
    "autonomous_execution_prohibited",
    (value) => {
      value.action_category = "autonomous_payment_execution";
    },
    "refuse_unsafe_action",
  );

  const scenarios = [
    approved,
    replay,
    missingMandate,
    missingEvidence,
    missingIntent,
    overLimit,
    approvalPending,
    expired,
    scopeMismatch,
    autonomous,
  ];
  const controls: LocalMoneyGateProofControls = {
    approved_in_scope_request_allowed_once: approved.control_proven,
    replay_blocked: replay.control_proven,
    no_mandate_blocked: missingMandate.control_proven,
    no_evidence_blocked: missingEvidence.control_proven,
    no_verified_intent_blocked: missingIntent.control_proven,
    over_limit_blocked: overLimit.control_proven,
    missing_approval_blocked: approvalPending.control_proven,
    expired_gate_pass_blocked: expired.control_proven,
    scope_mismatch_blocked: scopeMismatch.control_proven,
    autonomous_execution_blocked: autonomous.control_proven,
  };
  const failureReasons = Object.entries(controls)
    .filter(([, proven]) => !proven)
    .map(([name]) => `${name}_not_proven`);
  if (input.action_category.trim().toLowerCase() !== "money_movement") {
    failureReasons.push("baseline_action_category_must_be_money_movement");
  }
  const eligibleCount = scenarios.filter(
    (scenario) => scenario.settlement_outcome === "simulated_eligible",
  ).length;
  if (eligibleCount !== 1) failureReasons.push("expected_exactly_one_simulated_eligible_result");
  const uniqueFailures = [...new Set(failureReasons)];
  const proofPassed = uniqueFailures.length === 0;

  return {
    proof_version: LOCAL_END_TO_END_MONEY_GATE_PROOF_VERSION,
    proof_id: createLocalEndToEndMoneyGateProofId(input.proof_id ?? input.request_id, input.checked_at),
    proof_type: "local_end_to_end_money_gate",
    request_id: safeIdentifier(input.request_id),
    proof_metadata: createLocalMoneyGateProofMetadata(input, proofPassed ? "passed" : "failed"),
    rule: RULE,
    proof_status: proofPassed ? "passed" : "failed",
    proof_passed: proofPassed,
    scenario_count: scenarios.length,
    controls_proven: Object.values(controls).filter(Boolean).length,
    simulated_settlement_eligible_count: eligibleCount,
    failure_reasons: uniqueFailures,
    controls,
    scenarios,
    local_only: true,
    input_data_retained: false,
    private_data_included: false,
    network_call_performed: false,
    external_agent_contacted: false,
    credential_created: false,
    cryptographic_signature_created: false,
    payment_triggered: false,
    settlement_executed: false,
    action_executed: false,
    note: NOTE,
    checked_at: safeTimestamp(input.checked_at),
  };
}

export function createLocalEndToEndMoneyGateProofId(seed: string, checkedAt: string | undefined): string {
  const digest = createHash("sha256")
    .update(`${seed}|${checkedAt ?? ""}`, "utf8")
    .digest("hex");
  return `money_gate_proof_${digest.slice(0, 24)}`;
}

export function summariseLocalEndToEndMoneyGateProof(
  result: LocalEndToEndMoneyGateProofResult,
): LocalEndToEndMoneyGateProofSummary {
  const { scenarios: _scenarios, ...summary } = result;
  return summary;
}

function gateFailureScenario(
  input: LocalEndToEndMoneyGateProofInput,
  replayStore: LocalGatePassReplayStore,
  type: LocalMoneyGateProofScenarioType,
  mutate: (value: LocalGatePassDemoInput) => void,
  expectedVerdict: LocalGatePassVerdict,
): LocalMoneyGateProofScenarioResult {
  const value = scenarioInput(input, type);
  mutate(value);
  const receipt = createLocalGatePassAuditReceipt(value);
  const result = evaluateScenario(type, value, receipt, receipt.checked_at, replayStore);
  result.control_proven = result.gate_verdict === expectedVerdict
    && !result.receipt_verified_for_settlement
    && result.settlement_outcome === "blocked"
    && !result.settlement_blocker_invoked;
  return result;
}

function evaluateScenario(
  type: LocalMoneyGateProofScenarioType,
  input: LocalGatePassDemoInput,
  receipt: LocalGatePassAuditReceipt,
  evaluatedAt: string,
  replayStore: LocalGatePassReplayStore,
): LocalMoneyGateProofScenarioResult {
  const verification = verifyLocalTrustReceipt(receipt, {
    expected_request_id: input.request_id,
    expected_agent_id: input.agent_id,
    expected_requested_action: input.requested_action,
    current_time: evaluatedAt,
    require_settlement_eligibility: true,
    replay_store: replayStore,
  });
  const blocker = invokeBlockerOnlyAfterVerification(receipt, verification, replayStore, evaluatedAt);
  const settlementAllowed = blocker?.settlement_simulation === "allowed";

  return {
    scenario_type: type,
    request_id: receipt.request_id,
    gate_verdict: receipt.verdict,
    receipt_id: receipt.receipt_id,
    receipt_type: receipt.receipt_type,
    gate_checks: {
      mandate: receipt.checks.mandate.passed,
      evidence: receipt.checks.evidence.passed,
      verified_intent: receipt.checks.verified_intent.passed,
      limits: receipt.checks.limits.passed,
      approval: receipt.checks.approval.passed,
    },
    receipt_verified_for_settlement: verification.verified
      && verification.valid_for_simulated_settlement,
    receipt_structurally_valid: verification.structurally_valid,
    receipt_fresh: verification.fresh,
    replay_safe: verification.replay_safe,
    verification_reason_codes: [...verification.reason_codes],
    settlement_blocker_invoked: blocker !== undefined,
    settlement_outcome: settlementAllowed ? "simulated_eligible" : "blocked",
    settlement_block_reason_codes: blocker?.block_reason_codes
      ? [...blocker.block_reason_codes]
      : ["receipt_verification_failed"],
    control_proven: false,
    action_executed: false,
    payment_triggered: false,
    settlement_executed: false,
  };
}

function invokeBlockerOnlyAfterVerification(
  receipt: LocalGatePassAuditReceipt,
  verification: LocalTrustReceiptVerificationDecision,
  replayStore: LocalGatePassReplayStore,
  evaluatedAt: string,
): LocalSettlementBlockerDecision | undefined {
  if (!verification.verified || !verification.valid_for_simulated_settlement) return undefined;
  return simulateLocalSettlementBlocker(receipt, {
    evaluated_at: evaluatedAt,
    replay_store: replayStore,
    consume: true,
  });
}

function scenarioInput(
  input: LocalEndToEndMoneyGateProofInput,
  type: LocalMoneyGateProofScenarioType,
): LocalGatePassDemoInput {
  const value: LocalGatePassDemoInput = structuredClone(input);
  const suffix = `-${type}`;
  value.request_id = `${safeIdentifier(input.request_id).slice(0, 80 - suffix.length)}${suffix}`;
  return value;
}

function createLocalMoneyGateProofMetadata(
  input: LocalEndToEndMoneyGateProofInput,
  proofStatus: "passed" | "failed",
): LocalMoneyGateProofMetadata {
  const createdAt = safeTimestamp(input.proof_metadata?.created_at ?? input.checked_at);
  const nonce = safeIdentifier(
    input.proof_metadata?.nonce
    ?? input.nonce
    ?? createLocalProofNonce(input.proof_id ?? input.request_id, createdAt),
  );
  const expiresAt = safeTimestamp(
    input.proof_metadata?.expires_at
    ?? new Date(Date.parse(createdAt) + 300_000).toISOString(),
  );
  return {
    schema_version: "atg.local-proof-metadata.v1",
    proof_purpose: "pre_settlement_money_gate",
    proof_status: proofStatus,
    issuer_ref: safeIdentifier(input.proof_metadata?.issuer_ref ?? input.issuer_ref ?? "local_demo_issuer"),
    verifier_ref: safeIdentifier(input.proof_metadata?.verifier_ref ?? input.verifier_ref ?? "local_demo_verifier"),
    created_at: createdAt,
    expires_at: expiresAt,
    nonce,
    local_only: true,
    replay_freshness: {
      nonce: safeIdentifier(input.proof_metadata?.replay_freshness?.nonce ?? nonce),
      single_use: true,
      freshness_window_seconds: 300,
      replay_protection: "local_in_memory_single_use",
    },
  };
}

function createLocalProofNonce(seed: string, createdAt: string): string {
  const digest = createHash("sha256")
    .update(`${seed}|${createdAt}|money_gate_proof_metadata`, "utf8")
    .digest("hex");
  return `nonce_${digest.slice(0, 32)}`;
}

function safeAmount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function safeIdentifier(value: unknown): string {
  if (typeof value !== "string") return "money_gate_proof";
  const output = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80);
  return output || "money_gate_proof";
}

function safeTimestamp(value: unknown): string {
  if (typeof value !== "string") return "1970-01-01T00:00:00.000Z";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? "1970-01-01T00:00:00.000Z"
    : parsed.toISOString();
}
