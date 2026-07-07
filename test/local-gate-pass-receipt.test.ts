import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createLocalGatePassAuditReceipt,
  createLocalGatePassReceiptId,
  summariseLocalGatePassAudit,
} from "../src/local-gate-pass-receipt.js";
import type { LocalGatePassDemoInput } from "../src/local-gate-pass-demo.js";

const input = (name: string): LocalGatePassDemoInput =>
  JSON.parse(readFileSync(`examples/${name}`, "utf8")) as LocalGatePassDemoInput;

test("every local demo verdict produces an inspectable receipt", () => {
  const names = [
    "local-demo-low-risk-allow.json",
    "local-demo-money-review.json",
    "local-demo-no-mandate-refuse.json",
    "local-demo-stale-evidence-refuse.json",
    "local-demo-over-limit-refuse.json",
  ];
  for (const name of names) {
    const receipt = createLocalGatePassAuditReceipt(input(name));
    assert.match(receipt.receipt_id, /^receipt_demo_[a-f0-9]{24}$/);
    assert.ok(receipt.checked_at);
    assert.equal(receipt.audit_metadata.local_only, true);
    assert.equal(receipt.settlement_executed, false);
  }
});

test("allow and review verdicts have the correct receipt and settlement eligibility", () => {
  const allow = createLocalGatePassAuditReceipt(input("local-demo-low-risk-allow.json"));
  assert.equal(allow.verdict, "allow_signed_gate_pass");
  assert.equal(allow.receipt_type, "signed_gate_pass");
  assert.equal(allow.settlement_allowed, true);

  const review = createLocalGatePassAuditReceipt(input("local-demo-money-review.json"));
  assert.equal(review.verdict, "review_required");
  assert.equal(review.receipt_type, "review_receipt");
  assert.equal(review.settlement_allowed, false);
  assert.equal(review.checks.approval.passed, false);
});

test("refusal receipts expose failed mandate evidence intent and limit checks", () => {
  const mandate = createLocalGatePassAuditReceipt(input("local-demo-no-mandate-refuse.json"));
  assert.equal(mandate.receipt_type, "refusal_receipt");
  assert.equal(mandate.checks.mandate.passed, false);
  assert.equal(mandate.checks.mandate.reason, "mandate_missing");
  assert.ok(mandate.reason_codes.includes("MANDATE_REQUIRED"));

  const stale = createLocalGatePassAuditReceipt(input("local-demo-stale-evidence-refuse.json"));
  assert.equal(stale.checks.evidence.passed, false);
  assert.equal(stale.checks.evidence.fresh, false);
  assert.ok(stale.reason_codes.includes("EVIDENCE_STALE"));

  const over = createLocalGatePassAuditReceipt(input("local-demo-over-limit-refuse.json"));
  assert.equal(over.checks.limits.passed, false);
  assert.ok(over.reason_codes.includes("LIMIT_EXCEEDED"));

  const missingIntent = input("local-demo-low-risk-allow.json");
  missingIntent.verified_intent = { present: false, source: "local_demo" };
  const intent = createLocalGatePassAuditReceipt(missingIntent);
  assert.equal(intent.checks.verified_intent.passed, false);
  assert.ok(intent.reason_codes.includes("VERIFIED_INTENT_REQUIRED"));
});

test("settlement is eligible only for an allow verdict and is never executed", () => {
  const names = [
    "local-demo-low-risk-allow.json",
    "local-demo-money-review.json",
    "local-demo-no-mandate-refuse.json",
    "local-demo-stale-evidence-refuse.json",
    "local-demo-over-limit-refuse.json",
  ];
  for (const name of names) {
    const receipt = createLocalGatePassAuditReceipt(input(name));
    assert.equal(receipt.settlement_allowed, receipt.verdict === "allow_signed_gate_pass");
    assert.equal(receipt.settlement_executed, false);
  }
});

test("audit summary reports failed checks and deterministic IDs are stable", () => {
  const receipt = createLocalGatePassAuditReceipt(input("local-demo-over-limit-refuse.json"));
  const summary = summariseLocalGatePassAudit(receipt);
  assert.ok(summary.failed_checks.includes("limits"));
  assert.deepEqual(summary.reason_codes, ["LIMIT_EXCEEDED"]);
  assert.equal(
    createLocalGatePassReceiptId(receipt.request_id, receipt.checked_at),
    createLocalGatePassReceiptId(receipt.request_id, receipt.checked_at),
  );
});

test("signature metadata is an explicit non-cryptographic local placeholder", () => {
  const receipt = createLocalGatePassAuditReceipt(input("local-demo-low-risk-allow.json"));
  assert.equal(receipt.signature_metadata.signature_mode, "local_demo_placeholder");
  assert.equal(receipt.signature_metadata.algorithm, "none");
  assert.match(receipt.signature_metadata.note, /not cryptographic signing/i);
});

test("receipt examples parse and contain no live endpoints credentials secrets or payment rails", () => {
  const names = [
    "local-receipt-signed-gate-pass.json",
    "local-receipt-review-required.json",
    "local-receipt-refusal-no-mandate.json",
    "local-receipt-refusal-stale-evidence.json",
    "local-receipt-refusal-over-limit.json",
  ];
  const unsafe = /https?:\/\/|api[_-]?key|access[_-]?token|bearer|password|secret|wallet|x402|\bap2\b|stripe|checkout|bank[_-]?account|endpoint[_-]?url/i;
  for (const name of names) {
    const text = readFileSync(`examples/${name}`, "utf8");
    assert.doesNotThrow(() => JSON.parse(text), name);
    assert.doesNotMatch(text, unsafe, name);
  }
});
