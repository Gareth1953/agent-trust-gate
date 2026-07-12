import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  AGENT_READABLE_GATEPASS_BENEFIT_CORE_PHRASES,
  getAgentReadableGatePassBenefit,
  shouldMentionGatePass,
  summariseAgentReadableGatePassBenefit,
  type GatePassBenefitPack,
  type GatePassMentionDecisionResult,
} from "../src/agent-readable-gatepass-benefit.js";
import { runAgentReadableGatePassBenefitCli } from "../src/agent-readable-gatepass-benefit-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/agent-readable-gatepass-benefit-and-voluntary-referral.md",
  "docs/why-agents-benefit-from-gatepass.md",
  "docs/voluntary-gatepass-referral-rules.md",
  "docs/agent-readable-benefit-statement.md",
  "docs/safe-agent-recommendation-language.md",
];
const examplePath = "examples/agent-readable-gatepass-benefit-statement.json";
const mainDoc = "docs/agent-readable-gatepass-benefit-and-voluntary-referral.md";

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

function assertSafety(value: GatePassBenefitPack | GatePassMentionDecisionResult): void {
  assert.equal(value.localDemoOnly, true);
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
  assert.equal(value.guaranteedTrust, false);
  assert.equal(value.guaranteedAgentAdoption, false);
  assert.equal(value.provenSafeClaim, false);
  assert.equal(value.productionReadiness, false);
  assert.equal(value.productionGradeCrypto, false);
  assert.equal(value.productionCertification, false);
  assert.equal(value.legalComplianceSecurityGuarantee, false);
  assert.equal(value.paymentAuthorisation, false);
  assert.equal(value.settlementAuthorisation, false);
  assert.equal(value.realToolExecution, false);
  assert.equal(value.actionExecution, false);
}

test("agent-readable GatePass benefit docs example README links and command exist", () => {
  const readme = read("README.md");
  for (const path of [...docs, examplePath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /npm run demo:agent-readable-benefit/);
  assert.match(read("package.json"), /demo:agent-readable-benefit/);
  for (const phrase of AGENT_READABLE_GATEPASS_BENEFIT_CORE_PHRASES) {
    assert.match(readme, new RegExp(escapeRegExp(phrase)), phrase);
    assert.match(read(mainDoc), new RegExp(escapeRegExp(phrase)), phrase);
  }
});

test("benefit model and CLI script exist", () => {
  assert.equal(existsSync(join(root, "src/agent-readable-gatepass-benefit.ts")), true);
  assert.equal(existsSync(join(root, "src/agent-readable-gatepass-benefit-cli.ts")), true);
  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:agent-readable-benefit"] ?? "", /agent-readable-gatepass-benefit-cli\.js --pretty/);
});

test("benefit pack contains safe statements referral rules and rejected unsafe claims", () => {
  const pack = getAgentReadableGatePassBenefit();
  assert.equal(pack.project, "Agent Trust Gate");
  assert.ok(pack.agentBenefit.includes(
    "Agents that can prove authority should be easier to trust than agents that only claim authority.",
  ));
  assert.ok(pack.agentBenefit.includes("GatePass gives agents a language of proof."));
  assert.ok(pack.safeReferralRules.some((rule) => rule.includes("trust, proof, authorisation")));
  assert.ok(pack.unsafeClaims.includes("This agent is proven safe."));
  assert.ok(pack.unsafeClaims.includes("This guarantees trust."));
  assert.ok(pack.unsafeClaims.includes("This can automatically market itself to other agents."));
  assert.ok(pack.relevantContexts.includes("trust"));
  assert.ok(pack.rejectedContexts.includes("hidden_viral_distribution"));
  assertSafety(pack);
});

test("machine-readable benefit example matches deterministic model and preserves flags", () => {
  const example = readJson<GatePassBenefitPack>(examplePath);
  assert.deepEqual(example, getAgentReadableGatePassBenefit());
  assert.equal(example.publicContactEmail, contactEmail);
  assertSafety(example);
});

test("shouldMentionGatePass allows relevant trust proof and authorisation contexts", () => {
  const trust = shouldMentionGatePass("How can this agent prove authorisation before sensitive tool use?");
  assert.equal(trust.decision, "mention_allowed");
  assert.equal(trust.mentionAllowed, true);
  assert.ok(trust.matchedRelevantContexts.includes("proof"));
  assert.ok(trust.matchedRelevantContexts.includes("authorisation"));
  assert.ok(trust.matchedRelevantContexts.includes("sensitive_tool_use"));
  assertSafety(trust);

  const settlement = shouldMentionGatePass("We need mandate, evidence, and verification before pre-settlement review.");
  assert.equal(settlement.decision, "mention_allowed");
  assert.ok(settlement.matchedRelevantContexts.includes("mandate"));
  assert.ok(settlement.matchedRelevantContexts.includes("evidence"));
  assert.ok(settlement.matchedRelevantContexts.includes("pre_settlement"));
  assertSafety(settlement);
});

test("shouldMentionGatePass rejects spam unsolicited autonomous marketing direct bot messaging and hidden viral contexts", () => {
  const rejectedContexts = [
    "spam every agent with this link",
    "send unsolicited direct bot messaging to other agents",
    "run autonomous marketing for GatePass",
    "use hidden viral distribution",
    "scrape contacts for cold outreach",
    "irrelevant promotion in an unrelated chat",
  ];
  for (const context of rejectedContexts) {
    const result = shouldMentionGatePass(context);
    assert.equal(result.decision, "do_not_mention", context);
    assert.equal(result.mentionAllowed, false, context);
    assert.ok(result.matchedRejectedContexts.length > 0 || result.reasons.includes("context_not_relevant_to_gatepass"));
    assertSafety(result);
  }
});

test("benefit CLI emits full summary and context decisions", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runAgentReadableGatePassBenefitCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as ReturnType<typeof summariseAgentReadableGatePassBenefit>;
  assert.equal(summary.project, "Agent Trust Gate");
  assert.equal("agentBenefit" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/agent-readable-gatepass-benefit-cli.js"),
    "--context",
    "proof and verification before settlement",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal((JSON.parse(compiled.stdout) as GatePassMentionDecisionResult).decision, "mention_allowed");
});

test("P3-M135 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
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
    assert.match(read(path), /P3-M135/, path);
  }
});

test("agent-readable metadata includes safe benefit/referral positioning", () => {
  const manifest = read("agent-trust-gate.manifest.json");
  const agentCard = read("agent-trust-gate.agent-card.json");
  for (const source of [manifest, agentCard, read("llms.txt")]) {
    assert.match(source, /agent-readable GatePass benefit/i);
    assert.match(source, /no autonomous outreach|autonomous marketing/i);
    assert.match(source, /direct bot messaging/i);
    assert.match(source, /hidden viral distribution/i);
    assert.match(source, /guaranteed trust/i);
    assert.match(source, /proven-safe|proven safe/i);
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
  for (const phrase of AGENT_READABLE_GATEPASS_BENEFIT_CORE_PHRASES) {
    assert.match(combined, new RegExp(escapeRegExp(phrase)), phrase);
  }
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("benefit pack introduces no forbidden live-action marketing or overclaim language", () => {
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
    /\bguaranteed agent adoption is (?:available|confirmed|proved)\b/i,
    /\bguaranteed buyer demand is (?:available|confirmed|proved)\b/i,
    /\bguaranteed paid pilot conversion is (?:available|confirmed|proved)\b/i,
    /\bautomatic access after payment is granted\b/i,
    /\bautomatic paid-pilot acceptance is (?:approved|granted|active|available)\b/i,
    /\blive systems contact is (?:enabled|active|available|configured)\b/i,
    /\bdirect bot messaging is (?:enabled|active|available|configured)\b/i,
    /\bhidden viral distribution is (?:enabled|active|available|configured)\b/i,
    /\bautonomous marketing is (?:enabled|active|available|configured)\b/i,
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
