import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  ExactActionTrustGatewayPrototype,
  verifyExactActionTrustReceipt,
} from "../src/exact-action-trust-gateway-prototype.js";

const documents = {
  report: "docs/P3-M156-controlled-buyer-pilot-readiness-report.md",
  onePage: "docs/P3-M156-buyer-pilot-one-page.md",
  responsibilities: "docs/P3-M156-pilot-responsibility-matrix.md",
  risks: "docs/P3-M156-pilot-risk-register.md",
  plan: "docs/P3-M156-pilot-test-plan.md",
  intake: "docs/P3-M156-pilot-intake-checklist.md",
} as const;

const read = (path: string): string => readFileSync(path, "utf8");

test("P3-M156 01 — every required buyer-pilot artifact exists", () => {
  for (const path of Object.values(documents)) {
    assert.equal(existsSync(path), true, path);
    assert.ok(read(path).length > 500, `${path} should contain substantive guidance`);
  }
});

test("P3-M156 02 — the default boundary is decision-and-evidence only and buyer-controlled", () => {
  const sources = [read(documents.report), read(documents.onePage), read(documents.responsibilities)];
  for (const source of sources) {
    assert.match(source, /default.*(?:evaluation|decision).*(?:evidence|only)/is);
    assert.match(source, /buyer.*(?:retains|remain|owns).*(?:execution|executor)/is);
    assert.match(source, /no (?:buyer )?(?:execution system|executor).*connect/is);
  }
  assert.match(sources[0]!, /local synthetic.*(?:adapter|demonstration)/is);
  assert.match(sources[0]!, /not.*autonomous execution engine/is);
});

test("P3-M156 03 — a valid authorised action returns GatePass and auditable evidence without executing", async () => {
  const gateway = new ExactActionTrustGatewayPrototype();
  const evaluation = await gateway.evaluateExactAction("allowed");
  assert.equal(evaluation.decision, "GATEPASS_ISSUED");
  assert.ok(evaluation.gatePass);
  assert.equal(evaluation.checks.length, 20);
  assert.ok(evaluation.checks.every((check) => check.passed));
  assert.equal(evaluation.trustReceipt.execution, null);
  assert.equal(evaluation.trustReceipt.executiveSummary.executionStatus, "NOT_ATTEMPTED");
  assert.equal(evaluation.trustReceipt.safety.networkCallPerformed, false);
  assert.equal(verifyExactActionTrustReceipt(evaluation.trustReceipt).verified, true);
});

test("P3-M156 04 — an authority-limit violation refuses with root-cause values and no GatePass", async () => {
  const gateway = new ExactActionTrustGatewayPrototype();
  const evaluation = await gateway.evaluateExactAction("overspend");
  assert.equal(evaluation.decision, "ACTION_REFUSED");
  assert.equal(evaluation.gatePass, null);
  assert.equal(evaluation.refusal?.primaryFailureCode, "AUTHORITY_LIMIT_EXCEEDED");
  assert.equal(evaluation.refusal?.primaryFailure.requestedValue, 31_000);
  assert.equal(evaluation.refusal?.primaryFailure.permittedValue, 25_000);
  assert.equal(evaluation.refusal?.gatePassIssued, false);
  assert.equal(evaluation.refusal?.executionPermitted, false);
  assert.equal(verifyExactActionTrustReceipt(evaluation.trustReceipt).verified, true);
});

test("P3-M156 05 — altered action and replay fail closed inside the local synthetic boundary", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => {
    throw new Error("P3-M156 attempted an external network call");
  }) as typeof fetch;
  try {
    const gateway = new ExactActionTrustGatewayPrototype();
    const evaluation = await gateway.evaluateExactAction("allowed");
    const altered = await gateway.executeWithGatePass(evaluation, { actionPatch: { totalAmount: 24_250 } });
    assert.equal(altered.execution.status, "BLOCKED_ACTION_MISMATCH");
    assert.equal(altered.trustReceipt.refusal?.primaryFailureCode, "EXACT_ACTION_MISMATCH");
    assert.equal(altered.execution.gatePassConsumed, false);
    assert.equal(altered.execution.realOrderCreated, false);
    const first = await gateway.executeWithGatePass(evaluation);
    const replay = await gateway.executeWithGatePass(evaluation);
    assert.equal(first.execution.status, "SIMULATED_PURCHASE_COMPLETED");
    assert.equal(first.execution.gatePassConsumed, true);
    assert.equal(replay.execution.status, "BLOCKED_REPLAY");
    assert.equal(replay.trustReceipt.refusal?.primaryFailureCode, "GATEPASS_REPLAY");
    assert.equal(replay.execution.simulatedPurchaseReference, null);
    assert.equal(replay.execution.networkCallPerformed, false);
    assert.equal(replay.execution.realPaymentProcessed, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("P3-M156 06 — the input contract classifies requirement, ownership, sensitivity and pilot allowance", () => {
  const report = read(documents.report);
  for (const input of [
    "Exact proposed action", "Action ID", "Human identity and authority evidence",
    "Organisational mandate", "Agent identity and standing", "Policy and version references",
    "Action timestamp and validity times", "Nonce/replay material", "Amount, currency and risk metadata",
  ]) assert.match(report, new RegExp(input, "i"), input);
  assert.match(report, /Input \| Required \| Source\/owner \| Potentially sensitive \| Allowed in controlled pilot/);
  assert.match(report, /Missing required evidence fails closed/);
});

test("P3-M156 07 — the output contract distinguishes ATG evidence from buyer-owned downstream records", () => {
  const report = read(documents.report);
  for (const output of [
    "PASS", "REFUSE", "reason codes", "Canonical action digest", "GatePass",
    "Human Authority Proof", "Agent Standing evidence", "Executive Trust Receipt",
    "Full machine-readable audit receipt", "Timestamps and version identifiers",
  ]) assert.match(report, new RegExp(output, "i"), output);
  assert.match(report, /Buyer downstream log\/acknowledgement \| Not generated by current prototype/);
  assert.match(report, /no such integration is implemented or claimed/i);
});

test("P3-M156 08 — current, pilot and future security capabilities are kept distinct", () => {
  const report = read(documents.report);
  assert.match(report, /Currently implemented \| Controlled-pilot integration requirement \| Future production requirement/);
  for (const limit of [
    "deterministic.*fixture key", "in-memory nonce", "loopback", "no production secret",
    "buyer retains authoritative identity", "buyer retains every final execution system",
  ]) assert.match(report, new RegExp(limit, "is"), limit);
});

test("P3-M156 09 — the test plan has measurable success criteria and explicit aborts", () => {
  const plan = read(documents.plan);
  for (const heading of ["Functional", "Evidence", "Operational", "Commercial", "Abort criteria"]) {
    assert.match(plan, new RegExp(heading, "i"), heading);
  }
  assert.match(plan, /monotonic clock/);
  assert.match(plan, /no unsupported target/i);
  assert.match(plan, /zero unexplained failures/i);
  assert.match(plan, /authority, mandate or agent-standing bypass/i);
});

test("P3-M156 10 — responsibilities make authorisation and execution ownership unambiguous", () => {
  const matrix = read(documents.responsibilities);
  assert.match(matrix, /buyer authorises people and agents/i);
  assert.match(matrix, /buyer.*only owner of any downstream execution/is);
  assert.match(matrix, /ATG evaluates the evidence presented for one exact action/i);
  assert.match(matrix, /PASS or GatePass is not a substitute/i);
  assert.match(matrix, /Legal, privacy and compliance approval/);
  assert.match(matrix, /Production decision/);
});

test("P3-M156 11 — the risk register contains owners, mitigations and stop conditions for all required risks", () => {
  const risks = read(documents.risks);
  const rows = risks.match(/^\| R\d+ \|/gm) ?? [];
  assert.ok(rows.length >= 13, `expected at least 13 risks, received ${rows.length}`);
  assert.match(risks, /Probability \| Impact \| Mitigation and evidence \| Owner \| Pilot stop condition/);
  for (const risk of [
    "production product", "identity source", "Authority directory", "Agent-standing evidence",
    "Integration mapping", "policy", "canonical", "replay", "Sensitive data", "receipt",
    "Execution occurs outside", "scope expands", "Security expectations",
  ]) assert.match(risks, new RegExp(risk, "i"), risk);
});

test("P3-M156 12 — buyer materials are free of secrets, private paths and affirmative production claims", () => {
  const secret = /sk_(?:live|test)_[a-z0-9]{12,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i;
  const privatePath = /[A-Z]:\\Users\\|\/Users\/[^/]+\//i;
  const affirmativeOverclaim = /(?:^|[.!?]\s+)(?:ATG|The (?:product|prototype|pilot)) is (?:production ready|certified|regulator approved|bank grade|guaranteed secure|guaranteed compliant)/im;
  for (const path of Object.values(documents)) {
    const source = read(path);
    assert.doesNotMatch(source, secret, path);
    assert.doesNotMatch(source, privatePath, path);
    assert.doesNotMatch(source, affirmativeOverclaim, path);
    assert.match(source, /(?:synthetic|controlled|prototype|pilot)/i, path);
  }
});
