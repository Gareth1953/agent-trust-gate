import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  DEFAULT_AGGREGATE_EXPOSURE_RULE,
  DurableStateError,
  LIFECYCLE_TRANSITION_TABLE,
  LocalDurableLifecycleStore,
  createOperatorAuthorityEvidence,
  type AggregateExposureRule,
} from "../src/durable-action-lifecycle.js";
import {
  McpExactActionGateway,
  createDefaultMcpBusinessPolicyRequest,
  type McpBusinessPolicyResult,
} from "../src/mcp-exact-action-gateway.js";
import type { ExactActionGatePass } from "../src/exact-action-gatepass.js";
import { validateJsonSchemaFile } from "../src/json-schema-validator.js";

const tempDirectories: string[] = [];
afterEach(() => {
  while (tempDirectories.length > 0) rmSync(tempDirectories.pop()!, { recursive: true, force: true });
});

function statePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "atg-p3-m160-"));
  tempDirectories.push(directory);
  return join(directory, "state.json");
}

function rule(patch: Partial<AggregateExposureRule> = {}): AggregateExposureRule {
  return { ...DEFAULT_AGGREGATE_EXPOSURE_RULE, ...patch };
}

async function evaluate(
  store: LocalDurableLifecycleStore,
  nonce: string,
  amountMinorUnits = 400_000,
  options: { mode?: "enforced" | "shadow"; exposureRule?: AggregateExposureRule } = {},
): Promise<McpBusinessPolicyResult> {
  const totalAmount = amountMinorUnits / 100;
  const request = createDefaultMcpBusinessPolicyRequest(
    options.mode ?? "enforced",
    { nonce, totalAmount },
  );
  request.amountMinorUnits = amountMinorUnits;
  const gateway = new McpExactActionGateway(options.exposureRule === undefined
    ? { durableStore: store }
    : { durableStore: store, exposureRule: options.exposureRule });
  return await gateway.evaluateAction(request) as McpBusinessPolicyResult;
}

async function issued(
  store: LocalDurableLifecycleStore,
  nonce: string,
  amountMinorUnits = 400_000,
  exposureRule: AggregateExposureRule = DEFAULT_AGGREGATE_EXPOSURE_RULE,
): Promise<{ result: McpBusinessPolicyResult; gatePass: ExactActionGatePass }> {
  const result = await evaluate(store, nonce, amountMinorUnits, { exposureRule });
  assert.equal(result.outcome, "ACCEPT", result.reasonCodes.join(","));
  assert.ok(result.gatePass);
  assert.equal(result.lifecycle?.status, "ISSUED");
  return { result, gatePass: result.gatePass };
}

const operator = createOperatorAuthorityEvidence();

test("transition table is explicit and terminal states cannot create authority", () => {
  assert.deepEqual(LIFECYCLE_TRANSITION_TABLE.EXECUTED, []);
  assert.deepEqual(LIFECYCLE_TRANSITION_TABLE.REVOKED, []);
  assert.deepEqual(LIFECYCLE_TRANSITION_TABLE.EXPIRED, []);
  assert.deepEqual(LIFECYCLE_TRANSITION_TABLE.REJECTED, []);
  assert.deepEqual(LIFECYCLE_TRANSITION_TABLE.REFERRED, []);
  assert.ok(LIFECYCLE_TRANSITION_TABLE.UNKNOWN.includes("UNKNOWN"));
  assert.ok(!LIFECYCLE_TRANSITION_TABLE.UNKNOWN.includes("ISSUED"));
});

test("enforced ACCEPT persists ISSUED before returning its GatePass", async () => {
  const path = statePath();
  const store = new LocalDurableLifecycleStore({ statePath: path });
  const { result, gatePass } = await issued(store, "nonce_durable_issued_001");
  const restarted = new LocalDurableLifecycleStore({ statePath: path });
  const record = restarted.getLifecycleByGatePassId(gatePass.gatePassId);
  assert.equal(record?.status, "ISSUED");
  assert.equal(record?.actionDigest, gatePass.action.actionDigest);
  assert.equal(record?.policyDigest, gatePass.action.policyDigest);
  assert.equal(record?.passportDigest, result.passport.passportDigest);
  assert.equal(restarted.snapshot().exposureEntries[0]?.status, "OUTSTANDING");
  const altered = structuredClone(gatePass);
  altered.action.actionDigest = `sha256:${"0".repeat(64)}`;
  assert.equal(restarted.reserve(altered, 1, "2026-09-02T09:01:00.000Z").reasonCode, "LIFECYCLE_BINDING_MISMATCH");
  assert.equal(restarted.reserve(gatePass, 1, "2026-09-02T09:01:00.000Z").changed, true);
});

test("invalid transition rejects and exactly one compare-and-set reservation succeeds", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const { gatePass } = await issued(store, "nonce_reservation_cas_001");
  const revision = store.getLifecycleByGatePassId(gatePass.gatePassId)!.lifecycleRevision;
  const attempts = await Promise.all(Array.from({ length: 8 }, async () =>
    store.reserve(gatePass, revision, "2026-09-02T09:01:00.000Z")));
  assert.equal(attempts.filter((attempt) => attempt.changed).length, 1);
  assert.equal(store.getLifecycleByGatePassId(gatePass.gatePassId)?.status, "RESERVED");
  const invalid = store.markExecuted("unknown-gatepass", "2026-09-02T09:02:00.000Z");
  assert.equal(invalid.reasonCode, "LIFECYCLE_RECORD_NOT_FOUND");
});

test("consumed and terminal lifecycle cannot be reused", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const { gatePass } = await issued(store, "nonce_terminal_001");
  assert.equal(store.reserve(gatePass, 1, "2026-09-02T09:01:00.000Z").changed, true);
  assert.equal(store.markExecuted(gatePass.gatePassId, "2026-09-02T09:02:00.000Z").changed, true);
  const again = store.reserve(gatePass, 3, "2026-09-02T09:03:00.000Z");
  assert.equal(again.changed, false);
  assert.equal(again.lifecycle?.status, "EXECUTED");
  assert.equal(store.markExecuted(gatePass.gatePassId, "2026-09-02T09:03:00.000Z").reasonCode, "LIFECYCLE_TERMINAL");
});

test("truncated, corrupted and unsupported-version storage fail closed", async () => {
  for (const mutation of [
    (_text: string) => "{\"truncated\":",
    (text: string) => text.replace('"storeRevision": 1', '"storeRevision": 99'),
    (text: string) => text.replace("atg.durable-lifecycle-store.local.v1", "atg.durable-lifecycle-store.local.v999"),
  ]) {
    const path = statePath();
    const store = new LocalDurableLifecycleStore({ statePath: path });
    await issued(store, `nonce_corrupt_${tempDirectories.length}`);
    writeFileSync(path, mutation(readFileSync(path, "utf8")), "utf8");
    const restarted = new LocalDurableLifecycleStore({ statePath: path });
    assert.equal(restarted.health().available, false);
    assert.throws(() => restarted.snapshot(), DurableStateError);
  }
});

test("write interruption before persistence returns no authority", async () => {
  const path = statePath();
  const store = new LocalDurableLifecycleStore({
    statePath: path,
    faultInjector: (stage) => { if (stage === "before_write") throw new Error("synthetic interruption"); },
  });
  const result = await evaluate(store, "nonce_interrupted_001");
  assert.equal(result.outcome, "REJECT");
  assert.equal(result.gatePass, null);
  assert.ok(result.reasonCodes.includes("DURABLE_WRITE_FAILED"));
});

test("several valid actions fit, then outstanding authority exhausts aggregate exposure", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const first = await evaluate(store, "nonce_exposure_001");
  const second = await evaluate(store, "nonce_exposure_002");
  const third = await evaluate(store, "nonce_exposure_003");
  assert.deepEqual([first.outcome, second.outcome, third.outcome], ["ACCEPT", "ACCEPT", "REFER"]);
  assert.equal(third.gatePass, null);
  assert.ok(third.reasonCodes.includes("EXPOSURE_AMOUNT_LIMIT_EXCEEDED"));
  assert.equal(store.snapshot().exposureEntries.filter((entry) => entry.status === "OUTSTANDING").length, 2);
});

test("concurrent issuance cannot overcommit aggregate exposure", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const results = await Promise.all([1, 2, 3].map((index) =>
    evaluate(store, `nonce_concurrent_issue_00${index}`)));
  assert.equal(results.filter((result) => result.outcome === "ACCEPT").length, 2);
  assert.equal(results.filter((result) => result.outcome === "REFER").length, 1);
  const counted = store.snapshot().exposureEntries.filter((entry) => entry.status !== "RELEASED");
  assert.equal(counted.reduce((sum, entry) => sum + entry.amountMinorUnits, 0), 800_000);
});

test("executed and UNKNOWN exposure remain counted across restart", async () => {
  const path = statePath();
  const store = new LocalDurableLifecycleStore({ statePath: path });
  const first = await issued(store, "nonce_committed_001");
  store.reserve(first.gatePass, 1, "2026-09-02T09:01:00.000Z");
  store.markExecuted(first.gatePass.gatePassId, "2026-09-02T09:02:00.000Z");
  const second = await issued(store, "nonce_unknown_001");
  store.reserve(second.gatePass, 1, "2026-09-02T09:01:00.000Z");
  store.markPossibleExternalEffect(second.gatePass.gatePassId, "2026-09-02T09:02:00.000Z");
  const restarted = new LocalDurableLifecycleStore({ statePath: path });
  const third = await evaluate(restarted, "nonce_counted_after_restart_001");
  assert.equal(third.outcome, "REFER");
  assert.deepEqual(restarted.snapshot().exposureEntries.map((entry) => entry.status), ["COMMITTED", "UNKNOWN"]);
});

test("revoked, expired and formally abandoned unused authority release exposure exactly once", async () => {
  for (const release of ["revoke", "expire", "abandon"] as const) {
    const store = new LocalDurableLifecycleStore({ statePath: statePath() });
    const { gatePass } = await issued(store, `nonce_release_${release}_001`);
    if (release === "revoke") {
      const first = store.revoke({ gatePass, reason: "Synthetic operator revocation", revokedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: operator });
      const second = store.revoke({ gatePass, reason: "Synthetic operator revocation", revokedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: operator });
      assert.equal(first.changed, true);
      assert.equal(second.changed, false);
      assert.deepEqual(second.receipt, first.receipt);
    } else if (release === "expire") {
      assert.equal(store.expire(gatePass.gatePassId, "2026-09-02T09:06:00.000Z").changed, true);
      assert.equal(store.expire(gatePass.gatePassId, "2026-09-02T09:07:00.000Z").changed, false);
    } else {
      assert.equal(store.abandonIssued(gatePass.gatePassId, "2026-09-02T09:01:00.000Z", operator).changed, true);
      assert.equal(store.abandonIssued(gatePass.gatePassId, "2026-09-02T09:02:00.000Z", operator).changed, false);
    }
    const entries = store.snapshot().exposureEntries;
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.status, "RELEASED");
  }
});

test("Shadow Mode simulates exposure without mutating lifecycle or ledger", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const before = store.snapshot();
  const shadow = await evaluate(store, "nonce_shadow_exposure_001", 400_000, { mode: "shadow" });
  const after = store.snapshot();
  assert.equal(shadow.outcome, "SHADOW");
  assert.equal(shadow.aggregateExposure?.simulatedOnly, true);
  assert.equal(shadow.gatePass, null);
  assert.deepEqual(after, before);
});

test("cross-currency aggregation rejects without conversion", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const request = createDefaultMcpBusinessPolicyRequest("enforced", {
    currency: "USD",
    nonce: "nonce_cross_currency_001",
  });
  const result = await new McpExactActionGateway({ durableStore: store }).evaluateAction(request) as McpBusinessPolicyResult;
  assert.equal(result.outcome, "REJECT");
  assert.equal(result.gatePass, null);
  assert.ok(result.reasonCodes.includes("EXPOSURE_CURRENCY_MISMATCH"));
});

test("authorised revocation prevents reservation and survives restart", async () => {
  const path = statePath();
  const store = new LocalDurableLifecycleStore({ statePath: path });
  const { gatePass } = await issued(store, "nonce_revoke_restart_001");
  const revoked = store.revoke({ gatePass, reason: "Synthetic scope withdrawn", revokedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: operator });
  assert.equal(revoked.receipt?.reversedExternalAction, false);
  const restarted = new LocalDurableLifecycleStore({ statePath: path });
  const reserve = restarted.reserve(gatePass, 2, "2026-09-02T09:02:00.000Z");
  assert.equal(reserve.changed, false);
  assert.equal(reserve.lifecycle?.status, "REVOKED");
});

test("agent-like authority cannot revoke or expand authority", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const { gatePass } = await issued(store, "nonce_agent_revoke_001");
  const invalid = createOperatorAuthorityEvidence({ actorReference: "agent://self" });
  const result = store.revoke({ gatePass, reason: "Agent request", revokedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: invalid });
  assert.equal(result.reasonCode, "OPERATOR_AUTHORITY_INVALID");
  assert.equal(store.getLifecycleByGatePassId(gatePass.gatePassId)?.status, "ISSUED");
});

test("revocation after execution preserves history and after reservation requires reconciliation", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const executed = await issued(store, "nonce_revoke_executed_001", 100_000);
  store.reserve(executed.gatePass, 1, "2026-09-02T09:01:00.000Z");
  store.markExecuted(executed.gatePass.gatePassId, "2026-09-02T09:02:00.000Z");
  const afterExecution = store.revoke({ gatePass: executed.gatePass, reason: "Too late", revokedAt: "2026-09-02T09:03:00.000Z", authorityEvidence: operator });
  assert.equal(afterExecution.reasonCode, "GATEPASS_REVOCATION_AFTER_EXECUTION_REFUSED");
  assert.equal(afterExecution.lifecycle?.status, "EXECUTED");

  const reserved = await issued(store, "nonce_revoke_reserved_001", 100_000);
  store.reserve(reserved.gatePass, 1, "2026-09-02T09:01:00.000Z");
  const afterReservation = store.revoke({ gatePass: reserved.gatePass, reason: "Uncertain", revokedAt: "2026-09-02T09:02:00.000Z", authorityEvidence: operator });
  assert.equal(afterReservation.reasonCode, "GATEPASS_REVOCATION_REQUIRES_RECONCILIATION");
  assert.equal(afterReservation.lifecycle?.status, "UNKNOWN");
  assert.equal(afterReservation.receipt, null);
});

test("persistent emergency stop blocks issuance and outstanding reservation", async () => {
  const path = statePath();
  const store = new LocalDurableLifecycleStore({ statePath: path });
  const outstanding = await issued(store, "nonce_stop_outstanding_001");
  const activated = store.setEmergencyStop({ active: true, reason: "Synthetic incident", recordedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: operator });
  assert.equal(activated.reasonCode, "EMERGENCY_STOP_ACTIVATED");
  assert.equal(store.reserve(outstanding.gatePass, 1, "2026-09-02T09:02:00.000Z").reasonCode, "EMERGENCY_STOP_ACTIVE");
  const blocked = await evaluate(store, "nonce_stop_new_001");
  assert.equal(blocked.outcome, "REJECT");
  assert.equal(blocked.gatePass, null);
  assert.ok(blocked.reasonCodes.includes("EMERGENCY_STOP_ACTIVE"));
  assert.equal(new LocalDurableLifecycleStore({ statePath: path }).isEmergencyStopActive(), true);
});

test("Shadow remains non-authorising while emergency stop is active", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  store.setEmergencyStop({ active: true, reason: "Synthetic incident", recordedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: operator });
  const before = store.snapshot();
  const result = await evaluate(store, "nonce_stop_shadow_001", 400_000, { mode: "shadow" });
  assert.equal(result.outcome, "SHADOW");
  assert.equal(result.wouldOutcome, "REJECT");
  assert.equal(result.gatePass, null);
  assert.deepEqual(store.snapshot(), before);
});

test("only authorised operator evidence deactivates stop and creates evidence", () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  store.setEmergencyStop({ active: true, reason: "Synthetic incident", recordedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: operator });
  const invalid = createOperatorAuthorityEvidence({ actorReference: "agent://self" });
  assert.equal(store.setEmergencyStop({ active: false, reason: "Agent attempt", recordedAt: "2026-09-02T09:02:00.000Z", authorityEvidence: invalid }).reasonCode, "OPERATOR_AUTHORITY_INVALID");
  const deactivated = store.setEmergencyStop({ active: false, reason: "Operator cleared synthetic incident", recordedAt: "2026-09-02T09:03:00.000Z", authorityEvidence: operator });
  assert.equal(deactivated.reasonCode, "EMERGENCY_STOP_DEACTIVATED");
  assert.equal(deactivated.record?.operation, "deactivate");
  assert.equal(store.snapshot().emergencyStop.records.length, 2);
});

test("storage failure blocks enforcement", async () => {
  const path = statePath();
  writeFileSync(path, "not-json", "utf8");
  const store = new LocalDurableLifecycleStore({ statePath: path });
  const result = await evaluate(store, "nonce_storage_failure_001");
  assert.equal(result.outcome, "REJECT");
  assert.equal(result.gatePass, null);
  assert.ok(result.reasonCodes.includes("DURABLE_STATE_CORRUPTED"));
});

test("RESERVED survives restart and is never silently returned to ISSUED", async () => {
  const path = statePath();
  const store = new LocalDurableLifecycleStore({ statePath: path });
  const { gatePass } = await issued(store, "nonce_reserved_restart_001");
  store.reserve(gatePass, 1, "2026-09-02T09:01:00.000Z");
  const restarted = new LocalDurableLifecycleStore({ statePath: path });
  assert.equal(restarted.getLifecycleByGatePassId(gatePass.gatePassId)?.status, "RESERVED");
  const retry = restarted.reserve(gatePass, 2, "2026-09-02T09:02:00.000Z");
  assert.equal(retry.changed, false);
  assert.equal(retry.reasonCode, "LIFECYCLE_INVALID_TRANSITION");
  const recovered = restarted.reconcile({
    gatePassId: gatePass.gatePassId,
    finding: "confirmed_not_executed",
    evidenceReference: "fixture://northstar/reconciliation/reserved-not-invoked",
    reconciledAt: "2026-09-02T09:03:00.000Z",
    authorityEvidence: operator,
  });
  assert.equal(recovered.lifecycle?.status, "ABANDONED");
});

test("possible effect becomes UNKNOWN and is never automatically retried", async () => {
  const path = statePath();
  const store = new LocalDurableLifecycleStore({ statePath: path });
  const { gatePass } = await issued(store, "nonce_unknown_retry_001");
  store.reserve(gatePass, 1, "2026-09-02T09:01:00.000Z");
  store.markPossibleExternalEffect(gatePass.gatePassId, "2026-09-02T09:02:00.000Z");
  const restarted = new LocalDurableLifecycleStore({ statePath: path });
  const retry = restarted.reserve(gatePass, 3, "2026-09-02T09:03:00.000Z");
  assert.equal(retry.reasonCode, "LIFECYCLE_UNKNOWN_NO_AUTOMATIC_RETRY");
  assert.equal(retry.lifecycle?.status, "UNKNOWN");
});

test("explicit reconciliation distinguishes not executed, executed and unresolved", async () => {
  const exposureRule = rule({ maximumAggregateMinorUnits: 10_000_000, maximumActionCount: 10 });
  for (const [finding, expectedStatus, expectedCode] of [
    ["confirmed_not_executed", "ABANDONED", "RECONCILIATION_CONFIRMED_NOT_EXECUTED"],
    ["confirmed_executed", "EXECUTED", "RECONCILIATION_CONFIRMED_EXECUTED"],
    ["still_unknown", "UNKNOWN", "RECONCILIATION_STILL_UNKNOWN"],
  ] as const) {
    const store = new LocalDurableLifecycleStore({ statePath: statePath() });
    const { gatePass } = await issued(store, `nonce_reconcile_${finding}`, 100_000, exposureRule);
    store.reserve(gatePass, 1, "2026-09-02T09:01:00.000Z");
    if (finding !== "confirmed_not_executed") {
      store.markPossibleExternalEffect(gatePass.gatePassId, "2026-09-02T09:02:00.000Z");
    }
    const result = store.reconcile({
      gatePassId: gatePass.gatePassId,
      finding,
      evidenceReference: `fixture://northstar/reconciliation/${finding}`,
      reconciledAt: "2026-09-02T09:03:00.000Z",
      authorityEvidence: operator,
    });
    assert.equal(result.reasonCode, expectedCode);
    assert.equal(result.lifecycle?.status, expectedStatus);
    assert.equal(result.reconciliation?.automaticRetryPermitted, false);
    assert.equal(result.reconciliation?.externalActionReversed, false);
  }
});

test("lifecycle, exposure, revocation, emergency and reconciliation records validate", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: statePath() });
  const first = await issued(store, "nonce_schema_revoke_001", 100_000);
  const revoked = store.revoke({ gatePass: first.gatePass, reason: "Schema fixture", revokedAt: "2026-09-02T09:01:00.000Z", authorityEvidence: operator });
  const stop = store.setEmergencyStop({ active: true, reason: "Schema fixture", recordedAt: "2026-09-02T09:02:00.000Z", authorityEvidence: operator });
  store.setEmergencyStop({ active: false, reason: "Schema fixture clear", recordedAt: "2026-09-02T09:03:00.000Z", authorityEvidence: operator });
  const second = await issued(store, "nonce_schema_reconcile_001", 100_000);
  store.reserve(second.gatePass, 1, "2026-09-02T09:01:00.000Z");
  store.markPossibleExternalEffect(second.gatePass.gatePassId, "2026-09-02T09:02:00.000Z");
  const reconciled = store.reconcile({
    gatePassId: second.gatePass.gatePassId,
    finding: "still_unknown",
    evidenceReference: "fixture://northstar/reconciliation/schema",
    reconciledAt: "2026-09-02T09:04:00.000Z",
    authorityEvidence: operator,
  });
  const snapshot = store.snapshot();
  const cases: Array<[string, unknown]> = [
    ["schemas/durable-action-lifecycle-state.schema.json", snapshot.lifecycles[0]],
    ["schemas/aggregate-exposure-ledger-entry.schema.json", snapshot.exposureEntries[0]],
    ["schemas/gatepass-revocation-receipt.schema.json", revoked.receipt],
    ["schemas/emergency-stop-record.schema.json", stop.record],
    ["schemas/lifecycle-reconciliation-record.schema.json", reconciled.reconciliation],
  ];
  for (const [schema, value] of cases) {
    const validation = validateJsonSchemaFile(schema, value);
    assert.equal(validation.valid, true, `${schema}: ${validation.errors.join("; ")}`);
  }
});

test("MCP exposes no lifecycle administration, revocation, stop or execution tool", async () => {
  const source = readFileSync(join("src", "mcp-stdio-server.ts"), "utf8");
  assert.doesNotMatch(source, /atg\.(?:reserve|execute|revoke|reconcile|emergency|admin)_/);
  const result = await evaluate(new LocalDurableLifecycleStore({ statePath: statePath() }), "nonce_no_execution_001");
  assert.equal(result.executionReceipt, null);
  assert.equal(result.executionAvailable, false);
  assert.equal(result.actionExecuted, false);
});
