import {
  createHumanTrustReceipt,
  renderHumanTrustReceiptText,
  type HumanTrustReceiptEvidenceInput,
} from "./human-trust-receipt.js";

const ACTION_DIGEST = `sha256:${"a".repeat(64)}`;
const CHANGED_DIGEST = `sha256:${"b".repeat(64)}`;
const FIXED_TIME = "2026-08-12T06:30:00.000Z";

export type HumanTrustReceiptScenarioId =
  | "authorised_refund"
  | "completed_refund"
  | "refused_missing_evidence"
  | "tampered_execution_digest";

function baseInput(): HumanTrustReceiptEvidenceInput {
  return {
    receiptReference: "ATG-HR-REFUND-77291",
    issuedAt: FIXED_TIME,
    plainLanguageAction: "Refund £475.00 to the original payment method",
    purpose: "Returned defective item",
    amount: 475,
    currency: "GBP",
    counterparty: "Customer order ending 7291",
    agentIdentity: "AGENT-RETURNS-17",
    agentStanding: {
      required: true,
      outcome: "STANDING_VERIFIED",
      exactActionDigest: ACTION_DIGEST,
    },
    humanAuthority: {
      required: true,
      verified: true,
      authorisedBy: "Sarah Collins — Senior Returns Supervisor",
      authoritySummary: "Verified refund authority up to GBP 1,000",
      exactActionDigest: ACTION_DIGEST,
      proofReference: "HAP-REFUND-77291",
    },
    policyDecision: {
      decision: "allowed",
      policyChecked: true,
      actionDigest: ACTION_DIGEST,
      decisionReceiptReference: "PDR-REFUND-77291",
      reasonCodes: [],
      gatePassId: "GP-REFUND-77291",
    },
    gatePass: {
      present: true,
      verified: true,
      gatePassId: "GP-REFUND-77291",
      actionDigest: ACTION_DIGEST,
    },
    execution: {
      present: false,
      resultStatus: null,
      verificationVerified: false,
      gatePassId: null,
      actionDigest: null,
      receiptReference: null,
    },
  };
}

export function createHumanTrustReceiptScenarios(): Record<HumanTrustReceiptScenarioId, HumanTrustReceiptEvidenceInput> {
  const authorised = baseInput();
  const completed = structuredClone(authorised);
  completed.receiptReference = "ATG-HR-COMPLETED-77291";
  completed.execution = {
    present: true,
    resultStatus: "executed",
    verificationVerified: true,
    gatePassId: completed.gatePass.gatePassId,
    actionDigest: ACTION_DIGEST,
    receiptReference: "EXEC-REFUND-77291",
  };

  const refused = structuredClone(authorised);
  refused.receiptReference = "ATG-HR-REFUSED-77291";
  refused.policyDecision = {
    decision: "refused",
    policyChecked: true,
    actionDigest: ACTION_DIGEST,
    decisionReceiptReference: "PDR-REFUSED-77291",
    reasonCodes: ["REQUIRED_RETURN_EVIDENCE_MISSING"],
    gatePassId: null,
  };
  refused.gatePass = {
    present: false,
    verified: false,
    gatePassId: null,
    actionDigest: null,
  };

  const tampered = structuredClone(completed);
  tampered.receiptReference = "ATG-HR-UNVERIFIED-77291";
  tampered.execution.actionDigest = CHANGED_DIGEST;

  return {
    authorised_refund: authorised,
    completed_refund: completed,
    refused_missing_evidence: refused,
    tampered_execution_digest: tampered,
  };
}

export function runHumanTrustReceiptScenario(scenarioId: HumanTrustReceiptScenarioId) {
  return createHumanTrustReceipt(createHumanTrustReceiptScenarios()[scenarioId]);
}

export function runHumanTrustReceiptDemo() {
  const scenarios = createHumanTrustReceiptScenarios();
  const results = Object.entries(scenarios).map(([scenarioId, input]) => ({
    scenarioId: scenarioId as HumanTrustReceiptScenarioId,
    ...createHumanTrustReceipt(input),
  }));
  return {
    demoVersion: "P3-M156-v1",
    localOnly: true as const,
    simulatedOnly: true as const,
    results,
    summary: {
      scenarioCount: results.length,
      authorised: results.filter((item) => item.receipt.status === "AUTHORISED").length,
      completed: results.filter((item) => item.receipt.status === "COMPLETED_EXACTLY_AS_AUTHORISED").length,
      refused: results.filter((item) => item.receipt.status === "REFUSED").length,
      unverified: results.filter((item) => item.receipt.status === "UNVERIFIED").length,
      externalActionsPerformed: false as const,
    },
  };
}

export function runHumanTrustReceiptCli(args = process.argv.slice(2)): number {
  const scenarioIndex = args.indexOf("--scenario");
  const scenario = scenarioIndex >= 0 ? args[scenarioIndex + 1] : undefined;
  const json = args.includes("--json");
  const summaryOnly = args.includes("--summary-only");

  if (scenario !== undefined) {
    if (!(scenario in createHumanTrustReceiptScenarios())) {
      console.error(`Unknown scenario: ${scenario}`);
      return 2;
    }
    const evaluation = runHumanTrustReceiptScenario(scenario as HumanTrustReceiptScenarioId);
    console.log(json ? JSON.stringify(evaluation, null, 2) : renderHumanTrustReceiptText(evaluation.receipt));
    return 0;
  }

  const report = runHumanTrustReceiptDemo();
  if (json) {
    console.log(JSON.stringify(summaryOnly ? report.summary : report, null, 2));
    return 0;
  }
  if (summaryOnly) {
    console.log(`P3-M156 Human Trust Receipt: ${report.summary.scenarioCount} deterministic local scenarios`);
    console.log(`AUTHORISED=${report.summary.authorised} COMPLETED=${report.summary.completed} REFUSED=${report.summary.refused} UNVERIFIED=${report.summary.unverified}`);
    console.log("External actions performed: NO");
    return 0;
  }

  for (const result of report.results) {
    console.log(`\n=== ${result.scenarioId} ===`);
    console.log(renderHumanTrustReceiptText(result.receipt));
    if (result.verificationFailures.length > 0) {
      console.log(`Verification failures: ${result.verificationFailures.join(", ")}`);
    }
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runHumanTrustReceiptCli();
}
