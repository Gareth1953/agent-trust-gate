import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  LOCAL_ADVERSARIAL_EVALUATION_RULE,
  LOCAL_ADVERSARIAL_EXAMPLE_FILES,
  LOCAL_ADVERSARIAL_PUBLIC_CONTACT,
  runLocalAdversarialEvaluation,
  summariseLocalAdversarialEvaluation,
  type LocalAdversarialScenarioResult,
  type LocalAdversarialScenarioType,
} from "../src/local-adversarial-evaluation.js";
import { runLocalAdversarialEvaluationCli } from "../src/local-adversarial-evaluation-cli.js";

function run() {
  return runLocalAdversarialEvaluation();
}

function scenario(type: LocalAdversarialScenarioType): LocalAdversarialScenarioResult {
  const value = run().scenarios.find((item) => item.scenarioType === type);
  assert.ok(value, type);
  return value;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

test("local adversarial evaluation pack proves nine blocked cases and one local control", () => {
  const result = run();
  assert.equal(result.evaluationPassed, true);
  assert.equal(result.scenarioCount, 10);
  assert.equal(result.blockedScenarioCount, 9);
  assert.equal(result.allowedControlCount, 1);
  assert.equal(result.attackCasesBlocked, true);
  assert.equal(result.validControlAllowedLocally, true);
  assert.equal(result.rule, LOCAL_ADVERSARIAL_EVALUATION_RULE);
  assert.equal(result.publicContactEmail, LOCAL_ADVERSARIAL_PUBLIC_CONTACT);
});

test("required attack cases are blocked with explicit reasons", () => {
  const expectations: Array<[LocalAdversarialScenarioType, string]> = [
    ["replay_attempt", "replay_risk_detected"],
    ["forged_evidence", "evidence_hash_mismatch"],
    ["expired_gate_pass", "expired_receipt"],
    ["scope_creep", "requested_action_mismatch"],
    ["missing_mandate", "MANDATE_REQUIRED"],
    ["tampered_signed_proof", "payload_hash_mismatch"],
    ["unsigned_malformed_proof", "malformed_signed_proof"],
    ["stale_nonce_freshness", "stale_nonce_freshness_window_exceeded"],
    ["settlement_blocker_refusal", "refusal_receipt_blocks_settlement"],
  ];

  for (const [type, reason] of expectations) {
    const value = scenario(type);
    assert.equal(value.verdict, "blocked", type);
    assert.equal(value.blocked, true, type);
    assert.equal(value.allowedLocally, false, type);
    assert.equal(value.controlSatisfied, true, type);
    assert.ok(
      value.reasonCodes.includes(reason)
        || value.receiptVerification?.reasonCodes.includes(reason) === true
        || value.settlementBlocker?.blockReasonCodes.includes(reason) === true
        || value.signatureVerification?.reasonCodes.includes(reason) === true
        || value.evidenceIntegrity?.reasonCodes.includes(reason) === true
        || value.nonceFreshness?.reasonCodes.includes(reason) === true,
      `${type} missing ${reason}`,
    );
  }
});

test("valid control case is allowed locally only", () => {
  const value = scenario("valid_control_allowed");
  assert.equal(value.verdict, "allowed_local_control");
  assert.equal(value.allowedLocally, true);
  assert.equal(value.blocked, false);
  assert.equal(value.controlSatisfied, true);
  assert.ok(value.reasonCodes.includes("local_control_allowed"));
  assert.equal(value.receiptVerification?.verified, true);
  assert.equal(value.receiptVerification?.validForSimulatedSettlement, true);
  assert.equal(value.settlementBlocker?.settlementSimulation, "allowed");
  assert.equal(value.settlementBlocker?.settlementExecuted, false);
  assert.equal(value.signatureVerification?.verified, true);
  assert.equal(value.signatureVerification?.reasonCodes.includes("signature_valid"), true);
});

test("all scenarios preserve local-demo and non-authorisation flags", () => {
  const result = run();
  const all = [summariseLocalAdversarialEvaluation(result), ...result.scenarios];
  for (const value of all) {
    assert.equal(value.localDemoOnly, true);
    assert.equal(value.localOnly, true);
    assert.equal(value.productionSigning, false);
    assert.equal(value.paymentAuthorisation, false);
    assert.equal(value.settlementAuthorisation, false);
    assert.equal(value.privateDataIncluded, false);
    assert.equal(value.networkCallPerformed, false);
    assert.equal(value.externalAgentContacted, false);
    assert.equal(value.paymentTriggered, false);
    assert.equal(value.settlementExecuted, false);
    assert.equal(value.actionExecuted, false);
  }
});

test("adversarial example JSON files match deterministic scenario outputs", () => {
  const result = run();
  for (const [type, path] of Object.entries(LOCAL_ADVERSARIAL_EXAMPLE_FILES)) {
    assert.equal(existsSync(path), true, path);
    const expected = result.scenarios.find((item) => item.scenarioType === type);
    assert.ok(expected, type);
    assert.deepEqual(readJson<LocalAdversarialScenarioResult>(path), expected, path);
  }
});

test("CLI emits full summary and single-scenario JSON", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const summaryCode = runLocalAdversarialEvaluationCli(
    ["--summary-only"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
  );
  assert.equal(summaryCode, 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as { evaluationPassed: boolean; scenarios?: unknown };
  assert.equal(summary.evaluationPassed, true);
  assert.equal("scenarios" in summary, false);

  stdout.length = 0;
  const scenarioCode = runLocalAdversarialEvaluationCli(
    ["--scenario", "tampered_signed_proof"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
  );
  assert.equal(scenarioCode, 0);
  const selected = JSON.parse(stdout[0] ?? "{}") as LocalAdversarialScenarioResult;
  assert.equal(selected.scenarioType, "tampered_signed_proof");
  assert.equal(selected.blocked, true);
});

test("compiled adversarial CLI command runs locally", () => {
  const result = spawnSync(process.execPath, [
    resolve("dist/src/local-adversarial-evaluation-cli.js"),
    "--summary-only",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal((JSON.parse(result.stdout) as { evaluationPassed: boolean }).evaluationPassed, true);
});

test("adversarial docs README link contact and core safety line are present", () => {
  const paths = [
    "docs/adversarial-evaluation-pack.md",
    "README.md",
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
    assert.match(source, /P3-M118/);
    assert.match(source, /No mandate\. No evidence\. No verified intent\. No signed gate pass\. No settlement\./);
  }
  const readme = readFileSync("README.md", "utf8");
  assert.match(readme, /docs\/adversarial-evaluation-pack\.md/);
  const doc = readFileSync("docs/adversarial-evaluation-pack.md", "utf8");
  assert.match(doc, /gpmiddleton71@gmail\.com/);
  assert.match(doc, /not production security certification/i);
  assert.match(doc, /not payment or settlement authorisation/i);
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

test("adversarial artifacts contain no live capability or unsafe authorisation material", () => {
  const paths = [
    "src/local-adversarial-evaluation.ts",
    "src/local-adversarial-evaluation-cli.ts",
    "docs/adversarial-evaluation-pack.md",
    ...Object.values(LOCAL_ADVERSARIAL_EXAMPLE_FILES),
  ];
  const forbidden = /https?:\/\/|paypal|stripe|checkout|webhook|wallet|bank[_ -]?account|routing[_ -]?number|api[_ -]?key|access[_ -]?token|private[_ -]?key|fetch\s*\(|productionSigning": true|paymentAuthorisation": true|settlementAuthorisation": true/i;
  for (const path of paths) {
    assert.doesNotMatch(readFileSync(path, "utf8"), forbidden, path);
  }
});
