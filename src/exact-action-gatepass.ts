import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
} from "node:crypto";

import {
  LOCAL_SIGNED_PROOF_ALGORITHM,
  createLocalDemoKeyPair,
  type LocalDemoSigningKeyPair,
} from "./local-signed-proof.js";

export const CANONICAL_ACTION_ENVELOPE_VERSION = "atg.canonical-action-envelope.v1" as const;
export const CANONICAL_JSON_VERSION = "atg.canonical-json.v1" as const;
export const EXACT_ACTION_GATEPASS_VERSION = "atg.exact-action-gatepass.local.v1" as const;
export const POLICY_DECISION_RECEIPT_VERSION = "atg.policy-decision-receipt.local.v1" as const;
export const EXECUTION_RECEIPT_VERSION = "atg.execution-receipt.local.v1" as const;
export const NONCE_STATE_VERSION = "atg.nonce-state.local.v1" as const;
export const VERIFICATION_RESULT_VERSION = "atg.exact-action-verification.local.v1" as const;
export const VERIFICATION_PROFILE_VERSION = "atg.local-verification-profile.v1" as const;
export const KEY_STATUS_FIXTURE_VERSION = "atg.key-status-fixture.local.v1" as const;
export const EXACT_ACTION_REFERENCE_TIME = "2026-07-20T09:05:00.000Z" as const;
export const EXACT_ACTION_TRUST_STATEMENT =
  "Agent Trust Gate™ exists to make digital trust verifiable before action, observable during execution and accountable afterwards." as const;
export const EXACT_ACTION_OPERATIONAL_MESSAGE =
  "Control before action. Evidence during execution. Accountability after the event." as const;
export const EXACT_ACTION_PERMISSION_STATEMENT =
  "Permission must be verified at the point of action. Decision does not equal execution." as const;
export const ALLOWED_DOES_NOT_MEAN_EXECUTED = "Allowed does not mean executed." as const;

export type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

export type ExactActionDecision = "allowed" | "refused" | "escalated";
export type KeyStatus = "active" | "rotated" | "revoked" | "unknown";
export type NonceStatus = "unused" | "reserved" | "consumed" | "expired" | "failed" | "abandoned";
export type ExecutionResultStatus =
  | "executed"
  | "execution_refused"
  | "expired_before_execution"
  | "replay_rejected"
  | "action_mismatch"
  | "verifier_unavailable"
  | "execution_failed"
  | "abandoned_not_acknowledged";

export type GatePassFailureReasonCode =
  | "GATEPASS_INVALID_SIGNATURE"
  | "GATEPASS_UNKNOWN_KEY"
  | "GATEPASS_KEY_REVOKED"
  | "GATEPASS_NOT_YET_VALID"
  | "GATEPASS_EXPIRED"
  | "GATEPASS_ACTION_DIGEST_MISMATCH"
  | "GATEPASS_AGENT_MISMATCH"
  | "GATEPASS_SESSION_MISMATCH"
  | "GATEPASS_RUN_MISMATCH"
  | "GATEPASS_MANDATE_MISMATCH"
  | "GATEPASS_TOOL_MISMATCH"
  | "GATEPASS_TARGET_MISMATCH"
  | "GATEPASS_ENVIRONMENT_MISMATCH"
  | "GATEPASS_ALREADY_CONSUMED"
  | "GATEPASS_NONCE_UNRESOLVED"
  | "GATEPASS_VERIFIER_UNAVAILABLE"
  | "GATEPASS_APPROVAL_MISSING"
  | "GATEPASS_VERIFICATION_PROFILE_MISMATCH"
  | "EXECUTION_NOT_ACKNOWLEDGED"
  | "EXECUTION_FAILED";

export interface CanonicalActionEnvelopeInput {
  issuerIdentity: string;
  issuerKeyId: string;
  verificationProfile: string;
  subjectAgentIdentity: string;
  nativeSessionId: string;
  nativeRunId: string;
  operatorIdentity: string | null;
  mandateIdentity: string | null;
  mandateReference: string;
  mandateDigest: string;
  policyReference: string;
  policyDigest: string;
  evidenceReference: string;
  evidenceDigest: string;
  approvalRequired: boolean;
  humanApprovalReference: string | null;
  humanApprovalDigest: string | null;
  toolIdentity: string;
  toolSchemaVersion: string;
  operationName: string;
  canonicalArguments: unknown;
  targetIdentity: string;
  amount: number | null;
  currency: string | null;
  operatingEnvironment: string;
  issuedAt: string;
  notBefore: string;
  expiresAt: string;
  nonce: string;
  idempotencyKey: string;
  usageSemantics: "one_shot";
}

export interface CanonicalActionEnvelope extends Omit<CanonicalActionEnvelopeInput, "canonicalArguments"> {
  actionEnvelopeVersion: typeof CANONICAL_ACTION_ENVELOPE_VERSION;
  canonicalizationVersion: typeof CANONICAL_JSON_VERSION;
  digestAlgorithm: "sha256";
  canonicalArguments: CanonicalJsonValue;
  actionDigest: string;
}

export interface ExactActionGatePassSignature {
  algorithm: typeof LOCAL_SIGNED_PROOF_ALGORITHM;
  keyId: string;
  signedAt: string;
  signature: string;
  localFixtureOnly: true;
  productionKeyCustody: false;
}

export interface ExactActionGatePass {
  gatePassVersion: typeof EXACT_ACTION_GATEPASS_VERSION;
  gatePassId: string;
  decision: "allow";
  action: CanonicalActionEnvelope;
  oneUse: true;
  allowedDoesNotMeanExecuted: true;
  localOnly: true;
  simulatedActionsOnly: true;
  productionEnforcement: false;
  signature: ExactActionGatePassSignature;
}

export interface GatePassIssuanceReference {
  gatePassId: string;
  actionDigest: string;
  nonce: string;
  issuerIdentity: string;
  issuerKeyId: string;
  issuedAt: string;
}

export interface PolicyDecisionReceipt {
  receiptVersion: typeof POLICY_DECISION_RECEIPT_VERSION;
  receiptId: string;
  decision: ExactActionDecision;
  policyReference: string;
  policyDigest: string;
  reasons: string[];
  evidenceState: "present" | "missing";
  approvalState: "approved" | "not_required" | "missing";
  decidedAt: string;
  gatePassIssuance: GatePassIssuanceReference | null;
  executionState: "not_executed";
  allowedDoesNotMeanExecuted: true;
  localOnly: true;
  simulatedActionsOnly: true;
}

export interface ExactActionIssuance {
  gatePass: ExactActionGatePass;
  decisionReceipt: PolicyDecisionReceipt;
}

export interface LocalVerificationKey {
  issuerIdentity: string;
  keyId: string;
  algorithm: typeof LOCAL_SIGNED_PROOF_ALGORITHM;
  status: KeyStatus;
  publicKeyPem: string | null;
  acceptedForVerification: boolean;
  acceptedForIssuance: boolean;
  note: string;
}

export interface LocalVerificationProfile {
  profileVersion: typeof VERIFICATION_PROFILE_VERSION;
  profileId: string;
  verifierIdentity: string;
  clockSkewSeconds: number;
  keys: LocalVerificationKey[];
  localOnly: true;
  productionKeyCustody: false;
}

export interface KeyStatusFixture {
  fixtureVersion: typeof KEY_STATUS_FIXTURE_VERSION;
  profileId: string;
  keys: LocalVerificationKey[];
  localOnly: true;
  productionKeyCustody: false;
}

export interface NonceTransition {
  from: NonceStatus | null;
  to: NonceStatus;
  at: string;
  reasonCode: GatePassFailureReasonCode | "NONCE_REGISTERED" | "NONCE_CONSUMED";
}

export interface NonceStateRecord {
  stateVersion: typeof NONCE_STATE_VERSION;
  nonce: string;
  gatePassId: string;
  actionDigest: string;
  expiresAt: string;
  status: NonceStatus;
  updatedAt: string;
  transitions: NonceTransition[];
  localProcessOnly: true;
  crossProcessAtomicity: false;
}

export interface NonceConsumeResult {
  consumed: boolean;
  state: NonceStateRecord | null;
  reasonCode: GatePassFailureReasonCode | null;
}

export class InMemoryNonceStore {
  readonly localProcessOnly = true as const;
  readonly crossProcessAtomicity = false as const;
  readonly #records = new Map<string, NonceStateRecord>();

  registerUnused(gatePass: ExactActionGatePass, registeredAt = gatePass.action.issuedAt): NonceStateRecord {
    const existing = this.#records.get(gatePass.action.nonce);
    if (existing !== undefined) return structuredClone(existing);
    const record: NonceStateRecord = {
      stateVersion: NONCE_STATE_VERSION,
      nonce: gatePass.action.nonce,
      gatePassId: gatePass.gatePassId,
      actionDigest: gatePass.action.actionDigest,
      expiresAt: gatePass.action.expiresAt,
      status: "unused",
      updatedAt: normalizeTimestamp(registeredAt, "registeredAt"),
      transitions: [{
        from: null,
        to: "unused",
        at: normalizeTimestamp(registeredAt, "registeredAt"),
        reasonCode: "NONCE_REGISTERED",
      }],
      localProcessOnly: true,
      crossProcessAtomicity: false,
    };
    this.#records.set(record.nonce, record);
    return structuredClone(record);
  }

  get(nonce: string): NonceStateRecord | null {
    const record = this.#records.get(nonce);
    return record === undefined ? null : structuredClone(record);
  }

  consume(gatePass: ExactActionGatePass, consumedAt: string): NonceConsumeResult {
    const record = this.#records.get(gatePass.action.nonce);
    if (record === undefined
      || record.gatePassId !== gatePass.gatePassId
      || record.actionDigest !== gatePass.action.actionDigest) {
      return { consumed: false, state: record === undefined ? null : structuredClone(record), reasonCode: "GATEPASS_NONCE_UNRESOLVED" };
    }
    const at = normalizeTimestamp(consumedAt, "consumedAt");
    if (Date.parse(at) >= Date.parse(record.expiresAt)) {
      if (record.status === "unused" || record.status === "reserved") {
        this.#transition(record, "expired", at, "GATEPASS_EXPIRED");
      }
      return { consumed: false, state: structuredClone(record), reasonCode: "GATEPASS_EXPIRED" };
    }
    if (record.status !== "unused") {
      return { consumed: false, state: structuredClone(record), reasonCode: "GATEPASS_ALREADY_CONSUMED" };
    }
    this.#transition(record, "consumed", at, "NONCE_CONSUMED");
    return { consumed: true, state: structuredClone(record), reasonCode: null };
  }

  markExecutionFailed(nonce: string, at: string): NonceStateRecord | null {
    return this.#markTerminal(nonce, "failed", at, "EXECUTION_FAILED");
  }

  markAbandoned(nonce: string, at: string): NonceStateRecord | null {
    return this.#markTerminal(nonce, "abandoned", at, "EXECUTION_NOT_ACKNOWLEDGED");
  }

  markExpired(nonce: string, at: string): NonceStateRecord | null {
    const record = this.#records.get(nonce);
    if (record === undefined) return null;
    if (record.status === "unused" || record.status === "reserved") {
      this.#transition(record, "expired", normalizeTimestamp(at, "expiredAt"), "GATEPASS_EXPIRED");
    }
    return structuredClone(record);
  }

  #markTerminal(
    nonce: string,
    status: "failed" | "abandoned",
    at: string,
    reasonCode: "EXECUTION_FAILED" | "EXECUTION_NOT_ACKNOWLEDGED",
  ): NonceStateRecord | null {
    const record = this.#records.get(nonce);
    if (record === undefined) return null;
    if (record.status === "consumed") this.#transition(record, status, normalizeTimestamp(at, "transitionAt"), reasonCode);
    return structuredClone(record);
  }

  #transition(
    record: NonceStateRecord,
    to: NonceStatus,
    at: string,
    reasonCode: NonceTransition["reasonCode"],
  ): void {
    const from = record.status;
    record.status = to;
    record.updatedAt = at;
    record.transitions.push({ from, to, at, reasonCode });
  }
}

export interface TrustedClock {
  clockId: string;
  now: () => Date | undefined;
}

export interface ExactActionVerificationConstraints {
  subjectAgentIdentity: string;
  nativeSessionId: string;
  nativeRunId: string;
  mandateReference: string;
  toolIdentity: string;
  toolSchemaVersion: string;
  targetIdentity: string;
  operatingEnvironment: string;
}

export interface ExactActionVerifierContext {
  verifierIdentity: string;
  available: boolean;
  verificationProfile: LocalVerificationProfile | null;
  nonceStore: InMemoryNonceStore | null;
  trustedClock: TrustedClock | null;
  constraints: ExactActionVerificationConstraints;
  decisionReceipt: PolicyDecisionReceipt;
}

export interface ExactActionVerificationResult {
  resultVersion: typeof VERIFICATION_RESULT_VERSION;
  gatePassId: string;
  actionDigest: string;
  proposedActionDigest: string | null;
  verifierIdentity: string;
  verificationProfile: string;
  verificationTimestamp: string | null;
  verified: boolean;
  nonceConsumed: boolean;
  signatureValid: boolean;
  keyStatus: KeyStatus;
  nonceState: NonceStateRecord | null;
  reasonCodes: GatePassFailureReasonCode[];
  localOnly: true;
  simulatedActionsOnly: true;
  note: typeof ALLOWED_DOES_NOT_MEAN_EXECUTED;
}

export interface SimulatedExecutionAcknowledgement {
  acknowledged: boolean;
  simulatedSideEffectReference: string | null;
}

export interface ExecutionReceipt {
  receiptVersion: typeof EXECUTION_RECEIPT_VERSION;
  receiptId: string;
  gatePassId: string;
  actionDigest: string;
  nonce: string;
  verifierIdentity: string;
  verificationTimestamp: string | null;
  executionAcknowledgementTimestamp: string | null;
  resultStatus: ExecutionResultStatus;
  reasonCode: GatePassFailureReasonCode | null;
  reasonCodes: GatePassFailureReasonCode[];
  simulatedSideEffectReference: string | null;
  decisionReceiptReference: string;
  safeFailureDetail: string | null;
  verification: ExactActionVerificationResult;
  simulatedOnly: true;
  externalActionOccurred: false;
  allowedDoesNotMeanExecuted: true;
}

export type ExactActionDemoScenarioId =
  | "exact_action_executed"
  | "replay_refused"
  | "changed_amount_refused"
  | "changed_target_refused"
  | "changed_tool_schema_refused"
  | "expired_refused"
  | "revoked_key_refused"
  | "unknown_key_refused"
  | "verifier_unavailable"
  | "allowed_not_executed";

export interface ExactActionDemoScenario {
  scenarioId: ExactActionDemoScenarioId;
  description: string;
  decisionReceipt: PolicyDecisionReceipt;
  gatePass: ExactActionGatePass;
  executionReceipt: ExecutionReceipt | null;
  lifecycleState: "executed" | "execution_refused" | "allowed_not_executed";
}

export interface ExactActionDemoPack {
  demoVersion: typeof EXACT_ACTION_GATEPASS_VERSION;
  referenceTime: typeof EXACT_ACTION_REFERENCE_TIME;
  trustStatement: typeof EXACT_ACTION_TRUST_STATEMENT;
  operationalMessage: typeof EXACT_ACTION_OPERATIONAL_MESSAGE;
  permissionStatement: typeof EXACT_ACTION_PERMISSION_STATEMENT;
  allowedDoesNotMeanExecuted: typeof ALLOWED_DOES_NOT_MEAN_EXECUTED;
  scenarios: Record<ExactActionDemoScenarioId, ExactActionDemoScenario>;
  localOnly: true;
  simulatedActionsOnly: true;
  realPayments: false;
  realSettlement: false;
  externalApis: false;
  productionEnforcement: false;
}

export type ExactActionDemoSummary = Omit<ExactActionDemoPack, "scenarios"> & {
  scenarioCount: number;
  executedLocally: number;
  refusedLocally: number;
  allowedNotExecuted: number;
};

export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(toCanonicalJsonValue(value, "$", new Set<object>()));
}

export function createCanonicalActionEnvelope(input: CanonicalActionEnvelopeInput): CanonicalActionEnvelope {
  const fields = normalizeActionInput(input);
  const payload = {
    actionEnvelopeVersion: CANONICAL_ACTION_ENVELOPE_VERSION,
    canonicalizationVersion: CANONICAL_JSON_VERSION,
    digestAlgorithm: "sha256" as const,
    ...fields,
  };
  return {
    ...payload,
    actionDigest: sha256(canonicalizeJson(payload)),
  };
}

export function recomputeCanonicalActionDigest(envelope: CanonicalActionEnvelope): string {
  const { actionDigest: _actionDigest, ...payload } = envelope;
  return sha256(canonicalizeJson(payload));
}

export function issueExactActionGatePass(
  input: CanonicalActionEnvelopeInput,
  keyPair: LocalDemoSigningKeyPair = createLocalDemoKeyPair(),
): ExactActionIssuance {
  const action = createCanonicalActionEnvelope(input);
  if (action.approvalRequired
    && (action.humanApprovalReference === null || action.humanApprovalDigest === null)) {
    throw new TypeError("A required human approval must be present before an exact-action GatePass is issued");
  }
  const unsigned = {
    gatePassVersion: EXACT_ACTION_GATEPASS_VERSION,
    gatePassId: `gatepass_exact_${digestId(action.actionDigest, action.nonce)}`,
    decision: "allow" as const,
    action,
    oneUse: true as const,
    allowedDoesNotMeanExecuted: true as const,
    localOnly: true as const,
    simulatedActionsOnly: true as const,
    productionEnforcement: false as const,
  };
  const signature = cryptoSign(
    null,
    Buffer.from(canonicalizeJson(unsigned), "utf8"),
    createPrivateKey(keyPair.privateKeyPem),
  ).toString("base64");
  const gatePass: ExactActionGatePass = {
    ...unsigned,
    signature: {
      algorithm: LOCAL_SIGNED_PROOF_ALGORITHM,
      keyId: action.issuerKeyId,
      signedAt: action.issuedAt,
      signature,
      localFixtureOnly: true,
      productionKeyCustody: false,
    },
  };
  const decisionReceipt = createPolicyDecisionReceipt({
    decision: "allowed",
    action,
    gatePass,
    reasons: [
      "POLICY_EXACT_ACTION_ALLOWED",
      "GATEPASS_ISSUED_FOR_ONE_EXACT_LOCAL_SIMULATED_ACTION",
      "ALLOWED_DOES_NOT_MEAN_EXECUTED",
    ],
  });
  return { gatePass, decisionReceipt };
}

export function createPolicyDecisionReceipt(input: {
  decision: ExactActionDecision;
  action: CanonicalActionEnvelope;
  gatePass: ExactActionGatePass | null;
  reasons: string[];
}): PolicyDecisionReceipt {
  const approvalState = input.action.approvalRequired
    ? input.action.humanApprovalReference !== null && input.action.humanApprovalDigest !== null
      ? "approved"
      : "missing"
    : "not_required";
  const issuance: GatePassIssuanceReference | null = input.gatePass === null ? null : {
    gatePassId: input.gatePass.gatePassId,
    actionDigest: input.action.actionDigest,
    nonce: input.action.nonce,
    issuerIdentity: input.action.issuerIdentity,
    issuerKeyId: input.action.issuerKeyId,
    issuedAt: input.action.issuedAt,
  };
  return {
    receiptVersion: POLICY_DECISION_RECEIPT_VERSION,
    receiptId: `decision_receipt_${digestId(input.action.actionDigest, input.decision, input.reasons.join("|"))}`,
    decision: input.decision,
    policyReference: input.action.policyReference,
    policyDigest: input.action.policyDigest,
    reasons: [...input.reasons],
    evidenceState: input.action.evidenceReference !== "" && input.action.evidenceDigest !== "" ? "present" : "missing",
    approvalState,
    decidedAt: input.action.issuedAt,
    gatePassIssuance: issuance,
    executionState: "not_executed",
    allowedDoesNotMeanExecuted: true,
    localOnly: true,
    simulatedActionsOnly: true,
  };
}

export function createLocalVerificationProfile(
  keyStatus: KeyStatus = "active",
  options: {
    profileId?: string;
    verifierIdentity?: string;
    issuerIdentity?: string;
    keyId?: string;
    acceptedForVerification?: boolean;
    keyPair?: LocalDemoSigningKeyPair;
  } = {},
): LocalVerificationProfile {
  const keyPair = options.keyPair ?? createLocalDemoKeyPair();
  const acceptedForVerification = options.acceptedForVerification
    ?? (keyStatus === "active" || keyStatus === "rotated");
  return {
    profileVersion: VERIFICATION_PROFILE_VERSION,
    profileId: options.profileId ?? "local_exact_action_verification_profile",
    verifierIdentity: options.verifierIdentity ?? "local_point_of_action_verifier",
    clockSkewSeconds: 30,
    keys: [{
      issuerIdentity: options.issuerIdentity ?? "local_demo_policy_authority",
      keyId: options.keyId ?? keyPair.keyId,
      algorithm: LOCAL_SIGNED_PROOF_ALGORITHM,
      status: keyStatus,
      publicKeyPem: keyStatus === "unknown" ? null : keyPair.publicKeyPem,
      acceptedForVerification,
      acceptedForIssuance: keyStatus === "active",
      note: keyStatus === "rotated"
        ? "Rotated local fixture keys may verify existing GatePasses but must not issue new GatePasses."
        : "Local fixture status only; no production key custody or revocation service.",
    }],
    localOnly: true,
    productionKeyCustody: false,
  };
}

export function createKeyStatusFixture(): KeyStatusFixture {
  const keyPair = createLocalDemoKeyPair();
  const statuses: KeyStatus[] = ["active", "rotated", "revoked", "unknown"];
  return {
    fixtureVersion: KEY_STATUS_FIXTURE_VERSION,
    profileId: "local_exact_action_key_status_fixture",
    keys: statuses.map((status) => createLocalVerificationProfile(status, {
      profileId: "local_exact_action_key_status_fixture",
      keyId: `${keyPair.keyId}-${status}`,
      keyPair,
    }).keys[0] as LocalVerificationKey),
    localOnly: true,
    productionKeyCustody: false,
  };
}

export function verifyExactActionAtExecution(
  gatePass: ExactActionGatePass,
  proposedAction: CanonicalActionEnvelopeInput,
  context: ExactActionVerifierContext,
): ExactActionVerificationResult {
  if (!context.available
    || context.verificationProfile === null
    || context.nonceStore === null
    || context.trustedClock === null) {
    return unavailableVerification(gatePass, context);
  }
  let now: Date | undefined;
  try {
    now = context.trustedClock.now();
  } catch {
    now = undefined;
  }
  if (now === undefined || Number.isNaN(now.valueOf())) return unavailableVerification(gatePass, context);
  const checkedAt = now.toISOString();
  const reasons: GatePassFailureReasonCode[] = [];
  let reconstructed: CanonicalActionEnvelope | null = null;
  try {
    reconstructed = createCanonicalActionEnvelope(proposedAction);
  } catch {
    reasons.push("GATEPASS_ACTION_DIGEST_MISMATCH");
  }
  if (reconstructed !== null) {
    if (reconstructed.actionDigest !== gatePass.action.actionDigest
      || recomputeCanonicalActionDigest(gatePass.action) !== gatePass.action.actionDigest) {
      reasons.push("GATEPASS_ACTION_DIGEST_MISMATCH");
    }
    collectActionBindingReasons(gatePass.action, reconstructed, context.constraints, reasons);
  }
  if (gatePass.action.verificationProfile !== context.verificationProfile.profileId
    || context.verifierIdentity !== context.verificationProfile.verifierIdentity) {
    reasons.push("GATEPASS_VERIFICATION_PROFILE_MISMATCH");
  }
  if (context.decisionReceipt.decision !== "allowed"
    || context.decisionReceipt.gatePassIssuance?.gatePassId !== gatePass.gatePassId
    || context.decisionReceipt.gatePassIssuance.actionDigest !== gatePass.action.actionDigest) {
    reasons.push("GATEPASS_ACTION_DIGEST_MISMATCH");
  }
  if (gatePass.action.approvalRequired
    && (gatePass.action.humanApprovalReference === null || gatePass.action.humanApprovalDigest === null)) {
    reasons.push("GATEPASS_APPROVAL_MISSING");
  }
  const skewMs = context.verificationProfile.clockSkewSeconds * 1_000;
  const nowMs = now.valueOf();
  if (nowMs + skewMs < Date.parse(gatePass.action.notBefore)
    || nowMs + skewMs < Date.parse(gatePass.action.issuedAt)) {
    reasons.push("GATEPASS_NOT_YET_VALID");
  }
  if (nowMs - skewMs >= Date.parse(gatePass.action.expiresAt)) reasons.push("GATEPASS_EXPIRED");

  const key = context.verificationProfile.keys.find((candidate) =>
    candidate.issuerIdentity === gatePass.action.issuerIdentity
    && candidate.keyId === gatePass.action.issuerKeyId
    && candidate.keyId === gatePass.signature.keyId
  );
  let keyStatus: KeyStatus = "unknown";
  let signatureValid = false;
  if (key === undefined || key.status === "unknown" || key.publicKeyPem === null) {
    reasons.push("GATEPASS_UNKNOWN_KEY");
  } else if (key.status === "revoked") {
    keyStatus = "revoked";
    reasons.push("GATEPASS_KEY_REVOKED");
  } else {
    keyStatus = key.status;
    if (!key.acceptedForVerification) {
      reasons.push("GATEPASS_UNKNOWN_KEY");
    } else {
      signatureValid = verifyGatePassSignature(gatePass, key.publicKeyPem);
      if (!signatureValid) reasons.push("GATEPASS_INVALID_SIGNATURE");
    }
  }

  let existingNonce = context.nonceStore.get(gatePass.action.nonce);
  if (existingNonce !== null
    && reasons.includes("GATEPASS_EXPIRED")
    && (existingNonce.status === "unused" || existingNonce.status === "reserved")) {
    existingNonce = context.nonceStore.markExpired(gatePass.action.nonce, checkedAt);
  }
  if (existingNonce === null
    || existingNonce.gatePassId !== gatePass.gatePassId
    || existingNonce.actionDigest !== gatePass.action.actionDigest) {
    reasons.push("GATEPASS_NONCE_UNRESOLVED");
  } else if (existingNonce.status === "expired") {
    reasons.push("GATEPASS_EXPIRED");
  } else if (existingNonce.status !== "unused") {
    reasons.push("GATEPASS_ALREADY_CONSUMED");
  }

  let nonceConsumed = false;
  let nonceState = existingNonce;
  if (reasons.length === 0) {
    const consumed = context.nonceStore.consume(gatePass, checkedAt);
    nonceConsumed = consumed.consumed;
    nonceState = consumed.state;
    if (consumed.reasonCode !== null) reasons.push(consumed.reasonCode);
  }
  return {
    resultVersion: VERIFICATION_RESULT_VERSION,
    gatePassId: gatePass.gatePassId,
    actionDigest: gatePass.action.actionDigest,
    proposedActionDigest: reconstructed?.actionDigest ?? null,
    verifierIdentity: context.verifierIdentity,
    verificationProfile: context.verificationProfile.profileId,
    verificationTimestamp: checkedAt,
    verified: reasons.length === 0 && nonceConsumed,
    nonceConsumed,
    signatureValid,
    keyStatus,
    nonceState,
    reasonCodes: unique(reasons),
    localOnly: true,
    simulatedActionsOnly: true,
    note: ALLOWED_DOES_NOT_MEAN_EXECUTED,
  };
}

export async function verifyAndExecuteSimulatedAction(
  gatePass: ExactActionGatePass,
  proposedAction: CanonicalActionEnvelopeInput,
  context: ExactActionVerifierContext,
  executor: (action: CanonicalActionEnvelope) =>
    | SimulatedExecutionAcknowledgement
    | Promise<SimulatedExecutionAcknowledgement>,
): Promise<ExecutionReceipt> {
  const verification = verifyExactActionAtExecution(gatePass, proposedAction, context);
  if (!verification.verified) {
    return createExecutionReceipt(gatePass, context, verification, {
      resultStatus: statusForVerificationFailure(verification.reasonCodes),
      reasonCode: verification.reasonCodes[0] ?? "GATEPASS_VERIFIER_UNAVAILABLE",
      executionAcknowledgementTimestamp: null,
      simulatedSideEffectReference: null,
      safeFailureDetail: safeFailureDetail(verification.reasonCodes),
    });
  }
  const action = createCanonicalActionEnvelope(proposedAction);
  try {
    const acknowledgement = await executor(action);
    const acknowledgedAt = safeClockRead(context.trustedClock);
    if (!acknowledgement.acknowledged
      || acknowledgement.simulatedSideEffectReference === null
      || acknowledgedAt === null) {
      context.nonceStore?.markAbandoned(gatePass.action.nonce, acknowledgedAt ?? verification.verificationTimestamp ?? gatePass.action.issuedAt);
      return createExecutionReceipt(gatePass, context, verification, {
        resultStatus: "abandoned_not_acknowledged",
        reasonCode: "EXECUTION_NOT_ACKNOWLEDGED",
        executionAcknowledgementTimestamp: null,
        simulatedSideEffectReference: null,
        safeFailureDetail: "The local simulated side effect did not return a complete verifier-timestamped acknowledgement.",
      });
    }
    return createExecutionReceipt(gatePass, context, verification, {
      resultStatus: "executed",
      reasonCode: null,
      executionAcknowledgementTimestamp: acknowledgedAt,
      simulatedSideEffectReference: acknowledgement.simulatedSideEffectReference,
      safeFailureDetail: null,
    });
  } catch {
    const failedAt = safeClockRead(context.trustedClock) ?? verification.verificationTimestamp ?? gatePass.action.issuedAt;
    context.nonceStore?.markExecutionFailed(gatePass.action.nonce, failedAt);
    return createExecutionReceipt(gatePass, context, verification, {
      resultStatus: "execution_failed",
      reasonCode: "EXECUTION_FAILED",
      executionAcknowledgementTimestamp: null,
      simulatedSideEffectReference: null,
      safeFailureDetail: "The local simulated executor reported failure; no external side effect was attempted.",
    });
  }
}

export function createBaseExactActionInput(
  overrides: Partial<CanonicalActionEnvelopeInput> = {},
): CanonicalActionEnvelopeInput {
  return {
    issuerIdentity: "local_demo_policy_authority",
    issuerKeyId: createLocalDemoKeyPair().keyId,
    verificationProfile: "local_exact_action_verification_profile",
    subjectAgentIdentity: "simulated_agent_procurement_001",
    nativeSessionId: "simulated_session_001",
    nativeRunId: "simulated_run_001",
    operatorIdentity: "synthetic_operator_mandate_holder",
    mandateIdentity: "synthetic_supplier_payment_mandate",
    mandateReference: "mandate://local/synthetic-001",
    mandateDigest: sha256("synthetic mandate fixture"),
    policyReference: "policy://local/exact-action-v1",
    policyDigest: sha256("synthetic exact action policy fixture"),
    evidenceReference: "evidence://local/synthetic-invoice-001",
    evidenceDigest: sha256("synthetic evidence fixture"),
    approvalRequired: true,
    humanApprovalReference: "approval://local/synthetic-001",
    humanApprovalDigest: sha256("synthetic approval fixture"),
    toolIdentity: "local.simulated-supplier-payment",
    toolSchemaVersion: "1.0.0",
    operationName: "simulate_supplier_payment_authorisation",
    canonicalArguments: {
      dryRun: true,
      invoiceReference: "synthetic_invoice_001",
      lineItems: ["synthetic_service_alpha", "synthetic_service_beta"],
    },
    targetIdentity: "synthetic_supplier_001",
    amount: 125.5,
    currency: "GBP",
    operatingEnvironment: "local_simulation",
    issuedAt: "2026-07-20T09:00:00.000Z",
    notBefore: "2026-07-20T09:00:00.000Z",
    expiresAt: "2026-07-20T09:10:00.000Z",
    nonce: "nonce_exact_action_001",
    idempotencyKey: "idempotency_exact_action_001",
    usageSemantics: "one_shot",
    ...overrides,
  };
}

export function createFixedTrustedClock(
  timestamp: string | undefined = EXACT_ACTION_REFERENCE_TIME,
): TrustedClock {
  return {
    clockId: "local_verifier_controlled_test_clock",
    now: () => timestamp === undefined ? undefined : new Date(timestamp),
  };
}

export function createVerifierContext(
  issuance: ExactActionIssuance,
  store: InMemoryNonceStore,
  overrides: Partial<ExactActionVerifierContext> = {},
): ExactActionVerifierContext {
  const action = issuance.gatePass.action;
  const profile = createLocalVerificationProfile("active", {
    profileId: action.verificationProfile,
    issuerIdentity: action.issuerIdentity,
    keyId: action.issuerKeyId,
  });
  return {
    verifierIdentity: profile.verifierIdentity,
    available: true,
    verificationProfile: profile,
    nonceStore: store,
    trustedClock: createFixedTrustedClock(),
    constraints: {
      subjectAgentIdentity: action.subjectAgentIdentity,
      nativeSessionId: action.nativeSessionId,
      nativeRunId: action.nativeRunId,
      mandateReference: action.mandateReference,
      toolIdentity: action.toolIdentity,
      toolSchemaVersion: action.toolSchemaVersion,
      targetIdentity: action.targetIdentity,
      operatingEnvironment: action.operatingEnvironment,
    },
    decisionReceipt: issuance.decisionReceipt,
    ...overrides,
  };
}

export async function runExactActionGatePassDemo(): Promise<ExactActionDemoPack> {
  const executedInput = createBaseExactActionInput();
  const executedIssuance = issueExactActionGatePass(executedInput);
  const executedStore = new InMemoryNonceStore();
  executedStore.registerUnused(executedIssuance.gatePass);
  const executedContext = createVerifierContext(executedIssuance, executedStore);
  const executedReceipt = await verifyAndExecuteSimulatedAction(
    executedIssuance.gatePass,
    executedInput,
    executedContext,
    () => ({ acknowledged: true, simulatedSideEffectReference: "simulated-side-effect://supplier-payment/001" }),
  );
  const replayReceipt = await verifyAndExecuteSimulatedAction(
    executedIssuance.gatePass,
    executedInput,
    executedContext,
    () => ({ acknowledged: true, simulatedSideEffectReference: "must-not-run" }),
  );

  const changedAmount = await runRefusalScenario(
    createBaseExactActionInput({ nonce: "nonce_exact_action_amount", idempotencyKey: "idempotency_exact_action_amount" }),
    (input) => ({ ...input, amount: 126.5 }),
  );
  const changedTarget = await runRefusalScenario(
    createBaseExactActionInput({ nonce: "nonce_exact_action_target", idempotencyKey: "idempotency_exact_action_target" }),
    (input) => ({ ...input, targetIdentity: "synthetic_supplier_changed" }),
  );
  const changedTool = await runRefusalScenario(
    createBaseExactActionInput({ nonce: "nonce_exact_action_tool", idempotencyKey: "idempotency_exact_action_tool" }),
    (input) => ({ ...input, toolSchemaVersion: "2.0.0" }),
  );
  const expiredInput = createBaseExactActionInput({
    nonce: "nonce_exact_action_expired",
    idempotencyKey: "idempotency_exact_action_expired",
    expiresAt: "2026-07-20T09:02:00.000Z",
  });
  const expired = await runRefusalScenario(expiredInput, (input) => input);
  const revoked = await runKeyStatusScenario("revoked", "nonce_exact_action_revoked");
  const unknown = await runKeyStatusScenario("unknown", "nonce_exact_action_unknown");

  const unavailableInput = createBaseExactActionInput({
    nonce: "nonce_exact_action_unavailable",
    idempotencyKey: "idempotency_exact_action_unavailable",
  });
  const unavailableIssuance = issueExactActionGatePass(unavailableInput);
  const unavailableStore = new InMemoryNonceStore();
  unavailableStore.registerUnused(unavailableIssuance.gatePass);
  const unavailableReceipt = await verifyAndExecuteSimulatedAction(
    unavailableIssuance.gatePass,
    unavailableInput,
    createVerifierContext(unavailableIssuance, unavailableStore, { available: false }),
    () => ({ acknowledged: true, simulatedSideEffectReference: "must-not-run" }),
  );

  const neverExecutedInput = createBaseExactActionInput({
    nonce: "nonce_exact_action_not_executed",
    idempotencyKey: "idempotency_exact_action_not_executed",
  });
  const neverExecuted = issueExactActionGatePass(neverExecutedInput);
  const scenarios: Record<ExactActionDemoScenarioId, ExactActionDemoScenario> = {
    exact_action_executed: demoScenario(
      "exact_action_executed",
      "The exact authorised action was verified, its nonce consumed, and a local simulated side effect acknowledged.",
      executedIssuance,
      executedReceipt,
    ),
    replay_refused: demoScenario(
      "replay_refused",
      "The same one-use GatePass was replayed and refused before the simulated executor.",
      executedIssuance,
      replayReceipt,
    ),
    changed_amount_refused: demoScenario(
      "changed_amount_refused",
      "The amount changed after issuance, so the canonical action digest no longer matched.",
      changedAmount.issuance,
      changedAmount.receipt,
    ),
    changed_target_refused: demoScenario(
      "changed_target_refused",
      "The target changed after issuance and failed both digest and target binding checks.",
      changedTarget.issuance,
      changedTarget.receipt,
    ),
    changed_tool_schema_refused: demoScenario(
      "changed_tool_schema_refused",
      "The tool schema version changed after issuance and failed closed.",
      changedTool.issuance,
      changedTool.receipt,
    ),
    expired_refused: demoScenario(
      "expired_refused",
      "Verifier-provided time showed that the GatePass had expired before execution.",
      expired.issuance,
      expired.receipt,
    ),
    revoked_key_refused: demoScenario(
      "revoked_key_refused",
      "The local verification profile marked the signing key revoked.",
      revoked.issuance,
      revoked.receipt,
    ),
    unknown_key_refused: demoScenario(
      "unknown_key_refused",
      "The signing key could not be resolved by the local verification profile.",
      unknown.issuance,
      unknown.receipt,
    ),
    verifier_unavailable: demoScenario(
      "verifier_unavailable",
      "The point-of-action verifier was unavailable and execution failed closed.",
      unavailableIssuance,
      unavailableReceipt,
    ),
    allowed_not_executed: {
      scenarioId: "allowed_not_executed",
      description: "Policy allowed the exact action, but no point-of-action verification or execution was requested.",
      decisionReceipt: neverExecuted.decisionReceipt,
      gatePass: neverExecuted.gatePass,
      executionReceipt: null,
      lifecycleState: "allowed_not_executed",
    },
  };
  return {
    demoVersion: EXACT_ACTION_GATEPASS_VERSION,
    referenceTime: EXACT_ACTION_REFERENCE_TIME,
    trustStatement: EXACT_ACTION_TRUST_STATEMENT,
    operationalMessage: EXACT_ACTION_OPERATIONAL_MESSAGE,
    permissionStatement: EXACT_ACTION_PERMISSION_STATEMENT,
    allowedDoesNotMeanExecuted: ALLOWED_DOES_NOT_MEAN_EXECUTED,
    scenarios,
    localOnly: true,
    simulatedActionsOnly: true,
    realPayments: false,
    realSettlement: false,
    externalApis: false,
    productionEnforcement: false,
  };
}

export function summariseExactActionGatePassDemo(pack: ExactActionDemoPack): ExactActionDemoSummary {
  const values = Object.values(pack.scenarios);
  const { scenarios: _scenarios, ...summary } = pack;
  return {
    ...summary,
    scenarioCount: values.length,
    executedLocally: values.filter((value) => value.lifecycleState === "executed").length,
    refusedLocally: values.filter((value) => value.lifecycleState === "execution_refused").length,
    allowedNotExecuted: values.filter((value) => value.lifecycleState === "allowed_not_executed").length,
  };
}

function normalizeActionInput(input: CanonicalActionEnvelopeInput): Omit<CanonicalActionEnvelope, "actionEnvelopeVersion" | "canonicalizationVersion" | "digestAlgorithm" | "actionDigest"> {
  const allowedFields = new Set([
    "issuerIdentity", "issuerKeyId", "verificationProfile", "subjectAgentIdentity", "nativeSessionId",
    "nativeRunId", "operatorIdentity", "mandateIdentity", "mandateReference", "mandateDigest",
    "policyReference", "policyDigest", "evidenceReference", "evidenceDigest", "approvalRequired",
    "humanApprovalReference", "humanApprovalDigest", "toolIdentity", "toolSchemaVersion", "operationName",
    "canonicalArguments", "targetIdentity", "amount", "currency", "operatingEnvironment", "issuedAt",
    "notBefore", "expiresAt", "nonce", "idempotencyKey", "usageSemantics",
  ]);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) throw new TypeError(`${field} is not allowed in the action envelope`);
  }
  const requiredStrings: Array<keyof CanonicalActionEnvelopeInput> = [
    "issuerIdentity", "issuerKeyId", "verificationProfile", "subjectAgentIdentity", "nativeSessionId",
    "nativeRunId", "mandateReference", "mandateDigest", "policyReference", "policyDigest",
    "evidenceReference", "evidenceDigest", "toolIdentity", "toolSchemaVersion", "operationName",
    "targetIdentity", "operatingEnvironment", "nonce", "idempotencyKey",
  ];
  for (const field of requiredStrings) {
    const value = input[field];
    if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string`);
  }
  const issuedAt = normalizeTimestamp(input.issuedAt, "issuedAt");
  const notBefore = normalizeTimestamp(input.notBefore, "notBefore");
  const expiresAt = normalizeTimestamp(input.expiresAt, "expiresAt");
  if (Date.parse(notBefore) < Date.parse(issuedAt)) throw new TypeError("notBefore must not precede issuedAt");
  if (Date.parse(expiresAt) <= Date.parse(issuedAt)) throw new TypeError("expiresAt must be after issuedAt");
  if (Date.parse(expiresAt) <= Date.parse(notBefore)) throw new TypeError("expiresAt must be after notBefore");
  if (typeof input.approvalRequired !== "boolean") throw new TypeError("approvalRequired must be boolean");
  if (input.usageSemantics !== "one_shot") throw new TypeError("usageSemantics must be one_shot");
  if (input.amount !== null && (!Number.isFinite(input.amount) || input.amount < 0)) {
    throw new TypeError("amount must be a finite non-negative number or null");
  }
  if ((input.amount === null) !== (input.currency === null)) {
    throw new TypeError("amount and currency must either both be present or both be null");
  }
  if (input.currency !== null && !/^[A-Z]{3}$/.test(input.currency)) {
    throw new TypeError("currency must be a three-letter uppercase code");
  }
  for (const [field, value] of [
    ["operatorIdentity", input.operatorIdentity],
    ["mandateIdentity", input.mandateIdentity],
    ["humanApprovalReference", input.humanApprovalReference],
    ["humanApprovalDigest", input.humanApprovalDigest],
  ] as const) {
    if (value !== null && value.trim() === "") throw new TypeError(`${field} must be non-empty or null`);
  }
  if ((input.humanApprovalReference === null) !== (input.humanApprovalDigest === null)) {
    throw new TypeError("human approval reference and digest must either both be present or both be null");
  }
  for (const [field, value] of [
    ["mandateDigest", input.mandateDigest],
    ["policyDigest", input.policyDigest],
    ["evidenceDigest", input.evidenceDigest],
    ["humanApprovalDigest", input.humanApprovalDigest],
  ] as const) {
    if (value !== null && !/^sha256:[a-f0-9]{64}$/.test(value)) {
      throw new TypeError(`${field} must be a SHA-256 digest`);
    }
  }
  return {
    issuerIdentity: input.issuerIdentity,
    issuerKeyId: input.issuerKeyId,
    verificationProfile: input.verificationProfile,
    subjectAgentIdentity: input.subjectAgentIdentity,
    nativeSessionId: input.nativeSessionId,
    nativeRunId: input.nativeRunId,
    operatorIdentity: input.operatorIdentity,
    mandateIdentity: input.mandateIdentity,
    mandateReference: input.mandateReference,
    mandateDigest: input.mandateDigest,
    policyReference: input.policyReference,
    policyDigest: input.policyDigest,
    evidenceReference: input.evidenceReference,
    evidenceDigest: input.evidenceDigest,
    approvalRequired: input.approvalRequired,
    humanApprovalReference: input.humanApprovalReference,
    humanApprovalDigest: input.humanApprovalDigest,
    toolIdentity: input.toolIdentity,
    toolSchemaVersion: input.toolSchemaVersion,
    operationName: input.operationName,
    canonicalArguments: toCanonicalJsonValue(input.canonicalArguments, "$.canonicalArguments", new Set<object>()),
    targetIdentity: input.targetIdentity,
    issuedAt,
    notBefore,
    expiresAt,
    amount: input.amount === null ? null : Object.is(input.amount, -0) ? 0 : input.amount,
    currency: input.currency,
    operatingEnvironment: input.operatingEnvironment,
    nonce: input.nonce,
    idempotencyKey: input.idempotencyKey,
    usageSemantics: input.usageSemantics,
  };
}

function toCanonicalJsonValue(value: unknown, path: string, active: Set<object>): CanonicalJsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${path} contains a non-finite number`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") throw new TypeError(`${path} contains an unsupported ${typeof value} value`);
  if (active.has(value)) throw new TypeError(`${path} contains a cycle`);
  active.add(value);
  try {
    if (Array.isArray(value)) {
      const output: CanonicalJsonValue[] = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) throw new TypeError(`${path} contains a sparse array`);
        output.push(toCanonicalJsonValue(value[index], `${path}[${index}]`, active));
      }
      return output;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${path} must contain plain objects only`);
    if (Object.getOwnPropertySymbols(value).length > 0) throw new TypeError(`${path} contains symbol keys`);
    const output: { [key: string]: CanonicalJsonValue } = {};
    for (const key of Object.keys(value).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.get !== undefined || descriptor.set !== undefined) {
        throw new TypeError(`${path}.${key} must be a data property`);
      }
      output[key] = toCanonicalJsonValue(descriptor.value, `${path}.${key}`, active);
    }
    return output;
  } finally {
    active.delete(value);
  }
}

function collectActionBindingReasons(
  authorised: CanonicalActionEnvelope,
  proposed: CanonicalActionEnvelope,
  constraints: ExactActionVerificationConstraints,
  reasons: GatePassFailureReasonCode[],
): void {
  if (proposed.subjectAgentIdentity !== authorised.subjectAgentIdentity
    || proposed.subjectAgentIdentity !== constraints.subjectAgentIdentity) reasons.push("GATEPASS_AGENT_MISMATCH");
  if (proposed.nativeSessionId !== authorised.nativeSessionId
    || proposed.nativeSessionId !== constraints.nativeSessionId) reasons.push("GATEPASS_SESSION_MISMATCH");
  if (proposed.nativeRunId !== authorised.nativeRunId
    || proposed.nativeRunId !== constraints.nativeRunId) reasons.push("GATEPASS_RUN_MISMATCH");
  if (proposed.mandateReference !== authorised.mandateReference
    || proposed.mandateDigest !== authorised.mandateDigest
    || proposed.mandateReference !== constraints.mandateReference) reasons.push("GATEPASS_MANDATE_MISMATCH");
  if (proposed.toolIdentity !== authorised.toolIdentity
    || proposed.toolSchemaVersion !== authorised.toolSchemaVersion
    || proposed.operationName !== authorised.operationName
    || proposed.toolIdentity !== constraints.toolIdentity
    || proposed.toolSchemaVersion !== constraints.toolSchemaVersion) reasons.push("GATEPASS_TOOL_MISMATCH");
  if (proposed.targetIdentity !== authorised.targetIdentity
    || proposed.targetIdentity !== constraints.targetIdentity) reasons.push("GATEPASS_TARGET_MISMATCH");
  if (proposed.operatingEnvironment !== authorised.operatingEnvironment
    || proposed.operatingEnvironment !== constraints.operatingEnvironment) reasons.push("GATEPASS_ENVIRONMENT_MISMATCH");
}

function verifyGatePassSignature(gatePass: ExactActionGatePass, publicKeyPem: string): boolean {
  if (gatePass.signature.algorithm !== LOCAL_SIGNED_PROOF_ALGORITHM || gatePass.signature.localFixtureOnly !== true) {
    return false;
  }
  const { signature: _signature, ...unsigned } = gatePass;
  try {
    return cryptoVerify(
      null,
      Buffer.from(canonicalizeJson(unsigned), "utf8"),
      createPublicKey(publicKeyPem),
      Buffer.from(gatePass.signature.signature, "base64"),
    );
  } catch {
    return false;
  }
}

function unavailableVerification(
  gatePass: ExactActionGatePass,
  context: ExactActionVerifierContext,
): ExactActionVerificationResult {
  return {
    resultVersion: VERIFICATION_RESULT_VERSION,
    gatePassId: gatePass.gatePassId,
    actionDigest: gatePass.action.actionDigest,
    proposedActionDigest: null,
    verifierIdentity: context.verifierIdentity,
    verificationProfile: context.verificationProfile?.profileId ?? gatePass.action.verificationProfile,
    verificationTimestamp: null,
    verified: false,
    nonceConsumed: false,
    signatureValid: false,
    keyStatus: "unknown",
    nonceState: context.nonceStore?.get(gatePass.action.nonce) ?? null,
    reasonCodes: ["GATEPASS_VERIFIER_UNAVAILABLE"],
    localOnly: true,
    simulatedActionsOnly: true,
    note: ALLOWED_DOES_NOT_MEAN_EXECUTED,
  };
}

function createExecutionReceipt(
  gatePass: ExactActionGatePass,
  context: ExactActionVerifierContext,
  verification: ExactActionVerificationResult,
  outcome: {
    resultStatus: ExecutionResultStatus;
    reasonCode: GatePassFailureReasonCode | null;
    executionAcknowledgementTimestamp: string | null;
    simulatedSideEffectReference: string | null;
    safeFailureDetail: string | null;
  },
): ExecutionReceipt {
  const reasonCodes = outcome.reasonCode === null
    ? verification.reasonCodes
    : unique([...verification.reasonCodes, outcome.reasonCode]);
  return {
    receiptVersion: EXECUTION_RECEIPT_VERSION,
    receiptId: `execution_receipt_${digestId(gatePass.gatePassId, outcome.resultStatus, reasonCodes.join("|"))}`,
    gatePassId: gatePass.gatePassId,
    actionDigest: gatePass.action.actionDigest,
    nonce: gatePass.action.nonce,
    verifierIdentity: context.verifierIdentity,
    verificationTimestamp: verification.verificationTimestamp,
    executionAcknowledgementTimestamp: outcome.executionAcknowledgementTimestamp,
    resultStatus: outcome.resultStatus,
    reasonCode: outcome.reasonCode,
    reasonCodes,
    simulatedSideEffectReference: outcome.simulatedSideEffectReference,
    decisionReceiptReference: context.decisionReceipt.receiptId,
    safeFailureDetail: outcome.safeFailureDetail,
    verification,
    simulatedOnly: true,
    externalActionOccurred: false,
    allowedDoesNotMeanExecuted: true,
  };
}

function statusForVerificationFailure(reasons: readonly GatePassFailureReasonCode[]): ExecutionResultStatus {
  if (reasons.includes("GATEPASS_VERIFIER_UNAVAILABLE")) return "verifier_unavailable";
  if (reasons.includes("GATEPASS_ALREADY_CONSUMED")) return "replay_rejected";
  if (reasons.includes("GATEPASS_EXPIRED")) return "expired_before_execution";
  if (reasons.some((reason) => [
    "GATEPASS_ACTION_DIGEST_MISMATCH",
    "GATEPASS_AGENT_MISMATCH",
    "GATEPASS_SESSION_MISMATCH",
    "GATEPASS_RUN_MISMATCH",
    "GATEPASS_MANDATE_MISMATCH",
    "GATEPASS_TOOL_MISMATCH",
    "GATEPASS_TARGET_MISMATCH",
    "GATEPASS_ENVIRONMENT_MISMATCH",
  ].includes(reason))) return "action_mismatch";
  return "execution_refused";
}

function safeFailureDetail(reasons: readonly GatePassFailureReasonCode[]): string {
  if (reasons.includes("GATEPASS_VERIFIER_UNAVAILABLE")) {
    return "The local verifier, verification profile, nonce store, or verifier-controlled clock was unavailable.";
  }
  return `Execution was refused locally before the simulated side effect: ${reasons.join(", ")}.`;
}

async function runRefusalScenario(
  authorised: CanonicalActionEnvelopeInput,
  mutate: (input: CanonicalActionEnvelopeInput) => CanonicalActionEnvelopeInput,
): Promise<{ issuance: ExactActionIssuance; receipt: ExecutionReceipt }> {
  const issuance = issueExactActionGatePass(authorised);
  const store = new InMemoryNonceStore();
  store.registerUnused(issuance.gatePass);
  const receipt = await verifyAndExecuteSimulatedAction(
    issuance.gatePass,
    mutate(structuredClone(authorised)),
    createVerifierContext(issuance, store),
    () => ({ acknowledged: true, simulatedSideEffectReference: "must-not-run" }),
  );
  return { issuance, receipt };
}

async function runKeyStatusScenario(
  status: "revoked" | "unknown",
  nonce: string,
): Promise<{ issuance: ExactActionIssuance; receipt: ExecutionReceipt }> {
  const input = createBaseExactActionInput({ nonce, idempotencyKey: `idempotency_${nonce}` });
  const issuance = issueExactActionGatePass(input);
  const store = new InMemoryNonceStore();
  store.registerUnused(issuance.gatePass);
  const profile = createLocalVerificationProfile(status, {
    profileId: input.verificationProfile,
    issuerIdentity: input.issuerIdentity,
    keyId: input.issuerKeyId,
  });
  const receipt = await verifyAndExecuteSimulatedAction(
    issuance.gatePass,
    input,
    createVerifierContext(issuance, store, { verificationProfile: profile }),
    () => ({ acknowledged: true, simulatedSideEffectReference: "must-not-run" }),
  );
  return { issuance, receipt };
}

function demoScenario(
  scenarioId: ExactActionDemoScenarioId,
  description: string,
  issuance: ExactActionIssuance,
  executionReceipt: ExecutionReceipt,
): ExactActionDemoScenario {
  return {
    scenarioId,
    description,
    decisionReceipt: issuance.decisionReceipt,
    gatePass: issuance.gatePass,
    executionReceipt,
    lifecycleState: executionReceipt.resultStatus === "executed" ? "executed" : "execution_refused",
  };
}

function safeClockRead(clock: TrustedClock | null): string | null {
  if (clock === null) return null;
  try {
    const value = clock.now();
    return value === undefined || Number.isNaN(value.valueOf()) ? null : value.toISOString();
  } catch {
    return null;
  }
}

function normalizeTimestamp(value: string, field: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new TypeError(`${field} must be a valid date-time`);
  return parsed.toISOString();
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function digestId(...values: string[]): string {
  return createHash("sha256").update(values.join("|"), "utf8").digest("hex").slice(0, 24);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
