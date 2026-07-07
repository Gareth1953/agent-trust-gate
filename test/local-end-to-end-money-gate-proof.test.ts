import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  runLocalEndToEndMoneyGateProof,
  summariseLocalEndToEndMoneyGateProof,
  type LocalEndToEndMoneyGateProofResult,
  type LocalMoneyGateProofScenarioType,
} from "../src/local-end-to-end-money-gate-proof.js";
import {
  readLocalEndToEndMoneyGateProofInput,
  runLocalEndToEndMoneyGateProofCli,
} from "../src/local-end-to-end-money-gate-proof-cli.js";

const inputPath = "examples/local-end-to-end-money-gate-proof-input.json";

function run(): LocalEndToEndMoneyGateProofResult {
  return runLocalEndToEndMoneyGateProof(readLocalEndToEndMoneyGateProofInput(inputPath));
}

function scenario(result: LocalEndToEndMoneyGateProofResult, type: LocalMoneyGateProofScenarioType) {
  const value = result.scenarios.find((item) => item.scenario_type === type);
  assert.ok(value, type);
  return value;
}

test("approved local money request passes once and all ten controls are proven", () => {
  const result = run();
  assert.equal(result.proof_status, "passed");
  assert.equal(result.proof_passed, true);
  assert.equal(result.scenario_count, 10);
  assert.equal(result.controls_proven, 10);
  assert.equal(result.simulated_settlement_eligible_count, 1);
  assert.deepEqual(result.failure_reasons, []);
  assert.ok(Object.values(result.controls).every(Boolean));

  const approved = scenario(result, "approved_first_use");
  assert.equal(approved.gate_verdict, "allow_signed_gate_pass");
  assert.equal(approved.receipt_type, "signed_gate_pass");
  assert.equal(approved.receipt_verified_for_settlement, true);
  assert.equal(approved.settlement_blocker_invoked, true);
  assert.equal(approved.settlement_outcome, "simulated_eligible");
  assert.equal(approved.control_proven, true);
});

test("replay, expiry, and scope mismatch stop before final blocker invocation", () => {
  const result = run();
  const replay = scenario(result, "replay_attempt");
  assert.equal(replay.settlement_outcome, "blocked");
  assert.equal(replay.settlement_blocker_invoked, false);
  assert.equal(replay.replay_safe, false);
  assert.ok(replay.verification_reason_codes.includes("replay_risk_detected"));

  const expired = scenario(result, "expired_gate_pass");
  assert.equal(expired.settlement_blocker_invoked, false);
  assert.equal(expired.receipt_fresh, false);
  assert.ok(expired.verification_reason_codes.includes("expired_receipt"));

  const mismatch = scenario(result, "scope_mismatch");
  assert.equal(mismatch.settlement_blocker_invoked, false);
  assert.ok(mismatch.verification_reason_codes.includes("requested_action_mismatch"));
  assert.equal(mismatch.control_proven, true);
});

test("missing money-gate controls, over-limit use, and autonomous execution fail closed", () => {
  const result = run();
  const expectations: Array<[LocalMoneyGateProofScenarioType, string]> = [
    ["missing_mandate", "refuse_no_mandate"],
    ["missing_evidence", "refuse_no_evidence"],
    ["missing_verified_intent", "refuse_no_verified_intent"],
    ["over_limit", "refuse_over_limit"],
    ["approval_pending", "review_required"],
    ["autonomous_execution_prohibited", "refuse_unsafe_action"],
  ];
  for (const [type, verdict] of expectations) {
    const value = scenario(result, type);
    assert.equal(value.gate_verdict, verdict);
    assert.equal(value.receipt_verified_for_settlement, false);
    assert.equal(value.settlement_blocker_invoked, false);
    assert.equal(value.settlement_outcome, "blocked");
    assert.equal(value.control_proven, true);
    assert.equal(value.action_executed, false);
    assert.equal(value.payment_triggered, false);
    assert.equal(value.settlement_executed, false);
  }
});

test("proof fails when the baseline is not a money movement", () => {
  const input = readLocalEndToEndMoneyGateProofInput(inputPath);
  input.action_category = "local_review";
  const result = runLocalEndToEndMoneyGateProof(input);
  assert.equal(result.proof_passed, false);
  assert.equal(result.proof_status, "failed");
  assert.ok(result.failure_reasons.includes("baseline_action_category_must_be_money_movement"));
});

test("proof is deterministic and summary omits scenario evidence", () => {
  const first = run();
  const second = run();
  assert.deepEqual(first, second);
  const summary = summariseLocalEndToEndMoneyGateProof(first);
  assert.equal("scenarios" in summary, false);
  assert.equal(summary.proof_passed, true);
  assert.equal(summary.controls_proven, 10);
  assert.deepEqual(
    summary,
    JSON.parse(readFileSync(
      "examples/local-end-to-end-money-gate-proof-output.json",
      "utf8",
    )),
  );
});

test("proof output is explicitly local and non-executing", () => {
  const result = run();
  assert.equal(result.local_only, true);
  assert.equal(result.input_data_retained, false);
  assert.equal(result.private_data_included, false);
  assert.equal(result.network_call_performed, false);
  assert.equal(result.external_agent_contacted, false);
  assert.equal(result.credential_created, false);
  assert.equal(result.cryptographic_signature_created, false);
  assert.equal(result.payment_triggered, false);
  assert.equal(result.settlement_executed, false);
  assert.equal(result.action_executed, false);
});

test("CLI emits full and summary proof JSON with meaningful exit codes", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runLocalEndToEndMoneyGateProofCli(
    [inputPath, "--pretty"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
  );
  assert.equal(code, 0);
  assert.equal(stderr.length, 0);
  const full = JSON.parse(stdout[0] ?? "{}") as LocalEndToEndMoneyGateProofResult;
  assert.equal(full.proof_passed, true);
  assert.equal(full.scenarios.length, 10);

  stdout.length = 0;
  assert.equal(runLocalEndToEndMoneyGateProofCli(
    [inputPath, "--summary-only"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
  ), 0);
  assert.equal("scenarios" in (JSON.parse(stdout[0] ?? "{}") as object), false);

  stdout.length = 0;
  assert.equal(runLocalEndToEndMoneyGateProofCli(
    ["--input", inputPath, "--summary-only"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
  ), 0);
  assert.equal((JSON.parse(stdout[0] ?? "{}") as { proof_passed: boolean }).proof_passed, true);
});

test("compiled proof command runs one local proof", () => {
  const result = spawnSync(process.execPath, [
    resolve("dist/src/local-end-to-end-money-gate-proof-cli.js"),
    resolve(inputPath),
    "--summary-only",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal((JSON.parse(result.stdout) as { proof_passed: boolean }).proof_passed, true);
});

test("private, payment-rail, and live endpoint fields are rejected", () => {
  assert.throws(
    () => readLocalEndToEndMoneyGateProofInput(
      "examples/local-end-to-end-money-gate-proof-private-data-rejected.json",
    ),
    /Private, credential, payment-rail, contact, or live endpoint fields are not accepted/,
  );
  assert.throws(
    () => readLocalEndToEndMoneyGateProofInput(
      "examples/local-end-to-end-money-gate-proof-live-execution-blocked.json",
    ),
    /Private, credential, payment-rail, contact, or live endpoint fields are not accepted/,
  );
});

test("docs and synthetic fixtures exist without live capability material", () => {
  for (const path of [
    "docs/local-end-to-end-money-gate-proof-pack.md",
    inputPath,
    "examples/local-end-to-end-money-gate-proof-output.json",
    "examples/local-end-to-end-money-gate-proof-private-data-rejected.json",
    "examples/local-end-to-end-money-gate-proof-live-execution-blocked.json",
  ]) {
    assert.equal(existsSync(path), true, path);
  }
  const safeFixture = readFileSync(inputPath, "utf8");
  assert.doesNotMatch(
    safeFixture,
    /https?:\/\/|api[_-]?key|access[_-]?token|password|secret|credential|wallet|bank[_-]?account|card[_-]?number|x402|stripe|checkout/i,
  );
});
