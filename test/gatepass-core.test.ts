import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  GATEPASS_CORE_EXAMPLE_FILES,
  GATEPASS_CORE_LINE,
  GATEPASS_CORE_POSITIONING,
  classifyGatePassProfile,
  createGatePassCoreExampleInputs,
  explainGatePassCore,
  runGatePassCoreDemo,
  runGatePassCoreScenario,
  validateGatePassCore,
  type GatePassCore,
  type GatePassCoreDemoPack,
  type GatePassCoreExampleId,
  type GatePassCoreExplanation,
  type GatePassCoreValidationResult,
} from "../src/gatepass-core.js";
import { runGatePassCoreCli } from "../src/gatepass-core-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/minimal-gatepass-core-specification.md",
  "docs/gatepass-field-guide.md",
  "docs/gatepass-minimal-profile.md",
  "docs/gatepass-proofpackage-consolidation.md",
  "docs/why-minimal-gatepass-matters.md",
];
const mainDoc = "docs/minimal-gatepass-core-specification.md";
const schemaPath = "schemas/gatepass-core.schema.json";
const corePhrases = [
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
  "No signed GatePass. No settlement.",
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

function assertSafe(
  value: GatePassCore | GatePassCoreValidationResult | GatePassCoreDemoPack | GatePassCoreExplanation,
): void {
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
  assert.equal(value.productionGradeCrypto, false);
  assert.equal(value.productionCertification, false);
  assert.equal(value.actionExecution, false);
  if ("noProofMeansNoPermission" in value) assert.equal(value.noProofMeansNoPermission, true);
}

test("GatePass core docs schema and README links exist with command and core phrases", () => {
  const readme = read("README.md");
  for (const path of [...docs, schemaPath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /npm run demo:gatepass-core/);
  assert.match(read("package.json"), /demo:gatepass-core/);
  for (const phrase of corePhrases) {
    assert.match(readme, new RegExp(escapeRegExp(phrase)), phrase);
    assert.match(read(mainDoc), new RegExp(escapeRegExp(phrase)), phrase);
  }
  assert.match(read(mainDoc), new RegExp(escapeRegExp(GATEPASS_CORE_LINE)));
  assert.match(read(mainDoc), new RegExp(escapeRegExp(contactEmail)));
});

test("GatePass core model and CLI script exist", () => {
  assert.equal(existsSync(join(root, "src/gatepass-core.ts")), true);
  assert.equal(existsSync(join(root, "src/gatepass-core-cli.ts")), true);
  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:gatepass-core"] ?? "", /gatepass-core-cli\.js --pretty/);
});

test("GatePass schema examples and generated local inputs are valid JSON and deterministic", () => {
  assert.doesNotThrow(() => readJson<unknown>(schemaPath));
  const generated = createGatePassCoreExampleInputs();
  for (const [exampleId, path] of Object.entries(GATEPASS_CORE_EXAMPLE_FILES)) {
    assert.equal(existsSync(join(root, path)), true, path);
    const example = readJson<GatePassCore>(path);
    assert.deepEqual(example, generated[exampleId as GatePassCoreExampleId], path);
    assertSafe(example);
  }
});

test("valid low-risk and valid sensitive tool GatePass pass locally only", () => {
  const lowRisk = runGatePassCoreScenario("gatepass_core_valid_local_low_risk");
  assert.equal(lowRisk.profile, "low_risk_action");
  assert.equal(lowRisk.decision, "allow");
  assert.equal(lowRisk.validLocally, true);
  assertSafe(lowRisk);

  const sensitive = runGatePassCoreScenario("gatepass_core_sensitive_tool_valid");
  assert.equal(sensitive.profile, "sensitive_tool_call");
  assert.equal(sensitive.decision, "allow");
  assert.equal(sensitive.validLocally, true);
  assertSafe(sensitive);
});

test("high-risk GatePass requires human review and pre-settlement valid profile requires signed GatePass", () => {
  const highRisk = runGatePassCoreScenario("gatepass_core_high_risk_human_review");
  assert.equal(highRisk.profile, "high_risk_human_review");
  assert.equal(highRisk.decision, "require_human_review");
  assert.ok(highRisk.missingFields.includes("approval"));
  assertSafe(highRisk);

  const preSettlement = runGatePassCoreScenario("gatepass_core_pre_settlement_valid_local");
  assert.equal(preSettlement.profile, "pre_settlement");
  assert.equal(preSettlement.decision, "allow");
  assert.ok(preSettlement.reasons.includes("pre_settlement_signed_gatepass_required"));
  assert.ok(preSettlement.gatePassMeaning.mayProveLocally.includes(
    "pre_settlement_profile_requires_signed_gatepass_before_any_settlement_sensitive_flow",
  ));
  assertSafe(preSettlement);
});

test("identity-only missing mandate missing evidence stale expiry and missing pre-settlement signature fail locally", () => {
  const identityOnly = runGatePassCoreScenario("gatepass_core_identity_only_invalid");
  assert.equal(identityOnly.profile, "identity_only_invalid");
  assert.equal(identityOnly.decision, "block");
  assert.ok(identityOnly.reasons.includes("claimed_identity_only_is_not_proof"));
  assertSafe(identityOnly);

  const missingMandate = runGatePassCoreScenario("gatepass_core_missing_mandate_invalid");
  assert.equal(missingMandate.decision, "block");
  assert.ok(missingMandate.missingFields.includes("mandate"));
  assertSafe(missingMandate);

  const missingEvidence = runGatePassCoreScenario("gatepass_core_missing_evidence_invalid");
  assert.equal(missingEvidence.decision, "require_evidence");
  assert.ok(missingEvidence.missingFields.includes("evidence"));
  assertSafe(missingEvidence);

  const stale = runGatePassCoreScenario("gatepass_core_stale_expiry_invalid");
  assert.equal(stale.decision, "block");
  assert.ok(stale.reasons.includes("gatepass_expired_or_stale"));
  assertSafe(stale);

  const missingSignature = runGatePassCoreScenario("gatepass_core_missing_signature_pre_settlement_invalid");
  assert.equal(missingSignature.profile, "pre_settlement");
  assert.equal(missingSignature.decision, "require_signed_proof");
  assert.ok(missingSignature.missingFields.includes("signature"));
  assertSafe(missingSignature);
});

test("GatePass explanation and classifier keep claimed identity from becoming trust", () => {
  const examples = createGatePassCoreExampleInputs();
  assert.equal(classifyGatePassProfile(examples.gatepass_core_identity_only_invalid), "identity_only_invalid");
  const result = validateGatePassCore(examples.gatepass_core_identity_only_invalid);
  assert.equal(result.claimedIdentityAloneSufficient, false);
  assert.equal(result.noProofMeansNoPermission, true);

  const explanation = explainGatePassCore(examples.gatepass_core_sensitive_tool_valid);
  assert.equal(explanation.profile, "sensitive_tool_call");
  assert.ok(explanation.localChecks.includes("claimed_identity_alone_is_not_trust"));
  assert.ok(explanation.localChecks.includes("signed_gatepass_required_for_pre_settlement_profile"));
  assertSafe(explanation);
});

test("GatePass demo pack summarizes deterministic local outcomes", () => {
  const pack = runGatePassCoreDemo();
  assert.equal(pack.coreLine, GATEPASS_CORE_LINE);
  assert.deepEqual(pack.positioning, GATEPASS_CORE_POSITIONING);
  assert.equal(pack.exampleCount, 9);
  assert.equal(pack.decisions.allow, 3);
  assert.equal(pack.decisions.block, 3);
  assert.equal(pack.decisions.escalate, 0);
  assert.equal(pack.decisions.require_evidence, 1);
  assert.equal(pack.decisions.require_human_review, 1);
  assert.equal(pack.decisions.require_signed_proof, 1);
  assertSafe(pack);
  for (const example of Object.values(pack.examples)) {
    assertSafe(example.gatePass);
    assertSafe(example.result);
    assertSafe(example.explanation);
  }
});

test("GatePass CLI emits summary example and result output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runGatePassCoreCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as GatePassCoreDemoPack;
  assert.equal(summary.exampleCount, 9);
  assert.equal("examples" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/gatepass-core-cli.js"),
    "--example",
    "gatepass_core_missing_signature_pre_settlement_invalid",
    "--result-only",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal((JSON.parse(compiled.stdout) as GatePassCoreValidationResult).decision, "require_signed_proof");
});

test("P3-M133 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/enforceable-local-tool-calling-gate-demo.md",
    "docs/local-tool-call-gate-wrapper-guide.md",
    "docs/mock-sensitive-tools-catalog.md",
    "docs/tool-call-enforcement-scenarios.md",
    "docs/what-the-enforceable-tool-gate-demo-proves.md",
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
    assert.match(read(path), /P3-M133/, path);
  }
});

test("public contact old-email absence and core GatePass line are preserved", () => {
  const combined = [
    read("README.md"),
    ...docs.map((path) => read(path)),
    read("llms.txt"),
    read("agent-trust-gate.agent-card.json"),
    read("agent-trust-gate.manifest.json"),
  ].join("\n");
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  assert.match(combined, new RegExp(escapeRegExp(GATEPASS_CORE_LINE)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("GatePass core pack introduces no forbidden live-action production crypto or overclaim language", () => {
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
    /\bproduction-grade crypto is (?:enabled|active|available|configured|provided)\b/i,
    /\bproduction-grade cryptography is (?:enabled|active|available|configured|provided)\b/i,
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
