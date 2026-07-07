import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { LocalGatePassDemoInput } from "../src/local-gate-pass-demo.js";
import { createLocalGatePassAuditReceipt } from "../src/local-gate-pass-receipt.js";
import { LocalGatePassReplayStore } from "../src/local-gate-pass-protection.js";
import {
  verifyLocalTrustReceipt,
  type LocalTrustReceiptVerifierOptions,
} from "../src/local-trust-receipt-verifier.js";

const exampleNames = [
  "receipt-verification-valid-pass.json",
  "receipt-verification-expired-blocked.json",
  "receipt-verification-replay-blocked.json",
  "receipt-verification-mismatch-blocked.json",
  "receipt-verification-review-blocked.json",
  "receipt-verification-refusal-blocked.json",
  "receipt-verification-malformed-blocked.json",
] as const;

function input(name: string): LocalGatePassDemoInput {
  return JSON.parse(readFileSync(`examples/${name}`, "utf8")) as LocalGatePassDemoInput;
}

function receipt(name = "policy-low-risk-fast-path-allow.json") {
  return createLocalGatePassAuditReceipt(input(name));
}

function matchingOptions(value = input("policy-low-risk-fast-path-allow.json")): LocalTrustReceiptVerifierOptions {
  return {
    expected_request_id: value.request_id,
    expected_agent_id: value.agent_id,
    expected_requested_action: value.requested_action,
    current_time: value.checked_at ?? "1970-01-01T00:00:00.000Z",
  };
}

test("valid v2 signed gate pass verifies and is eligible for simulated settlement", () => {
  const decision = verifyLocalTrustReceipt(receipt(), matchingOptions());
  assert.equal(decision.verified, true);
  assert.equal(decision.valid_for_simulated_settlement, true);
  assert.equal(decision.structurally_valid, true);
  assert.equal(decision.schema_supported, true);
  assert.equal(decision.internally_consistent, true);
  assert.equal(decision.fresh, true);
  assert.equal(decision.replay_safe, true);
  assert.equal(decision.settlement_blocker_allowed, true);
  assert.deepEqual(decision.reason_codes, []);
  assert.deepEqual(decision.warnings, ["signature_not_cryptographic"]);
});

test("signed gate pass is settlement eligible only while validity and blocker pass", () => {
  const value = receipt();
  const current = value.gate_pass_validity?.expires_at ?? value.checked_at;
  const expired = verifyLocalTrustReceipt(value, { ...matchingOptions(), current_time: current });
  assert.equal(expired.verified, false);
  assert.equal(expired.fresh, false);
  assert.equal(expired.valid_for_simulated_settlement, false);
  assert.equal(expired.settlement_blocker_allowed, false);
  assert.ok(expired.reason_codes.includes("expired_receipt"));
  assert.ok(expired.reason_codes.includes("settlement_blocker_rejected"));
});

test("previous receipt ID and consumed replay store both block replay", () => {
  const value = receipt();
  const seen = verifyLocalTrustReceipt(value, {
    ...matchingOptions(),
    previously_seen_receipt_ids: [value.receipt_id],
  });
  assert.equal(seen.replay_safe, false);
  assert.equal(seen.valid_for_simulated_settlement, false);
  assert.equal(seen.settlement_blocker_allowed, false);
  assert.ok(seen.reason_codes.includes("replay_risk_detected"));

  const store = new LocalGatePassReplayStore();
  const first = verifyLocalTrustReceipt(value, { ...matchingOptions(), replay_store: store });
  assert.ok(value.replay_protection);
  store.consume(value.replay_protection.replay_key);
  const replay = verifyLocalTrustReceipt(value, { ...matchingOptions(), replay_store: store });
  assert.equal(first.valid_for_simulated_settlement, true);
  assert.equal(replay.replay_safe, false);
  assert.equal(replay.valid_for_simulated_settlement, false);
  assert.ok(replay.reason_codes.includes("replay_risk_detected"));
});

test("custom verifier TTL can tighten but never extend gate-pass freshness", () => {
  const value = receipt();
  const expired = verifyLocalTrustReceipt(value, {
    ...matchingOptions(),
    ttl_seconds: 30,
    current_time: "2026-07-07T09:00:30.000Z",
  });
  assert.equal(expired.fresh, false);
  assert.ok(expired.reason_codes.includes("expired_receipt"));
});

test("request agent and requested-action scope mismatches fail verification", () => {
  const cases: Array<[keyof LocalTrustReceiptVerifierOptions, string]> = [
    ["expected_request_id", "request_id_mismatch"],
    ["expected_agent_id", "agent_id_mismatch"],
    ["expected_requested_action", "requested_action_mismatch"],
  ];
  for (const [field, reason] of cases) {
    const decision = verifyLocalTrustReceipt(receipt(), {
      ...matchingOptions(),
      [field]: "unexpected-local-value",
    });
    assert.equal(decision.verified, false);
    assert.equal(decision.valid_for_simulated_settlement, false);
    assert.ok(decision.reason_codes.includes(reason as never));
  }
});

test("review and refusal receipts verify structurally but never for settlement", () => {
  const cases = [
    ["local-demo-money-review.json", "review_receipt_not_settlement_eligible"],
    ["local-demo-no-mandate-refuse.json", "refusal_receipt_not_settlement_eligible"],
  ] as const;
  for (const [name, reason] of cases) {
    const source = input(name);
    const decision = verifyLocalTrustReceipt(createLocalGatePassAuditReceipt(source), matchingOptions(source));
    assert.equal(decision.verified, true);
    assert.equal(decision.structurally_valid, true);
    assert.equal(decision.internally_consistent, true);
    assert.equal(decision.valid_for_simulated_settlement, false);
    assert.equal(decision.settlement_blocker_allowed, false);
    assert.ok(decision.reason_codes.includes(reason));

    const required = verifyLocalTrustReceipt(createLocalGatePassAuditReceipt(source), {
      ...matchingOptions(source),
      require_settlement_eligibility: true,
    });
    assert.equal(required.verified, false);
  }
});

test("missing malformed and unsupported receipts fail safely", () => {
  const missing = verifyLocalTrustReceipt(undefined, { current_time: "2026-07-07T09:00:00Z" });
  assert.deepEqual(missing.reason_codes, ["missing_receipt"]);

  const malformed = verifyLocalTrustReceipt("not-a-receipt", { current_time: "2026-07-07T09:00:00Z" });
  assert.deepEqual(malformed.reason_codes, ["malformed_receipt"]);

  const missingField = structuredClone(receipt()) as unknown as Record<string, unknown>;
  delete missingField.checks;
  const missingResult = verifyLocalTrustReceipt(missingField, matchingOptions());
  assert.equal(missingResult.structurally_valid, false);
  assert.ok(missingResult.reason_codes.includes("missing_required_field"));
  assert.ok(missingResult.reason_codes.includes("missing_checks"));

  const unsupported = structuredClone(receipt()) as unknown as Record<string, unknown>;
  (unsupported.audit_metadata as Record<string, unknown>).schema_version = "atg.local-gate-pass-receipt.v999";
  const unsupportedResult = verifyLocalTrustReceipt(unsupported, matchingOptions());
  assert.equal(unsupportedResult.schema_supported, false);
  assert.equal(unsupportedResult.verified, false);
  assert.ok(unsupportedResult.reason_codes.includes("unsupported_schema_version"));
});

test("type verdict allow and settlement inconsistencies fail", () => {
  const typeMismatch = structuredClone(receipt()) as unknown as Record<string, unknown>;
  typeMismatch.receipt_type = "review_receipt";
  const typeResult = verifyLocalTrustReceipt(typeMismatch, matchingOptions());
  assert.equal(typeResult.internally_consistent, false);
  assert.ok(typeResult.reason_codes.includes("receipt_type_verdict_mismatch"));

  const allowedMismatch = structuredClone(receipt()) as unknown as Record<string, unknown>;
  allowedMismatch.settlement_allowed = false;
  const allowedResult = verifyLocalTrustReceipt(allowedMismatch, matchingOptions());
  assert.equal(allowedResult.internally_consistent, false);
  assert.ok(allowedResult.reason_codes.includes("allowed_settlement_mismatch"));
});

test("failed checks reason-code gaps policy gaps and signature gaps fail closed", () => {
  const failedCheck = structuredClone(receipt()) as unknown as Record<string, unknown>;
  ((failedCheck.checks as Record<string, unknown>).evidence as Record<string, unknown>).passed = false;
  const failedResult = verifyLocalTrustReceipt(failedCheck, matchingOptions());
  assert.equal(failedResult.valid_for_simulated_settlement, false);
  assert.ok(failedResult.reason_codes.includes("failed_critical_check"));
  assert.ok(failedResult.reason_codes.includes("reason_codes_missing_for_failed_checks"));

  const policy = structuredClone(receipt()) as unknown as Record<string, unknown>;
  policy.applied_policy = "";
  assert.ok(verifyLocalTrustReceipt(policy, matchingOptions()).reason_codes.includes("missing_policy_metadata"));

  const signature = structuredClone(receipt()) as unknown as Record<string, unknown>;
  delete signature.signature_metadata;
  const signatureResult = verifyLocalTrustReceipt(signature, matchingOptions());
  assert.equal(signatureResult.verified, false);
  assert.ok(signatureResult.reason_codes.includes("missing_signature_metadata"));
});

test("verification output is explicitly local-only", () => {
  const decision = verifyLocalTrustReceipt(receipt(), matchingOptions());
  assert.equal(decision.mode, "local_simulation_only");
  assert.equal(
    decision.note,
    "Local receipt verification only; no real settlement, payment, API call, or action execution occurred.",
  );
});

test("tracked verification examples match deterministic decisions", () => {
  const allow = receipt();
  const reviewInput = input("local-demo-money-review.json");
  const refusalInput = input("local-demo-no-mandate-refuse.json");
  const expected = [
    verifyLocalTrustReceipt(allow, matchingOptions()),
    verifyLocalTrustReceipt(allow, {
      ...matchingOptions(),
      current_time: allow.gate_pass_validity?.expires_at ?? allow.checked_at,
    }),
    verifyLocalTrustReceipt(allow, {
      ...matchingOptions(),
      previously_seen_receipt_ids: [allow.receipt_id],
    }),
    verifyLocalTrustReceipt(allow, {
      ...matchingOptions(),
      expected_request_id: "different-local-request",
    }),
    verifyLocalTrustReceipt(createLocalGatePassAuditReceipt(reviewInput), matchingOptions(reviewInput)),
    verifyLocalTrustReceipt(createLocalGatePassAuditReceipt(refusalInput), matchingOptions(refusalInput)),
    verifyLocalTrustReceipt("not-a-receipt", { current_time: "2026-07-07T09:00:00Z" }),
  ];
  exampleNames.forEach((name, index) => {
    assert.equal(existsSync(`examples/${name}`), true, name);
    assert.deepEqual(JSON.parse(readFileSync(`examples/${name}`, "utf8")), expected[index], name);
  });
});

test("verification examples contain no URLs endpoints secrets credentials or payment data", () => {
  const unsafe = /https?:\/\/|endpoint[_-]?url|api[_-]?key|access[_-]?token|bearer|password|secret|credential|wallet|bank[_-]?account|routing[_-]?number|x402|\bap2\b|stripe|checkout|private_data/i;
  for (const name of exampleNames) {
    const source = readFileSync(`examples/${name}`, "utf8");
    assert.doesNotThrow(() => JSON.parse(source), name);
    assert.doesNotMatch(source, unsafe, name);
  }
});

test("verification documentation and README preserve trust and local-only boundaries", () => {
  const path = "docs/local-trust-receipt-verification.md";
  assert.equal(existsSync(path), true);
  const document = readFileSync(path, "utf8");
  assert.match(document, /receipt is not trusted merely because it exists/i);
  assert.match(document, /structurally valid, supported, internally consistent, fresh, scoped as requested, and replay-safe/i);
  assert.match(document, /not production cryptographic verification/i);
  assert.match(document, /No mandate\. No evidence\. No verified intent\. No signed gate pass\. No settlement\./);
  const readme = readFileSync("README.md", "utf8");
  assert.match(readme, /docs\/local-trust-receipt-verification\.md/);
});

test("CLI verify-receipt flag prints verification and local-only warning", () => {
  const result = spawnSync(process.execPath, [
    resolve("dist/src/local-demo-cli.js"),
    "--input",
    resolve("examples/policy-low-risk-fast-path-allow.json"),
    "--verify-receipt",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /Receipt verification: verified/);
  assert.match(result.stdout, /Valid for simulated settlement: true/);
  assert.match(result.stdout, /Structurally valid: true/);
  assert.match(result.stdout, /Internally consistent: true/);
  assert.match(result.stdout, /Fresh: true/);
  assert.match(result.stdout, /Replay safe: true/);
  assert.match(result.stdout, /Mode: local_simulation_only/);
  assert.match(result.stdout, /No real settlement, payment, API call, or action execution occurred/);

  const combined = spawnSync(process.execPath, [
    resolve("dist/src/local-demo-cli.js"),
    "--input",
    resolve("examples/policy-low-risk-fast-path-allow.json"),
    "--verify-receipt",
    "--simulate-settlement-blocker",
  ], { encoding: "utf8" });
  assert.equal(combined.status, 0);
  assert.match(combined.stdout, /Receipt verification: verified/);
  assert.match(combined.stdout, /Settlement blocker simulation: allowed/);
});
