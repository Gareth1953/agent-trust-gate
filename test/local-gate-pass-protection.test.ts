import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { LocalGatePassDemoInput } from "../src/local-gate-pass-demo.js";
import { createLocalGatePassAuditReceipt } from "../src/local-gate-pass-receipt.js";
import {
  createLocalGatePassReplayKey,
  evaluateLocalGatePassProtection,
  LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS,
  LocalGatePassReplayStore,
} from "../src/local-gate-pass-protection.js";
import { simulateLocalSettlementBlocker } from "../src/local-settlement-blocker.js";

function input(name: string): LocalGatePassDemoInput {
  return JSON.parse(readFileSync(`examples/${name}`, "utf8")) as LocalGatePassDemoInput;
}

function allowReceipt() {
  return createLocalGatePassAuditReceipt(input("policy-low-risk-fast-path-allow.json"));
}

test("allow receipts carry a bounded validity window and single-use replay key", () => {
  const receipt = allowReceipt();
  assert.equal(receipt.audit_metadata.schema_version, "atg.local-gate-pass-receipt.v2");
  assert.deepEqual(receipt.gate_pass_validity, {
    issued_at: "2026-07-07T09:00:00.000Z",
    valid_from: "2026-07-07T09:00:00.000Z",
    expires_at: "2026-07-07T09:05:00.000Z",
    ttl_seconds: 300,
    maximum_ttl_seconds: LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS,
  });
  assert.equal(receipt.replay_protection?.single_use, true);
  assert.equal(receipt.replay_protection?.protection_mode, "local_in_memory_single_use");
  assert.equal(
    receipt.replay_protection?.replay_key,
    createLocalGatePassReplayKey(receipt.receipt_id, receipt.request_id, receipt.checked_at),
  );
});

test("review and refusal receipts never receive gate-pass protection metadata", () => {
  for (const name of ["local-demo-money-review.json", "local-demo-no-mandate-refuse.json"]) {
    const receipt = createLocalGatePassAuditReceipt(input(name));
    assert.equal(receipt.gate_pass_validity, null);
    assert.equal(receipt.replay_protection, null);
  }
});

test("validity boundaries fail closed before valid_from and at expires_at", () => {
  const receipt = allowReceipt();
  const before = evaluateLocalGatePassProtection(receipt, "2026-07-07T08:59:59.999Z");
  assert.equal(before.protected, false);
  assert.equal(before.validity_status, "not_yet_valid");
  assert.deepEqual(before.reason_codes, ["gate_pass_not_yet_valid"]);

  const valid = evaluateLocalGatePassProtection(receipt, "2026-07-07T09:04:59.999Z");
  assert.equal(valid.protected, true);
  assert.equal(valid.validity_status, "valid");

  const expired = evaluateLocalGatePassProtection(receipt, "2026-07-07T09:05:00.000Z");
  assert.equal(expired.protected, false);
  assert.equal(expired.validity_status, "expired");
  assert.deepEqual(expired.reason_codes, ["gate_pass_expired"]);
});

test("a retained local replay store accepts once and blocks the replay", () => {
  const receipt = allowReceipt();
  const store = new LocalGatePassReplayStore();
  const first = evaluateLocalGatePassProtection(receipt, receipt.checked_at, store);
  assert.equal(first.protected, true);
  assert.equal(first.replay_status, "consumed");
  assert.equal(store.size, 1);

  const replay = evaluateLocalGatePassProtection(receipt, receipt.checked_at, store);
  assert.equal(replay.protected, false);
  assert.equal(replay.replay_status, "replay_detected");
  assert.deepEqual(replay.reason_codes, ["gate_pass_replay_detected"]);
  assert.deepEqual(store.snapshot(), [receipt.replay_protection?.replay_key]);
});

test("tampered validity and replay metadata fail closed", () => {
  const extended = structuredClone(allowReceipt());
  assert.ok(extended.gate_pass_validity);
  extended.gate_pass_validity.expires_at = "2026-07-07T09:05:01.000Z";
  assert.deepEqual(
    evaluateLocalGatePassProtection(extended, extended.checked_at).reason_codes,
    ["gate_pass_validity_metadata_invalid"],
  );

  const replayKey = structuredClone(allowReceipt());
  assert.ok(replayKey.replay_protection);
  replayKey.replay_protection.replay_key = "replay_demo_tampered";
  assert.deepEqual(
    evaluateLocalGatePassProtection(replayKey, replayKey.checked_at).reason_codes,
    ["gate_pass_replay_metadata_invalid"],
  );
});

test("settlement blocker applies expiry and replay protection before allowing", () => {
  const receipt = allowReceipt();
  const store = new LocalGatePassReplayStore();
  const context = { evaluated_at: receipt.checked_at, replay_store: store };
  const first = simulateLocalSettlementBlocker(receipt, context);
  assert.equal(first.settlement_simulation, "allowed");
  assert.equal(first.replay_status, "consumed");

  const replay = simulateLocalSettlementBlocker(receipt, context);
  assert.equal(replay.settlement_simulation, "blocked");
  assert.ok(replay.block_reason_codes.includes("gate_pass_replay_detected"));

  const expired = simulateLocalSettlementBlocker(receipt, {
    evaluated_at: receipt.gate_pass_validity?.expires_at ?? receipt.checked_at,
    replay_store: new LocalGatePassReplayStore(),
  });
  assert.equal(expired.settlement_simulation, "blocked");
  assert.ok(expired.block_reason_codes.includes("gate_pass_expired"));

  assert.deepEqual(
    JSON.parse(readFileSync("examples/gate-pass-replay-blocked.json", "utf8")),
    replay,
  );
  assert.deepEqual(
    JSON.parse(readFileSync("examples/gate-pass-expired-blocked.json", "utf8")),
    expired,
  );
});

test("protection decisions remain local non-persistent and non-executing", () => {
  const decision = evaluateLocalGatePassProtection(
    allowReceipt(),
    "2026-07-07T09:00:00.000Z",
    new LocalGatePassReplayStore(),
  );
  assert.equal(decision.mode, "local_in_memory_only");
  assert.equal(decision.persistent_state_written, false);
  assert.equal(decision.network_call_performed, false);
  assert.equal(decision.action_executed, false);
  assert.equal(decision.settlement_executed, false);
});

test("protection examples contain no endpoint credential or payment-rail data", () => {
  const unsafe = /https?:\/\/|endpoint[_-]?url|api[_-]?key|access[_-]?token|bearer|password|secret|credential|wallet|bank[_-]?account|x402|\bap2\b|stripe|checkout/i;
  for (const name of ["gate-pass-replay-blocked.json", "gate-pass-expired-blocked.json"]) {
    const source = readFileSync(`examples/${name}`, "utf8");
    assert.doesNotThrow(() => JSON.parse(source));
    assert.doesNotMatch(source, unsafe);
  }
});

test("CLI replay simulation shows first-use acceptance and replay blocking", () => {
  const result = spawnSync(process.execPath, [
    resolve("dist/src/local-demo-cli.js"),
    "--input",
    resolve("examples/policy-low-risk-fast-path-allow.json"),
    "--simulate-replay-protection",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /First attempt:[\s\S]*Settlement blocker simulation: allowed/);
  assert.match(result.stdout, /Replay attempt:[\s\S]*Settlement blocker simulation: blocked/);
  assert.match(result.stdout, /gate_pass_replay_detected/);
  assert.match(result.stdout, /No real settlement, payment, API call, or action execution occurred/);
});
