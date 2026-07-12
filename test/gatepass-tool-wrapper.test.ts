import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  createGatePassToolPolicy,
  runGatePassToolWrapperDemo,
  summariseGatePassToolWrapperDemo,
  wrapGatePassTool,
  type GatePassToolWrapperDemo,
  type GatePassToolWrapperScenarioResult,
  type GatePassWrappedToolResult,
} from "../src/gatepass-tool-wrapper.js";
import {
  runLocalAgentFrameworkIntegrationExample,
  type LocalAgentFrameworkIntegrationDemo,
} from "../src/local-agent-framework-integration.js";
import { runGatePassToolWrapperCli, type GatePassToolWrapperCliOutput } from "../src/gatepass-tool-wrapper-cli.js";
import { runGatePassRoundTripScenario } from "../src/gatepass-round-trip.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/gatepass-developer-wrapper-and-local-integration-example.md",
  "docs/gatepass-wrap-tool-developer-guide.md",
  "docs/local-agent-framework-integration-example.md",
  "docs/gatepass-wrapper-policy-guide.md",
  "docs/gatepass-wrapper-limitations-and-safety-boundary.md",
];
const examplePath = "examples/gatepass-developer-wrapper-demo.json";
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

function assertSafety(value: GatePassToolWrapperDemo | GatePassToolWrapperScenarioResult | GatePassWrappedToolResult | LocalAgentFrameworkIntegrationDemo): void {
  assert.equal(value.localDemoOnly, true);
  assert.equal(value.mockToolExecutionOnly, true);
  assert.equal(value.realToolExecution, false);
  assert.equal(value.actionExecution, false);
  assert.equal(value.networkCalls, false);
  assert.equal(value.paymentAuthorisation, false);
  assert.equal(value.settlementAuthorisation, false);
  assert.equal(value.productionMiddleware, false);
  assert.equal(value.productionCertification, false);
  assert.equal(value.securityCertification, false);
}

function byScenario(demo: GatePassToolWrapperDemo, id: string): GatePassToolWrapperScenarioResult {
  const result = demo.scenarios.find((scenario) => scenario.scenarioId === id);
  assert.ok(result, id);
  return result;
}

test("GatePass wrapper docs example README links and package command exist", () => {
  const readme = read("README.md");
  for (const path of [...docs, examplePath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /npm run demo:gatepass-wrapper/);
  assert.match(readme, /npm run demo:gatepass-wrapper -- --summary-only/);
  assert.match(readme, /npm run demo:gatepass-wrapper -- --json/);
  assert.match(read("package.json"), /demo:gatepass-wrapper/);
});

test("wrapper and local framework integration models exist", () => {
  assert.equal(existsSync(join(root, "src/gatepass-tool-wrapper.ts")), true);
  assert.equal(existsSync(join(root, "src/local-agent-framework-integration.ts")), true);
  assert.equal(existsSync(join(root, "src/gatepass-tool-wrapper-cli.ts")), true);
  assert.equal(typeof wrapGatePassTool, "function");
});

test("machine-readable wrapper example preserves local-only flags", () => {
  const example = readJson<{
    project: string;
    scenarios: { scenarioId: string; expectedOutcome: string }[];
    localDemoOnly: boolean;
    mockToolExecutionOnly: boolean;
    realToolExecution: boolean;
    actionExecution: boolean;
    networkCalls: boolean;
    liveAgentFrameworkDependency: boolean;
    productionMiddleware: boolean;
    productionCertification: boolean;
    securityCertification: boolean;
    legalComplianceGuarantee: boolean;
    paymentAuthorisation: boolean;
    settlementAuthorisation: boolean;
    publicContact: string;
  }>(examplePath);
  assert.equal(example.project, "Agent Trust Gate");
  assert.equal(example.scenarios.length, 12);
  assert.equal(example.localDemoOnly, true);
  assert.equal(example.mockToolExecutionOnly, true);
  assert.equal(example.realToolExecution, false);
  assert.equal(example.actionExecution, false);
  assert.equal(example.networkCalls, false);
  assert.equal(example.liveAgentFrameworkDependency, false);
  assert.equal(example.productionMiddleware, false);
  assert.equal(example.productionCertification, false);
  assert.equal(example.securityCertification, false);
  assert.equal(example.legalComplianceGuarantee, false);
  assert.equal(example.paymentAuthorisation, false);
  assert.equal(example.settlementAuthorisation, false);
  assert.equal(example.publicContact, contactEmail);
});

test("wrapGatePassTool allows valid low-risk GatePass local mock execution only", () => {
  const tool = {
    toolName: "test_local_mock_tool",
    description: "local mock only",
    callLocalMock: (input: { value: string }) => ({
      value: input.value,
      localMockExecution: true,
      realToolExecution: false,
      actionExecution: false,
    }),
  };
  const policy = createGatePassToolPolicy();
  const wrapped = wrapGatePassTool(tool, policy);
  const result = wrapped.call({
    input: { value: "local" },
    requestedAction: "read_public_docs",
    gatePass: runGatePassRoundTripScenario("valid_allow_local"),
    proofPackage: {
      proofPackageId: "test_proof_package",
      evidenceComplete: true,
      mandateReferencePresent: true,
      localDemoOnly: true,
    },
    localDemoOnly: true,
  });

  assertSafety(result);
  assert.equal(result.allowed, true);
  assert.equal(result.outcome, "allow");
  assert.equal(result.localMockExecuted, true);
  assert.equal(result.localMockResult?.localMockExecution, true);
  assert.equal(result.localMockResult?.realToolExecution, false);
  assert.equal(result.localMockResult?.actionExecution, false);
});

test("wrapper scenarios produce expected GatePass outcomes", () => {
  const demo = runGatePassToolWrapperDemo();
  assertSafety(demo);
  assert.equal(demo.scenarioCount, 12);
  for (const scenario of demo.scenarios) {
    assertSafety(scenario);
    assert.equal(scenario.matchedExpectedOutcome, true, scenario.scenarioId);
    assert.equal(scenario.allowed, scenario.outcome === "allow");
    assert.equal(scenario.realToolExecution, false);
    assert.equal(scenario.actionExecution, false);
  }

  assert.equal(byScenario(demo, "valid_low_risk_local_mock_allowed").outcome, "allow");
  assert.equal(byScenario(demo, "valid_low_risk_local_mock_allowed").localMockExecuted, true);
  assert.equal(byScenario(demo, "identity_only_blocks").outcome, "block");
  assert.equal(byScenario(demo, "missing_mandate_blocks").outcome, "block");
  assert.equal(byScenario(demo, "missing_evidence_requires_evidence").outcome, "require_evidence");
  assert.equal(byScenario(demo, "stale_gatepass_blocks").outcome, "block");
  assert.equal(byScenario(demo, "replayed_nonce_blocks").outcome, "block");
  assert.equal(byScenario(demo, "tampered_scope_blocks").outcome, "block");
  assert.equal(byScenario(demo, "tampered_action_blocks").outcome, "block");
  assert.equal(byScenario(demo, "high_risk_requires_human_review").outcome, "require_human_review");
  assert.equal(byScenario(demo, "settlement_sensitive_requires_signed_gatepass").outcome, "require_signed_proof");
  assert.equal(byScenario(demo, "unsafe_proven_safe_claim_blocks").outcome, "block");
  assert.equal(byScenario(demo, "guaranteed_trust_claim_blocks").outcome, "block");
});

test("local framework integration example covers allowed blocked evidence review and signed proof cases", () => {
  const demo = runLocalAgentFrameworkIntegrationExample();
  assertSafety(demo);
  assert.equal(demo.noLangGraphDependency, true);
  assert.equal(demo.noExternalNetworkCall, true);
  assert.equal(demo.noLiveAgentFrameworkExecution, true);
  assert.equal(demo.stepCount, 5);
  const outcomes = demo.steps.map((step) => step.wrapperResult.outcome);
  assert.deepEqual(outcomes, ["allow", "block", "require_evidence", "require_human_review", "require_signed_proof"]);
  for (const step of demo.steps) {
    assert.equal(step.matchedExpectedOutcome, true, step.stepId);
    assertSafety(step.wrapperResult);
    assert.equal(step.realToolExecution, false);
    assert.equal(step.actionExecution, false);
    assert.equal(step.networkCalls, false);
  }
});

test("wrapper CLI supports summary-only and JSON-only output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runGatePassToolWrapperCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /GatePass developer wrapper/);
  assert.doesNotMatch(stdout[0] ?? "", /wrapper scenario results:/);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/gatepass-tool-wrapper-cli.js"),
    "--json",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as GatePassToolWrapperCliOutput;
  assert.equal(parsed.wrapper.localDemoOnly, true);
  assert.equal(parsed.wrapper.mockToolExecutionOnly, true);
  assert.equal(parsed.localFrameworkIntegration.localDemoOnly, true);
});

test("summary helper omits scenario results", () => {
  const summary = summariseGatePassToolWrapperDemo(runGatePassToolWrapperDemo());
  assert.equal("scenarios" in summary, false);
  assert.equal(summary.scenarioCount, 12);
  assert.equal(summary.productionMiddleware, false);
});

test("P3-M138 public docs preserve contact core phrases and safe wording", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read("llms.txt"),
    read("agent-trust-gate.manifest.json"),
    read("agent-trust-gate.agent-card.json"),
  ].join("\n");

  assert.match(combined, /P3-M138/);
  assert.match(combined, /GatePass proof vocabulary/i);
  assert.match(combined, /GatePass claims vocabulary/i);
  assert.match(combined, /common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence/i);
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  for (const phrase of corePhrases) assert.match(combined, new RegExp(escapeRegExp(phrase)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("wrapper docs introduce no forbidden production middleware or live-action claims", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read("examples/gatepass-developer-wrapper-demo.json"),
  ].join("\n");
  const forbidden = [
    /\bproduction middleware is (?:enabled|active|available|configured|ready)\b/i,
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
