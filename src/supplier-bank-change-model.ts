import { createHash } from "node:crypto";

import { canonicalizeJson } from "./exact-action-gatepass.js";
import {
  LOCAL_SIGNED_PROOF_ALGORITHM,
  createDeterministicLocalFixtureKeyPair,
  signCanonicalLocalFixturePayload,
  verifyCanonicalLocalFixturePayload,
} from "./local-signed-proof.js";

export const SUPPLIER_BANK_CHANGE_SCENARIO_VERSION =
  "atg.supplier-bank-change.scenario.local.v1" as const;
export const SUPPLIER_BANK_CHANGE_ACTION_VERSION =
  "atg.supplier-bank-change.action.v1" as const;
export const SUPPLIER_BANK_CHANGE_DECISION_VERSION =
  "atg.supplier-bank-change.decision.local.v1" as const;
export const SUPPLIER_BANK_CHANGE_REFERENCE_TIME =
  "2026-08-04T10:00:00.000Z" as const;
export const SUPPLIER_BANK_CHANGE_MAX_APPROVAL_MINUTES = 30 as const;
export const SUPPLIER_BANK_CHANGE_CTA =
  "Request a scoped workflow-governance assessment." as const;
export const SUPPLIER_BANK_CHANGE_NO_EXTERNAL_ACTION =
  "No ERP, bank, payment or other external action occurred." as const;

export const SUPPLIER_BANK_CHANGE_SCENARIO_IDS = [
  "valid_exact_change",
  "changed_account_details",
  "changed_supplier",
  "missing_independent_verification",
  "self_verification",
  "wrong_approver_role",
  "authority_limit_exceeded",
  "dual_approval_missing",
  "approval_expired",
  "replayed_gatepass",
  "action_digest_mismatch",
  "agent_standing_unverifiable",
  "delegation_out_of_scope",
  "commercial_authority_confusion",
  "execution_claim_without_execution_receipt",
  "revoked_human_authority",
] as const;

export type SupplierBankChangeScenarioId =
  (typeof SUPPLIER_BANK_CHANGE_SCENARIO_IDS)[number];

export type SupplierBankChangeReasonCode =
  | "ALL_CONTROLS_PASSED"
  | "ACCOUNT_DETAILS_CHANGED"
  | "SUPPLIER_CHANGED"
  | "INDEPENDENT_VERIFICATION_MISSING"
  | "SEPARATION_OF_DUTIES_FAILED"
  | "APPROVER_ROLE_UNAUTHORISED"
  | "AUTHORITY_LIMIT_EXCEEDED"
  | "DUAL_APPROVAL_REQUIRED"
  | "APPROVAL_EXPIRED"
  | "GATEPASS_ALREADY_CONSUMED"
  | "ACTION_DIGEST_MISMATCH"
  | "AGENT_STANDING_UNVERIFIABLE"
  | "DELEGATION_OUT_OF_SCOPE"
  | "COMMERCIAL_AUTHORITY_CONFUSION"
  | "EXECUTION_RECEIPT_MISSING"
  | "APPROVER_AUTHORITY_REVOKED";

export interface SupplierBankChangeAction {
  actionVersion: typeof SUPPLIER_BANK_CHANGE_ACTION_VERSION;
  actionType: string;
  supplierName: string;
  supplierReference: string;
  currentAccountEnding: string;
  proposedAccountEnding: string;
  changeType: string;
  reason: string;
  destinationSystem: string;
  requestedBy: string;
  accountablePrincipal: string;
  supplierCategory: string;
  riskTier: number;
}

export interface SupplierBankChangeDelegation {
  delegationReference: string;
  evidencePresent: boolean;
  status: "active" | "revoked" | "unknown";
  permittedActions: string[];
  permittedResources: string[];
  supplierCategories: string[];
  maximumRiskTier: number;
  validFrom: string;
  expiresAt: string;
}

export interface SupplierBankChangeAgent {
  identity: string;
  identityVerified: boolean;
  accountablePrincipal: string;
  principalVerified: boolean;
  delegation: SupplierBankChangeDelegation;
}

export interface SupplierBankChangeVerification {
  required: true;
  evidenceReference: string | null;
  evidencePresent: boolean;
  independentlyObtained: boolean;
  evidenceTypeApproved: boolean;
  requesterIdentity: string;
  verifierIdentity: string | null;
  supplierReference: string | null;
  proposedAccountEnding: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
}

export interface SupplierBankChangeApproval {
  approvalReference: string;
  humanIdentity: string;
  authenticated: boolean;
  active: boolean;
  authorityRevoked: boolean;
  role: string;
  permittedActions: string[];
  supplierCategories: string[];
  maximumRiskTier: number;
  approvedActionDigest: string;
  approvedAt: string;
  expiresAt: string;
}

export interface SupplierBankChangeExecutionClaim {
  claimsExternalExecution: boolean;
  receiptPresent: boolean;
  receiptSimulated: boolean;
  receiptReference: string | null;
}

export interface SupplierBankChangeScenario {
  scenarioVersion: typeof SUPPLIER_BANK_CHANGE_SCENARIO_VERSION;
  scenarioId: SupplierBankChangeScenarioId;
  title: string;
  description: string;
  synthetic: true;
  realData: false;
  networkAccess: false;
  externalActionPerformed: false;
  referenceTime: typeof SUPPLIER_BANK_CHANGE_REFERENCE_TIME;
  action: SupplierBankChangeAction;
  approvedAction: SupplierBankChangeAction;
  agent: SupplierBankChangeAgent;
  independentVerification: SupplierBankChangeVerification;
  humanApprovals: SupplierBankChangeApproval[];
  presentedGatePass: {
    state: "none" | "unused" | "consumed";
    nonce: string;
  };
  executionClaim: SupplierBankChangeExecutionClaim;
  expected: {
    decision: "GATEPASS_ISSUED" | "REFUSED";
    reasonCode: SupplierBankChangeReasonCode;
  };
}

export interface SupplierBankChangeControlResult {
  control: string;
  passed: boolean;
  detail: string;
}

export interface SupplierBankChangeDecision {
  decisionVersion: typeof SUPPLIER_BANK_CHANGE_DECISION_VERSION;
  scenarioId: SupplierBankChangeScenarioId;
  scenarioTitle: string;
  decision: "GATEPASS_ISSUED" | "REFUSED";
  decisionStage: "gatepass" | "execution_claim";
  reasonCode: SupplierBankChangeReasonCode;
  reasonCodes: SupplierBankChangeReasonCode[];
  humanReadableReason: string;
  failedControl: string | null;
  actionDigest: string;
  approvedActionDigest: string;
  digestComparison: {
    match: boolean;
    approved: string;
    proposed: string;
    changedFields: string[];
  };
  controls: SupplierBankChangeControlResult[];
  gatePass: {
    status: "issued" | "not_issued" | "previously_issued" | "presented_consumed";
    gatePassId: string | null;
    exactActionDigest: string | null;
    supplierReference: string | null;
    accountEndingTransition: string | null;
    nonce: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
    oneUse: true;
    permitsMasterDataChangeOnly: true;
    permitsPayment: false;
    permitsSettlement: false;
    permitsBroaderErpAccess: false;
    signedFixtureEvidence: {
      status: "verified" | "not_present";
      algorithm: typeof LOCAL_SIGNED_PROOF_ALGORITHM | null;
      keyId: string | null;
      signature: string | null;
      localFixtureOnly: true;
      productionKeyCustody: false;
    };
  };
  executionEvidence: {
    status: "simulated_receipt_present" | "not_claimed" | "claim_not_proven";
    externalExecutionClaimAccepted: false;
    receiptReference: string | null;
    simulatedOnly: true;
    externalActionPerformed: false;
  };
  identityVerification: "verified" | "unverifiable";
  authorityVerification: "verified" | "refused" | "not_reached";
  businessPolicyEvaluation: "passed" | "refused" | "not_reached";
  gatePassDecision: "issued" | "refused" | "previously_issued";
  externalActionPerformed: false;
  noExternalActionStatement: typeof SUPPLIER_BANK_CHANGE_NO_EXTERNAL_ACTION;
  localOnly: true;
  syntheticOnly: true;
  limitations: string[];
}

const requiredApproverRoles = new Set([
  "supplier_master_data_manager",
  "finance_controls_manager",
]);

export function createSupplierBankChangeActionDigest(
  action: SupplierBankChangeAction,
): string {
  return createHash("sha256")
    .update(`${SUPPLIER_BANK_CHANGE_ACTION_VERSION}\n${canonicalizeJson(action)}`, "utf8")
    .digest("hex");
}

export function evaluateSupplierBankChange(
  scenario: SupplierBankChangeScenario,
): SupplierBankChangeDecision {
  assertSafeScenario(scenario);
  const actionDigest = createSupplierBankChangeActionDigest(scenario.action);
  const approvedActionDigest = createSupplierBankChangeActionDigest(scenario.approvedAction);
  const changedFields = compareActionFields(scenario.approvedAction, scenario.action);
  const controls: SupplierBankChangeControlResult[] = [];

  const refuse = (
    reasonCode: Exclude<SupplierBankChangeReasonCode, "ALL_CONTROLS_PASSED">,
    humanReadableReason: string,
    failedControl: string,
    decisionStage: "gatepass" | "execution_claim" = "gatepass",
  ): SupplierBankChangeDecision => {
    controls.push({ control: failedControl, passed: false, detail: humanReadableReason });
    const previouslyIssued = decisionStage === "execution_claim";
    const presentedConsumed = reasonCode === "GATEPASS_ALREADY_CONSUMED";
    return createDecision({
      scenario,
      actionDigest,
      approvedActionDigest,
      changedFields,
      controls,
      decision: "REFUSED",
      decisionStage,
      reasonCode,
      humanReadableReason,
      failedControl,
      gatePassStatus: previouslyIssued
        ? "previously_issued"
        : presentedConsumed
          ? "presented_consumed"
          : "not_issued",
    });
  };

  if (scenario.action.actionType !== "supplier_bank_detail_change") {
    return refuse(
      "COMMERCIAL_AUTHORITY_CONFUSION",
      "Supplier-master-data approval cannot be treated as authority to make or approve a payment.",
      "gatepass_scope",
    );
  }
  controls.push({ control: "gatepass_scope", passed: true, detail: "The proposed action is a supplier master-data change, not a payment." });

  if (!scenario.agent.identityVerified
    || !scenario.agent.principalVerified
    || !scenario.agent.delegation.evidencePresent
    || scenario.agent.delegation.status === "unknown") {
    return refuse(
      "AGENT_STANDING_UNVERIFIABLE",
      "The agent identity, accountable principal or delegation evidence cannot be sufficiently verified.",
      "agent_standing",
    );
  }
  controls.push({ control: "agent_standing", passed: true, detail: "Agent identity, accountable principal and delegation evidence are verifiable in the local fixture." });

  const referenceTime = Date.parse(scenario.referenceTime);
  const delegation = scenario.agent.delegation;
  const delegationInTime = isAtOrAfter(referenceTime, delegation.validFrom)
    && isBefore(referenceTime, delegation.expiresAt);
  const delegationInScope = delegation.status === "active"
    && delegationInTime
    && delegation.permittedActions.includes("supplier_bank_detail_change")
    && delegation.permittedResources.includes("supplier_payment_master")
    && delegation.supplierCategories.includes(scenario.action.supplierCategory)
    && scenario.action.riskTier <= delegation.maximumRiskTier;
  if (!delegationInScope) {
    return refuse(
      "DELEGATION_OUT_OF_SCOPE",
      "The agent delegation does not permit this supplier bank-detail change, resource, category, risk tier or time window.",
      "delegated_supplier_maintenance_authority",
    );
  }
  controls.push({ control: "delegated_supplier_maintenance_authority", passed: true, detail: "The active delegation covers the exact action class, resource, supplier category and risk tier." });

  if (scenario.action.supplierReference !== scenario.approvedAction.supplierReference
    || scenario.action.supplierName !== scenario.approvedAction.supplierName) {
    return refuse(
      "SUPPLIER_CHANGED",
      "The proposed supplier differs from the supplier bound to the approvals.",
      "exact_supplier_binding",
    );
  }
  controls.push({ control: "exact_supplier_binding", passed: true, detail: "The supplier identity matches the approved canonical action." });

  if (scenario.action.proposedAccountEnding !== scenario.approvedAction.proposedAccountEnding
    || scenario.action.currentAccountEnding !== scenario.approvedAction.currentAccountEnding) {
    return refuse(
      "ACCOUNT_DETAILS_CHANGED",
      "The proposed account-ending change differs from the change bound to the approvals.",
      "exact_account_change_binding",
    );
  }
  controls.push({ control: "exact_account_change_binding", passed: true, detail: "The account-ending transition matches the approved canonical action." });

  if (actionDigest !== approvedActionDigest) {
    return refuse(
      "ACTION_DIGEST_MISMATCH",
      `The proposed action digest differs after approval; changed fields: ${changedFields.join(", ") || "unknown"}.`,
      "exact_action_digest",
    );
  }
  controls.push({ control: "exact_action_digest", passed: true, detail: "The proposed and approved canonical action digests match." });

  if (scenario.humanApprovals.some((approval) =>
    approval.approvedActionDigest !== approvedActionDigest
  )) {
    return refuse(
      "ACTION_DIGEST_MISMATCH",
      "A human approval is not bound to the canonical approved-action digest.",
      "human_approval_digest_binding",
    );
  }
  controls.push({ control: "human_approval_digest_binding", passed: true, detail: "Every human approval binds the same canonical approved-action digest." });

  const verification = scenario.independentVerification;
  const verificationFresh = verification.verifiedAt !== null
    && verification.expiresAt !== null
    && isAtOrAfter(referenceTime, verification.verifiedAt)
    && isBefore(referenceTime, verification.expiresAt);
  if (!verification.evidencePresent
    || verification.evidenceReference === null
    || !verification.independentlyObtained
    || !verification.evidenceTypeApproved
    || !verificationFresh
    || verification.verifierIdentity === null
    || verification.supplierReference !== scenario.approvedAction.supplierReference
    || verification.proposedAccountEnding !== scenario.approvedAction.proposedAccountEnding) {
    return refuse(
      "INDEPENDENT_VERIFICATION_MISSING",
      "Configured evidence does not show that the organisation's independent-verification step was completed; ATG does not determine whether the bank details are correct.",
      "independent_verification",
    );
  }
  controls.push({ control: "independent_verification", passed: true, detail: "Configured evidence shows that the organisation's independent-verification step was completed; ATG does not determine whether the bank details are correct." });

  if (verification.verifierIdentity === verification.requesterIdentity
    || verification.verifierIdentity === scenario.agent.identity) {
    return refuse(
      "SEPARATION_OF_DUTIES_FAILED",
      "The requester cannot independently verify its own supplier-change request.",
      "separation_of_duties",
    );
  }

  const approvalIdentities = scenario.humanApprovals.map((approval) => approval.humanIdentity);
  if (approvalIdentities.some((identity) =>
    identity === scenario.agent.identity || identity === verification.verifierIdentity)
    || new Set(approvalIdentities).size !== approvalIdentities.length) {
    return refuse(
      "SEPARATION_OF_DUTIES_FAILED",
      "Requester, independent verifier and human approvers must be distinct fixture identities.",
      "separation_of_duties",
    );
  }
  controls.push({ control: "separation_of_duties", passed: true, detail: "Requester, verifier and approvers are distinct fixture identities." });

  const revokedApproval = scenario.humanApprovals.find((approval) =>
    approval.authorityRevoked || !approval.active
  );
  if (revokedApproval !== undefined) {
    return refuse(
      "APPROVER_AUTHORITY_REVOKED",
      "Configured evidence shows that a human approver's organisational authority for this exact action was revoked before the decision.",
      "current_human_authority",
    );
  }

  const wrongRole = scenario.humanApprovals.find((approval) =>
    !approval.authenticated
    || !requiredApproverRoles.has(approval.role)
    || !approval.permittedActions.includes("supplier_bank_detail_change")
  );
  if (wrongRole !== undefined) {
    return refuse(
      "APPROVER_ROLE_UNAUTHORISED",
      "Configured evidence does not show that an active human identity has the required organisational role and authority for this exact action.",
      "human_approval_role",
    );
  }
  controls.push({ control: "human_approval_role", passed: true, detail: "Each presented approval has an authenticated fixture identity and an eligible action role." });

  const limitExceeded = scenario.humanApprovals.find((approval) =>
    scenario.action.riskTier > approval.maximumRiskTier
    || !approval.supplierCategories.includes(scenario.action.supplierCategory)
  );
  if (limitExceeded !== undefined) {
    return refuse(
      "AUTHORITY_LIMIT_EXCEEDED",
      "A human approver lacks authority for the configured supplier category or risk tier.",
      "human_authority_limits",
    );
  }
  controls.push({ control: "human_authority_limits", passed: true, detail: "Approver supplier-category and risk-tier limits cover the proposed action." });

  const expiredApproval = scenario.humanApprovals.find((approval) => {
    const approvedAt = Date.parse(approval.approvedAt);
    const expiresAt = Date.parse(approval.expiresAt);
    const ageMinutes = (referenceTime - approvedAt) / 60_000;
    return !Number.isFinite(approvedAt)
      || !Number.isFinite(expiresAt)
      || approvedAt > referenceTime
      || expiresAt <= referenceTime
      || ageMinutes > SUPPLIER_BANK_CHANGE_MAX_APPROVAL_MINUTES
      || (expiresAt - approvedAt) / 60_000 > SUPPLIER_BANK_CHANGE_MAX_APPROVAL_MINUTES;
  });
  if (expiredApproval !== undefined) {
    return refuse(
      "APPROVAL_EXPIRED",
      "An exact-action approval is outside the configured 30-minute freshness window.",
      "approval_freshness",
    );
  }
  controls.push({ control: "approval_freshness", passed: true, detail: "All exact-action approvals are current and valid for no more than 30 minutes." });

  const approvedRoles = new Set(scenario.humanApprovals.map((approval) => approval.role));
  if (scenario.humanApprovals.length < 2
    || [...requiredApproverRoles].some((role) => !approvedRoles.has(role))) {
    return refuse(
      "DUAL_APPROVAL_REQUIRED",
      "Policy requires two distinct authorised humans in the required supplier-master-data and finance-controls roles.",
      "dual_approval",
    );
  }
  controls.push({ control: "dual_approval", passed: true, detail: "Configured evidence of current organisational authority for this exact action is present for two distinct human fixture identities; ATG does not independently establish legal authority." });

  if (scenario.presentedGatePass.state === "consumed") {
    return refuse(
      "GATEPASS_ALREADY_CONSUMED",
      "The one-use GatePass nonce has already been consumed and cannot be replayed.",
      "replay_protection",
    );
  }
  controls.push({ control: "replay_protection", passed: true, detail: "The GatePass nonce is unused in the deterministic local fixture." });

  if (scenario.executionClaim.claimsExternalExecution) {
    return refuse(
      "EXECUTION_RECEIPT_MISSING",
      "The fixture presents a prior GatePass state, but this local demonstrator neither reconstructs that GatePass nor accepts a claim that an external ERP change occurred; no production execution receipt is available.",
      "execution_evidence",
      "execution_claim",
    );
  }

  controls.push({
    control: "execution_evidence",
    passed: true,
    detail: scenario.executionClaim.receiptPresent
      ? "A separate local simulated receipt is present; it does not claim an ERP change."
      : "No execution is claimed and decision evidence remains separate from execution evidence.",
  });
  return createDecision({
    scenario,
    actionDigest,
    approvedActionDigest,
    changedFields,
    controls,
    decision: "GATEPASS_ISSUED",
    decisionStage: "gatepass",
    reasonCode: "ALL_CONTROLS_PASSED",
    humanReadableReason: "All configured local controls pass for this one exact synthetic supplier master-data change.",
    failedControl: null,
    gatePassStatus: "issued",
  });
}

function createDecision(input: {
  scenario: SupplierBankChangeScenario;
  actionDigest: string;
  approvedActionDigest: string;
  changedFields: string[];
  controls: SupplierBankChangeControlResult[];
  decision: "GATEPASS_ISSUED" | "REFUSED";
  decisionStage: "gatepass" | "execution_claim";
  reasonCode: SupplierBankChangeReasonCode;
  humanReadableReason: string;
  failedControl: string | null;
  gatePassStatus: SupplierBankChangeDecision["gatePass"]["status"];
}): SupplierBankChangeDecision {
  const gatePassIssuedNow = input.gatePassStatus === "issued";
  const gatePassId = gatePassIssuedNow
    ? `gatepass_supplier_${digest(`${input.actionDigest}:${input.scenario.presentedGatePass.nonce}`).slice(0, 20)}`
    : null;
  const gatePassExpiresAt = "2026-08-04T10:30:00.000Z";
  const fixtureKey = createDeterministicLocalFixtureKeyPair(
    "atg-supplier-bank-change-local-fixture-key-v1",
  );
  const signedPayload = gatePassIssuedNow ? {
    gatePassId,
    actionDigest: input.actionDigest,
    supplierReference: input.scenario.action.supplierReference,
    accountEndingTransition: `${input.scenario.action.currentAccountEnding}->${input.scenario.action.proposedAccountEnding}`,
    nonce: input.scenario.presentedGatePass.nonce,
    issuedAt: input.scenario.referenceTime,
    expiresAt: gatePassExpiresAt,
    oneUse: true,
    scope: "supplier_payment_master_data_change_only",
    permitsPayment: false,
    permitsSettlement: false,
    externalActionPerformed: false,
  } : null;
  const fixtureSignature = signedPayload === null
    ? null
    : signCanonicalLocalFixturePayload(signedPayload, fixtureKey);
  const fixtureSignatureVerified = signedPayload !== null
    && fixtureSignature !== null
    && verifyCanonicalLocalFixturePayload(
      signedPayload,
      fixtureSignature,
      fixtureKey.publicKeyPem,
    );
  const receiptPresent = input.scenario.executionClaim.receiptPresent
    && input.scenario.executionClaim.receiptSimulated;
  const identityVerified = input.scenario.agent.identityVerified
    && input.scenario.agent.principalVerified
    && input.scenario.agent.delegation.evidencePresent;
  const authorityReached = input.controls.some((control) =>
    ["human_approval_role", "human_authority_limits", "approval_freshness", "dual_approval"].includes(control.control)
  );
  const authorityVerified = input.controls.some((control) =>
    control.control === "dual_approval" && control.passed
  );
  const gatePassControlsPassed = input.decision === "GATEPASS_ISSUED"
    || input.decisionStage === "execution_claim"
    || input.reasonCode === "GATEPASS_ALREADY_CONSUMED";
  return {
    decisionVersion: SUPPLIER_BANK_CHANGE_DECISION_VERSION,
    scenarioId: input.scenario.scenarioId,
    scenarioTitle: input.scenario.title,
    decision: input.decision,
    decisionStage: input.decisionStage,
    reasonCode: input.reasonCode,
    reasonCodes: [input.reasonCode],
    humanReadableReason: input.humanReadableReason,
    failedControl: input.failedControl,
    actionDigest: input.actionDigest,
    approvedActionDigest: input.approvedActionDigest,
    digestComparison: {
      match: input.actionDigest === input.approvedActionDigest,
      approved: input.approvedActionDigest,
      proposed: input.actionDigest,
      changedFields: [...input.changedFields],
    },
    controls: input.controls.map((control) => ({ ...control })),
    gatePass: {
      status: input.gatePassStatus,
      gatePassId,
      exactActionDigest: gatePassIssuedNow ? input.actionDigest : null,
      supplierReference: gatePassIssuedNow ? input.scenario.action.supplierReference : null,
      accountEndingTransition: gatePassIssuedNow
        ? `${input.scenario.action.currentAccountEnding}->${input.scenario.action.proposedAccountEnding}`
        : null,
      nonce: input.gatePassStatus === "not_issued" ? null : input.scenario.presentedGatePass.nonce,
      issuedAt: gatePassIssuedNow ? input.scenario.referenceTime : null,
      expiresAt: gatePassIssuedNow ? gatePassExpiresAt : null,
      oneUse: true,
      permitsMasterDataChangeOnly: true,
      permitsPayment: false,
      permitsSettlement: false,
      permitsBroaderErpAccess: false,
      signedFixtureEvidence: {
        status: fixtureSignatureVerified ? "verified" : "not_present",
        algorithm: gatePassIssuedNow ? LOCAL_SIGNED_PROOF_ALGORITHM : null,
        keyId: gatePassIssuedNow ? fixtureKey.keyId : null,
        signature: fixtureSignature,
        localFixtureOnly: true,
        productionKeyCustody: false,
      },
    },
    executionEvidence: {
      status: receiptPresent
        ? "simulated_receipt_present"
        : input.scenario.executionClaim.claimsExternalExecution
          ? "claim_not_proven"
          : "not_claimed",
      externalExecutionClaimAccepted: false,
      receiptReference: receiptPresent ? input.scenario.executionClaim.receiptReference : null,
      simulatedOnly: true,
      externalActionPerformed: false,
    },
    identityVerification: identityVerified ? "verified" : "unverifiable",
    authorityVerification: authorityVerified
      ? "verified"
      : authorityReached
        ? "refused"
        : "not_reached",
    businessPolicyEvaluation: gatePassControlsPassed
      ? "passed"
      : input.controls.length > 0
        ? "refused"
        : "not_reached",
    gatePassDecision: input.gatePassStatus === "issued"
      ? "issued"
      : input.gatePassStatus === "previously_issued" || input.gatePassStatus === "presented_consumed"
        ? "previously_issued"
        : "refused",
    externalActionPerformed: false,
    noExternalActionStatement: SUPPLIER_BANK_CHANGE_NO_EXTERNAL_ACTION,
    localOnly: true,
    syntheticOnly: true,
    limitations: [
      "No real identity, supplier, bank-account, ERP, payment or customer data is used.",
      "No ERP, bank, payment service, directory or external network is connected.",
      "Fixture cryptography can support integrity and binding, not truth, legality, fraud absence, bank-detail correctness, compliance or general agent safety.",
      "A GatePass decision is not execution evidence.",
    ],
  };
}

function assertSafeScenario(scenario: SupplierBankChangeScenario): void {
  if (scenario.scenarioVersion !== SUPPLIER_BANK_CHANGE_SCENARIO_VERSION
    || scenario.referenceTime !== SUPPLIER_BANK_CHANGE_REFERENCE_TIME
    || !SUPPLIER_BANK_CHANGE_SCENARIO_IDS.includes(scenario.scenarioId)
    || scenario.synthetic !== true
    || scenario.realData !== false
    || scenario.networkAccess !== false
    || scenario.externalActionPerformed !== false) {
    throw new TypeError("Supplier-change input must be a recognised local synthetic no-action scenario.");
  }
  for (const action of [scenario.action, scenario.approvedAction]) {
    if (action.actionVersion !== SUPPLIER_BANK_CHANGE_ACTION_VERSION
      || !/^\d{4}$/.test(action.currentAccountEnding)
      || !/^\d{4}$/.test(action.proposedAccountEnding)
      || !/^SUP-\d{5}$/.test(action.supplierReference)
      || !Number.isInteger(action.riskTier)
      || action.riskTier < 1) {
      throw new TypeError("Supplier-change actions must use the safe canonical fixture shape and four-digit account endings.");
    }
  }
  if (scenario.agent.identity !== scenario.action.requestedBy
    || scenario.agent.accountablePrincipal !== scenario.action.accountablePrincipal
    || scenario.independentVerification.requesterIdentity !== scenario.action.requestedBy) {
    throw new TypeError("Requester and accountable-principal bindings must be internally consistent.");
  }
}

function compareActionFields(
  approved: SupplierBankChangeAction,
  proposed: SupplierBankChangeAction,
): string[] {
  return (Object.keys(approved) as Array<keyof SupplierBankChangeAction>)
    .filter((key) => canonicalizeJson(approved[key]) !== canonicalizeJson(proposed[key]));
}

function isAtOrAfter(referenceTime: number, timestamp: string): boolean {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) && referenceTime >= parsed;
}

function isBefore(referenceTime: number, timestamp: string): boolean {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) && referenceTime < parsed;
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
