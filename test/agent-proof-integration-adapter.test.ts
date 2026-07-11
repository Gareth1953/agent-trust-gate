import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  AGENT_PROOF_INTEGRATION_CORE_LINE,
  AGENT_PROOF_INTEGRATION_EXAMPLE_FILES,
  AGENT_PROOF_INTEGRATION_POSITIONING,
  runAgentProofIntegrationAdapterExamples,
  runAgentProofIntegrationAdapterScenario,
  type AgentProofIntegrationAdapterPack,
  type AgentProofIntegrationScenarioId,
  type LocalAgentProofIntegrationResult,
} from "../src/agent-proof-integration-adapter.js";
import { runAgentProofIntegrationAdapterCli } from "../src/agent-proof-integration-adapter-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/agent-proof-contract-integration-readiness.md",
  "docs/local-agent-workflow-integration-guide.md",
  "docs/tool-calling-proof-gate-adapter-guide.md",
  "docs/pre-settlement-proof-contract-integration.md",
  "docs/integration-readiness-checklist.md",
];
const mainDoc = "docs/agent-proof-contract-integration-readiness.md";
const corePhrases = [
  "Do not trust the agent. Trust the gate pass.",
  "No proof. No permission.",
  "No mandate. No action.",
  "No signed gate pass. No settlement.",
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

function assertSafe(value: LocalAgentProofIntegrationResult | AgentProofIntegrationAdapterPack): void {
  assert.equal(value.localDemoOnly, true);
  assert.equal(value.localOnly, true);
  assert.equal(value.liveSystemsContact, false);
  assert.equal(value.directBotMessaging, false);
  assert.equal(value.autonomousOutreach, false);
  assert.equal(value.outreachAutomation, false);
  assert.equal(value.liveAgentToAgentCommunication, false);
  assert.equal(value.externalAgentContact, false);
  assert.equal(value.liveApi, false);
  assert.equal(value.mcpServer, false);
  assert.equal(value.cloudNetworkCall, false);
  assert.equal(value.secretsOrCredentials, false);
  assert.equal(value.paymentAuthorisation, false);
  assert.equal(value.settlementAuthorisation, false);
  assert.equal(value.walletBankingLogic, false);
  assert.equal(value.productionSigning, false);
  assert.equal(value.productionCertification, false);
  assert.equal(value.actionExecution, false);
  if ("executedAction" in value) {
    assert.equal(value.executedAction, false);
    assert.equal(value.calledTool, false);
    assert.equal(value.simulatedSettlementOnly, true);
    assert.equal(value.noProofMeansNoPermission, true);
  }
}

test("agent proof integration docs exist and README links them with core phrases", () => {
  const readme = read("README.md");
  for (const path of docs) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
    assert.match(read(path), new RegExp(escapeRegExp(contactEmail)), path);
  }
  for (const phrase of corePhrases) {
    assert.match(readme, new RegExp(escapeRegExp(phrase)), phrase);
    assert.match(read(mainDoc), new RegExp(escapeRegExp(phrase)), phrase);
  }
  assert.match(read(mainDoc), new RegExp(escapeRegExp(AGENT_PROOF_INTEGRATION_CORE_LINE)));
});

test("integration adapter model and demo script exist", () => {
  assert.equal(existsSync(join(root, "src/agent-proof-integration-adapter.ts")), true);
  assert.equal(existsSync(join(root, "src/agent-proof-integration-adapter-cli.ts")), true);
  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:agent-proof-integration"] ?? "", /agent-proof-integration-adapter-cli\.js --pretty/);
});

test("required local integration scenarios produce expected decisions", () => {
  const expected: Record<AgentProofIntegrationScenarioId, LocalAgentProofIntegrationResult["decision"]> = {
    valid_local_workflow: "allow",
    sensitive_tool_call_escalated: "escalate",
    missing_proof_requires_evidence: "require_evidence",
    pre_settlement_requires_signed_proof: "require_signed_proof",
    high_risk_human_review: "require_human_review",
    replayed_proof_blocked: "block",
  };
  for (const [scenarioId, decision] of Object.entries(expected)) {
    const result = runAgentProofIntegrationAdapterScenario(scenarioId as AgentProofIntegrationScenarioId);
    assert.equal(result.decision, decision, scenarioId);
    assert.ok(result.reasons.includes("integration_adapter_local_only"), scenarioId);
    assert.ok(result.reasons.includes("no_action_execution"), scenarioId);
    assertSafe(result);
  }
});

test("valid proof allows locally only", () => {
  const result = runAgentProofIntegrationAdapterScenario("valid_local_workflow");
  assert.equal(result.decision, "allow");
  assert.equal(result.proofContractDecision, "allow");
  assert.equal(result.proofContractResult?.decision, "allow");
  assert.ok(result.requiredDeveloperInputs.includes("define_local_action_scope"));
  assertSafe(result);
});

test("missing proof requires evidence before permission", () => {
  const result = runAgentProofIntegrationAdapterScenario("missing_proof_requires_evidence");
  assert.equal(result.decision, "require_evidence");
  assert.equal(result.proofContractDecision, "not_evaluated_missing_proof");
  assert.equal(result.proofContractResult, null);
  assert.ok(result.reasons.includes("proof_package_missing"));
  assert.ok(result.missingProofItems.includes("agentProofPackage"));
  assert.ok(result.missingProofItems.includes("mandateReference"));
  assert.ok(result.missingProofItems.includes("evidenceReference"));
  assertSafe(result);
});

test("sensitive tool call escalates without verified intent", () => {
  const result = runAgentProofIntegrationAdapterScenario("sensitive_tool_call_escalated");
  assert.equal(result.adapterType, "local_tool_call_proof_gate");
  assert.equal(result.toolCallType, "customer_facing_message");
  assert.equal(result.decision, "escalate");
  assert.ok(result.reasons.includes("tool_call_blocked_until_proof_passes"));
  assert.ok(result.reasons.includes("customer_facing_tool_call_requires_verified_intent"));
  assert.ok(result.reasons.includes("proof_contract_contract_verified_intent_unverified"));
  assertSafe(result);
});

test("settlement-sensitive step requires signed proof and does not settle", () => {
  const result = runAgentProofIntegrationAdapterScenario("pre_settlement_requires_signed_proof");
  assert.equal(result.adapterType, "local_pre_settlement_proof_gate");
  assert.equal(result.toolCallType, "settlement_sensitive_step");
  assert.equal(result.decision, "require_signed_proof");
  assert.ok(result.reasons.includes("pre_settlement_gate_requires_signed_gate_pass"));
  assert.ok(result.reasons.includes("settlement_sensitive_tool_call_requires_signed_proof"));
  assert.ok(result.missingProofItems.includes("signedProofReference"));
  assertSafe(result);
});

test("high-risk action requires human review and replayed proof blocks", () => {
  const highRisk = runAgentProofIntegrationAdapterScenario("high_risk_human_review");
  assert.equal(highRisk.decision, "require_human_review");
  assert.ok(highRisk.reasons.includes("proof_contract_risk_high_requires_human_review"));
  assertSafe(highRisk);

  const replayed = runAgentProofIntegrationAdapterScenario("replayed_proof_blocked");
  assert.equal(replayed.decision, "block");
  assert.ok(replayed.reasons.includes("proof_contract_nonce_replayed"));
  assert.ok(replayed.reasons.includes("proof_contract_freshness_stale"));
  assertSafe(replayed);
});

test("integration pack covers all local outcomes and preserves disabled authority flags", () => {
  const pack = runAgentProofIntegrationAdapterExamples();
  assert.equal(pack.coreLine, AGENT_PROOF_INTEGRATION_CORE_LINE);
  assert.deepEqual(pack.positioning, AGENT_PROOF_INTEGRATION_POSITIONING);
  assert.equal(pack.scenarioCount, 6);
  assert.equal(pack.decisions.allow, 1);
  assert.equal(pack.decisions.block, 1);
  assert.equal(pack.decisions.escalate, 1);
  assert.equal(pack.decisions.require_evidence, 1);
  assert.equal(pack.decisions.require_human_review, 1);
  assert.equal(pack.decisions.require_signed_proof, 1);
  assertSafe(pack);
  for (const scenario of pack.scenarios) assertSafe(scenario);
});

test("agent proof integration example JSON files match deterministic local outputs", () => {
  for (const [scenarioId, path] of Object.entries(AGENT_PROOF_INTEGRATION_EXAMPLE_FILES)) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.deepEqual(
      readJson<LocalAgentProofIntegrationResult>(path),
      runAgentProofIntegrationAdapterScenario(scenarioId as AgentProofIntegrationScenarioId),
      path,
    );
  }
});

test("agent proof integration CLI emits local summary and scenario output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runAgentProofIntegrationAdapterCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as AgentProofIntegrationAdapterPack;
  assert.equal(summary.scenarioCount, 6);
  assert.equal("scenarios" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/agent-proof-integration-adapter-cli.js"),
    "--scenario",
    "pre_settlement_requires_signed_proof",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0);
  assert.equal((JSON.parse(compiled.stdout) as LocalAgentProofIntegrationResult).decision, "require_signed_proof");
});

test("P3-M131 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/agent-proof-package-schema-and-verification-contract.md",
    "docs/agent-proof-package-field-guide.md",
    "docs/gate-pass-challenge-and-response-flow.md",
    "docs/agent-trust-invitation-and-prove-yourself-protocol.md",
    "docs/agent-proof-requirements.md",
    "docs/system-side-agent-verification-guide.md",
    "docs/agent-owner-trust-presentation-guide.md",
    "docs/what-a-gate-pass-proves.md",
    "docs/controlled-public-visibility-and-paid-enquiry-positioning.md",
    "docs/public-visibility-readiness-checklist.md",
    "docs/paid-enquiry-positioning.md",
    "docs/public-positioning-message-bank.md",
    "docs/controlled-distribution-sequence.md",
    "docs/global-code-discovery-and-developer-distribution-pack.md",
    "docs/github-discovery-metadata-guide.md",
    "docs/developer-distribution-checklist.md",
    "docs/global-developer-sharing-copy.md",
    "docs/agent-readable-distribution-note.md",
    "docs/public-repo-commercial-conversion-review.md",
    "docs/public-reviewer-and-paid-pilot-enquiry-pack.md",
    "docs/buyer-use-cases-and-revenue-triggers.md",
    "docs/revenue-trigger-map.md",
    "docs/paid-review-scope-examples.md",
    "docs/paid-pilot-readiness-review.md",
    "docs/paid-pilot-enquiry-checklist.md",
    "docs/pricing-and-paid-pilot-menu.md",
    "docs/paid-pilot-offer.md",
    "docs/commercial-payment-capture-pack.md",
    "docs/agent-readable-discovery-and-system-metadata.md",
    "docs/system-integration-metadata.md",
    "docs/p3-mission-register.md",
    "docs/public-launch-record.md",
    "PUBLIC_LAUNCH_CHECKLIST.md",
    "RELEASE_NOTES.md",
    "CHANGELOG.md",
  ];
  for (const path of paths) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(read(path), /P3-M131/, path);
  }
});

test("public contact old-email absence and core safety line are preserved", () => {
  const combined = [
    read("README.md"),
    ...docs.map((path) => read(path)),
    read("llms.txt"),
    read("agent-trust-gate.agent-card.json"),
    read("agent-trust-gate.manifest.json"),
  ].join("\n");
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  assert.match(combined, new RegExp(escapeRegExp(AGENT_PROOF_INTEGRATION_CORE_LINE)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("agent proof integration pack introduces no forbidden live-action or overclaim language", () => {
  const combined = [
    read("README.md"),
    ...docs.map((path) => read(path)),
    read("llms.txt"),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
    read("RELEASE_NOTES.md"),
    read("CHANGELOG.md"),
    read("agent-trust-gate.agent-card.json"),
    read("agent-trust-gate.manifest.json"),
  ].join("\n");

  for (const forbidden of [
    /\bAgent Trust Gate(?:™)? is production-ready\b/i,
    /\bproduction readiness is (?:approved|complete|ready)\b/i,
    /\blive payment\/settlement readiness is (?:approved|complete|ready)\b/i,
    /\blegal\/compliance\/security certification is (?:granted|active|available)\b/i,
    /\bidentity\/authentication certification is (?:granted|active|available)\b/i,
    /\buniversal agent standard is (?:approved|active|available|ratified)\b/i,
    /\bguaranteed agent adoption is (?:available|confirmed|proved)\b/i,
    /\bguaranteed buyer demand is (?:available|confirmed|proved)\b/i,
    /\bguaranteed paid pilot conversion is (?:available|confirmed|proved)\b/i,
    /\bautomatic access after payment is granted\b/i,
    /\bautomatic paid-pilot acceptance is (?:approved|granted|active|available)\b/i,
    /\blive systems contact is (?:enabled|active|available|configured)\b/i,
    /\bdirect bot messaging is (?:enabled|active|available|configured)\b/i,
    /\blive API is (?:enabled|active|available|configured)\b/i,
    /\bMCP server (?:is|has been) (?:enabled|active|available|configured|created)\b/i,
    /\blive agent-to-agent communication is (?:enabled|active|available|configured)\b/i,
    /\bautomates outreach\b/i,
    /\bscrapes contacts\b/i,
    /\bharvests contacts\b/i,
    /\btracking is (?:enabled|active|available|configured)\b/i,
    /\banalytics (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bpaid ads are (?:enabled|active|available|configured)\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bcheckout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bwallet\/banking logic is (?:enabled|active|available|configured)\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
    /\bdeployment is (?:performed|active|available|configured)\b/i,
    /\bexternal-agent contact is (?:enabled|active|available|configured)\b/i,
    /\bproduction signing is (?:enabled|active|available|configured)\b/i,
    /\bAUC is integrated\b/i,
    /\bAgent Contact System is integrated\b/i,
    /\bexecutes actions\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("all repository JSON examples schemas and metadata remain valid", () => {
  const jsonFiles = [
    ...jsonFilesUnder("examples"),
    ...jsonFilesUnder("schemas"),
    "agent-trust-gate.manifest.json",
    "agent-trust-gate.agent-card.json",
  ];
  assert.ok(jsonFiles.length > 300);
  for (const path of jsonFiles) assert.doesNotThrow(() => JSON.parse(read(path)), path);
});
