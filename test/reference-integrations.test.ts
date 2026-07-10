import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  REFERENCE_INTEGRATION_EXAMPLE_FILES,
  REFERENCE_INTEGRATIONS_PUBLIC_CONTACT,
  REFERENCE_INTEGRATIONS_RULE,
  runAgentToAgentHandoffGateReference,
  runGenericAgentLoopReference,
  runGovernanceReviewerFlowReference,
  runHumanInTheLoopEscalationReference,
  runPreSettlementMoneyGateReference,
  runReferenceIntegrationExamples,
  runReferenceIntegrationPatternResults,
  runToolCallingGuardrailReference,
  runTrustGateWrapperReference,
  summariseReferenceIntegrationExamples,
  type ReferenceIntegrationPack,
  type ReferenceIntegrationPatternId,
  type ReferenceIntegrationResult,
  type ReferenceIntegrationSafetyFlags,
} from "../src/reference-integrations/index.js";
import { runReferenceIntegrationsCli } from "../src/reference-integrations-cli.js";

function assertSafe(value: ReferenceIntegrationSafetyFlags): void {
  assert.equal(value.localDemoOnly, true);
  assert.equal(value.localOnly, true);
  assert.equal(value.productionSigning, false);
  assert.equal(value.paymentAuthorisation, false);
  assert.equal(value.settlementAuthorisation, false);
  assert.equal(value.privateDataIncluded, false);
  assert.equal(value.networkCallPerformed, false);
  assert.equal(value.cloudCallPerformed, false);
  assert.equal(value.externalFrameworkCalled, false);
  assert.equal(value.externalAgentContacted, false);
  assert.equal(value.paymentTriggered, false);
  assert.equal(value.settlementExecuted, false);
  assert.equal(value.actionExecuted, false);
  assert.equal(value.sensitiveActionExecuted, false);
  assert.equal(value.officialFrameworkIntegration, false);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

test("reference integration pack covers all required local patterns", () => {
  const pack = runReferenceIntegrationExamples();
  assert.equal(pack.patternCount, 7);
  assert.equal(pack.allowedCount, 2);
  assert.equal(pack.blockedCount, 3);
  assert.equal(pack.escalatedCount, 2);
  assert.equal(pack.rule, REFERENCE_INTEGRATIONS_RULE);
  assert.equal(pack.publicContactEmail, REFERENCE_INTEGRATIONS_PUBLIC_CONTACT);
  assert.deepEqual(pack.patternIds, [
    "generic_agent_loop",
    "tool_calling_guardrail",
    "human_in_the_loop_escalation",
    "pre_settlement_money_gate",
    "governance_reviewer_flow",
    "agent_to_agent_handoff_gate",
    "trust_gate_wrapper",
  ]);
  assertSafe(pack);
  for (const pattern of pack.patterns) assertSafe(pattern);
});

test("generic agent-loop pre-action gate produces local allow result", () => {
  const result = runGenericAgentLoopReference();
  assert.equal(result.patternId, "generic_agent_loop");
  assert.equal(result.result, "allow");
  assert.equal(result.allowedLocally, true);
  assert.equal(result.receipt.verdict, "allow_signed_gate_pass");
  assert.equal(result.signedProof?.verified, true);
  assert.equal(result.actionExecuted, false);
  assertSafe(result);
});

test("tool-calling guardrail blocks sensitive tool use when mandate is missing", () => {
  const result = runToolCallingGuardrailReference();
  assert.equal(result.patternId, "tool_calling_guardrail");
  assert.equal(result.result, "block");
  assert.equal(result.blocked, true);
  assert.equal(result.receipt.verdict, "refuse_no_mandate");
  assert.ok(result.reasonCodes.includes("MANDATE_REQUIRED"));
  assert.equal(result.sensitiveActionExecuted, false);
  assertSafe(result);
});

test("human-in-the-loop escalation produces escalation without executing action", () => {
  const result = runHumanInTheLoopEscalationReference();
  assert.equal(result.patternId, "human_in_the_loop_escalation");
  assert.equal(result.result, "escalate");
  assert.equal(result.escalated, true);
  assert.equal(result.receipt.verdict, "review_required");
  assert.ok(result.reasonCodes.includes("HUMAN_REVIEW_REQUIRED"));
  assert.equal(result.actionExecuted, false);
  assertSafe(result);
});

test("pre-settlement money-gate blocks simulated settlement without valid gate proof", () => {
  const result = runPreSettlementMoneyGateReference();
  assert.equal(result.patternId, "pre_settlement_money_gate");
  assert.equal(result.result, "block");
  assert.equal(result.receipt.verdict, "refuse_no_mandate");
  assert.equal(result.settlementBlocker?.blocked, true);
  assert.equal(result.settlementBlocker?.settlementSimulation, "blocked");
  assert.equal(result.settlementBlocker?.settlementExecuted, false);
  assert.equal(result.moneyGateProof?.proofPassed, false);
  assert.equal(result.moneyGateProof?.settlementExecuted, false);
  assertSafe(result);
});

test("governance reviewer flow produces auditable local receipt review summary", () => {
  const result = runGovernanceReviewerFlowReference();
  assert.equal(result.patternId, "governance_reviewer_flow");
  assert.equal(result.result, "escalate");
  assert.equal(result.receipt.receiptType, "review_receipt");
  assert.equal(result.reviewerSummary?.reviewQueue, "local_governance_review");
  assert.equal(result.reviewerSummary?.auditableReceipt, true);
  assertSafe(result);
});

test("agent-to-agent handoff gate remains local-only and contacts no external agent", () => {
  const result = runAgentToAgentHandoffGateReference();
  assert.equal(result.patternId, "agent_to_agent_handoff_gate");
  assert.equal(result.result, "block");
  assert.equal(result.handoffSummary?.externalAgentContacted, false);
  assert.equal(result.handoffSummary?.handoffAllowed, false);
  assert.equal(result.externalAgentContacted, false);
  assert.ok(result.reasonCodes.includes("VERIFIED_INTENT_REQUIRED"));
  assertSafe(result);
});

test("trustGate.evaluate-style wrapper returns deterministic result", () => {
  const first = runTrustGateWrapperReference();
  const second = runTrustGateWrapperReference();
  assert.deepEqual(first, second);
  assert.equal(first.patternId, "trust_gate_wrapper");
  assert.equal(first.result, "allow");
  assert.equal(first.wrapperSummary?.apiShape, "trustGate.evaluate(request)");
  assert.equal(first.signedProof?.verified, true);
  assertSafe(first);
});

test("reference integration CLI emits summary and selected pattern JSON", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const summaryCode = runReferenceIntegrationsCli(
    ["--summary-only"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
  );
  assert.equal(summaryCode, 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as ReturnType<typeof summariseReferenceIntegrationExamples>;
  assert.equal(summary.patternCount, 7);
  assert.equal("patterns" in summary, false);
  assertSafe(summary);

  stdout.length = 0;
  const patternCode = runReferenceIntegrationsCli(
    ["--pattern", "pre_settlement_money_gate"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
  );
  assert.equal(patternCode, 0);
  const selected = JSON.parse(stdout[0] ?? "{}") as ReferenceIntegrationResult;
  assert.equal(selected.patternId, "pre_settlement_money_gate");
  assert.equal(selected.result, "block");
});

test("compiled runner works locally and package script is registered", () => {
  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/reference-integrations-cli.js"),
    "--summary-only",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0);
  assert.equal((JSON.parse(compiled.stdout) as ReferenceIntegrationPack).patternCount, 7);

  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  const script = packageJson.scripts["demo:integrations"];
  assert.ok(script !== undefined);
  assert.match(script, /reference-integrations-cli\.js --pretty/);
});

test("reference example JSON files match deterministic outputs", () => {
  const patterns = new Map<ReferenceIntegrationPatternId, ReferenceIntegrationResult>(
    runReferenceIntegrationPatternResults().map((pattern) => [pattern.patternId, pattern]),
  );
  for (const [patternId, path] of Object.entries(REFERENCE_INTEGRATION_EXAMPLE_FILES)) {
    assert.equal(existsSync(path), true, path);
    assert.deepEqual(
      readJson<ReferenceIntegrationResult>(path),
      patterns.get(patternId as ReferenceIntegrationPatternId),
      path,
    );
  }
});

test("reference integration docs README link contact and core safety line are present", () => {
  const paths = [
    "docs/reference-integration-examples.md",
    "README.md",
    "docs/simplified-developer-cli.md",
    "docs/adversarial-evaluation-pack.md",
    "docs/local-signed-receipt-and-proof-prototype.md",
    "docs/schema-formalisation-and-evidence-model.md",
    "docs/external-reviewer-signal-and-hardening-roadmap.md",
    "docs/p3-mission-register.md",
    "docs/public-launch-record.md",
    "PUBLIC_LAUNCH_CHECKLIST.md",
    "RELEASE_NOTES.md",
    "CHANGELOG.md",
  ];
  for (const path of paths) {
    assert.equal(existsSync(path), true, path);
    const source = readFileSync(path, "utf8");
    assert.match(source, /P3-M120/);
    assert.match(source, /No mandate\. No evidence\. No verified intent\. No signed gate pass\. No settlement\./);
  }
  assert.match(readFileSync("README.md", "utf8"), /docs\/reference-integration-examples\.md/);
  const doc = readFileSync("docs/reference-integration-examples.md", "utf8");
  assert.match(doc, /gpmiddleton71@gmail\.com/);
  assert.match(doc, /not official LangGraph\/CrewAI\/AutoGen integrations/i);
});

test("old public email is absent from tracked files", () => {
  const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
  const tracked = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  assert.equal(tracked.status, 0);
  for (const path of tracked.stdout.split(/\r?\n/).filter(Boolean)) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(oldEmail.replace(".", "\\.")), path);
  }
});

test("reference integration artifacts contain no active live-action or payment material", () => {
  const paths = [
    "src/reference-integrations/shared.ts",
    "src/reference-integrations-cli.ts",
    "docs/reference-integration-examples.md",
    ...Object.values(REFERENCE_INTEGRATION_EXAMPLE_FILES),
  ];
  const forbidden = /https?:\/\/|paypal\.com|api\.stripe|stripe\.checkout|webhook_url|wallet_address|bank_account_number|routing_number|api[_-]?key|access[_-]?token|fetch\s*\(|productionSigning": true|paymentAuthorisation": true|settlementAuthorisation": true/i;
  for (const path of paths) {
    assert.doesNotMatch(readFileSync(path, "utf8"), forbidden, path);
  }
});
