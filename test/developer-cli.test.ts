import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  DEVELOPER_CLI_PUBLIC_CONTACT,
  DEVELOPER_CLI_RULE,
  formatDeveloperCliHelp,
  runDeveloperCli,
  type DeveloperCliErrorResult,
  type DeveloperCliResult,
} from "../src/developer-cli.js";

function run(args: readonly string[]): {
  code: number;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runDeveloperCli(args, {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  });
  return { code, stdout, stderr };
}

function output(args: readonly string[]): DeveloperCliResult {
  const result = run(args);
  assert.equal(result.code, 0, result.stderr.join("\n"));
  assert.equal(result.stderr.length, 0);
  return JSON.parse(result.stdout[0] ?? "{}") as DeveloperCliResult;
}

function assertSafe(result: DeveloperCliResult | DeveloperCliErrorResult): void {
  assert.equal(result.localDemoOnly, true);
  assert.equal(result.localOnly, true);
  assert.equal(result.productionSigning, false);
  assert.equal(result.paymentAuthorisation, false);
  assert.equal(result.settlementAuthorisation, false);
  assert.equal(result.privateDataIncluded, false);
  assert.equal(result.networkCallPerformed, false);
  assert.equal(result.externalAgentContacted, false);
  assert.equal(result.paymentTriggered, false);
  assert.equal(result.settlementExecuted, false);
  assert.equal(result.actionExecuted, false);
}

test("help command lists the key local developer commands", () => {
  const result = run(["help"]);
  assert.equal(result.code, 0);
  assert.equal(result.stderr.length, 0);
  const help = result.stdout[0] ?? "";
  for (const command of [
    "gate evaluate",
    "receipt verify",
    "proof money-gate",
    "proof signed",
    "demo adversarial",
    "demo quickstart",
  ]) {
    assert.match(help, new RegExp(command.replace("-", "\\-")));
  }
  assert.match(help, /localDemoOnly=true/);
  assert.match(help, /productionSigning=false/);
  assert.match(help, /paymentAuthorisation=false/);
  assert.match(help, /settlementAuthorisation=false/);
  assert.match(help, /gpmiddleton71@gmail\.com/);
  assert.equal(formatDeveloperCliHelp(), help);
});

test("unknown command fails clearly and safely", () => {
  const result = run(["unknown", "command"]);
  assert.equal(result.code, 1);
  assert.equal(result.stdout.length, 0);
  const error = JSON.parse(result.stderr[0] ?? "{}") as DeveloperCliErrorResult;
  assert.equal(error.error.code, "UNKNOWN_COMMAND");
  assert.match(error.error.message, /Unknown local developer command/);
  assert.ok(error.availableCommands.includes("gate evaluate"));
  assertSafe(error);
});

test("gate evaluate command runs local-only with a safe default input", () => {
  const result = output(["gate", "evaluate"]);
  assert.equal(result.command, "gate evaluate");
  assert.equal(result.rule, DEVELOPER_CLI_RULE);
  assert.equal(result.publicContactEmail, DEVELOPER_CLI_PUBLIC_CONTACT);
  assert.equal(result.result.verdict, "allow_signed_gate_pass");
  assert.equal(result.result.receiptType, "signed_gate_pass");
  assert.equal(result.result.settlementAllowedByGate, true);
  assertSafe(result);
});

test("receipt verify command runs local-only", () => {
  const result = output(["receipt", "verify"]);
  assert.equal(result.command, "receipt verify");
  assert.equal(result.result.verified, true);
  assert.equal(result.result.validForSimulatedSettlement, true);
  assert.equal(result.result.mode, "local_simulation_only");
  assertSafe(result);
});

test("proof money-gate command runs local-only", () => {
  const result = output(["proof", "money-gate"]);
  assert.equal(result.command, "proof money-gate");
  assert.equal(result.result.proofPassed, true);
  assert.equal(result.result.controlsProven, 10);
  assert.equal(result.result.localOnly, true);
  assert.equal(result.result.paymentTriggered, false);
  assert.equal(result.result.settlementExecuted, false);
  assert.equal(result.result.actionExecuted, false);
  assertSafe(result);
});

test("proof signed command preserves local demo signature authorisation flags", () => {
  const result = output(["proof", "signed"]);
  assert.equal(result.command, "proof signed");
  const verifications = result.result.verifications;
  assert.ok(Array.isArray(verifications));
  assert.equal(verifications.length, 2);
  for (const verification of verifications) {
    assert.equal(verification.verified, true);
    assert.equal(verification.localDemoOnly, true);
    assert.equal(verification.productionSigning, false);
    assert.equal(verification.paymentAuthorisation, false);
    assert.equal(verification.settlementAuthorisation, false);
  }
  assertSafe(result);
});

test("demo adversarial command runs local-only", () => {
  const result = output(["demo", "adversarial"]);
  assert.equal(result.command, "demo adversarial");
  assert.equal(result.result.evaluationPassed, true);
  assert.equal(result.result.blockedScenarioCount, 9);
  assert.equal(result.result.allowedControlCount, 1);
  assert.equal(result.result.localDemoOnly, true);
  assert.equal(result.result.productionSigning, false);
  assert.equal(result.result.paymentAuthorisation, false);
  assert.equal(result.result.settlementAuthorisation, false);
  assertSafe(result);
});

test("demo quickstart composes the shortest local developer path", () => {
  const result = output(["demo", "quickstart"]);
  assert.equal(result.command, "demo quickstart");
  assert.equal(result.result.gateVerdict, "allow_signed_gate_pass");
  assert.equal(result.result.receiptVerified, true);
  assert.equal(result.result.moneyGateProofPassed, true);
  assert.equal(result.result.signedProofsVerified, true);
  assert.equal(result.result.adversarialEvaluationPassed, true);
  assert.equal(result.result.shortestUsefulCommand, "npm run cli -- demo quickstart");
  assertSafe(result);
});

test("compiled developer CLI command runs help and gate evaluation", () => {
  const help = spawnSync(process.execPath, [
    resolve("dist/src/developer-cli.js"),
    "help",
  ], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /gate evaluate/);

  const gate = spawnSync(process.execPath, [
    resolve("dist/src/developer-cli.js"),
    "gate",
    "evaluate",
  ], { encoding: "utf8" });
  assert.equal(gate.status, 0);
  assert.equal((JSON.parse(gate.stdout) as DeveloperCliResult).result.verdict, "allow_signed_gate_pass");
});

test("simplified CLI documentation and README link are present", () => {
  const paths = [
    "docs/simplified-developer-cli.md",
    "README.md",
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
    assert.match(source, /P3-M119/);
    assert.match(source, /No mandate\. No evidence\. No verified intent\. No signed gate pass\. No settlement\./);
  }
  assert.match(readFileSync("README.md", "utf8"), /docs\/simplified-developer-cli\.md/);
  const doc = readFileSync("docs/simplified-developer-cli.md", "utf8");
  assert.match(doc, /gpmiddleton71@gmail\.com/);
  assert.match(doc, /npm run cli -- help/);
  assert.match(doc, /npm run cli -- demo quickstart/);
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

test("simplified CLI artifacts contain no active live-action or payment material", () => {
  const paths = [
    "src/developer-cli.ts",
    "docs/simplified-developer-cli.md",
    "package.json",
  ];
  const forbidden = /https?:\/\/|paypal\.com|api\.stripe|stripe\.checkout|webhook_url|wallet_address|bank_account_number|api[_-]?key|access[_-]?token|private[_-]?key|fetch\s*\(|productionSigning\": true|paymentAuthorisation\": true|settlementAuthorisation\": true/i;
  for (const path of paths) {
    assert.doesNotMatch(readFileSync(path, "utf8"), forbidden, path);
  }
  const readme = readFileSync("README.md", "utf8");
  const section = readme.slice(
    readme.indexOf("## Simplified developer CLI"),
    readme.indexOf("## Global Code Launch Readiness"),
  );
  assert.match(section, /P3-M119/);
  assert.doesNotMatch(section, forbidden, "README simplified developer CLI section");
});
