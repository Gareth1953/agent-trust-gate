import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  AGENT_PROOF_CONTRACT_CORE_LINE,
  AGENT_PROOF_CONTRACT_EXAMPLE_FILES,
  AGENT_PROOF_CONTRACT_POSITIONING,
  createAgentProofContractExamples,
  evaluateAgentProofVerification,
  getAgentProofContractArtifact,
  runAgentProofContractExamples,
  type AgentProofContractSafetyFlags,
  type AgentProofPackage,
  type AgentProofVerificationResult,
} from "../src/agent-proof-contract.js";
import { runAgentProofContractCli } from "../src/agent-proof-contract-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/agent-proof-package-schema-and-verification-contract.md",
  "docs/agent-proof-package-field-guide.md",
  "docs/gate-pass-challenge-and-response-flow.md",
];
const mainDoc = "docs/agent-proof-package-schema-and-verification-contract.md";
const schemas = [
  "schemas/agent-proof-package.schema.json",
  "schemas/agent-proof-verification-request.schema.json",
  "schemas/agent-proof-verification-result.schema.json",
  "schemas/gate-pass-challenge.schema.json",
];
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

function assertSafe(value: AgentProofContractSafetyFlags): void {
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

test("agent proof contract docs schemas and README links exist", () => {
  const readme = read("README.md");
  for (const path of [...docs, ...schemas]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  for (const phrase of corePhrases) {
    assert.match(readme, new RegExp(escapeRegExp(phrase)), phrase);
    assert.match(read(mainDoc), new RegExp(escapeRegExp(phrase)), phrase);
  }
  assert.match(read(mainDoc), new RegExp(escapeRegExp(AGENT_PROOF_CONTRACT_CORE_LINE)));
  assert.match(read(mainDoc), new RegExp(escapeRegExp(contactEmail)));
});

test("agent proof schemas are valid JSON and describe required contract fields", () => {
  for (const path of schemas) {
    const schema = readJson<{ type: string; additionalProperties: boolean; required: string[]; properties: Record<string, unknown> }>(path);
    assert.equal(schema.type, "object", path);
    assert.equal(schema.additionalProperties, false, path);
    assert.ok(Array.isArray(schema.required), path);
    assert.ok(Object.keys(schema.properties).length > 0, path);
  }

  const proofPackage = readJson<{ required: string[] }>("schemas/agent-proof-package.schema.json");
  for (const field of [
    "claimedAgentName",
    "claimedAgentType",
    "ownerReference",
    "issuerReference",
    "mandateReference",
    "permittedActionScope",
    "requestedAction",
    "evidenceReference",
    "verifiedIntentStatus",
    "humanApprovalStatus",
    "riskTier",
    "freshnessStatus",
    "nonce",
    "nonceStatus",
    "signedProofReference",
    "signedProofStatus",
    "sessionContextReference",
    "settlementSensitive",
    "localDemoOnly",
  ]) {
    assert.ok(proofPackage.required.includes(field), field);
  }

  const verificationResult = readJson<{ properties: Record<string, { const?: unknown }> }>(
    "schemas/agent-proof-verification-result.schema.json",
  );
  for (const [field, expected] of Object.entries({
    localDemoOnly: true,
    liveSystemsContact: false,
    directBotMessaging: false,
    autonomousOutreach: false,
    liveAgentToAgentCommunication: false,
    paymentAuthorisation: false,
    settlementAuthorisation: false,
    actionExecution: false,
    productionCertification: false,
  })) {
    assert.equal(verificationResult.properties[field]?.const, expected, field);
  }
});

test("example artifacts match deterministic local contract outputs", () => {
  for (const [artifactId, path] of Object.entries(AGENT_PROOF_CONTRACT_EXAMPLE_FILES)) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.deepEqual(readJson<unknown>(path), getAgentProofContractArtifact(artifactId as keyof typeof AGENT_PROOF_CONTRACT_EXAMPLE_FILES), path);
  }
});

test("claimed identity alone is not sufficient proof", () => {
  const examples = createAgentProofContractExamples();
  const result = evaluateAgentProofVerification(
    examples.proofPackages.identityOnlyInvalid,
    examples.verificationRequests.basic,
    examples.gatePassChallenges.basic,
  );
  assert.equal(result.decision, "block");
  assert.equal(result.claimedIdentityAloneSufficient, false);
  assert.equal(result.noProofMeansNoPermission, true);
  assert.ok(result.reasons.includes("claimed_identity_not_trust"));
  assert.ok(result.reasons.includes("missing_mandateReference"));
  assert.ok(result.reasons.includes("missing_evidenceReference"));
  assertSafe(result);
});

test("missing mandate and evidence fail block or require proof", () => {
  const examples = createAgentProofContractExamples();
  const missingMandate: AgentProofPackage = {
    ...examples.proofPackages.validLocalControl,
    packageId: "agent_proof_pkg_missing_mandate_test",
    mandateReference: null,
  };
  const missingMandateResult = evaluateAgentProofVerification(
    missingMandate,
    examples.verificationRequests.basic,
    examples.gatePassChallenges.basic,
  );
  assert.equal(missingMandateResult.decision, "block");
  assert.ok(missingMandateResult.missingProofItems.includes("mandateReference"));
  assertSafe(missingMandateResult);

  const missingEvidenceResult = examples.verificationResults.requiresEvidence;
  assert.equal(missingEvidenceResult.decision, "require_evidence");
  assert.ok(missingEvidenceResult.missingProofItems.includes("evidenceReference"));
  assertSafe(missingEvidenceResult);
});

test("stale or replayed proof fails and settlement-sensitive requests require signed proof", () => {
  const examples = createAgentProofContractExamples();
  const replayed = evaluateAgentProofVerification(
    examples.proofPackages.replayedProof,
    examples.verificationRequests.basic,
    examples.gatePassChallenges.basic,
  );
  assert.equal(replayed.decision, "block");
  assert.ok(replayed.reasons.includes("contract_nonce_replayed"));
  assert.ok(replayed.reasons.includes("contract_freshness_stale"));
  assertSafe(replayed);

  const settlementSensitive = examples.verificationResults.settlementSensitiveRequiresSignedProof;
  assert.equal(settlementSensitive.decision, "require_signed_proof");
  assert.ok(settlementSensitive.reasons.includes("verification_request_settlement_sensitive"));
  assert.ok(settlementSensitive.missingProofItems.includes("signedProofReference"));
  assertSafe(settlementSensitive);
});

test("valid local control allows locally only and all outputs keep authority disabled", () => {
  const pack = runAgentProofContractExamples();
  assert.deepEqual(pack.positioning, AGENT_PROOF_CONTRACT_POSITIONING);
  assert.equal(pack.resultCount, 6);
  assert.equal(pack.decisions.allow, 1);
  assert.equal(pack.decisions.block, 2);
  assert.equal(pack.decisions.require_evidence, 1);
  assert.equal(pack.decisions.require_human_review, 1);
  assert.equal(pack.decisions.require_signed_proof, 1);
  assertSafe(pack);

  const allowed = pack.examples.verificationResults.allowedLocal;
  assert.equal(allowed.decision, "allow");
  assert.equal(allowed.requiredNextProof.includes("continue_local_demo_only"), true);
  assertSafe(allowed);
  for (const result of Object.values(pack.examples.verificationResults) as AgentProofVerificationResult[]) {
    assertSafe(result);
  }
});

test("agent proof contract CLI emits local summary and package script is registered", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runAgentProofContractCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as ReturnType<typeof runAgentProofContractExamples>;
  assert.equal(summary.resultCount, 6);
  assert.equal("examples" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/agent-proof-contract-cli.js"),
    "--artifact",
    "agent_proof_verification_result_allowed_local",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0);
  assert.equal((JSON.parse(compiled.stdout) as AgentProofVerificationResult).decision, "allow");

  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:agent-proof-contract"] ?? "", /agent-proof-contract-cli\.js --pretty/);
});

test("P3-M130 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
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
    assert.match(read(path), /P3-M130/, path);
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
  assert.match(combined, new RegExp(escapeRegExp(AGENT_PROOF_CONTRACT_CORE_LINE)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("agent proof contract pack introduces no forbidden live-action or overclaim language", () => {
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
