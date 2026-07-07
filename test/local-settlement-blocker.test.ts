import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { LocalGatePassDemoInput } from "../src/local-gate-pass-demo.js";
import { createLocalGatePassAuditReceipt } from "../src/local-gate-pass-receipt.js";
import {
  isReceiptSettlementEligible,
  simulateLocalSettlementBlocker,
} from "../src/local-settlement-blocker.js";

const exampleOutputs = [
  "settlement-blocker-allow.json",
  "settlement-blocker-review-blocked.json",
  "settlement-blocker-refusal-blocked.json",
  "settlement-blocker-over-limit-blocked.json",
  "settlement-blocker-missing-receipt-blocked.json",
] as const;

function input(name: string): LocalGatePassDemoInput {
  return JSON.parse(readFileSync(`examples/${name}`, "utf8")) as LocalGatePassDemoInput;
}

function receipt(name: string) {
  return createLocalGatePassAuditReceipt(input(name));
}

test("complete signed gate pass is the only settlement-eligible receipt", () => {
  const allow = receipt("policy-low-risk-fast-path-allow.json");
  assert.equal(isReceiptSettlementEligible(allow), true);
  const decision = simulateLocalSettlementBlocker(allow);
  assert.equal(decision.settlement_simulation, "allowed");
  assert.equal(decision.blocked, false);
  assert.deepEqual(decision.block_reason_codes, []);
  assert.equal(decision.settlement_executed, false);

  const tampered = structuredClone(allow);
  tampered.checks.evidence.passed = false;
  assert.equal(isReceiptSettlementEligible(tampered), false);
  assert.ok(simulateLocalSettlementBlocker(tampered).block_reason_codes.includes("critical_check_failed"));
});

test("review and refusal receipts block with explicit reasons", () => {
  const review = simulateLocalSettlementBlocker(receipt("local-demo-money-review.json"));
  assert.equal(review.settlement_simulation, "blocked");
  assert.ok(review.block_reason_codes.includes("receipt_type_not_allowed"));
  assert.ok(review.block_reason_codes.includes("human_review_required"));

  const refusal = simulateLocalSettlementBlocker(receipt("local-demo-no-mandate-refuse.json"));
  assert.equal(refusal.settlement_simulation, "blocked");
  assert.ok(refusal.block_reason_codes.includes("refusal_receipt_blocks_settlement"));
  assert.ok(refusal.block_reason_codes.includes("refusal_reason_code_present"));
});

test("over-limit stale-evidence missing-intent and missing-approval outcomes block", () => {
  const base = input("policy-low-risk-fast-path-allow.json");
  const cases: LocalGatePassDemoInput[] = [
    input("local-demo-over-limit-refuse.json"),
    input("local-demo-stale-evidence-refuse.json"),
    { ...base, verified_intent: { present: false, source: "local_demo" } },
    input("local-demo-money-review.json"),
  ];
  for (const value of cases) {
    const decision = simulateLocalSettlementBlocker(createLocalGatePassAuditReceipt(value));
    assert.equal(decision.blocked, true);
    assert.equal(decision.settlement_simulation, "blocked");
    assert.equal(decision.settlement_executed, false);
  }
});

test("missing and malformed receipts fail closed safely", () => {
  const missing = simulateLocalSettlementBlocker(undefined);
  assert.deepEqual(missing.block_reason_codes, ["missing_receipt"]);
  assert.equal(missing.mode, "local_simulation_only");

  const malformed = simulateLocalSettlementBlocker({ receipt_type: "signed_gate_pass" });
  assert.deepEqual(malformed.block_reason_codes, ["malformed_receipt"]);
  assert.equal(malformed.blocked, true);
  assert.equal(isReceiptSettlementEligible(malformed), false);
});

test("every blocker decision is explicitly local and non-executing", () => {
  for (const value of [undefined, {}, receipt("policy-low-risk-fast-path-allow.json"), receipt("local-demo-money-review.json")]) {
    const decision = simulateLocalSettlementBlocker(value);
    assert.equal(decision.mode, "local_simulation_only");
    assert.equal(decision.note, "No real settlement, payment, API call, or action execution occurred.");
    assert.equal(decision.settlement_executed, false);
    assert.equal(decision.payment_triggered, false);
    assert.equal(decision.network_call_performed, false);
    assert.equal(decision.action_executed, false);
  }
});

test("tracked blocker examples exactly match deterministic decisions", () => {
  const expected = [
    simulateLocalSettlementBlocker(receipt("policy-low-risk-fast-path-allow.json")),
    simulateLocalSettlementBlocker(receipt("local-demo-money-review.json")),
    simulateLocalSettlementBlocker(receipt("local-demo-no-mandate-refuse.json")),
    simulateLocalSettlementBlocker(receipt("local-demo-over-limit-refuse.json")),
    simulateLocalSettlementBlocker(undefined),
  ];
  exampleOutputs.forEach((name, index) => {
    assert.equal(existsSync(`examples/${name}`), true, name);
    assert.deepEqual(JSON.parse(readFileSync(`examples/${name}`, "utf8")), expected[index], name);
  });
});

test("blocker examples contain no network credentials banking wallet or payment-rail data", () => {
  const unsafe = /https?:\/\/|endpoint[_-]?url|api[_-]?key|access[_-]?token|bearer|password|secret|credential|wallet|bank[_-]?account|routing[_-]?number|x402|\bap2\b|stripe|checkout|private_data/i;
  for (const name of exampleOutputs) {
    const source = readFileSync(`examples/${name}`, "utf8");
    assert.doesNotThrow(() => JSON.parse(source), name);
    assert.doesNotMatch(source, unsafe, name);
  }
});

test("CLI settlement blocker flag prints decision and local-only warning", () => {
  const cli = resolve("dist/src/local-demo-cli.js");
  const result = spawnSync(process.execPath, [
    cli,
    "--input",
    resolve("examples/local-demo-money-review.json"),
    "--simulate-settlement-blocker",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /Settlement blocker simulation: blocked/);
  assert.match(result.stdout, /receipt_type_not_allowed/);
  assert.match(result.stdout, /human_review_required/);
  assert.match(result.stdout, /Mode: local_simulation_only/);
  assert.match(result.stdout, /No real settlement, payment, API call, or action execution occurred/);
});
