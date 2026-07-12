import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  GATEPASS_REVIEWER_KIT_ONE_COMMAND,
  runGatePassReviewerKit,
  summariseGatePassReviewerKit,
  type GatePassReviewerKitReport,
} from "../src/gatepass-reviewer-kit.js";
import {
  runGatePassReviewerKitCli,
  type GatePassReviewerKitCliIo,
} from "../src/gatepass-reviewer-kit-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/one-command-reviewer-demo-kit.md",
  "docs/reviewer-demo-kit-quickstart.md",
  "docs/reviewer-demo-output-guide.md",
  "docs/reviewer-demo-limitations-and-safety-boundary.md",
  "docs/reviewer-evaluation-checklist.md",
];
const examplePath = "examples/gatepass-reviewer-kit-report.json";
const corePhrases = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jsonFilesUnder(path: string): string[] {
  const full = join(root, path);
  const files: string[] = [];
  for (const entry of readdirSync(full)) {
    const child = join(path, entry);
    const childFull = join(root, child);
    if (statSync(childFull).isDirectory()) files.push(...jsonFilesUnder(child));
    else if (entry.endsWith(".json")) files.push(child);
  }
  return files;
}

function gitFiles(args: string[]): string[] {
  const result = spawnSync("git", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function assertSafety(report: GatePassReviewerKitReport | ReturnType<typeof summariseGatePassReviewerKit>): void {
  assert.equal(report.localDemoOnly, true);
  assert.equal(report.mockToolExecutionOnly, true);
  assert.equal(report.realToolExecution, false);
  assert.equal(report.actionExecution, false);
  assert.equal(report.networkCalls, false);
  assert.equal(report.paymentAuthorisation, false);
  assert.equal(report.settlementAuthorisation, false);
  assert.equal(report.productionMiddleware, false);
  assert.equal(report.productionBenchmark, false);
  assert.equal(report.productionCertification, false);
  assert.equal(report.securityCertification, false);
  assert.equal(report.legalComplianceGuarantee, false);
  assert.equal(report.liveAgentToAgentCommunication, false);
}

test("reviewer kit docs example README links and package command exist", () => {
  const readme = read("README.md");
  for (const path of [...docs, examplePath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /One-command reviewer demo kit/);
  assert.match(readme, /npm run demo:reviewer-kit/);
  assert.match(readme, /npm run demo:reviewer-kit -- --summary-only/);
  assert.match(readme, /npm run demo:reviewer-kit -- --json/);
  assert.match(read("package.json"), /demo:reviewer-kit/);
});

test("reviewer kit model and CLI exist", () => {
  assert.equal(existsSync(join(root, "src/gatepass-reviewer-kit.ts")), true);
  assert.equal(existsSync(join(root, "src/gatepass-reviewer-kit-cli.ts")), true);
  assert.equal(typeof runGatePassReviewerKit, "function");
  assert.equal(typeof runGatePassReviewerKitCli, "function");
});

test("reviewer kit report includes lifecycle scorecard wrapper safety and contact", () => {
  const report = runGatePassReviewerKit();
  assertSafety(report);
  assert.equal(report.oneCommand, GATEPASS_REVIEWER_KIT_ONE_COMMAND);
  assert.equal(report.publicContact, contactEmail);
  assert.equal(report.includedDemos.includes("GatePass round trip"), true);
  assert.equal(report.includedDemos.includes("GatePass adversarial scorecard"), true);
  assert.equal(report.includedDemos.includes("GatePass developer wrapper"), true);

  assert.equal(report.lifecycleSummary.scenarioCount, 10);
  assert.ok(report.lifecycleSummary.allowExamples.includes("valid_allow_local"));
  assert.ok(report.lifecycleSummary.rejectExamples.includes("identity_only_rejected"));
  assert.ok(report.lifecycleSummary.requiresEvidenceExamples.includes("missing_evidence_requires_evidence"));
  assert.ok(report.lifecycleSummary.requiresHumanReviewExamples.includes("high_risk_human_review"));
  assert.ok(report.lifecycleSummary.requiresSignedGatePassExamples.includes("pre_settlement_requires_signed_proof"));

  assert.equal(report.scorecardSummary.totalScenarios >= 12, true);
  assert.equal(report.scorecardSummary.mismatchedExpectedOutcomes, 0);
  assert.equal(report.scorecardSummary.adversarialCaught, report.scorecardSummary.adversarialScenarios);
  assert.equal(report.scorecardSummary.timingMode, "local_illustrative");

  assert.equal(report.wrapperSummary.wrapperPattern, "wrapGatePassTool(mockTool, policy).call({ input, gatePass, proofPackage })");
  assert.equal(report.wrapperSummary.wrapperScenarioCount, 12);
  assert.equal(report.wrapperSummary.localFrameworkStepCount, 5);
  assert.ok(report.wrapperSummary.allowedLocalMockExamples.includes("valid_low_risk_local_mock_allowed"));
  assert.ok(report.wrapperSummary.blockedExamples.includes("identity_only_blocks"));
  assert.ok(report.wrapperSummary.requiresEvidenceExamples.includes("missing_evidence_requires_evidence"));
  assert.ok(report.wrapperSummary.requiresHumanReviewExamples.includes("high_risk_requires_human_review"));
  assert.ok(report.wrapperSummary.requiresSignedGatePassExamples.includes("settlement_sensitive_requires_signed_gatepass"));

  assert.match(report.safetyBoundary, /Local deterministic reviewer kit only/);
});

test("reviewer kit summary omits component payload but keeps required sections", () => {
  const summary = summariseGatePassReviewerKit(runGatePassReviewerKit());
  assertSafety(summary);
  assert.equal("components" in summary, false);
  assert.equal(summary.lifecycleSummary.scenarioCount, 10);
  assert.equal(summary.wrapperSummary.wrapperScenarioCount, 12);
  assert.equal(summary.scorecardSummary.totalScenarios >= 12, true);
});

test("reviewer kit CLI supports summary-only and JSON-only output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: GatePassReviewerKitCliIo = {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  };
  assert.equal(runGatePassReviewerKitCli(["--summary-only"], io), 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /GatePass one-command reviewer demo kit/);
  assert.doesNotMatch(stdout[0] ?? "", /decision highlights:/);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/gatepass-reviewer-kit-cli.js"),
    "--json",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as GatePassReviewerKitReport;
  assertSafety(parsed);
  assert.equal(parsed.oneCommand, GATEPASS_REVIEWER_KIT_ONE_COMMAND);
  assert.equal(parsed.lifecycleSummary.scenarioCount, 10);
  assert.equal(parsed.wrapperSummary.wrapperScenarioCount, 12);
});

test("machine-readable reviewer report example preserves required fields and safety flags", () => {
  const example = readJson<{
    project: string;
    purpose: string;
    kitVersion: string;
    oneCommand: string;
    includedDemos: string[];
    lifecycleSummary: unknown;
    scorecardSummary: unknown;
    wrapperSummary: unknown;
    safetyBoundary: string;
    publicContact: string;
    localDemoOnly: boolean;
    mockToolExecutionOnly: boolean;
    realToolExecution: boolean;
    actionExecution: boolean;
    networkCalls: boolean;
    paymentAuthorisation: boolean;
    settlementAuthorisation: boolean;
    productionMiddleware: boolean;
    productionBenchmark: boolean;
    productionCertification: boolean;
    securityCertification: boolean;
    legalComplianceGuarantee: boolean;
    liveAgentToAgentCommunication: boolean;
  }>(examplePath);
  assert.equal(example.project, "Agent Trust Gate");
  assert.equal(example.oneCommand, "npm run demo:reviewer-kit");
  assert.ok(example.includedDemos.includes("GatePass round trip"));
  assert.ok(example.includedDemos.includes("GatePass adversarial scorecard"));
  assert.ok(example.includedDemos.includes("GatePass developer wrapper"));
  assert.equal(typeof example.lifecycleSummary, "object");
  assert.equal(typeof example.scorecardSummary, "object");
  assert.equal(typeof example.wrapperSummary, "object");
  assert.equal(example.publicContact, contactEmail);
  assert.equal(example.localDemoOnly, true);
  assert.equal(example.mockToolExecutionOnly, true);
  assert.equal(example.realToolExecution, false);
  assert.equal(example.actionExecution, false);
  assert.equal(example.networkCalls, false);
  assert.equal(example.paymentAuthorisation, false);
  assert.equal(example.settlementAuthorisation, false);
  assert.equal(example.productionMiddleware, false);
  assert.equal(example.productionBenchmark, false);
  assert.equal(example.productionCertification, false);
  assert.equal(example.securityCertification, false);
  assert.equal(example.legalComplianceGuarantee, false);
  assert.equal(example.liveAgentToAgentCommunication, false);
});

test("P3-M139 public docs metadata and core phrases are present", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read("llms.txt"),
    read("agent-trust-gate.manifest.json"),
    read("agent-trust-gate.agent-card.json"),
  ].join("\n");

  assert.match(combined, /P3-M139/);
  assert.match(combined, /GatePass proof vocabulary/i);
  assert.match(combined, /GatePass claims vocabulary/i);
  assert.match(combined, /common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence/i);
  assert.match(combined, /one-command reviewer demo kit/i);
  assert.match(combined, /not production middleware/i);
  assert.match(combined, /not a production benchmark/i);
  assert.match(combined, /not security certification/i);
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  for (const phrase of corePhrases) assert.match(combined, new RegExp(escapeRegExp(phrase)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("reviewer kit docs introduce no forbidden live-action or overclaim language", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read(examplePath),
  ].join("\n");
  const forbidden = [
    /\bproduction middleware is (?:enabled|active|available|configured|ready)\b/i,
    /\bproduction benchmark is (?:confirmed|achieved|provided|available)\b/i,
    /\bproduction readiness is (?:confirmed|achieved|guaranteed|certified)\b/i,
    /\bsecurity certification is (?:confirmed|achieved|provided|granted)\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?legal guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?compliance guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?security guarantee\b/i,
    /\blive tool execution is (?:enabled|active|available|configured)\b/i,
    /\bnetwork calls are (?:enabled|active|available|configured)\b/i,
    /\bcloud calls are (?:enabled|active|available|configured)\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bcheckout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(combined, pattern);
});

test("all repository JSON examples schemas and metadata remain valid", () => {
  const files = [
    ...jsonFilesUnder("examples"),
    ...jsonFilesUnder("schemas"),
    "agent-trust-gate.manifest.json",
    "agent-trust-gate.agent-card.json",
  ];
  for (const file of files) assert.doesNotThrow(() => readJson<unknown>(file), file);
});

test("old public email is absent from tracked files", () => {
  const tracked = gitFiles(["ls-files"]);
  for (const file of tracked) {
    if (!existsSync(join(root, file))) continue;
    const content = read(file);
    assert.doesNotMatch(content, new RegExp(escapeRegExp(oldEmail), "i"), file);
  }
});
