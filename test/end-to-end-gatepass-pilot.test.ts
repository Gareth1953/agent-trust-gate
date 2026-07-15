import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  END_TO_END_GATEPASS_PILOT_EXAMPLE_FILES,
  createEndToEndGatePassPilotScenarioInputs,
  runEndToEndGatePassPilot,
  runEndToEndGatePassPilotScenario,
  summariseEndToEndGatePassPilot,
  validateGatePassPilotSettlement,
  type EndToEndGatePassPilotReport,
  type EndToEndGatePassPilotScenarioResult,
} from "../src/end-to-end-gatepass-pilot.js";
import {
  runEndToEndGatePassPilotCli,
  type EndToEndGatePassPilotCliOutput,
} from "../src/end-to-end-gatepass-pilot-cli.js";
import { LocalGatePassReplayStore } from "../src/local-gate-pass-protection.js";

function assertLocalSafety(value: {
  localOnly: boolean;
  simulatedSettlementOnly: boolean;
  networkCallPerformed: boolean;
  livePaymentProcessed: boolean;
  realSettlementExecuted: boolean;
  actionExecuted: boolean;
}): void {
  assert.equal(value.localOnly, true);
  assert.equal(value.simulatedSettlementOnly, true);
  assert.equal(value.networkCallPerformed, false);
  assert.equal(value.livePaymentProcessed, false);
  assert.equal(value.realSettlementExecuted, false);
  assert.equal(value.actionExecuted, false);
}

test("valid pilot action creates a local-demo signed GatePass", () => {
  const scenario = runEndToEndGatePassPilotScenario("permitted_action");
  assertLocalSafety(scenario);
  assert.equal(scenario.decision, "allow");
  assert.equal(scenario.gatePassReceipt.receipt_type, "signed_gate_pass");
  assert.ok(scenario.gatePassIdentifier?.startsWith("receipt_demo_"));
  assert.ok(scenario.signedGatePass);
  assert.equal(scenario.signedGatePass.signatureMetadata.localDemoOnly, true);
  assert.equal(scenario.signedGatePass.signatureMetadata.productionSigning, false);
  assert.equal(scenario.scopeResult, "passed");
  assert.equal(scenario.spendCapResult, "passed");
  assert.equal(scenario.evidenceResult, "passed");
  assert.equal(scenario.approvalResult, "passed");
});

test("valid GatePass permits only local simulated settlement", () => {
  const scenario = runEndToEndGatePassPilotScenario("permitted_action");
  assert.equal(scenario.settlement.result, "permitted_to_proceed");
  assert.equal(scenario.settlement.permitted, true);
  assert.deepEqual(scenario.settlement.blockingReasons, []);
  assert.equal(scenario.settlement.receiptVerification.valid_for_simulated_settlement, true);
  assert.equal(scenario.settlement.signatureVerification.verified, true);
  assert.equal(scenario.settlement.settlementBlocker.settlement_simulation, "allowed");
  assertLocalSafety(scenario.settlement);
});

test("refused pilot action creates a refusal receipt with blocking reasons", () => {
  const scenario = runEndToEndGatePassPilotScenario("refused_action");
  assertLocalSafety(scenario);
  assert.equal(scenario.decision, "refuse");
  assert.equal(scenario.gatePassReceipt.receipt_type, "refusal_receipt");
  assert.equal(scenario.gatePassIdentifier, null);
  assert.equal(scenario.signedGatePass, null);
  assert.equal(scenario.spendCapResult, "failed");
  assert.ok(scenario.refusalReasons.includes("LIMIT_EXCEEDED"));
  assert.ok(scenario.checks.some((check) => check.id === "spend_limit" && !check.passed));
});

test("refused action cannot reach simulated settlement", () => {
  const scenario = runEndToEndGatePassPilotScenario("refused_action");
  assert.equal(scenario.settlement.result, "blocked");
  assert.equal(scenario.settlement.permitted, false);
  assert.ok(scenario.settlement.blockingReasons.includes("requested_value_exceeds_authorised_limit"));
  assert.ok(scenario.settlement.blockingReasons.includes("receipt_refusal_receipt_not_settlement_eligible"));
  assert.ok(scenario.settlement.blockingReasons.includes("signature_missing_signed_proof"));
  assert.equal(scenario.settlement.settlementBlocker.settlement_simulation, "blocked");
});

test("missing GatePass blocks simulated settlement", () => {
  const action = createEndToEndGatePassPilotScenarioInputs().permitted_action;
  const decision = validateGatePassPilotSettlement({
    pilotIdentifier: "test_missing_gatepass",
    action,
    evaluatedAt: action.checked_at ?? "2026-07-15T09:00:00.000Z",
    replayStore: new LocalGatePassReplayStore(),
  });
  assert.equal(decision.permitted, false);
  assert.equal(decision.result, "blocked");
  assert.ok(decision.blockingReasons.includes("missing_gatepass_receipt"));
  assert.ok(decision.blockingReasons.includes("signature_missing_signed_proof"));
});

test("expired or mismatched GatePass blocks simulated settlement", () => {
  const scenario = runEndToEndGatePassPilotScenario("permitted_action");
  assert.ok(scenario.signedGatePass);
  assert.ok(scenario.gatePassExpiryTime);

  const expired = validateGatePassPilotSettlement({
    pilotIdentifier: "test_expired_gatepass",
    action: scenario.proposedAction,
    receipt: scenario.gatePassReceipt,
    signedGatePass: scenario.signedGatePass,
    evaluatedAt: scenario.gatePassExpiryTime,
    replayStore: new LocalGatePassReplayStore(),
  });
  assert.equal(expired.permitted, false);
  assert.ok(expired.blockingReasons.includes("receipt_expired_receipt"));
  assert.ok(expired.blockingReasons.includes("settlement_gate_pass_expired"));

  const mismatched = validateGatePassPilotSettlement({
    pilotIdentifier: "test_mismatched_gatepass",
    action: {
      ...scenario.proposedAction,
      requested_action: "authorise_unrelated_action",
    },
    receipt: scenario.gatePassReceipt,
    signedGatePass: scenario.signedGatePass,
    evaluatedAt: scenario.proposedAction.checked_at ?? "2026-07-15T09:00:00.000Z",
    replayStore: new LocalGatePassReplayStore(),
  });
  assert.equal(mismatched.permitted, false);
  assert.ok(mismatched.blockingReasons.includes("receipt_requested_action_mismatch"));
  assert.ok(mismatched.blockingReasons.includes("action_scope_mismatch"));
});

test("pilot report exposes complete audit evidence and summaries", () => {
  const report = runEndToEndGatePassPilot();
  assertLocalSafety(report);
  assert.equal(report.scenarioCount, 2);
  assert.equal(report.permittedCount, 1);
  assert.equal(report.refusedCount, 1);
  assert.equal(report.simulatedSettlementPermittedCount, 1);
  assert.equal(report.simulatedSettlementBlockedCount, 1);
  assert.match(report.auditEvidenceReferences.report, /end-to-end-gatepass-pilot-report\.json$/);
  assert.match(report.auditEvidenceReferences.permittedAction.signedGatePass ?? "", /signed-gatepass\.json$/);
  assert.equal(report.auditEvidenceReferences.refusedAction.signedGatePass, null);
  const summary = summariseEndToEndGatePassPilot(report);
  assert.equal("scenarios" in summary, false);
});

test("pilot examples are deterministic and align with generated output", () => {
  const inputs = createEndToEndGatePassPilotScenarioInputs();
  assert.deepEqual(
    JSON.parse(readFileSync(END_TO_END_GATEPASS_PILOT_EXAMPLE_FILES.permittedAction, "utf8")),
    inputs.permitted_action,
  );
  assert.deepEqual(
    JSON.parse(readFileSync(END_TO_END_GATEPASS_PILOT_EXAMPLE_FILES.refusedAction, "utf8")),
    inputs.refused_action,
  );
  const exampleReport = JSON.parse(
    readFileSync(END_TO_END_GATEPASS_PILOT_EXAMPLE_FILES.report, "utf8"),
  ) as EndToEndGatePassPilotReport;
  assert.deepEqual(exampleReport, runEndToEndGatePassPilot());
});

test("CLI emits reviewer output, JSON-only output, and saved local evidence files", () => {
  const outputDirectory = mkdtempSync(join(tmpdir(), "atg-gatepass-pilot-"));
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runEndToEndGatePassPilotCli(
    ["--scenario", "permitted", "--output-dir", outputDirectory],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
  );
  assert.equal(code, 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /End-to-end GatePass pilot/);
  assert.match(stdout[0] ?? "", /simulated settlement: permitted_to_proceed/);
  assert.equal(existsSync(join(outputDirectory, "permitted-action-signed-gatepass.json")), true);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/end-to-end-gatepass-pilot-cli.js"),
    "--json",
    "--output-dir",
    mkdtempSync(join(tmpdir(), "atg-gatepass-pilot-json-")),
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as EndToEndGatePassPilotCliOutput;
  assert.equal(parsed.selectedScenario, "all");
  assert.equal(parsed.report.simulatedSettlementPermittedCount, 1);
  assert.ok(parsed.savedEvidence.files.length >= 6);
});

test("pilot fixtures and docs avoid live execution material", () => {
  for (const path of [
    "docs/end-to-end-gatepass-pilot.md",
    "docs/commercial-feasibility-pilot.md",
    "docs/pilot-inputs-outputs-boundaries.md",
    "docs/pilot-conversion-path.md",
  ]) {
    assert.equal(existsSync(path), true, path);
  }
  for (const path of [
    END_TO_END_GATEPASS_PILOT_EXAMPLE_FILES.permittedAction,
    END_TO_END_GATEPASS_PILOT_EXAMPLE_FILES.refusedAction,
    END_TO_END_GATEPASS_PILOT_EXAMPLE_FILES.report,
  ]) {
    assert.equal(existsSync(path), true, path);
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /https?:\/\/|api[_-]?key|access[_-]?token|password|card_number|payment_token|wallet|blockchain|cryptocurrency/i);
  }
  const report = runEndToEndGatePassPilot();
  for (const scenario of Object.values(report.scenarios) as EndToEndGatePassPilotScenarioResult[]) {
    assertLocalSafety(scenario);
    assert.equal(scenario.productionCredentialUsed, false);
    assert.equal(scenario.customerDataIncluded, false);
    assert.equal(scenario.mcpProxyCreated, false);
    assert.equal(scenario.ssoIntegrated, false);
  }
});
