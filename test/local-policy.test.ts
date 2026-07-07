import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import type { LocalGatePassDemoInput } from "../src/local-gate-pass-demo.js";
import { createLocalGatePassAuditReceipt } from "../src/local-gate-pass-receipt.js";
import { classifyLocalPolicy, summariseLocalPolicy } from "../src/local-policy.js";

const examples = [
  "policy-low-risk-fast-path-allow.json",
  "policy-medium-risk-review.json",
  "policy-high-risk-money-approval-required.json",
  "policy-prohibited-no-mandate-refuse.json",
  "policy-prohibited-secret-handling-refuse.json",
] as const;

function input(name: string): LocalGatePassDemoInput {
  return JSON.parse(readFileSync(`examples/${name}`, "utf8")) as LocalGatePassDemoInput;
}

test("local policy documentation and examples exist", () => {
  for (const path of ["docs/local-policy-pack.md", "docs/risk-tier-matrix.md", ...examples.map((name) => `examples/${name}`)]) {
    assert.equal(existsSync(path), true, path);
  }
  const readme = readFileSync("README.md", "utf8");
  for (const path of ["docs/local-policy-pack.md", "docs/risk-tier-matrix.md", "docs/refusal-condition-matrix.md"]) {
    assert.ok(readme.includes(path), path);
  }
});

test("low-risk valid request allows the fast path with policy metadata", () => {
  const value = input(examples[0]);
  const rule = classifyLocalPolicy(value);
  const receipt = createLocalGatePassAuditReceipt(value);
  assert.equal(rule.risk_tier, "low");
  assert.equal(rule.allows_fast_path, true);
  assert.equal(receipt.verdict, "allow_signed_gate_pass");
  assert.equal(receipt.receipt_type, "signed_gate_pass");
  assert.equal(receipt.policy_pack_version, "local-demo-v1");
  assert.equal(receipt.applied_policy, "low-risk-local-demo");
  assert.equal(receipt.fast_path_allowed, true);
  assert.equal(receipt.human_review_required, false);
  assert.equal(receipt.settlement_allowed, true);
});

test("medium uncertainty and high-risk money categories require review", () => {
  const medium = createLocalGatePassAuditReceipt(input(examples[1]));
  assert.equal(medium.risk_tier, "medium");
  assert.equal(medium.verdict, "review_required");
  assert.equal(medium.applied_policy, "medium-risk-review-required");
  assert.equal(medium.human_review_required, true);
  assert.equal(medium.fast_path_allowed, false);

  const highInput = input(examples[2]);
  const high = createLocalGatePassAuditReceipt(highInput);
  assert.equal(high.risk_tier, "high");
  assert.equal(high.verdict, "review_required");
  assert.equal(high.applied_policy, "high-risk-approval-required");
  highInput.approval = { required: true, status: "approved" };
  const approved = createLocalGatePassAuditReceipt(highInput);
  assert.equal(approved.verdict, "allow_signed_gate_pass");
  assert.equal(approved.fast_path_allowed, false);
  assert.equal(approved.settlement_allowed, true);
});

test("base trust failures refuse and remain settlement blocked", () => {
  const cases: Array<[Partial<LocalGatePassDemoInput>, string, string]> = [
    [{ mandate: { present: false, scope: "none", expires_at: "2026-01-01T00:00:00Z" } }, "refuse_no_mandate", "MANDATE_REQUIRED"],
    [{ evidence: { present: true, fresh: false, source: "local_demo" } }, "refuse_stale_evidence", "EVIDENCE_STALE"],
    [{ verified_intent: { present: false, source: "local_demo" } }, "refuse_no_verified_intent", "VERIFIED_INTENT_REQUIRED"],
    [{ limits: { spend_amount_gbp: 2, max_allowed_gbp: 1 } }, "refuse_over_limit", "LIMIT_EXCEEDED"],
  ];
  for (const [change, verdict, reason] of cases) {
    const value = { ...input(examples[0]), ...change };
    const receipt = createLocalGatePassAuditReceipt(value);
    assert.equal(receipt.verdict, verdict);
    assert.equal(receipt.receipt_type, "refusal_receipt");
    assert.equal(receipt.settlement_allowed, false);
    assert.ok(receipt.reason_codes.includes(reason));
  }
});

test("prohibited restricted-material handling always refuses despite approval", () => {
  const receipt = createLocalGatePassAuditReceipt(input(examples[4]));
  assert.equal(receipt.verdict, "refuse_unsafe_action");
  assert.equal(receipt.receipt_type, "refusal_receipt");
  assert.equal(receipt.risk_tier, "blocked");
  assert.equal(receipt.applied_policy, "refusal-unsafe-action");
  assert.equal(receipt.settlement_allowed, false);
  assert.deepEqual(receipt.reason_codes, ["UNSUPPORTED_UNSAFE_ACTION"]);
});

test("policy summary is concise and explains the decision", () => {
  const value = input(examples[1]);
  const receipt = createLocalGatePassAuditReceipt(value);
  const summary = summariseLocalPolicy(value, receipt.verdict, receipt.reason_codes);
  assert.deepEqual(Object.keys(summary).sort(), [
    "applied_policy", "fast_path_allowed", "human_review_required", "reason_codes",
    "request_id", "risk_tier", "settlement_allowed", "verdict",
  ].sort());
  assert.equal(summary.applied_policy, "medium-risk-review-required");
  assert.equal(summary.human_review_required, true);
});

test("policy examples parse and contain no live or private operational material", () => {
  const unsafe = /https?:\/\/|endpoint[_-]?url|api[_-]?key|access[_-]?token|bearer|password|secret|credential|wallet|x402|\bap2\b|stripe|checkout|bank[_-]?account|live[_ -]?api|customer_email|phone_number|private_data/i;
  for (const name of examples) {
    const source = readFileSync(`examples/${name}`, "utf8");
    assert.doesNotThrow(() => JSON.parse(source), name);
    assert.doesNotMatch(source, unsafe, name);
  }
});
