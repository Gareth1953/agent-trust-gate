import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  AGENT_STANDING_PROOF_VERSION,
  AGENT_STANDING_PUBLIC_CLAIM,
  createAgentStandingExactActionInput,
  createAgentStandingRequestDigest,
  createAgentStandingScenarios,
  evaluateAgentStanding,
  runAgentStandingDemo,
  runAgentStandingScenario,
} from "../src/agent-standing.js";
import { runAgentStandingCli } from "../src/agent-standing-cli.js";
import { createCanonicalActionEnvelope } from "../src/exact-action-gatepass.js";
import {
  createDeterministicLocalFixtureKeyPair,
  signCanonicalLocalFixturePayload,
  verifyCanonicalLocalFixturePayload,
} from "../src/local-signed-proof.js";

const expectedOutcomes = {
  self_declared_only: "STANDING_UNVERIFIABLE",
  invalid_key_challenge: "STANDING_REFUSED",
  key_proven_no_delegation: "STANDING_REFUSED",
  expired_delegation: "STANDING_REFUSED",
  revoked_delegation: "STANDING_REFUSED",
  scope_mismatch: "STANDING_REFUSED",
  authority_limit_breach: "STANDING_REFUSED",
  request_digest_changed: "STANDING_REFUSED",
  delegation_depth_exceeded: "STANDING_REFUSED",
  valid_individual_sponsored_agent: "STANDING_VERIFIED",
  valid_organisation_sponsored_agent: "STANDING_VERIFIED",
  valid_standing_then_gatepass: "STANDING_VERIFIED",
} as const;

function result(scenarioId: keyof typeof expectedOutcomes) {
  const scenario = createAgentStandingScenarios().find((candidate) => candidate.scenarioId === scenarioId);
  assert.ok(scenario, scenarioId);
  return runAgentStandingScenario(scenario);
}

test("all twelve standing scenarios match deterministic expected outcomes", () => {
  const report = runAgentStandingDemo();
  assert.equal(report.results.length, 12);
  assert.equal(report.summary.matchedScenarios, 12);
  assert.equal(report.summary.outcomes.STANDING_VERIFIED, 3);
  assert.equal(report.summary.outcomes.STANDING_REFUSED, 8);
  assert.equal(report.summary.outcomes.STANDING_UNVERIFIABLE, 1);
  assert.equal(report.summary.externalActionsPerformed, false);
  assert.equal(report.summary.overallPassed, true);
  for (const scenario of report.results) {
    assert.equal(scenario.receipt.outcome, expectedOutcomes[scenario.scenarioId]);
    assert.equal(scenario.matchedExpectation, true);
  }
});

test("S0 self-declaration is unverifiable and never permits GatePass evaluation", () => {
  const observed = result("self_declared_only");
  assert.equal(observed.receipt.outcome, "STANDING_UNVERIFIABLE");
  assert.equal(observed.receipt.verifiedAssuranceClassification, "S0");
  assert.ok(observed.receipt.reasonCodes.includes("STANDING_PROOF_MISSING"));
  assert.equal(observed.receipt.gatePassEvaluationMayBegin, false);
  assert.equal(observed.receipt.gatePassEvaluation.attempted, false);
});

test("key challenge and signed material changes fail closed", () => {
  const invalidChallenge = result("invalid_key_challenge");
  assert.ok(invalidChallenge.receipt.reasonCodes.includes("STANDING_KEY_CHALLENGE_INVALID"));
  assert.ok(invalidChallenge.receipt.reasonCodes.includes("STANDING_PROOF_SIGNATURE_INVALID"));

  const scenario = createAgentStandingScenarios().find((candidate) =>
    candidate.scenarioId === "valid_individual_sponsored_agent"
  );
  assert.ok(scenario?.input.proof);
  const tampered = structuredClone(scenario.input);
  assert.ok(tampered.proof);
  tampered.proof.delegation.permittedActions.push("changed_after_signing");
  const decision = evaluateAgentStanding(tampered);
  assert.equal(decision.outcome, "STANDING_REFUSED");
  assert.ok(decision.reasonCodes.includes("STANDING_DELEGATION_SIGNATURE_INVALID"));
  assert.ok(decision.reasonCodes.includes("STANDING_PROOF_SIGNATURE_INVALID"));
  assert.equal(decision.gatePassEvaluationMayBegin, false);
});

test("principal, delegation, expiry, revocation, scope, amount, digest and depth reasons are explicit", () => {
  const reasons = new Map([
    ["key_proven_no_delegation", "STANDING_DELEGATION_MISSING"],
    ["expired_delegation", "STANDING_DELEGATION_EXPIRED"],
    ["revoked_delegation", "STANDING_DELEGATION_REVOKED"],
    ["scope_mismatch", "STANDING_ACTION_OUT_OF_SCOPE"],
    ["authority_limit_breach", "STANDING_AMOUNT_LIMIT_EXCEEDED"],
    ["request_digest_changed", "STANDING_REQUEST_DIGEST_MISMATCH"],
    ["delegation_depth_exceeded", "STANDING_DELEGATION_DEPTH_EXCEEDED"],
  ] as const);
  for (const [scenarioId, reason] of reasons) {
    const observed = result(scenarioId);
    assert.equal(observed.receipt.outcome, "STANDING_REFUSED", scenarioId);
    assert.ok(observed.receipt.reasonCodes.includes(reason), `${scenarioId}: ${reason}`);
    assert.equal(observed.receipt.gatePassEvaluationMayBegin, false, scenarioId);
  }
  const limit = result("authority_limit_breach");
  assert.equal(limit.proof?.delegation.maximumAmountMinorUnits, 2_500);
  assert.equal(limit.request.amountMinorUnits, 4_000);
  assert.equal(Number.isInteger(limit.proof?.delegation.maximumAmountMinorUnits), true);
});

test("resource, counterparty, session and required-evidence restrictions fail closed", () => {
  const scenario = createAgentStandingScenarios().find((candidate) =>
    candidate.scenarioId === "valid_individual_sponsored_agent"
  );
  assert.ok(scenario?.input.proof);
  const changed = structuredClone(scenario.input);
  assert.ok(changed.proof);
  changed.request.requestedResources = [{ resource: "supplier_invoices", quantity: 99 }];
  changed.request.counterpartyIdentifier = "synthetic_supplier_not_permitted";
  changed.request.sessionBinding = "changed_session_after_standing";
  changed.proof.evidenceReferences = changed.proof.evidenceReferences.filter((evidence) =>
    evidence.type !== "revocation_status"
  );
  const decision = evaluateAgentStanding(changed);
  assert.equal(decision.outcome, "STANDING_REFUSED");
  assert.ok(decision.reasonCodes.includes("STANDING_RESOURCE_LIMIT_EXCEEDED"));
  assert.ok(decision.reasonCodes.includes("STANDING_COUNTERPARTY_NOT_PERMITTED"));
  assert.ok(decision.reasonCodes.includes("STANDING_SESSION_BINDING_MISMATCH"));
  assert.ok(decision.reasonCodes.includes("STANDING_REQUIRED_EVIDENCE_MISSING"));
  assert.equal(decision.gatePassEvaluationMayBegin, false);
});

test("individual and organisation standing reach only evidence-derived S3 and S4", () => {
  const individual = result("valid_individual_sponsored_agent");
  assert.equal(individual.receipt.outcome, "STANDING_VERIFIED");
  assert.equal(individual.receipt.verifiedAssuranceClassification, "S3");
  assert.equal(individual.receipt.checks.keyControlChallengeValid, true);
  assert.equal(individual.receipt.checks.delegationSignatureValid, true);

  const organisation = result("valid_organisation_sponsored_agent");
  assert.equal(organisation.receipt.outcome, "STANDING_VERIFIED");
  assert.equal(organisation.receipt.verifiedAssuranceClassification, "S4");
  assert.ok(organisation.receipt.organisationSponsorIdentifier);
  assert.ok(organisation.receipt.accountableHumanSponsorReference);
  assert.notEqual(organisation.receipt.verifiedAssuranceClassification, "S5");
});

test("exact standing request digest reuses canonical exact-action GatePass binding", () => {
  const observed = result("valid_individual_sponsored_agent");
  const expected = createCanonicalActionEnvelope(createAgentStandingExactActionInput(observed.request)).actionDigest;
  assert.equal(createAgentStandingRequestDigest(observed.request), expected);
  assert.equal(observed.receipt.exactRequestDigest, expected);
  assert.equal(observed.proof?.exactRequestDigest, expected);
  assert.equal(observed.proof?.challenge.exactRequestDigest, expected);
  assert.equal(observed.proof?.delegation.exactRequestDigest, expected);
});

test("existing GatePass evaluation starts only after verified standing", () => {
  const verified = result("valid_standing_then_gatepass");
  assert.equal(verified.receipt.outcome, "STANDING_VERIFIED");
  assert.equal(verified.receipt.gatePassEvaluationMayBegin, true);
  assert.equal(verified.receipt.gatePassEvaluation.attempted, true);
  assert.equal(verified.receipt.gatePassEvaluation.verified, true);
  assert.equal(verified.receipt.gatePassEvaluation.actionDigest, verified.receipt.exactRequestDigest);
  assert.equal(verified.receipt.gatePassEvaluation.externalActionOccurred, false);

  for (const scenarioId of ["self_declared_only", "invalid_key_challenge", "revoked_delegation"] as const) {
    const blocked = result(scenarioId);
    assert.equal(blocked.receipt.gatePassEvaluationMayBegin, false);
    assert.equal(blocked.receipt.gatePassEvaluation.attempted, false);
    assert.equal(blocked.receipt.externalActionsPerformed, false);
  }
});

test("deterministic Ed25519 fixture helper signs canonical local payloads", () => {
  const first = createDeterministicLocalFixtureKeyPair("agent-standing-test-key");
  const second = createDeterministicLocalFixtureKeyPair("agent-standing-test-key");
  assert.equal(first.publicKeyPem, second.publicKeyPem);
  assert.equal(first.privateKeyPem, second.privateKeyPem);
  assert.equal(first.deterministicPublicFixture, true);
  assert.equal(first.productionSigning, false);
  const payload = { requestDigest: "sha256:" + "a".repeat(64), nonce: "fixture-challenge" };
  const signature = signCanonicalLocalFixturePayload(payload, first);
  assert.equal(verifyCanonicalLocalFixturePayload(payload, signature, first.publicKeyPem), true);
  assert.equal(verifyCanonicalLocalFixturePayload({ ...payload, nonce: "changed" }, signature, first.publicKeyPem), false);
});

test("AgentStandingProof schema is closed, versioned and requires bounded evidence", () => {
  const schemaPath = "schemas/agent-standing-proof.schema.json";
  assert.equal(existsSync(schemaPath), true);
  const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as Record<string, unknown>;
  assert.equal(schema.additionalProperties, false);
  const required = schema.required as string[];
  for (const field of [
    "version",
    "proofIdentifier",
    "agentIdentifier",
    "agentPublicKeyReference",
    "principalIdentifier",
    "delegation",
    "challenge",
    "exactRequestDigest",
    "evidenceReferences",
    "assuranceClassification",
    "limitations",
    "signatureMetadata",
  ]) assert.ok(required.includes(field), field);
  const properties = schema.properties as Record<string, Record<string, unknown>>;
  assert.equal(properties.version?.const, AGENT_STANDING_PROOF_VERSION);
  const defs = schema.$defs as Record<string, Record<string, unknown>>;
  assert.equal(defs.delegation?.additionalProperties, false);
  assert.equal(defs.challenge?.additionalProperties, false);
  assert.equal(defs.signatureMetadata?.additionalProperties, false);
});

test("CLI supports summary, scenario and JSON reviewer modes", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runAgentStandingCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.match(stdout[0] ?? "", /ATG AGENT STANDING RESULT/);
  assert.match(stdout[0] ?? "", /Overall: AGENT STANDING DEMONSTRATION PASSED/);
  assert.equal(stderr.length, 0);

  stdout.length = 0;
  assert.equal(runAgentStandingCli(["--scenario", "valid_organisation_sponsored_agent"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.match(stdout[0] ?? "", /Standing outcome: STANDING_VERIFIED/);
  assert.match(stdout[0] ?? "", /Assurance: declared S4; verified S4/);

  stdout.length = 0;
  assert.equal(runAgentStandingCli(["--json"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  const json = JSON.parse(stdout[0] ?? "{}") as Record<string, unknown>;
  assert.equal((json.summary as Record<string, unknown>).overallPassed, true);
  assert.equal((json.results as unknown[]).length, 12);
});

test("documentation and static demo preserve the claims boundary", () => {
  for (const path of [
    "docs/verified-agent-standing.md",
    "discovery-site/agent-standing-demo.html",
    "schemas/agent-standing-proof.schema.json",
  ]) assert.equal(existsSync(path), true, path);
  const content = [
    readFileSync("README.md", "utf8"),
    readFileSync("docs/verified-agent-standing.md", "utf8"),
    readFileSync("discovery-site/agent-standing-demo.html", "utf8"),
  ].join("\n");
  assert.match(content, new RegExp(AGENT_STANDING_PUBLIC_CLAIM.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(content, /does not prove that software is intelligent or conscious/i);
  assert.match(content, /S5[^\n]+future|future[^\n]+S5/i);
  assert.doesNotMatch(content, /production runtime attestation is implemented|certified agent|guaranteed safe/i);

  const page = readFileSync("discovery-site/agent-standing-demo.html", "utf8");
  assert.match(page, /First prove who or what is asking, whom it represents and why it has standing\. Then decide whether its exact action may proceed\./);
  assert.doesNotMatch(page, /<form\b|<input\b|<iframe\b|<script\b[^>]*\bsrc=|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|document\.cookie|analytics\.js|gtag|googletagmanager|plausible|mixpanel/i);
});

test("package version is unchanged and standing scripts are additive", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    version: string;
    scripts: Record<string, string>;
  };
  assert.equal(packageJson.version, "0.1.0");
  assert.match(packageJson.scripts["demo:agent-standing"] ?? "", /agent-standing-cli\.js/);
  assert.match(packageJson.scripts["test:agent-standing"] ?? "", /agent-standing\.test\.js/);
});
