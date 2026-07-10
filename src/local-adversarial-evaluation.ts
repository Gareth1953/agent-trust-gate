import { createHash } from "node:crypto";

import type { LocalGatePassDemoInput } from "./local-gate-pass-demo.js";
import {
  createLocalGatePassAuditReceipt,
  type LocalGatePassAuditReceipt,
  type LocalReceiptProofMetadata,
} from "./local-gate-pass-receipt.js";
import {
  evaluateLocalGatePassProtection,
  LocalGatePassReplayStore,
} from "./local-gate-pass-protection.js";
import {
  runLocalEndToEndMoneyGateProof,
} from "./local-end-to-end-money-gate-proof.js";
import {
  simulateLocalSettlementBlocker,
  type LocalSettlementBlockerDecision,
} from "./local-settlement-blocker.js";
import {
  verifyLocalTrustReceipt,
  type LocalTrustReceiptVerificationDecision,
} from "./local-trust-receipt-verifier.js";
import {
  signLocalMoneyGateProof,
  signLocalTrustReceipt,
  verifyLocalMoneyGateProofSignature,
  verifyLocalTrustReceiptSignature,
  type LocalSignedProofVerificationDecision,
} from "./local-signed-proof.js";

export const LOCAL_ADVERSARIAL_EVALUATION_VERSION =
  "atg.local-adversarial-evaluation.v1" as const;
export const LOCAL_ADVERSARIAL_EVALUATION_RULE =
  "No mandate. No evidence. No verified intent. No signed gate pass. No settlement." as const;
export const LOCAL_ADVERSARIAL_PUBLIC_CONTACT = "gpmiddleton71@gmail.com" as const;

export type LocalAdversarialScenarioType =
  | "replay_attempt"
  | "forged_evidence"
  | "expired_gate_pass"
  | "scope_creep"
  | "missing_mandate"
  | "tampered_signed_proof"
  | "unsigned_malformed_proof"
  | "stale_nonce_freshness"
  | "settlement_blocker_refusal"
  | "valid_control_allowed";

export type LocalAdversarialScenarioVerdict = "blocked" | "allowed_local_control";
export type LocalAdversarialExpectedVerdict = "blocked" | "allowed_local_control";

export interface LocalAdversarialSafetyFlags {
  localDemoOnly: true;
  localOnly: true;
  productionSigning: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  privateDataIncluded: false;
  networkCallPerformed: false;
  externalAgentContacted: false;
  paymentTriggered: false;
  settlementExecuted: false;
  actionExecuted: false;
}

export interface LocalEvidenceIntegrityDecision {
  expectedEvidenceHash: string;
  observedEvidenceHash: string;
  hashMatched: boolean;
  reasonCodes: string[];
  localOnly: true;
}

export interface LocalNonceFreshnessDecision {
  nonceMatched: boolean;
  fresh: boolean;
  createdAt: string;
  evaluatedAt: string;
  freshnessWindowSeconds: number;
  reasonCodes: string[];
  localOnly: true;
}

export interface LocalAdversarialReceiptVerificationEvidence {
  verified: boolean;
  validForSimulatedSettlement: boolean;
  structurallyValid: boolean;
  fresh: boolean;
  replaySafe: boolean;
  settlementBlockerAllowed: boolean;
  receiptType: string;
  verdict: string;
  reasonCodes: string[];
  mode: "local_simulation_only";
}

export interface LocalAdversarialSettlementBlockerEvidence {
  settlementSimulation: "allowed" | "blocked";
  blocked: boolean;
  blockReasonCodes: string[];
  validityStatus: string;
  replayStatus: string;
  settlementExecuted: false;
  paymentTriggered: false;
  networkCallPerformed: false;
  actionExecuted: false;
  mode: "local_simulation_only";
}

export interface LocalAdversarialSignatureVerificationEvidence {
  verified: boolean;
  structurallyValid: boolean;
  payloadHashMatches: boolean;
  signatureValid: boolean;
  signedPayloadType: string;
  algorithm: string;
  keyId: string;
  reasonCodes: string[];
  productionSigning: boolean;
  paymentAuthorisation: boolean;
  settlementAuthorisation: boolean;
}

export interface LocalAdversarialScenarioInput {
  scenarioId: string;
  scenarioType: LocalAdversarialScenarioType;
  title: string;
  attackSummary: string;
  expectedVerdict: LocalAdversarialExpectedVerdict;
  input: LocalGatePassDemoInput;
}

export interface LocalAdversarialScenarioResult extends LocalAdversarialSafetyFlags {
  scenarioId: string;
  scenarioType: LocalAdversarialScenarioType;
  title: string;
  attackSummary: string;
  expectedVerdict: LocalAdversarialExpectedVerdict;
  verdict: LocalAdversarialScenarioVerdict;
  blocked: boolean;
  allowedLocally: boolean;
  controlSatisfied: boolean;
  reasonCodes: string[];
  evidenceTrail: string[];
  receiptVerification?: LocalAdversarialReceiptVerificationEvidence;
  settlementBlocker?: LocalAdversarialSettlementBlockerEvidence;
  signatureVerification?: LocalAdversarialSignatureVerificationEvidence;
  evidenceIntegrity?: LocalEvidenceIntegrityDecision;
  nonceFreshness?: LocalNonceFreshnessDecision;
}

export interface LocalAdversarialEvaluationResult extends LocalAdversarialSafetyFlags {
  evaluationVersion: typeof LOCAL_ADVERSARIAL_EVALUATION_VERSION;
  evaluationId: string;
  evaluationType: "local_adversarial_evaluation_pack";
  checkedAt: string;
  rule: typeof LOCAL_ADVERSARIAL_EVALUATION_RULE;
  relationshipToPriorMissions: string[];
  scenarioCount: number;
  blockedScenarioCount: number;
  allowedControlCount: number;
  attackCasesBlocked: boolean;
  validControlAllowedLocally: boolean;
  evaluationPassed: boolean;
  publicContactEmail: typeof LOCAL_ADVERSARIAL_PUBLIC_CONTACT;
  note: "Local adversarial evaluation only; no live API, payment, settlement, external-agent contact, production signing, or action execution occurred.";
  scenarios: LocalAdversarialScenarioResult[];
}

export type LocalAdversarialEvaluationSummary = Omit<LocalAdversarialEvaluationResult, "scenarios">;

export const LOCAL_ADVERSARIAL_EXAMPLE_FILES: Record<LocalAdversarialScenarioType, string> = {
  replay_attempt: "examples/adversarial-replay-blocked.json",
  forged_evidence: "examples/adversarial-forged-evidence-blocked.json",
  expired_gate_pass: "examples/adversarial-expired-gate-pass-blocked.json",
  scope_creep: "examples/adversarial-scope-creep-blocked.json",
  missing_mandate: "examples/adversarial-missing-mandate-blocked.json",
  tampered_signed_proof: "examples/adversarial-tampered-signed-proof-blocked.json",
  unsigned_malformed_proof: "examples/adversarial-unsigned-proof-blocked.json",
  stale_nonce_freshness: "examples/adversarial-stale-nonce-blocked.json",
  settlement_blocker_refusal: "examples/adversarial-settlement-blocker-refusal.json",
  valid_control_allowed: "examples/adversarial-valid-control-allowed.json",
};

const CHECKED_AT = "2026-07-10T09:00:00.000Z";
const GATE_PASS_EXPIRES_AT = "2026-07-10T09:05:00.000Z";
const MANDATE_EXPIRES_AT = "2026-07-10T09:10:00.000Z";
const ISSUER_REF = "issuer_local_adversarial_eval";
const VERIFIER_REF = "verifier_local_adversarial_eval";
const BASE_EVIDENCE_REFERENCE = "local-fixture:adversarial-control-evidence-v1";
const FORGED_EVIDENCE_REFERENCE = "local-fixture:adversarial-forged-evidence-v1";

const NOTE =
  "Local adversarial evaluation only; no live API, payment, settlement, external-agent contact, production signing, or action execution occurred." as const;

const SAFETY_FLAGS: LocalAdversarialSafetyFlags = {
  localDemoOnly: true,
  localOnly: true,
  productionSigning: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  privateDataIncluded: false,
  networkCallPerformed: false,
  externalAgentContacted: false,
  paymentTriggered: false,
  settlementExecuted: false,
  actionExecuted: false,
};

export function createLocalAdversarialScenarioInputs(): LocalAdversarialScenarioInput[] {
  return [
    scenarioDefinition(
      "adversarial-replay-blocked",
      "replay_attempt",
      "Replay attempt blocked",
      "A previously consumed local signed gate pass is presented again.",
      "blocked",
    ),
    scenarioDefinition(
      "adversarial-forged-evidence-blocked",
      "forged_evidence",
      "Forged evidence blocked",
      "A local evidence claim presents a digest that does not match the observed local evidence fixture.",
      "blocked",
    ),
    scenarioDefinition(
      "adversarial-expired-gate-pass-blocked",
      "expired_gate_pass",
      "Expired gate pass blocked",
      "A valid local signed gate pass is presented at its expiry boundary.",
      "blocked",
    ),
    scenarioDefinition(
      "adversarial-scope-creep-blocked",
      "scope_creep",
      "Scope creep blocked",
      "The requested action no longer matches the action bound into the local gate pass.",
      "blocked",
    ),
    scenarioDefinition(
      "adversarial-missing-mandate-blocked",
      "missing_mandate",
      "Missing mandate blocked",
      "The local action request omits an active mandate.",
      "blocked",
      withoutMandate,
    ),
    scenarioDefinition(
      "adversarial-tampered-signed-proof-blocked",
      "tampered_signed_proof",
      "Tampered signed proof blocked",
      "A locally signed money-gate proof payload is changed after signing.",
      "blocked",
    ),
    scenarioDefinition(
      "adversarial-unsigned-proof-blocked",
      "unsigned_malformed_proof",
      "Unsigned or malformed proof blocked",
      "A money-gate proof payload is presented without a local signed-proof envelope.",
      "blocked",
    ),
    scenarioDefinition(
      "adversarial-stale-nonce-blocked",
      "stale_nonce_freshness",
      "Stale nonce and freshness failure blocked",
      "A local gate pass is presented after the proof nonce freshness window.",
      "blocked",
    ),
    scenarioDefinition(
      "adversarial-settlement-blocker-refusal",
      "settlement_blocker_refusal",
      "Settlement blocker refusal recorded",
      "A refusal receipt is sent to the local settlement blocker and must remain blocked.",
      "blocked",
      withoutMandate,
    ),
    scenarioDefinition(
      "adversarial-valid-control-allowed",
      "valid_control_allowed",
      "Valid control allowed locally",
      "A complete in-scope local control request passes the local verifier once.",
      "allowed_local_control",
    ),
  ];
}

export function runLocalAdversarialEvaluation(): LocalAdversarialEvaluationResult {
  const scenarios = createLocalAdversarialScenarioInputs().map(evaluateScenario);
  const blockedScenarioCount = scenarios.filter((scenario) => scenario.blocked).length;
  const allowedControlCount = scenarios.filter((scenario) => scenario.allowedLocally).length;
  const attackCasesBlocked = scenarios
    .filter((scenario) => scenario.expectedVerdict === "blocked")
    .every((scenario) => scenario.blocked && scenario.controlSatisfied);
  const validControlAllowedLocally = scenarios.some(
    (scenario) =>
      scenario.scenarioType === "valid_control_allowed"
      && scenario.allowedLocally
      && scenario.controlSatisfied,
  );
  const evaluationPassed = attackCasesBlocked
    && validControlAllowedLocally
    && blockedScenarioCount === 9
    && allowedControlCount === 1
    && scenarios.every((scenario) => flagsAreSafe(scenario));

  return {
    evaluationVersion: LOCAL_ADVERSARIAL_EVALUATION_VERSION,
    evaluationId: createEvaluationId(scenarios),
    evaluationType: "local_adversarial_evaluation_pack",
    checkedAt: CHECKED_AT,
    rule: LOCAL_ADVERSARIAL_EVALUATION_RULE,
    relationshipToPriorMissions: [
      "P3-M116 schema and evidence hardening supplies explicit mandate, evidence, nonce, freshness, issuer/verifier, and replay fields.",
      "P3-M117 local signed receipt and proof prototype supplies deterministic local signature and payload-tamper checks.",
    ],
    scenarioCount: scenarios.length,
    blockedScenarioCount,
    allowedControlCount,
    attackCasesBlocked,
    validControlAllowedLocally,
    evaluationPassed,
    publicContactEmail: LOCAL_ADVERSARIAL_PUBLIC_CONTACT,
    note: NOTE,
    scenarios,
    ...SAFETY_FLAGS,
  };
}

export function summariseLocalAdversarialEvaluation(
  result: LocalAdversarialEvaluationResult,
): LocalAdversarialEvaluationSummary {
  const { scenarios: _scenarios, ...summary } = result;
  return summary;
}

function evaluateScenario(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  switch (definition.scenarioType) {
    case "replay_attempt":
      return evaluateReplayAttempt(definition);
    case "forged_evidence":
      return evaluateForgedEvidence(definition);
    case "expired_gate_pass":
      return evaluateExpiredGatePass(definition);
    case "scope_creep":
      return evaluateScopeCreep(definition);
    case "missing_mandate":
      return evaluateMissingMandate(definition);
    case "tampered_signed_proof":
      return evaluateTamperedSignedProof(definition);
    case "unsigned_malformed_proof":
      return evaluateUnsignedProof(definition);
    case "stale_nonce_freshness":
      return evaluateStaleNonce(definition);
    case "settlement_blocker_refusal":
      return evaluateSettlementBlockerRefusal(definition);
    case "valid_control_allowed":
      return evaluateValidControl(definition);
  }
}

function evaluateReplayAttempt(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(definition.input);
  const replayStore = new LocalGatePassReplayStore();
  const firstUse = simulateLocalSettlementBlocker(receipt, {
    evaluated_at: receipt.checked_at,
    replay_store: replayStore,
    consume: true,
  });
  const verification = verifyReceiptForInput(receipt, definition.input, receipt.checked_at, replayStore);
  const replayProtection = evaluateLocalGatePassProtection(receipt, receipt.checked_at, replayStore, false);
  const replayBlocker = simulateLocalSettlementBlocker(receipt, {
    evaluated_at: receipt.checked_at,
    replay_store: replayStore,
    consume: true,
  });
  const reasons = unique([
    ...verification.reason_codes,
    ...replayProtection.reason_codes,
    ...replayBlocker.block_reason_codes,
  ]);
  const blocked = reasons.includes("replay_risk_detected")
    || reasons.includes("gate_pass_replay_detected");

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `first_use_settlement_simulation:${firstUse.settlement_simulation}`,
      `replay_store_size_after_first_use:${String(replayStore.size)}`,
      `receipt_verifier:${verification.reason_codes.join(",") || "none"}`,
      `gate_pass_protection:${replayProtection.reason_codes.join(",")}`,
      `settlement_blocker:${replayBlocker.block_reason_codes.join(",")}`,
    ]),
    receiptVerification: summariseReceiptVerification(verification),
    settlementBlocker: summariseSettlementBlocker(replayBlocker),
    controlSatisfied: blocked,
  };
}

function evaluateForgedEvidence(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(definition.input);
  const verification = verifyReceiptForInput(receipt, definition.input, receipt.checked_at);
  const integrity = evaluateEvidenceIntegrity(BASE_EVIDENCE_REFERENCE, FORGED_EVIDENCE_REFERENCE);
  const reasons = unique([
    ...integrity.reasonCodes,
    ...verification.reason_codes,
  ]);
  const blocked = !integrity.hashMatched;

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `expected_evidence_hash:${integrity.expectedEvidenceHash}`,
      `observed_evidence_hash:${integrity.observedEvidenceHash}`,
      `receipt_verifier:${verification.reason_codes.join(",") || "none"}`,
    ]),
    receiptVerification: summariseReceiptVerification(verification),
    evidenceIntegrity: integrity,
    controlSatisfied: blocked && reasons.includes("evidence_hash_mismatch"),
  };
}

function evaluateExpiredGatePass(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(definition.input);
  const evaluatedAt = receipt.gate_pass_validity?.expires_at ?? GATE_PASS_EXPIRES_AT;
  const verification = verifyReceiptForInput(receipt, definition.input, evaluatedAt);
  const blocker = simulateLocalSettlementBlocker(receipt, {
    evaluated_at: evaluatedAt,
    replay_store: new LocalGatePassReplayStore(),
    consume: true,
  });
  const reasons = unique([...verification.reason_codes, ...blocker.block_reason_codes]);
  const blocked = reasons.includes("expired_receipt") || reasons.includes("gate_pass_expired");

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `evaluated_at:${evaluatedAt}`,
      `receipt_verifier:${verification.reason_codes.join(",")}`,
      `settlement_blocker:${blocker.block_reason_codes.join(",")}`,
    ]),
    receiptVerification: summariseReceiptVerification(verification),
    settlementBlocker: summariseSettlementBlocker(blocker),
    controlSatisfied: blocked,
  };
}

function evaluateScopeCreep(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(definition.input);
  const expectedAction = `${definition.input.requested_action} plus unauthorised extra settlement scope`;
  const verification = verifyLocalTrustReceipt(receipt, {
    expected_request_id: definition.input.request_id,
    expected_agent_id: definition.input.agent_id,
    expected_requested_action: expectedAction,
    current_time: receipt.checked_at,
    require_settlement_eligibility: true,
  });
  const reasons = unique([...verification.reason_codes, "scope_creep_blocked"]);
  const blocked = verification.reason_codes.includes("requested_action_mismatch");

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `signed_scope:${receipt.requested_action}`,
      `attempted_scope:${expectedAction}`,
      `receipt_verifier:${verification.reason_codes.join(",")}`,
    ]),
    receiptVerification: summariseReceiptVerification(verification),
    controlSatisfied: blocked,
  };
}

function evaluateMissingMandate(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(definition.input);
  const verification = verifyReceiptForInput(receipt, definition.input, receipt.checked_at);
  const blocker = simulateLocalSettlementBlocker(receipt, {
    evaluated_at: receipt.checked_at,
    replay_store: new LocalGatePassReplayStore(),
    consume: true,
  });
  const reasons = unique([...receipt.reason_codes, ...verification.reason_codes, ...blocker.block_reason_codes]);
  const blocked = receipt.verdict === "refuse_no_mandate"
    && reasons.includes("MANDATE_REQUIRED");

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `gate_verdict:${receipt.verdict}`,
      `receipt_verifier:${verification.reason_codes.join(",")}`,
      `settlement_blocker:${blocker.block_reason_codes.join(",")}`,
    ]),
    receiptVerification: summariseReceiptVerification(verification),
    settlementBlocker: summariseSettlementBlocker(blocker),
    controlSatisfied: blocked,
  };
}

function evaluateTamperedSignedProof(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const proof = runLocalEndToEndMoneyGateProof(definition.input);
  const signed = signLocalMoneyGateProof(proof, { signedAt: CHECKED_AT });
  const tampered = structuredClone(signed);
  tampered.payload.proof_passed = false;
  tampered.payload.failure_reasons = ["tampered_after_local_signing"];
  const signature = verifyLocalMoneyGateProofSignature(tampered, { checkedAt: CHECKED_AT });
  const reasons = unique(signature.reasonCodes);
  const blocked = !signature.verified
    && reasons.includes("payload_hash_mismatch")
    && reasons.includes("signature_invalid");

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `signed_payload_type:${signature.signedPayloadType}`,
      `payload_hash_matches:${String(signature.payloadHashMatches)}`,
      `signature_valid:${String(signature.signatureValid)}`,
    ]),
    signatureVerification: summariseSignatureVerification(signature),
    controlSatisfied: blocked,
  };
}

function evaluateUnsignedProof(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const proof = runLocalEndToEndMoneyGateProof(definition.input);
  const signature = verifyLocalMoneyGateProofSignature(proof, { checkedAt: CHECKED_AT });
  const reasons = unique(signature.reasonCodes);
  const blocked = !signature.verified && reasons.includes("malformed_signed_proof");

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `signed_payload_type:${signature.signedPayloadType}`,
      `structurally_valid:${String(signature.structurallyValid)}`,
      `signature_valid:${String(signature.signatureValid)}`,
    ]),
    signatureVerification: summariseSignatureVerification(signature),
    controlSatisfied: blocked,
  };
}

function evaluateStaleNonce(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(definition.input);
  const evaluatedAt = addSeconds(receipt.proof_metadata.created_at, 301);
  const nonceFreshness = evaluateNonceFreshness(receipt.proof_metadata, evaluatedAt);
  const verification = verifyReceiptForInput(receipt, definition.input, evaluatedAt);
  const reasons = unique([...nonceFreshness.reasonCodes, ...verification.reason_codes]);
  const blocked = !nonceFreshness.fresh
    && reasons.includes("stale_nonce_freshness_window_exceeded");

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `nonce_created_at:${nonceFreshness.createdAt}`,
      `evaluated_at:${nonceFreshness.evaluatedAt}`,
      `freshness_window_seconds:${String(nonceFreshness.freshnessWindowSeconds)}`,
      `receipt_verifier:${verification.reason_codes.join(",")}`,
    ]),
    receiptVerification: summariseReceiptVerification(verification),
    nonceFreshness,
    controlSatisfied: blocked,
  };
}

function evaluateSettlementBlockerRefusal(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(definition.input);
  const blocker = simulateLocalSettlementBlocker(receipt, {
    evaluated_at: receipt.checked_at,
    replay_store: new LocalGatePassReplayStore(),
    consume: true,
  });
  const reasons = unique([...receipt.reason_codes, ...blocker.block_reason_codes]);
  const blocked = blocker.blocked
    && blocker.block_reason_codes.includes("refusal_receipt_blocks_settlement");

  return {
    ...baseScenarioResult(definition, blocked ? "blocked" : "allowed_local_control", reasons, [
      `gate_verdict:${receipt.verdict}`,
      `settlement_blocker:${blocker.block_reason_codes.join(",")}`,
      `settlement_executed:${String(blocker.settlement_executed)}`,
    ]),
    settlementBlocker: summariseSettlementBlocker(blocker),
    controlSatisfied: blocked,
  };
}

function evaluateValidControl(definition: LocalAdversarialScenarioInput): LocalAdversarialScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(definition.input);
  const signedReceipt = signLocalTrustReceipt(receipt, { signedAt: CHECKED_AT });
  const signature = verifyLocalTrustReceiptSignature(signedReceipt, { checkedAt: CHECKED_AT });
  const verification = verifyReceiptForInput(receipt, definition.input, receipt.checked_at);
  const blocker = simulateLocalSettlementBlocker(receipt, {
    evaluated_at: receipt.checked_at,
    replay_store: new LocalGatePassReplayStore(),
    consume: true,
  });
  const allowed = signature.verified
    && verification.verified
    && verification.valid_for_simulated_settlement
    && blocker.settlement_simulation === "allowed"
    && blocker.settlement_executed === false
    && signedReceipt.signatureMetadata.localDemoOnly === true
    && signedReceipt.signatureMetadata.productionSigning === false
    && signedReceipt.signatureMetadata.paymentAuthorisation === false
    && signedReceipt.signatureMetadata.settlementAuthorisation === false;
  const reasons = allowed
    ? ["local_control_allowed", ...signature.reasonCodes]
    : unique([...signature.reasonCodes, ...verification.reason_codes, ...blocker.block_reason_codes]);

  return {
    ...baseScenarioResult(definition, allowed ? "allowed_local_control" : "blocked", reasons, [
      `signature_verification:${signature.reasonCodes.join(",")}`,
      `receipt_verifier:${verification.reason_codes.join(",") || "none"}`,
      `settlement_blocker:${blocker.block_reason_codes.join(",") || "none"}`,
      "localDemoOnly:true",
      "productionSigning:false",
      "paymentAuthorisation:false",
      "settlementAuthorisation:false",
    ]),
    receiptVerification: summariseReceiptVerification(verification),
    settlementBlocker: summariseSettlementBlocker(blocker),
    signatureVerification: summariseSignatureVerification(signature),
    controlSatisfied: allowed,
  };
}

function scenarioDefinition(
  scenarioId: string,
  scenarioType: LocalAdversarialScenarioType,
  title: string,
  attackSummary: string,
  expectedVerdict: LocalAdversarialExpectedVerdict,
  mutate?: (input: LocalGatePassDemoInput) => LocalGatePassDemoInput,
): LocalAdversarialScenarioInput {
  const input = createBaselineInput(scenarioType);
  return {
    scenarioId,
    scenarioType,
    title,
    attackSummary,
    expectedVerdict,
    input: mutate === undefined ? input : mutate(input),
  };
}

function createBaselineInput(scenarioType: LocalAdversarialScenarioType): LocalGatePassDemoInput {
  const suffix = scenarioType.replaceAll("_", "-");
  const requestId = `adv-${suffix}`;
  const nonce = `nonce_adv_${scenarioType}`;
  return {
    schema_version: "atg.local-agent-action-request.v2",
    request_id: requestId,
    action_id: `act-${suffix}`,
    agent_id: "agent_local_adversarial_eval",
    requested_action: "Evaluate local simulated settlement eligibility for an approved demo request.",
    action_category: "money_movement",
    local_only: true,
    issuer_ref: ISSUER_REF,
    verifier_ref: VERIFIER_REF,
    nonce,
    mandate: {
      present: true,
      mandate_id: `mandate-${suffix}`,
      scope: "Local simulated settlement eligibility for this request only.",
      expires_at: MANDATE_EXPIRES_AT,
      issuer_ref: ISSUER_REF,
    },
    verified_intent: {
      present: true,
      status: "verified",
      source: "local_adversarial_fixture",
      verifier_ref: VERIFIER_REF,
      verified_at: "2026-07-10T08:59:00.000Z",
    },
    evidence: {
      present: true,
      fresh: true,
      evidence_id: `evidence-${suffix}`,
      evidence_type: "local_fixture",
      source: "local_adversarial_fixture",
      local_reference: BASE_EVIDENCE_REFERENCE,
      evidence_hash: localSha256(BASE_EVIDENCE_REFERENCE),
      verified_at: "2026-07-10T08:59:30.000Z",
      freshness: {
        checked_at: CHECKED_AT,
        expires_at: GATE_PASS_EXPIRES_AT,
        max_age_seconds: 300,
      },
    },
    limits: {
      spend_amount_gbp: 10,
      max_allowed_gbp: 25,
    },
    approval: {
      required: true,
      status: "approved",
    },
    risk_context: {
      risk_tier: "high",
      policy_decision: "allow",
      policy_pack_version: "local-demo-v1",
    },
    proof_metadata: {
      schema_version: "atg.local-proof-metadata.v1",
      proof_purpose: "pre_action_trust_gate",
      proof_status: "candidate",
      issuer_ref: ISSUER_REF,
      verifier_ref: VERIFIER_REF,
      created_at: CHECKED_AT,
      expires_at: GATE_PASS_EXPIRES_AT,
      nonce,
      local_only: true,
      replay_freshness: {
        nonce,
        single_use: true,
        freshness_window_seconds: 300,
        replay_protection: "local_in_memory_single_use",
      },
    },
    checked_at: CHECKED_AT,
  };
}

function withoutMandate(input: LocalGatePassDemoInput): LocalGatePassDemoInput {
  const output = structuredClone(input);
  output.mandate = {
    present: false,
    mandate_id: input.mandate?.mandate_id ?? "mandate-missing",
    scope: input.mandate?.scope ?? "missing mandate scenario",
    expires_at: input.mandate?.expires_at ?? MANDATE_EXPIRES_AT,
    issuer_ref: ISSUER_REF,
  };
  return output;
}

function verifyReceiptForInput(
  receipt: LocalGatePassAuditReceipt,
  input: LocalGatePassDemoInput,
  currentTime: string,
  replayStore?: LocalGatePassReplayStore,
): LocalTrustReceiptVerificationDecision {
  const options = {
    expected_request_id: input.request_id,
    expected_agent_id: input.agent_id,
    expected_requested_action: input.requested_action,
    current_time: currentTime,
    require_settlement_eligibility: true,
  };
  if (replayStore === undefined) return verifyLocalTrustReceipt(receipt, options);
  return verifyLocalTrustReceipt(receipt, { ...options, replay_store: replayStore });
}

function evaluateEvidenceIntegrity(
  expectedReference: string,
  observedReference: string,
): LocalEvidenceIntegrityDecision {
  const expectedEvidenceHash = localSha256(expectedReference);
  const observedEvidenceHash = localSha256(observedReference);
  const hashMatched = expectedEvidenceHash === observedEvidenceHash;
  return {
    expectedEvidenceHash,
    observedEvidenceHash,
    hashMatched,
    reasonCodes: hashMatched
      ? ["evidence_hash_match"]
      : ["evidence_hash_mismatch", "forged_evidence_blocked"],
    localOnly: true,
  };
}

function evaluateNonceFreshness(
  metadata: LocalReceiptProofMetadata,
  evaluatedAt: string,
): LocalNonceFreshnessDecision {
  const created = parseTimestamp(metadata.created_at);
  const evaluated = parseTimestamp(evaluatedAt);
  const windowSeconds = metadata.replay_freshness.freshness_window_seconds;
  const nonceMatched = metadata.nonce === metadata.replay_freshness.nonce;
  const fresh = created !== undefined
    && evaluated !== undefined
    && nonceMatched
    && evaluated.valueOf() - created.valueOf() < windowSeconds * 1_000;
  const reasonCodes: string[] = [];
  if (!nonceMatched) reasonCodes.push("nonce_mismatch");
  if (created === undefined || evaluated === undefined) reasonCodes.push("nonce_timestamp_invalid");
  else if (!fresh) reasonCodes.push("stale_nonce_freshness_window_exceeded");
  if (fresh) reasonCodes.push("nonce_fresh");

  return {
    nonceMatched,
    fresh,
    createdAt: safeTimestamp(metadata.created_at),
    evaluatedAt: safeTimestamp(evaluatedAt),
    freshnessWindowSeconds: windowSeconds,
    reasonCodes,
    localOnly: true,
  };
}

function baseScenarioResult(
  definition: LocalAdversarialScenarioInput,
  verdict: LocalAdversarialScenarioVerdict,
  reasonCodes: readonly string[],
  evidenceTrail: readonly string[],
): LocalAdversarialScenarioResult {
  return {
    scenarioId: definition.scenarioId,
    scenarioType: definition.scenarioType,
    title: definition.title,
    attackSummary: definition.attackSummary,
    expectedVerdict: definition.expectedVerdict,
    verdict,
    blocked: verdict === "blocked",
    allowedLocally: verdict === "allowed_local_control",
    controlSatisfied: false,
    reasonCodes: unique(reasonCodes),
    evidenceTrail: [...evidenceTrail],
    ...SAFETY_FLAGS,
  };
}

function summariseReceiptVerification(
  decision: LocalTrustReceiptVerificationDecision,
): LocalAdversarialReceiptVerificationEvidence {
  return {
    verified: decision.verified,
    validForSimulatedSettlement: decision.valid_for_simulated_settlement,
    structurallyValid: decision.structurally_valid,
    fresh: decision.fresh,
    replaySafe: decision.replay_safe,
    settlementBlockerAllowed: decision.settlement_blocker_allowed,
    receiptType: decision.receipt_type,
    verdict: decision.verdict,
    reasonCodes: [...decision.reason_codes],
    mode: decision.mode,
  };
}

function summariseSettlementBlocker(
  decision: LocalSettlementBlockerDecision,
): LocalAdversarialSettlementBlockerEvidence {
  return {
    settlementSimulation: decision.settlement_simulation,
    blocked: decision.blocked,
    blockReasonCodes: [...decision.block_reason_codes],
    validityStatus: decision.validity_status,
    replayStatus: decision.replay_status,
    settlementExecuted: decision.settlement_executed,
    paymentTriggered: decision.payment_triggered,
    networkCallPerformed: decision.network_call_performed,
    actionExecuted: decision.action_executed,
    mode: decision.mode,
  };
}

function summariseSignatureVerification(
  decision: LocalSignedProofVerificationDecision,
): LocalAdversarialSignatureVerificationEvidence {
  return {
    verified: decision.verified,
    structurallyValid: decision.structurallyValid,
    payloadHashMatches: decision.payloadHashMatches,
    signatureValid: decision.signatureValid,
    signedPayloadType: decision.signedPayloadType,
    algorithm: decision.algorithm,
    keyId: decision.keyId,
    reasonCodes: [...decision.reasonCodes],
    productionSigning: decision.productionSigning,
    paymentAuthorisation: decision.paymentAuthorisation,
    settlementAuthorisation: decision.settlementAuthorisation,
  };
}

function flagsAreSafe(scenario: LocalAdversarialScenarioResult): boolean {
  return scenario.localDemoOnly === true
    && scenario.localOnly === true
    && scenario.productionSigning === false
    && scenario.paymentAuthorisation === false
    && scenario.settlementAuthorisation === false
    && scenario.privateDataIncluded === false
    && scenario.networkCallPerformed === false
    && scenario.externalAgentContacted === false
    && scenario.paymentTriggered === false
    && scenario.settlementExecuted === false
    && scenario.actionExecuted === false;
}

function createEvaluationId(scenarios: readonly LocalAdversarialScenarioResult[]): string {
  const seed = scenarios
    .map((scenario) => `${scenario.scenarioId}:${scenario.verdict}:${scenario.reasonCodes.join(",")}`)
    .join("|");
  return `local_adversarial_eval_${createHash("sha256")
    .update(`${LOCAL_ADVERSARIAL_EVALUATION_VERSION}|${seed}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function localSha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function addSeconds(value: string, seconds: number): string {
  const parsed = parseTimestamp(value);
  if (parsed === undefined) return CHECKED_AT;
  return new Date(parsed.valueOf() + seconds * 1_000).toISOString();
}

function parseTimestamp(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
}

function safeTimestamp(value: unknown): string {
  return parseTimestamp(value)?.toISOString() ?? "1970-01-01T00:00:00.000Z";
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
