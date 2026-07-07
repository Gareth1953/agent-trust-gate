import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  runLocalGatePassDemo,
  type LocalGatePassDemoInput,
} from "../src/local-gate-pass-demo.js";

const example = (name: string): LocalGatePassDemoInput =>
  JSON.parse(readFileSync(`examples/${name}`, "utf8")) as LocalGatePassDemoInput;

test("low-risk valid request produces a placeholder signed gate pass", () => {
  const result = runLocalGatePassDemo(example("local-demo-low-risk-allow.json"));
  assert.equal(result.verdict, "allow_signed_gate_pass");
  assert.equal(result.allowed, true);
  assert.equal(result.receipt_type, "signed_gate_pass");
  assert.equal(result.signature_metadata.signature_mode, "local_demo_placeholder");
  assert.equal(result.signature_metadata.signed, false);
});

test("money request without final approval requires review", () => {
  const result = runLocalGatePassDemo(example("local-demo-money-review.json"));
  assert.equal(result.verdict, "review_required");
  assert.equal(result.allowed, false);
  assert.equal(result.receipt_type, "review_receipt");
  assert.deepEqual(result.reason_codes, ["HUMAN_REVIEW_REQUIRED"]);
});

test("missing mandate refuses", () => {
  const result = runLocalGatePassDemo(example("local-demo-no-mandate-refuse.json"));
  assert.equal(result.verdict, "refuse_no_mandate");
  assert.equal(result.receipt_type, "refusal_receipt");
});

test("expired mandate refuses", () => {
  const input = example("local-demo-low-risk-allow.json");
  input.mandate = { present: true, scope: "synthetic review", expires_at: "2026-01-01T00:00:00Z" };
  const result = runLocalGatePassDemo(input);
  assert.equal(result.verdict, "refuse_no_mandate");
  assert.deepEqual(result.reason_codes, ["MANDATE_EXPIRED"]);
});

test("missing and stale evidence refuse", () => {
  const missing = example("local-demo-low-risk-allow.json");
  missing.evidence = { present: false, fresh: false, source: "local_demo" };
  assert.equal(runLocalGatePassDemo(missing).verdict, "refuse_no_evidence");

  const stale = runLocalGatePassDemo(example("local-demo-stale-evidence-refuse.json"));
  assert.equal(stale.verdict, "refuse_stale_evidence");
  assert.equal(stale.receipt_type, "refusal_receipt");
});

test("over-limit request refuses before approval review", () => {
  const result = runLocalGatePassDemo(example("local-demo-over-limit-refuse.json"));
  assert.equal(result.verdict, "refuse_over_limit");
  assert.deepEqual(result.reason_codes, ["LIMIT_EXCEEDED"]);
});

test("missing verified intent refuses", () => {
  const input = example("local-demo-low-risk-allow.json");
  input.verified_intent = { present: false, source: "local_demo" };
  const result = runLocalGatePassDemo(input);
  assert.equal(result.verdict, "refuse_no_verified_intent");
  assert.equal(result.receipt_type, "refusal_receipt");
});

test("rejected required approval refuses", () => {
  const input = example("local-demo-money-review.json");
  input.approval = { required: true, status: "rejected" };
  const result = runLocalGatePassDemo(input);
  assert.equal(result.verdict, "refuse_missing_approval");
  assert.equal(result.receipt_type, "refusal_receipt");
});

test("every result remains local and never authorises settlement", () => {
  const names = [
    "local-demo-low-risk-allow.json",
    "local-demo-money-review.json",
    "local-demo-no-mandate-refuse.json",
    "local-demo-stale-evidence-refuse.json",
    "local-demo-over-limit-refuse.json",
  ];

  for (const name of names) {
    const result = runLocalGatePassDemo(example(name));
    assert.equal(result.settlement_allowed, false, name);
    assert.equal(result.action_executed, false, name);
    assert.equal(result.payment_triggered, false, name);
    assert.equal(result.network_call_performed, false, name);
    assert.equal(result.external_agent_contacted, false, name);
    assert.equal(result.local_only, true, name);
  }
});

test("examples contain no live endpoints credentials or payment rails", () => {
  const names = [
    "local-demo-low-risk-allow.json",
    "local-demo-money-review.json",
    "local-demo-no-mandate-refuse.json",
    "local-demo-stale-evidence-refuse.json",
    "local-demo-over-limit-refuse.json",
  ];
  const unsafe = /https?:\/\/|api[_-]?key|access[_-]?token|bearer|password|secret|wallet|x402|\bap2\b|stripe|checkout|bank[_-]?account|endpoint[_-]?url/i;

  for (const name of names) {
    const text = readFileSync(`examples/${name}`, "utf8");
    assert.doesNotMatch(text, unsafe, name);
    assert.doesNotThrow(() => JSON.parse(text), name);
  }
});
