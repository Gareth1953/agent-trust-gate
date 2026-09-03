export const HUMAN_TRUST_RECEIPT_VERSION = "atg.human-trust-receipt.local.v1" as const;
export const HUMAN_TRUST_RECEIPT_CLAIM_BOUNDARY =
  "Human-readable presentation of underlying ATG evidence. The receipt is not itself the source of proof and does not certify that an AI system is universally safe or compliant." as const;

export type HumanTrustReceiptStatus =
  | "AUTHORISED"
  | "REFUSED"
  | "COMPLETED_EXACTLY_AS_AUTHORISED"
  | "UNVERIFIED";

export interface HumanTrustReceiptEvidenceInput {
  receiptReference: string;
  issuedAt: string;
  plainLanguageAction: string;
  purpose: string | null;
  amount: number | null;
  currency: string | null;
  counterparty: string | null;
  agentIdentity: string;
  agentStanding: {
    required: boolean;
    outcome: "STANDING_VERIFIED" | "STANDING_REFUSED" | "STANDING_UNVERIFIABLE";
    exactActionDigest: string | null;
  };
  humanAuthority: {
    required: boolean;
    verified: boolean;
    authorisedBy: string | null;
    authoritySummary: string | null;
    exactActionDigest: string | null;
    proofReference: string | null;
  };
  policyDecision: {
    decision: "allowed" | "refused" | "escalated";
    policyChecked: boolean;
    actionDigest: string;
    decisionReceiptReference: string | null;
    reasonCodes: string[];
    gatePassId: string | null;
  };
  gatePass: {
    present: boolean;
    verified: boolean;
    gatePassId: string | null;
    actionDigest: string | null;
  };
  execution: {
    present: boolean;
    resultStatus: string | null;
    verificationVerified: boolean;
    gatePassId: string | null;
    actionDigest: string | null;
    receiptReference: string | null;
  };
}

export interface HumanTrustReceipt {
  receiptVersion: typeof HUMAN_TRUST_RECEIPT_VERSION;
  receiptReference: string;
  status: HumanTrustReceiptStatus;
  plainLanguageAction: string;
  purpose: string | null;
  amount: number | null;
  currency: string | null;
  counterparty: string | null;
  agent: {
    identity: string;
    standingVerified: boolean;
  };
  authority: {
    humanApprovalRequired: boolean;
    verified: boolean;
    authorisedBy: string | null;
    authoritySummary: string | null;
  };
  checks: {
    policyChecked: boolean;
    exactActionVerified: boolean;
    executionMatched: boolean | null;
  };
  refusalReason: string | null;
  evidence: {
    actionDigest: string;
    gatePassId: string | null;
    humanAuthorityProofReference: string | null;
    decisionReceiptReference: string | null;
    executionReceiptReference: string | null;
  };
  issuedAt: string;
  localOnly: true;
  simulatedOnly: true;
  claimBoundary: typeof HUMAN_TRUST_RECEIPT_CLAIM_BOUNDARY;
}

export interface HumanTrustReceiptEvaluation {
  receipt: HumanTrustReceipt;
  chainVerified: boolean;
  verificationFailures: string[];
}

function sameDigest(expected: string, candidate: string | null): boolean {
  return candidate !== null && candidate === expected;
}

function validDigest(value: string): boolean {
  return /^sha256:[a-f0-9]{64}$/i.test(value);
}

function collectVerificationFailures(input: HumanTrustReceiptEvidenceInput): string[] {
  const failures: string[] = [];
  const digest = input.policyDecision.actionDigest;

  if (!validDigest(digest)) failures.push("ACTION_DIGEST_INVALID");
  if (!input.policyDecision.policyChecked) failures.push("POLICY_NOT_CHECKED");
  if (!input.policyDecision.decisionReceiptReference) failures.push("DECISION_RECEIPT_MISSING");

  if (input.agentStanding.required) {
    if (input.agentStanding.outcome !== "STANDING_VERIFIED") failures.push("AGENT_STANDING_NOT_VERIFIED");
    if (!sameDigest(digest, input.agentStanding.exactActionDigest)) failures.push("AGENT_STANDING_ACTION_DIGEST_MISMATCH");
  }

  if (input.humanAuthority.required) {
    if (!input.humanAuthority.verified) failures.push("HUMAN_AUTHORITY_NOT_VERIFIED");
    if (!input.humanAuthority.proofReference) failures.push("HUMAN_AUTHORITY_PROOF_MISSING");
    if (!sameDigest(digest, input.humanAuthority.exactActionDigest)) failures.push("HUMAN_AUTHORITY_ACTION_DIGEST_MISMATCH");
  }

  if (input.policyDecision.decision === "allowed") {
    if (!input.gatePass.present) failures.push("GATEPASS_MISSING");
    if (!input.gatePass.verified) failures.push("GATEPASS_NOT_VERIFIED");
    if (!input.gatePass.gatePassId) failures.push("GATEPASS_ID_MISSING");
    if (input.policyDecision.gatePassId !== input.gatePass.gatePassId) failures.push("GATEPASS_ID_MISMATCH");
    if (!sameDigest(digest, input.gatePass.actionDigest)) failures.push("GATEPASS_ACTION_DIGEST_MISMATCH");
  }

  if (input.execution.present) {
    if (input.policyDecision.decision !== "allowed") failures.push("EXECUTION_WITHOUT_ALLOWED_DECISION");
    if (!input.execution.receiptReference) failures.push("EXECUTION_RECEIPT_MISSING");
    if (!input.execution.verificationVerified) failures.push("EXECUTION_VERIFICATION_NOT_VERIFIED");
    if (input.execution.gatePassId !== input.gatePass.gatePassId) failures.push("EXECUTION_GATEPASS_ID_MISMATCH");
    if (!sameDigest(digest, input.execution.actionDigest)) failures.push("EXECUTION_ACTION_DIGEST_MISMATCH");
  }

  return failures;
}

function determineStatus(input: HumanTrustReceiptEvidenceInput, failures: string[]): HumanTrustReceiptStatus {
  if (failures.length > 0) return "UNVERIFIED";
  if (input.policyDecision.decision === "refused") return "REFUSED";
  if (input.policyDecision.decision !== "allowed") return "UNVERIFIED";
  if (!input.execution.present) return "AUTHORISED";
  if (input.execution.resultStatus === "executed") return "COMPLETED_EXACTLY_AS_AUTHORISED";
  return "UNVERIFIED";
}

export function createHumanTrustReceipt(input: HumanTrustReceiptEvidenceInput): HumanTrustReceiptEvaluation {
  const verificationFailures = collectVerificationFailures(input);
  const status = determineStatus(input, verificationFailures);
  const exactActionVerified = status !== "UNVERIFIED";
  const executionMatched = input.execution.present
    ? status === "COMPLETED_EXACTLY_AS_AUTHORISED"
    : null;

  const receipt: HumanTrustReceipt = {
    receiptVersion: HUMAN_TRUST_RECEIPT_VERSION,
    receiptReference: input.receiptReference,
    status,
    plainLanguageAction: input.plainLanguageAction,
    purpose: input.purpose,
    amount: input.amount,
    currency: input.currency,
    counterparty: input.counterparty,
    agent: {
      identity: input.agentIdentity,
      standingVerified: !input.agentStanding.required || input.agentStanding.outcome === "STANDING_VERIFIED",
    },
    authority: {
      humanApprovalRequired: input.humanAuthority.required,
      verified: !input.humanAuthority.required || input.humanAuthority.verified,
      authorisedBy: input.humanAuthority.authorisedBy,
      authoritySummary: input.humanAuthority.authoritySummary,
    },
    checks: {
      policyChecked: input.policyDecision.policyChecked,
      exactActionVerified,
      executionMatched,
    },
    refusalReason: status === "REFUSED"
      ? (input.policyDecision.reasonCodes[0] ?? "Action refused by policy")
      : status === "UNVERIFIED"
        ? (verificationFailures[0] ?? "Underlying evidence could not be verified")
        : null,
    evidence: {
      actionDigest: input.policyDecision.actionDigest,
      gatePassId: input.gatePass.gatePassId,
      humanAuthorityProofReference: input.humanAuthority.proofReference,
      decisionReceiptReference: input.policyDecision.decisionReceiptReference,
      executionReceiptReference: input.execution.receiptReference,
    },
    issuedAt: input.issuedAt,
    localOnly: true,
    simulatedOnly: true,
    claimBoundary: HUMAN_TRUST_RECEIPT_CLAIM_BOUNDARY,
  };

  return {
    receipt,
    chainVerified: status !== "UNVERIFIED",
    verificationFailures,
  };
}

function displayAmount(receipt: HumanTrustReceipt): string | null {
  if (receipt.amount === null || receipt.currency === null) return null;
  return `${receipt.currency} ${receipt.amount.toFixed(2)}`;
}

export function renderHumanTrustReceiptText(receipt: HumanTrustReceipt): string {
  const lines = [
    "AGENT TRUST GATE™ — HUMAN TRUST RECEIPT",
    `Status: ${receipt.status}`,
    `Action: ${receipt.plainLanguageAction}`,
  ];
  const amount = displayAmount(receipt);
  if (amount) lines.push(`Amount: ${amount}`);
  if (receipt.purpose) lines.push(`Purpose: ${receipt.purpose}`);
  if (receipt.counterparty) lines.push(`Counterparty: ${receipt.counterparty}`);
  lines.push(`AI agent: ${receipt.agent.identity}`);
  lines.push(`Agent standing verified: ${receipt.agent.standingVerified ? "YES" : "NO"}`);
  lines.push(`Human approval required: ${receipt.authority.humanApprovalRequired ? "YES" : "NO"}`);
  if (receipt.authority.authorisedBy) lines.push(`Authorised by: ${receipt.authority.authorisedBy}`);
  if (receipt.authority.authoritySummary) lines.push(`Authority: ${receipt.authority.authoritySummary}`);
  lines.push(`Authority verified: ${receipt.authority.verified ? "YES" : "NO"}`);
  lines.push(`Policy checked: ${receipt.checks.policyChecked ? "YES" : "NO"}`);
  lines.push(`Exact action verified: ${receipt.checks.exactActionVerified ? "YES" : "NO"}`);
  if (receipt.checks.executionMatched !== null) {
    lines.push(`Execution matched authority: ${receipt.checks.executionMatched ? "YES" : "NO"}`);
  }
  if (receipt.refusalReason) lines.push(`Reason: ${receipt.refusalReason}`);
  lines.push(`Trust reference: ${receipt.receiptReference}`);
  lines.push(`Issued: ${receipt.issuedAt}`);
  lines.push("This is a local synthetic demonstration. The underlying machine-verifiable evidence remains the source of proof.");
  return lines.join("\n");
}
