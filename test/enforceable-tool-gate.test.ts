import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  ENFORCEABLE_TOOL_GATE_CORE_LINE,
  ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES,
  ENFORCEABLE_TOOL_GATE_POSITIONING,
  runEnforceableToolGateDemo,
  runEnforceableToolGateScenario,
  type EnforceableToolGateDemoPack,
  type EnforceableToolGateResult,
  type EnforceableToolGateScenarioId,
} from "../src/enforceable-tool-gate.js";
import { runEnforceableToolGateCli } from "../src/enforceable-tool-gate-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/enforceable-local-tool-calling-gate-demo.md",
  "docs/local-tool-call-gate-wrapper-guide.md",
  "docs/mock-sensitive-tools-catalog.md",
  "docs/tool-call-enforcement-scenarios.md",
  "docs/what-the-enforceable-tool-gate-demo-proves.md",
];
const mainDoc = "docs/enforceable-local-tool-calling-gate-demo.md";
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

function assertSafe(value: EnforceableToolGateResult | EnforceableToolGateDemoPack): void {
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
  if ("realToolExecuted" in value) {
    assert.equal(value.realToolExecuted, false);
    assert.equal(value.wouldExecute, false);
    assert.equal(value.mockToolInvoked, false);
    assert.equal(value.noProofMeansNoPermission, true);
    assert.equal(value.receiptSummary.realToolExecuted, false);
  }
}

test("enforceable tool gate docs exist and README links them with command and core phrases", () => {
  const readme = read("README.md");
  for (const path of docs) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
    assert.match(read(path), new RegExp(escapeRegExp(contactEmail)), path);
  }
  assert.match(readme, /npm run demo:enforceable-tool-gate/);
  for (const phrase of corePhrases) {
    assert.match(readme, new RegExp(escapeRegExp(phrase)), phrase);
    assert.match(read(mainDoc), new RegExp(escapeRegExp(phrase)), phrase);
  }
  assert.match(read(mainDoc), new RegExp(escapeRegExp(ENFORCEABLE_TOOL_GATE_CORE_LINE)));
});

test("enforceable tool gate model and demo script exist", () => {
  assert.equal(existsSync(join(root, "src/enforceable-tool-gate.ts")), true);
  assert.equal(existsSync(join(root, "src/enforceable-tool-gate-cli.ts")), true);
  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:enforceable-tool-gate"] ?? "", /enforceable-tool-gate-cli\.js --pretty/);
});

test("required enforceable tool gate scenarios produce expected decisions", () => {
  const expected: Record<EnforceableToolGateScenarioId, EnforceableToolGateResult["decision"]> = {
    public_post_allowed_local: "allow",
    customer_message_escalated: "escalate",
    data_export_blocked: "block",
    prepare_payment_requires_signed_proof: "require_signed_proof",
    procurement_stale_proof_blocked: "block",
    high_risk_human_review: "require_human_review",
    settlement_instruction_blocked: "block",
    valid_local_control: "allow",
    missing_proof_requires_evidence: "require_evidence",
  };
  for (const [scenarioId, decision] of Object.entries(expected)) {
    const result = runEnforceableToolGateScenario(scenarioId as EnforceableToolGateScenarioId);
    assert.equal(result.decision, decision, scenarioId);
    assert.ok(result.reasons.includes("mock_tool_call_intercepted"), scenarioId);
    assert.ok(result.reasons.includes("no_real_tool_execution"), scenarioId);
    assertSafe(result);
  }
});

test("valid local proof and public post allow locally only", () => {
  const publicPost = runEnforceableToolGateScenario("public_post_allowed_local");
  assert.equal(publicPost.toolName, "publish_public_post");
  assert.equal(publicPost.decision, "allow");
  assert.equal(publicPost.wouldAllowLocally, true);
  assert.equal(publicPost.proofContractDecision, "allow");
  assertSafe(publicPost);

  const control = runEnforceableToolGateScenario("valid_local_control");
  assert.equal(control.toolName, "write_file");
  assert.equal(control.decision, "allow");
  assert.equal(control.wouldAllowLocally, true);
  assertSafe(control);
});

test("missing proof blocks permission by requiring evidence", () => {
  const result = runEnforceableToolGateScenario("missing_proof_requires_evidence");
  assert.equal(result.decision, "require_evidence");
  assert.equal(result.proofContractDecision, "not_evaluated_missing_proof");
  assert.equal(result.proofContractResult, null);
  assert.ok(result.reasons.includes("proof_package_missing"));
  assert.ok(result.missingProofItems.includes("agentProofPackage"));
  assert.ok(result.missingProofItems.includes("mandateReference"));
  assert.ok(result.missingProofItems.includes("evidenceReference"));
  assertSafe(result);
});

test("customer message without approval escalates and data export without mandate blocks", () => {
  const customer = runEnforceableToolGateScenario("customer_message_escalated");
  assert.equal(customer.toolName, "send_customer_message");
  assert.equal(customer.decision, "escalate");
  assert.ok(customer.reasons.includes("required_human_approval_missing"));
  assertSafe(customer);

  const dataExport = runEnforceableToolGateScenario("data_export_blocked");
  assert.equal(dataExport.toolName, "export_data");
  assert.equal(dataExport.decision, "block");
  assert.ok(dataExport.reasons.includes("mandate_missing_blocks_tool_call"));
  assert.ok(dataExport.missingProofItems.includes("mandateReference"));
  assertSafe(dataExport);
});

test("payment preparation requires signed proof and stale proof blocks", () => {
  const payment = runEnforceableToolGateScenario("prepare_payment_requires_signed_proof");
  assert.equal(payment.toolName, "prepare_payment");
  assert.equal(payment.decision, "require_signed_proof");
  assert.ok(payment.reasons.includes("signed_proof_required_before_tool_call"));
  assert.ok(payment.missingProofItems.includes("signedProofReference"));
  assertSafe(payment);

  const stale = runEnforceableToolGateScenario("procurement_stale_proof_blocked");
  assert.equal(stale.toolName, "approve_procurement");
  assert.equal(stale.decision, "block");
  assert.ok(stale.reasons.includes("stale_freshness_blocks_tool_call"));
  assert.ok(stale.reasons.includes("replayed_nonce_blocks_tool_call"));
  assertSafe(stale);
});

test("high-risk action requires human review and settlement instruction without signed gate pass blocks", () => {
  const highRisk = runEnforceableToolGateScenario("high_risk_human_review");
  assert.equal(highRisk.toolName, "escalate_access_session");
  assert.equal(highRisk.decision, "require_human_review");
  assert.ok(highRisk.reasons.includes("required_human_approval_missing"));
  assertSafe(highRisk);

  const settlement = runEnforceableToolGateScenario("settlement_instruction_blocked");
  assert.equal(settlement.toolName, "create_settlement_instruction");
  assert.equal(settlement.decision, "block");
  assert.ok(settlement.reasons.includes("settlement_instruction_without_signed_gate_pass_blocks"));
  assert.ok(settlement.missingProofItems.includes("signedProofReference"));
  assertSafe(settlement);
});

test("demo pack covers all local outcomes and no real tool is executed", () => {
  const pack = runEnforceableToolGateDemo();
  assert.equal(pack.coreLine, ENFORCEABLE_TOOL_GATE_CORE_LINE);
  assert.deepEqual(pack.positioning, ENFORCEABLE_TOOL_GATE_POSITIONING);
  assert.equal(pack.scenarioCount, 9);
  assert.equal(pack.decisions.allow, 2);
  assert.equal(pack.decisions.block, 3);
  assert.equal(pack.decisions.escalate, 1);
  assert.equal(pack.decisions.require_evidence, 1);
  assert.equal(pack.decisions.require_human_review, 1);
  assert.equal(pack.decisions.require_signed_proof, 1);
  assertSafe(pack);
  for (const scenario of pack.scenarios) assertSafe(scenario);
});

test("enforceable tool gate example JSON files match deterministic local outputs", () => {
  for (const [scenarioId, path] of Object.entries(ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES)) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.deepEqual(
      readJson<EnforceableToolGateResult>(path),
      runEnforceableToolGateScenario(scenarioId as EnforceableToolGateScenarioId),
      path,
    );
  }
});

test("enforceable tool gate CLI emits summary and scenario output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runEnforceableToolGateCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as EnforceableToolGateDemoPack;
  assert.equal(summary.scenarioCount, 9);
  assert.equal("scenarios" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/enforceable-tool-gate-cli.js"),
    "--scenario",
    "settlement_instruction_blocked",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0);
  assert.equal((JSON.parse(compiled.stdout) as EnforceableToolGateResult).decision, "block");
});

test("P3-M132 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/agent-proof-contract-integration-readiness.md",
    "docs/local-agent-workflow-integration-guide.md",
    "docs/tool-calling-proof-gate-adapter-guide.md",
    "docs/pre-settlement-proof-contract-integration.md",
    "docs/integration-readiness-checklist.md",
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
    assert.match(read(path), /P3-M132/, path);
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
  assert.match(combined, new RegExp(escapeRegExp(ENFORCEABLE_TOOL_GATE_CORE_LINE)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("enforceable tool gate pack introduces no forbidden live-action or overclaim language", () => {
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
    /\breal tool execution is (?:enabled|active|available|configured)\b/i,
    /\bexecutes real tools\b/i,
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
