import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { runExactActionGatePassDemo } from "../src/exact-action-gatepass.js";
import { runGatePassToolWrapperDemo } from "../src/gatepass-tool-wrapper.js";
import {
  renderReviewerConversionReport,
  runReviewerConversionCli,
  runReviewerConversionDemo,
  type ReviewerConversionCliIo,
} from "../src/reviewer-conversion-cli.js";

function captureIo(): {
  io: ReviewerConversionCliIo;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout,
    stderr,
    io: {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    },
  };
}

test("reviewer sequence classifies every expected allow and refusal from actual demo results", async () => {
  const report = await runReviewerConversionDemo();
  assert.equal(report.scenarios.length, 8);
  assert.deepEqual(
    report.scenarios.map(({ scenarioId, expected, observed, matched }) => ({
      scenarioId,
      expected,
      observed,
      matched,
    })),
    [
      { scenarioId: "valid_exact_action_accepted", expected: "allow", observed: "allow", matched: true },
      { scenarioId: "materially_changed_action_refused", expected: "refuse", observed: "refuse", matched: true },
      { scenarioId: "consumed_gatepass_replay_refused", expected: "refuse", observed: "refuse", matched: true },
      { scenarioId: "expired_gatepass_refused", expected: "refuse", observed: "refuse", matched: true },
      { scenarioId: "missing_mandate_refused", expected: "refuse", observed: "refuse", matched: true },
      { scenarioId: "missing_evidence_refused", expected: "refuse", observed: "refuse", matched: true },
      { scenarioId: "missing_approval_refused", expected: "refuse", observed: "refuse", matched: true },
      { scenarioId: "settlement_without_current_authority_refused", expected: "refuse", observed: "refuse", matched: true },
    ],
  );
  assert.equal(report.scorecard.overallPassed, true);
});

test("reviewer CLI exits non-zero when an expected refusal becomes an unexpected allow", async () => {
  const brokenExactAction = structuredClone(await runExactActionGatePassDemo());
  const changed = brokenExactAction.scenarios.changed_amount_refused;
  assert.notEqual(changed.executionReceipt, null);
  changed.lifecycleState = "executed";
  if (changed.executionReceipt !== null) {
    changed.executionReceipt.resultStatus = "executed";
    changed.executionReceipt.verification.verified = true;
  }
  const captured = captureIo();
  const code = await runReviewerConversionCli([], captured.io, {
    runExactActionDemo: async () => brokenExactAction,
    runWrapperDemo: runGatePassToolWrapperDemo,
  });
  assert.equal(code, 1);
  assert.equal(captured.stderr.length, 0);
  assert.match(captured.stdout[0] ?? "", /\[FAIL\] A changed amount is refused/);
  assert.match(captured.stdout[0] ?? "", /Expected refusals: FAILED/);
  assert.match(captured.stdout[0] ?? "", /Overall: REVIEWER DEMONSTRATION FAILED/);
});

test("reviewer report and rendered output are deterministic", async () => {
  const first = await runReviewerConversionDemo();
  const second = await runReviewerConversionDemo();
  assert.deepEqual(second, first);
  assert.equal(renderReviewerConversionReport(second), renderReviewerConversionReport(first));

  const cli = resolve("dist/src/reviewer-conversion-cli.js");
  const firstProcess = spawnSync(process.execPath, [cli], { encoding: "utf8" });
  const secondProcess = spawnSync(process.execPath, [cli], { encoding: "utf8" });
  assert.equal(firstProcess.status, 0, firstProcess.stderr);
  assert.equal(secondProcess.status, 0, secondProcess.stderr);
  assert.equal(secondProcess.stdout, firstProcess.stdout);
});

test("reviewer sequence records simulated local execution but no external action", async () => {
  const report = await runReviewerConversionDemo();
  assert.equal(report.localOnly, true);
  assert.equal(report.simulatedExecutionOnly, true);
  assert.equal(report.externalActionOccurred, false);
  assert.equal(report.networkCalls, false);
  assert.equal(report.realPayments, false);
  assert.equal(report.realSettlement, false);
  assert.equal(report.uncontrolledGeneratedFiles, false);
  assert.equal(report.scorecard.externalActionsPerformed, "none");
  assert.match(renderReviewerConversionReport(report), /External actions performed: none/);
});

test("package exposes the exact reviewer command with a silent build", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    version: string;
    scripts: Record<string, string>;
  };
  assert.equal(packageJson.version, "0.1.0");
  assert.equal(
    packageJson.scripts.reviewer,
    "npm run build --silent && node dist/src/reviewer-conversion-cli.js",
  );
});
