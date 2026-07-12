import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  GATEPASS_ADVERSARIAL_SCENARIOS,
  GATEPASS_ADVERSARIAL_SCORECARD_CORE_PHRASES,
  runGatePassAdversarialScorecard,
  summariseGatePassAdversarialScorecard,
  type GatePassAdversarialScenarioResult,
  type GatePassAdversarialScorecard,
  type GatePassAdversarialScorecardScenarioId,
} from "../src/gatepass-adversarial-scorecard.js";
import { runGatePassAdversarialScorecardCli } from "../src/gatepass-adversarial-scorecard-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/gatepass-adversarial-metrics-and-latency-scorecard.md",
  "docs/gatepass-metrics-methodology.md",
  "docs/gatepass-adversarial-scenario-catalog.md",
  "docs/gatepass-latency-measurement-guide.md",
  "docs/gatepass-reviewer-scorecard-guide.md",
];
const examplePath = "examples/gatepass-adversarial-scorecard.json";

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

function assertSafety(value: GatePassAdversarialScorecard | GatePassAdversarialScenarioResult): void {
  assert.equal(value.localDemoOnly, true);
  assert.equal(value.productionBenchmark, false);
  assert.equal(value.productionCertification, false);
  assert.equal(value.securityCertification, false);
  assert.equal(value.adversarialCompleteness, false);
  assert.equal(value.liveToolExecution, false);
  assert.equal(value.realToolExecution, false);
  assert.equal(value.actionExecution, false);
  assert.equal(value.paymentAuthorisation, false);
  assert.equal(value.settlementAuthorisation, false);
  assert.equal(value.networkCalls, false);
  assert.equal(value.liveSystemsContact, false);
  assert.equal(value.directBotMessaging, false);
  assert.equal(value.liveAgentToAgentCommunication, false);
  assert.equal(value.autonomousMarketing, false);
  assert.equal(value.hiddenViralDistribution, false);
  assert.equal(value.productionReadiness, false);
  assert.equal(value.legalComplianceSecurityGuarantee, false);
}

function byId(scorecard: GatePassAdversarialScorecard, id: GatePassAdversarialScorecardScenarioId): GatePassAdversarialScenarioResult {
  const result = scorecard.scenarioResults.find((scenario) => scenario.scenarioId === id);
  assert.ok(result, id);
  return result;
}

test("GatePass scorecard docs example README links and command exist", () => {
  const readme = read("README.md");
  for (const path of [...docs, examplePath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /npm run demo:gatepass-scorecard/);
  assert.match(readme, /npm run demo:gatepass-scorecard -- --summary-only/);
  assert.match(readme, /npm run demo:gatepass-scorecard -- --json/);
  assert.match(read("package.json"), /demo:gatepass-scorecard/);
});

test("scorecard model and CLI exist", () => {
  assert.equal(existsSync(join(root, "src/gatepass-adversarial-scorecard.ts")), true);
  assert.equal(existsSync(join(root, "src/gatepass-adversarial-scorecard-cli.ts")), true);
  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:gatepass-scorecard"] ?? "", /gatepass-adversarial-scorecard-cli\.js/);
});

test("machine-readable scorecard example is valid and preserves local-only flags", () => {
  const example = readJson<GatePassAdversarialScorecard>(examplePath);
  assert.equal(example.project, "Agent Trust Gate");
  assert.equal(example.localDemoOnly, true);
  assert.equal(example.productionBenchmark, false);
  assert.equal(example.productionCertification, false);
  assert.equal(example.securityCertification, false);
  assert.equal(example.adversarialCompleteness, false);
  assert.equal(example.liveToolExecution, false);
  assert.equal(example.actionExecution, false);
  assert.equal(example.paymentAuthorisation, false);
  assert.equal(example.settlementAuthorisation, false);
  assert.equal(example.networkCalls, false);
  assert.equal(example.publicContact, contactEmail);
  assert.equal(example.scenarioSummary.totalScenarios, 19);
  assert.equal(example.scenarioResults.length, 19);
});

test("scorecard includes expected summary counts timing fields and decision reasons", () => {
  const scorecard = runGatePassAdversarialScorecard();
  assertSafety(scorecard);
  assert.equal(GATEPASS_ADVERSARIAL_SCENARIOS.length, 19);
  assert.equal(scorecard.scenarioSummary.totalScenarios, 19);
  assert.equal(scorecard.scenarioSummary.matchedExpectedOutcomes, 19);
  assert.equal(scorecard.scenarioSummary.mismatchedExpectedOutcomes, 0);
  assert.equal(scorecard.scenarioSummary.adversarialScenarios, 17);
  assert.equal(scorecard.scenarioSummary.adversarialCaught, 17);
  assert.equal(scorecard.scenarioSummary.validScenarios, 2);
  assert.equal(scorecard.scenarioSummary.validAllowed, 2);
  assert.ok(scorecard.timingSummary.totalDurationMs >= 0);
  assert.ok(scorecard.timingSummary.averageDecisionMs >= 0);
  assert.ok(scorecard.timingSummary.minDecisionMs >= 0);
  assert.ok(scorecard.timingSummary.maxDecisionMs >= 0);
  assert.match(scorecard.timingSummary.timingNote, /not a production benchmark/);
  for (const result of scorecard.scenarioResults) {
    assertSafety(result);
    assert.equal(result.matchedExpectedOutcome, true, result.scenarioId);
    assert.ok(result.reasons.length > 0, result.scenarioId);
    assert.ok(result.timing.decisionDurationMs >= 0, result.scenarioId);
  }
});

test("scorecard catches GatePass adversarial scenarios and allows valid controls locally", () => {
  const scorecard = runGatePassAdversarialScorecard();
  assert.equal(byId(scorecard, "valid_low_risk_gatepass_allowed").actualDecision, "allow");
  assert.equal(byId(scorecard, "valid_pre_settlement_gatepass_allowed").actualDecision, "allow");
  assert.equal(byId(scorecard, "identity_only_claim_blocked").actualDecision, "block");
  assert.ok(byId(scorecard, "identity_only_claim_blocked").reasons.includes("identity_only_not_sufficient"));
  assert.equal(byId(scorecard, "missing_mandate_blocked").actualDecision, "block");
  assert.ok(byId(scorecard, "missing_mandate_blocked").reasons.includes("missing_mandate"));
  assert.equal(byId(scorecard, "missing_evidence_requires_evidence").actualDecision, "require_evidence");
  assert.equal(byId(scorecard, "stale_gatepass_blocked").actualDecision, "block");
  assert.ok(byId(scorecard, "stale_gatepass_blocked").reasons.includes("stale_expiry"));
  assert.equal(byId(scorecard, "replayed_nonce_blocked").actualDecision, "block");
  assert.ok(byId(scorecard, "replayed_nonce_blocked").reasons.includes("replayed_nonce"));
  assert.equal(byId(scorecard, "tampered_scope_blocked").actualDecision, "block");
  assert.equal(byId(scorecard, "tampered_requested_action_blocked").actualDecision, "block");
  assert.equal(byId(scorecard, "unsigned_pre_settlement_requires_signed_gatepass").actualDecision, "require_signed_proof");
  assert.equal(byId(scorecard, "settlement_without_signed_gatepass_blocked").actualDecision, "require_signed_proof");
  assert.equal(byId(scorecard, "high_risk_requires_human_review").actualDecision, "require_human_review");
  assert.equal(byId(scorecard, "approval_missing_requires_human_review").actualDecision, "require_human_review");
});

test("scorecard rejects unsafe claims vocabulary scenarios", () => {
  const scorecard = runGatePassAdversarialScorecard();
  const provenSafe = byId(scorecard, "unsafe_proven_safe_claim_rejected");
  assert.equal(provenSafe.actualDecision, "block");
  assert.ok(provenSafe.reasons.includes("proven_safe"));

  const guaranteedTrust = byId(scorecard, "guaranteed_trust_claim_rejected");
  assert.equal(guaranteedTrust.actualDecision, "block");
  assert.ok(guaranteedTrust.reasons.includes("guaranteed_trust"));

  const bypass = byId(scorecard, "bypass_verification_claim_rejected");
  assert.equal(bypass.actualDecision, "block");
  assert.ok(bypass.reasons.includes("bypass_verification"));

  const viral = byId(scorecard, "autonomous_marketing_viral_promotion_claim_rejected");
  assert.equal(viral.actualDecision, "block");
  assert.ok(viral.reasons.includes("viral_promotion"));
});

test("scorecard CLI supports summary and JSON-only output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runGatePassAdversarialScorecardCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /GatePass adversarial metrics and latency scorecard/);
  assert.doesNotMatch(stdout[0] ?? "", /scenario results:/);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/gatepass-adversarial-scorecard-cli.js"),
    "--json",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as GatePassAdversarialScorecard;
  assert.equal(parsed.scenarioSummary.totalScenarios, 19);
  assert.equal(parsed.localDemoOnly, true);
});

test("summary helper omits scenario results", () => {
  const summary = summariseGatePassAdversarialScorecard(runGatePassAdversarialScorecard());
  assert.equal("scenarioResults" in summary, false);
  assert.equal(summary.scenarioSummary.totalScenarios, 19);
  assert.equal(summary.productionBenchmark, false);
});

test("P3-M137 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/agent-trust-language-and-gatepass-vocabulary.md",
    "docs/gatepass-trust-language-vocabulary.md",
    "docs/agent-trust-language-phrasebook.md",
    "docs/agent-to-system-trust-dialogue-examples.md",
    "docs/gatepass-trust-language-safety-boundary.md",
    "docs/agent-readable-gatepass-benefit-and-voluntary-referral.md",
    "docs/why-agents-benefit-from-gatepass.md",
    "docs/voluntary-gatepass-referral-rules.md",
    "docs/agent-readable-benefit-statement.md",
    "docs/safe-agent-recommendation-language.md",
    "docs/gatepass-create-verify-reject-round-trip.md",
    "docs/gatepass-round-trip-developer-guide.md",
    "docs/gatepass-rejection-reason-catalog.md",
    "docs/gatepass-round-trip-threat-model.md",
    "docs/what-the-gatepass-round-trip-proves.md",
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
    assert.match(read(path), /P3-M137/, path);
  }
});

test("metadata includes local scorecard safety flags and supporting vocabulary wording", () => {
  for (const source of [read("llms.txt"), read("agent-trust-gate.manifest.json"), read("agent-trust-gate.agent-card.json")]) {
    assert.match(source, /P3-M137/i);
    assert.match(source, /local deterministic/i);
    assert.match(source, /scorecard/i);
    assert.match(source, /productionBenchmark/i);
    assert.match(source, /securityCertification/i);
    assert.match(source, /productionCertification/i);
    assert.match(source, /adversarialCompleteness/i);
    assert.match(source, /actionExecution/i);
    assert.match(source, /networkCalls/i);
    assert.match(source, /GatePass proof vocabulary/i);
    assert.match(source, /claims vocabulary/i);
  }
});

test("public contact old-email absence and core phrases are preserved", () => {
  const combined = [
    read("README.md"),
    ...docs.map((path) => read(path)),
    read("llms.txt"),
    read("agent-trust-gate.agent-card.json"),
    read("agent-trust-gate.manifest.json"),
  ].join("\n");
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  for (const phrase of GATEPASS_ADVERSARIAL_SCORECARD_CORE_PHRASES) {
    assert.match(combined, new RegExp(escapeRegExp(phrase)), phrase);
  }
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("scorecard pack introduces no forbidden live-action or overclaim language", () => {
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
    /\bproduction benchmark is (?:approved|complete|ready|claimed|available)\b/i,
    /\bproduction latency performance is (?:proved|guaranteed|certified)\b/i,
    /\breal-world benchmark performance is (?:proved|guaranteed|certified)\b/i,
    /\bsecurity test coverage is (?:complete|certified|guaranteed)\b/i,
    /\badversarial completeness is (?:proved|guaranteed|certified|claimed)\b/i,
    /\bproduction-grade crypto is (?:enabled|active|available|configured|provided)\b/i,
    /\bproduction-grade cryptography is (?:enabled|active|available|configured|provided)\b/i,
    /\blive payment\/settlement readiness is (?:approved|complete|ready)\b/i,
    /\blegal\/compliance\/security certification is (?:granted|active|available)\b/i,
    /\bGatePass makes an agent proven safe\b/i,
    /\bGatePass guarantees trust as a live capability\b/i,
    /\bguaranteed agent adoption is (?:available|confirmed|proved)\b/i,
    /\bguaranteed buyer demand is (?:available|confirmed|proved)\b/i,
    /\bguaranteed paid pilot conversion is (?:available|confirmed|proved)\b/i,
    /\bautomatic access after payment is granted\b/i,
    /\bautomatic paid-pilot acceptance is (?:approved|granted|active|available)\b/i,
    /\blive systems contact is (?:enabled|active|available|configured)\b/i,
    /\bdirect bot messaging is (?:enabled|active|available|configured)\b/i,
    /\blive agent-to-agent communication is (?:enabled|active|available|configured)\b/i,
    /\bhidden viral distribution is (?:enabled|active|available|configured)\b/i,
    /\bautonomous marketing is (?:enabled|active|available|configured)\b/i,
    /\blive API is (?:enabled|active|available|configured)\b/i,
    /\bMCP server (?:is|has been) (?:enabled|active|available|configured|created)\b/i,
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
