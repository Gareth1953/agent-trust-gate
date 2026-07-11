import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  PROVE_YOURSELF_CORE_LINE,
  PROVE_YOURSELF_EXAMPLE_FILES,
  PROVE_YOURSELF_POSITIONING,
  createProveYourselfExampleInputs,
  evaluateProveYourselfPackage,
  runProveYourselfProtocolExamples,
  runProveYourselfProtocolScenario,
  type ProveYourselfProtocolResult,
  type ProveYourselfProtocolSafetyFlags,
  type ProveYourselfScenarioId,
} from "../src/prove-yourself-protocol.js";
import { runProveYourselfProtocolCli } from "../src/prove-yourself-protocol-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/agent-trust-invitation-and-prove-yourself-protocol.md",
  "docs/agent-proof-requirements.md",
  "docs/system-side-agent-verification-guide.md",
  "docs/agent-owner-trust-presentation-guide.md",
  "docs/what-a-gate-pass-proves.md",
];
const mainDoc = "docs/agent-trust-invitation-and-prove-yourself-protocol.md";
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

function assertSafe(value: ProveYourselfProtocolSafetyFlags): void {
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
}

test("prove-yourself docs exist and README links them with core phrases", () => {
  const readme = read("README.md");
  for (const path of docs) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
    assert.match(read(path), new RegExp(escapeRegExp(PROVE_YOURSELF_CORE_LINE)), path);
    assert.match(read(path), new RegExp(escapeRegExp(contactEmail)), path);
  }
  for (const phrase of corePhrases) {
    assert.match(readme, new RegExp(escapeRegExp(phrase)), phrase);
    assert.match(read(mainDoc), new RegExp(escapeRegExp(phrase)), phrase);
  }
});

test("proof requirement and gate-pass docs explain required proof and limits", () => {
  const requirements = read("docs/agent-proof-requirements.md");
  for (const expected of [
    "claimed agent identity",
    "owner / issuer reference",
    "mandate reference",
    "permitted action scope",
    "evidence reference",
    "verified intent status",
    "human approval status",
    "risk tier",
    "freshness / expiry",
    "nonce / replay-protection status",
    "signed receipt or signed proof reference",
    "session context",
    "local-only evaluation result",
    "No proof means no permission",
  ]) {
    assert.match(requirements, new RegExp(escapeRegExp(expected), "i"), expected);
  }

  const gatePass = read("docs/what-a-gate-pass-proves.md");
  for (const expected of [
    "what a gate pass may prove locally",
    "What A Gate Pass Does Not Prove",
    "scoped",
    "fresh",
    "non-replayable",
    "signed proof",
    "universal identity",
    "legal/compliance/security certification",
    "no settlement should proceed without a valid",
  ]) {
    assert.match(gatePass, new RegExp(escapeRegExp(expected), "i"), expected);
  }
});

test("prove-yourself protocol model exists and claimed identity alone is blocked", () => {
  assert.equal(existsSync(join(root, "src/prove-yourself-protocol.ts")), true);
  const result = evaluateProveYourselfPackage({
    ...createProveYourselfExampleInputs().claimed_identity_only_blocked,
    scenarioId: "identity_only_custom",
  });
  assert.equal(result.decision, "block");
  assert.equal(result.claimedIdentityAloneTrusted, false);
  assert.equal(result.noProofMeansNoPermission, true);
  assert.ok(result.reasons.includes("claimed_identity_not_trust"));
  assert.ok(result.reasons.includes("mandate_missing"));
  assert.ok(result.reasons.includes("evidence_missing"));
  assertSafe(result);
});

test("required prove-yourself scenarios produce expected outcomes", () => {
  const expected: Record<ProveYourselfScenarioId, ProveYourselfProtocolResult["decision"]> = {
    valid_local_control: "allow",
    claimed_identity_only_blocked: "block",
    missing_mandate_blocked: "block",
    missing_evidence_requires_evidence: "require_evidence",
    unverified_intent_escalated: "escalate",
    replayed_proof_blocked: "block",
    high_risk_human_review: "require_human_review",
    settlement_sensitive_requires_signed_proof: "require_signed_proof",
  };
  for (const [scenarioId, decision] of Object.entries(expected)) {
    const result = runProveYourselfProtocolScenario(scenarioId as ProveYourselfScenarioId);
    assert.equal(result.decision, decision, scenarioId);
    assert.equal(result.claimedIdentityAloneTrusted, false);
    assert.equal(result.noProofMeansNoPermission, true);
    assert.ok(result.reasons.includes("claimed_identity_not_trust"), scenarioId);
    assertSafe(result);
  }
  assert.ok(runProveYourselfProtocolScenario("missing_mandate_blocked").reasons.includes("mandate_missing"));
  assert.ok(runProveYourselfProtocolScenario("missing_evidence_requires_evidence").reasons.includes("evidence_missing"));
  assert.ok(runProveYourselfProtocolScenario("unverified_intent_escalated").reasons.includes("verified_intent_unverified"));
  assert.ok(runProveYourselfProtocolScenario("replayed_proof_blocked").reasons.includes("nonce_replayed"));
  assert.ok(runProveYourselfProtocolScenario("replayed_proof_blocked").reasons.includes("freshness_stale"));
  assert.ok(runProveYourselfProtocolScenario("high_risk_human_review").reasons.includes("risk_high_requires_human_review"));
  assert.ok(runProveYourselfProtocolScenario("settlement_sensitive_requires_signed_proof").reasons.includes("signed_proof_missing"));
});

test("local pack covers decisions and preserves disabled safety flags", () => {
  const pack = runProveYourselfProtocolExamples();
  assert.equal(pack.coreLine, PROVE_YOURSELF_CORE_LINE);
  assert.deepEqual(pack.positioning, PROVE_YOURSELF_POSITIONING);
  assert.equal(pack.scenarioCount, 8);
  assert.equal(pack.decisions.allow, 1);
  assert.equal(pack.decisions.block, 3);
  assert.equal(pack.decisions.escalate, 1);
  assert.equal(pack.decisions.require_evidence, 1);
  assert.equal(pack.decisions.require_human_review, 1);
  assert.equal(pack.decisions.require_signed_proof, 1);
  assertSafe(pack);
  for (const scenario of pack.scenarios) assertSafe(scenario);
});

test("prove-yourself example JSON files match deterministic local outputs", () => {
  for (const [scenarioId, path] of Object.entries(PROVE_YOURSELF_EXAMPLE_FILES)) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.deepEqual(
      readJson<ProveYourselfProtocolResult>(path),
      runProveYourselfProtocolScenario(scenarioId as ProveYourselfScenarioId),
      path,
    );
  }
});

test("CLI emits local pack summary and package script is registered", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runProveYourselfProtocolCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as ReturnType<typeof runProveYourselfProtocolExamples>;
  assert.equal(summary.scenarioCount, 8);
  assert.equal("scenarios" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/prove-yourself-protocol-cli.js"),
    "--scenario",
    "settlement_sensitive_requires_signed_proof",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0);
  assert.equal((JSON.parse(compiled.stdout) as ProveYourselfProtocolResult).decision, "require_signed_proof");

  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:prove-yourself"] ?? "", /prove-yourself-protocol-cli\.js --pretty/);
});

test("P3-M129 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
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
    assert.match(read(path), /P3-M129/, path);
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
  assert.match(combined, new RegExp(escapeRegExp(PROVE_YOURSELF_CORE_LINE)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("prove-yourself pack introduces no forbidden live-action or overclaim language", () => {
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
    /\bidentity certification is (?:granted|active|available)\b/i,
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
