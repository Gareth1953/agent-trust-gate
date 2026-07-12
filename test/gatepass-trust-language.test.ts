import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  buildAgentTrustStatement,
  classifyTrustLanguagePhrase,
  GATEPASS_TRUST_LANGUAGE_CORE_PHRASES,
  getGatePassTrustVocabulary,
  summariseGatePassTrustVocabulary,
  type BuiltAgentTrustStatement,
  type GatePassTrustPhraseClassification,
  type GatePassTrustVocabularyPack,
} from "../src/gatepass-trust-language.js";
import { runGatePassTrustLanguageCli } from "../src/gatepass-trust-language-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/agent-trust-language-and-gatepass-vocabulary.md",
  "docs/gatepass-trust-language-vocabulary.md",
  "docs/agent-trust-language-phrasebook.md",
  "docs/agent-to-system-trust-dialogue-examples.md",
  "docs/gatepass-trust-language-safety-boundary.md",
];
const mainDoc = "docs/agent-trust-language-and-gatepass-vocabulary.md";
const examplePath = "examples/gatepass-trust-language-vocabulary.json";

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

function assertSafety(value: GatePassTrustVocabularyPack | GatePassTrustPhraseClassification | BuiltAgentTrustStatement): void {
  assert.equal(value.localDemoOnly, true);
  assert.equal(value.provenSafeClaim, false);
  assert.equal(value.guaranteedTrust, false);
  assert.equal(value.autonomousMarketing, false);
  assert.equal(value.outreachAutomation, false);
  assert.equal(value.directBotMessaging, false);
  assert.equal(value.unsolicitedAgentContact, false);
  assert.equal(value.hiddenViralDistribution, false);
  assert.equal(value.scrapingOrContactHarvesting, false);
  assert.equal(value.paidAds, false);
  assert.equal(value.trackingAnalytics, false);
  assert.equal(value.liveSystemsContact, false);
  assert.equal(value.liveAgentToAgentCommunication, false);
  assert.equal(value.liveApi, false);
  assert.equal(value.mcpServer, false);
  assert.equal(value.cloudNetworkCall, false);
  assert.equal(value.productionReadiness, false);
  assert.equal(value.productionGradeCrypto, false);
  assert.equal(value.productionCertification, false);
  assert.equal(value.legalComplianceSecurityGuarantee, false);
  assert.equal(value.paymentAuthorisation, false);
  assert.equal(value.settlementAuthorisation, false);
  assert.equal(value.realToolExecution, false);
  assert.equal(value.actionExecution, false);
}

test("GatePass Trust Language docs example README links and command exist", () => {
  const readme = read("README.md");
  for (const path of [...docs, examplePath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /npm run demo:gatepass-trust-language/);
  assert.match(read("package.json"), /demo:gatepass-trust-language/);
  for (const phrase of GATEPASS_TRUST_LANGUAGE_CORE_PHRASES) {
    assert.match(readme, new RegExp(escapeRegExp(phrase)), phrase);
    assert.match(read(mainDoc), new RegExp(escapeRegExp(phrase)), phrase);
  }
});

test("trust language model and CLI script exist", () => {
  assert.equal(existsSync(join(root, "src/gatepass-trust-language.ts")), true);
  assert.equal(existsSync(join(root, "src/gatepass-trust-language-cli.ts")), true);
  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:gatepass-trust-language"] ?? "", /gatepass-trust-language-cli\.js --pretty/);
});

test("controlled vocabulary safe phrases and unsafe phrases are present", () => {
  const pack = getGatePassTrustVocabulary();
  assert.equal(pack.project, "Agent Trust Gate");
  assert.ok(pack.controlledTerms.identityTerms.includes("claimed_identity"));
  assert.ok(pack.controlledTerms.identityTerms.includes("verified_authority"));
  assert.ok(pack.controlledTerms.mandateTerms.includes("mandate_reference"));
  assert.ok(pack.controlledTerms.scopeTerms.includes("permitted_scope"));
  assert.ok(pack.controlledTerms.scopeTerms.includes("requested_action"));
  assert.ok(pack.controlledTerms.evidenceTerms.includes("evidence_reference"));
  assert.ok(pack.controlledTerms.intentTerms.includes("verified_intent"));
  assert.ok(pack.controlledTerms.approvalTerms.includes("human_approval_required"));
  assert.ok(pack.controlledTerms.freshnessTerms.includes("fresh_gatepass"));
  assert.ok(pack.controlledTerms.nonceReplayTerms.includes("replay_detected"));
  assert.ok(pack.controlledTerms.signatureGatePassTerms.includes("signed_gatepass_present"));
  assert.ok(pack.controlledTerms.decisionTerms.includes("allow_locally"));
  assert.ok(pack.controlledTerms.escalationTerms.includes("require_human_review"));
  assert.ok(pack.controlledTerms.preSettlementTerms.includes("no_signed_gatepass_no_settlement"));
  assert.ok(pack.controlledTerms.unsafeClaimTerms.includes("proven_safe_claim_rejected"));
  assert.ok(pack.controlledTerms.unsafeClaimTerms.includes("guaranteed_trust_claim_rejected"));
  assert.ok(pack.safePhrases.includes("I am requesting permission to act."));
  assert.ok(pack.unsafePhrases.includes("This agent is proven safe."));
  assert.ok(pack.unsafePhrases.includes("This bypasses verification."));
  assertSafety(pack);
});

test("machine-readable vocabulary example matches deterministic model and preserves flags", () => {
  const example = readJson<GatePassTrustVocabularyPack>(examplePath);
  assert.deepEqual(example, getGatePassTrustVocabulary());
  assert.equal(example.publicContactEmail, contactEmail);
  assertSafety(example);
});

test("classifyTrustLanguagePhrase accepts scoped proof language", () => {
  const phrases = [
    "This agent has presented proof for this specific action, under this specific scope, at this specific time.",
    "My mandate reference is local-mandate-001.",
    "My evidence reference is local-evidence-001.",
    "My GatePass is fresh and signed.",
    "No proof means no permission.",
  ];
  for (const phrase of phrases) {
    const result = classifyTrustLanguagePhrase(phrase);
    assert.equal(result.decision, "allowed", phrase);
    assert.equal(result.phraseAllowed, true, phrase);
    assert.ok(result.matchedSafeSignals.length > 0, phrase);
    assert.equal(result.matchedUnsafeSignals.length, 0, phrase);
    assertSafety(result);
  }
});

test("classifyTrustLanguagePhrase rejects proven safe guaranteed trust bypass and viral claims", () => {
  const phrases = [
    "This agent is proven safe.",
    "GatePass guarantees trust.",
    "This bypasses verification.",
    "Use this for autonomous marketing.",
    "This should be used for viral agent promotion.",
    "This is certified compliant.",
    "This creates automatic acceptance.",
  ];
  for (const phrase of phrases) {
    const result = classifyTrustLanguagePhrase(phrase);
    assert.equal(result.decision, "rejected", phrase);
    assert.equal(result.phraseAllowed, false, phrase);
    assert.ok(result.matchedUnsafeSignals.length > 0, phrase);
    assertSafety(result);
  }
});

test("buildAgentTrustStatement produces scoped action-specific time-bounded proof language", () => {
  const statement = buildAgentTrustStatement({
    agentSubject: "local-demo-agent",
    requestedAction: "export_data",
    scope: "local-redacted-export-only",
    proofStatus: "proof_present",
    mandateReference: "local-mandate-123",
    evidenceReference: "local-evidence-456",
    intentStatus: "verified_intent",
    approvalStatus: "approval_present",
    gatePassStatus: "fresh_signed_gatepass",
    issuedAt: "2026-07-12T09:00:00.000Z",
    expiresAt: "2026-07-12T09:10:00.000Z",
    localDemoOnly: true,
  });
  assert.match(statement.statement, /requested_action 'export_data'/);
  assert.match(statement.statement, /permitted_scope 'local-redacted-export-only'/);
  assert.match(statement.statement, /issued at 2026-07-12T09:00:00\.000Z/);
  assert.match(statement.statement, /expiring at 2026-07-12T09:10:00\.000Z/);
  assert.match(statement.statement, /scoped, action-specific, time-bounded/);
  assert.equal(statement.proofLanguage, "This agent has presented proof for this specific action, under this specific scope, at this specific time.");
  assert.ok(statement.termsUsed.includes("mandate_reference"));
  assert.ok(statement.termsUsed.includes("evidence_reference"));
  assertSafety(statement);
});

test("trust language CLI emits vocabulary summary phrase classifications and statement", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runGatePassTrustLanguageCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as ReturnType<typeof summariseGatePassTrustVocabulary>;
  assert.equal(summary.project, "Agent Trust Gate");
  assert.equal("controlledTerms" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/gatepass-trust-language-cli.js"),
    "--phrase",
    "This agent is proven safe.",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal((JSON.parse(compiled.stdout) as GatePassTrustPhraseClassification).decision, "rejected");

  const statement = spawnSync(process.execPath, [
    resolve("dist/src/gatepass-trust-language-cli.js"),
    "--statement",
  ], { encoding: "utf8" });
  assert.equal(statement.status, 0, statement.stderr);
  assert.match((JSON.parse(statement.stdout) as BuiltAgentTrustStatement).statement, /action-specific/);
});

test("P3-M136 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
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
    assert.match(read(path), /P3-M136/, path);
  }
});

test("agent-readable metadata includes GatePass Trust Language boundary", () => {
  for (const source of [read("llms.txt"), read("agent-trust-gate.manifest.json"), read("agent-trust-gate.agent-card.json")]) {
    assert.match(source, /GatePass Trust Language/i);
    assert.match(source, /proof vocabulary/i);
    assert.match(source, /not a safety guarantee/i);
    assert.match(source, /proven-safe|proven safe/i);
    assert.match(source, /guaranteed-trust|guaranteed trust/i);
    assert.match(source, /no live systems contact|live systems contact/i);
    assert.match(source, /direct bot messaging/i);
    assert.match(source, /live agent-to-agent communication/i);
    assert.match(source, /hidden viral distribution/i);
    assert.match(source, /action execution/i);
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
  for (const phrase of GATEPASS_TRUST_LANGUAGE_CORE_PHRASES) {
    assert.match(combined, new RegExp(escapeRegExp(phrase)), phrase);
  }
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("GatePass Trust Language pack introduces no forbidden live-action or overclaim language", () => {
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
    /\bGatePass makes an agent proven safe\b/i,
    /\bGatePass guarantees trust\b/i,
    /\bGatePass Trust Language is a universal agent language standard\b/i,
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
