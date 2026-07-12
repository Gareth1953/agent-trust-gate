import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  GATEPASS_ROUND_TRIP_CORE_LINE,
  GATEPASS_ROUND_TRIP_EXAMPLE_FILES,
  GATEPASS_ROUND_TRIP_POSITIONING,
  createGatePassIntegrityHash,
  createGatePassRoundTripScenarioInputs,
  createLocalGatePass,
  explainGatePassDecision,
  rejectGatePass,
  runGatePassRoundTripDemo,
  runGatePassRoundTripScenario,
  verifyLocalGatePass,
  type GatePassRoundTripDemoPack,
  type GatePassRoundTripResult,
  type GatePassRoundTripScenarioId,
} from "../src/gatepass-round-trip.js";
import { runGatePassRoundTripCli } from "../src/gatepass-round-trip-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/gatepass-create-verify-reject-round-trip.md",
  "docs/gatepass-round-trip-developer-guide.md",
  "docs/gatepass-rejection-reason-catalog.md",
  "docs/gatepass-round-trip-threat-model.md",
  "docs/what-the-gatepass-round-trip-proves.md",
];
const mainDoc = "docs/gatepass-create-verify-reject-round-trip.md";
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

function assertSafe(value: GatePassRoundTripResult | GatePassRoundTripDemoPack): void {
  assert.equal(value.localDemoOnly, true);
  assert.equal(value.localOnly, true);
  assert.equal(value.realToolExecuted, false);
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
  if ("receiptSummary" in value) {
    assert.equal(value.receiptSummary.realToolExecuted, false);
    assert.equal(value.receiptSummary.actionExecution, false);
  }
}

test("GatePass round-trip docs README links command and core phrases are present", () => {
  const readme = read("README.md");
  for (const path of docs) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /npm run demo:gatepass-round-trip/);
  assert.match(read("package.json"), /demo:gatepass-round-trip/);
  for (const phrase of corePhrases) {
    assert.match(readme, new RegExp(escapeRegExp(phrase)), phrase);
    assert.match(read(mainDoc), new RegExp(escapeRegExp(phrase)), phrase);
  }
  assert.match(read(mainDoc), new RegExp(escapeRegExp(GATEPASS_ROUND_TRIP_CORE_LINE)));
  assert.match(read(mainDoc), new RegExp(escapeRegExp(contactEmail)));
});

test("GatePass round-trip model and demo script exist", () => {
  assert.equal(existsSync(join(root, "src/gatepass-round-trip.ts")), true);
  assert.equal(existsSync(join(root, "src/gatepass-round-trip-cli.ts")), true);
  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:gatepass-round-trip"] ?? "", /gatepass-round-trip-cli\.js --pretty/);
});

test("GatePass round-trip examples are valid deterministic JSON", () => {
  const generated = runGatePassRoundTripDemo().scenarios;
  for (const [scenarioId, path] of Object.entries(GATEPASS_ROUND_TRIP_EXAMPLE_FILES)) {
    assert.equal(existsSync(join(root, path)), true, path);
    const example = readJson<GatePassRoundTripResult>(path);
    assert.deepEqual(example, generated[scenarioId as GatePassRoundTripScenarioId], path);
    assertSafe(example);
  }
});

test("valid local GatePass can be created and verified locally", () => {
  const inputs = createGatePassRoundTripScenarioInputs();
  const gatePass = createLocalGatePass(inputs.valid_allow_local);
  const result = verifyLocalGatePass(gatePass, {
    scenarioId: "valid_allow_local",
    expectedAudience: gatePass.aud,
    expectedAction: "read_public_docs",
    expectedIntegrityHash: createGatePassIntegrityHash(gatePass),
    consumedNonces: [],
    settlementSensitive: false,
    requireSignedGatePass: false,
    localDemoOnly: true,
    localOnly: true,
    liveSystemsContact: false,
    directBotMessaging: false,
    autonomousOutreach: false,
    outreachAutomation: false,
    liveAgentToAgentCommunication: false,
    externalAgentContact: false,
    liveApi: false,
    mcpServer: false,
    cloudNetworkCall: false,
    secretsOrCredentials: false,
    paymentAuthorisation: false,
    settlementAuthorisation: false,
    walletBankingLogic: false,
    productionSigning: false,
    productionGradeCrypto: false,
    productionCertification: false,
    actionExecution: false,
    realToolExecuted: false,
  });
  assert.equal(result.decision, "allow");
  assert.equal(result.validLocallyOnly, true);
  assert.equal(result.receiptSummary.wouldAllowLocally, true);
  assertSafe(result);
});

test("round-trip rejects identity-only missing mandate stale replayed and tampered GatePasses", () => {
  const identityOnly = runGatePassRoundTripScenario("identity_only_rejected");
  assert.equal(identityOnly.decision, "block");
  assert.ok(identityOnly.rejectionReasons.includes("identity_only_not_sufficient"));
  assertSafe(identityOnly);

  const missingMandate = runGatePassRoundTripScenario("missing_mandate_rejected");
  assert.equal(missingMandate.decision, "block");
  assert.ok(missingMandate.rejectionReasons.includes("missing_mandate"));
  assertSafe(missingMandate);

  const stale = runGatePassRoundTripScenario("stale_expiry_rejected");
  assert.equal(stale.decision, "block");
  assert.ok(stale.rejectionReasons.includes("stale_expiry"));
  assertSafe(stale);

  const replayed = runGatePassRoundTripScenario("replayed_nonce_rejected");
  assert.equal(replayed.decision, "block");
  assert.ok(replayed.rejectionReasons.includes("replayed_nonce"));
  assertSafe(replayed);

  const tampered = runGatePassRoundTripScenario("tampered_scope_rejected");
  assert.equal(tampered.decision, "block");
  assert.ok(tampered.rejectionReasons.includes("tampered_gatepass"));
  assert.ok(tampered.rejectionReasons.includes("scope_mismatch"));
  assertSafe(tampered);
});

test("round-trip requires evidence human review or signed proof where appropriate", () => {
  const missingEvidence = runGatePassRoundTripScenario("missing_evidence_requires_evidence");
  assert.equal(missingEvidence.decision, "require_evidence");
  assert.ok(missingEvidence.rejectionReasons.includes("missing_evidence"));
  assertSafe(missingEvidence);

  const highRisk = runGatePassRoundTripScenario("high_risk_human_review");
  assert.equal(highRisk.decision, "require_human_review");
  assert.ok(highRisk.rejectionReasons.includes("high_risk_requires_human_review"));
  assertSafe(highRisk);

  const preSettlementMissing = runGatePassRoundTripScenario("pre_settlement_requires_signed_proof");
  assert.equal(preSettlementMissing.decision, "require_signed_proof");
  assert.ok(preSettlementMissing.rejectionReasons.includes("settlement_requires_signed_gatepass"));
  assertSafe(preSettlementMissing);

  const preSettlementValid = runGatePassRoundTripScenario("pre_settlement_valid_local");
  assert.equal(preSettlementValid.decision, "allow");
  assert.equal(preSettlementValid.validLocallyOnly, true);
  assertSafe(preSettlementValid);
});

test("manual reject and explanation keep no-proof no-permission boundary", () => {
  const invalid = runGatePassRoundTripScenario("identity_only_rejected").gatePass;
  const result = rejectGatePass(invalid, "identity_only_not_sufficient");
  assert.equal(result.decision, "block");
  assert.ok(explainGatePassDecision(result).some((line) => line.includes("Claimed agent identity alone")));
  assert.equal(result.claimedIdentityAloneSufficient, false);
  assert.equal(result.noProofMeansNoPermission, true);
  assertSafe(result);
});

test("GatePass round-trip demo pack summarizes deterministic local outcomes", () => {
  const pack = runGatePassRoundTripDemo();
  assert.equal(pack.coreLine, GATEPASS_ROUND_TRIP_CORE_LINE);
  assert.deepEqual(pack.positioning, GATEPASS_ROUND_TRIP_POSITIONING);
  assert.equal(pack.scenarioCount, 10);
  assert.equal(pack.decisions.allow, 2);
  assert.equal(pack.decisions.block, 5);
  assert.equal(pack.decisions.escalate, 0);
  assert.equal(pack.decisions.require_evidence, 1);
  assert.equal(pack.decisions.require_human_review, 1);
  assert.equal(pack.decisions.require_signed_proof, 1);
  assertSafe(pack);
  for (const scenario of Object.values(pack.scenarios)) assertSafe(scenario);
});

test("GatePass round-trip CLI emits summary and scenario output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runGatePassRoundTripCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as GatePassRoundTripDemoPack;
  assert.equal(summary.scenarioCount, 10);
  assert.equal("scenarios" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/gatepass-round-trip-cli.js"),
    "--scenario",
    "replayed_nonce_rejected",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal((JSON.parse(compiled.stdout) as GatePassRoundTripResult).decision, "block");
});

test("P3-M134 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/minimal-gatepass-core-specification.md",
    "docs/gatepass-field-guide.md",
    "docs/gatepass-minimal-profile.md",
    "docs/gatepass-proofpackage-consolidation.md",
    "docs/why-minimal-gatepass-matters.md",
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
    assert.match(read(path), /P3-M134/, path);
  }
});

test("public contact old-email absence and GatePass core phrases are preserved", () => {
  const combined = [
    read("README.md"),
    ...docs.map((path) => read(path)),
    read("llms.txt"),
    read("agent-trust-gate.agent-card.json"),
    read("agent-trust-gate.manifest.json"),
  ].join("\n");
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  for (const phrase of corePhrases) assert.match(combined, new RegExp(escapeRegExp(phrase)), phrase);
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("GatePass round-trip pack introduces no forbidden live-action or overclaim language", () => {
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
