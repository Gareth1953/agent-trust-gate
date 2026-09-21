import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createFixedTrustedClock, type CanonicalActionEnvelopeInput } from "../src/exact-action-gatepass.js";
import { LocalDurableLifecycleStore } from "../src/durable-action-lifecycle.js";
import {
  REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS,
  executeThroughRegisteredSyntheticPurchasingAdapter,
  renderLocalPurchasingLifecycleDemo,
  runLocalPurchasingLifecycleDemo,
  verifyPurchasingExecutionEvidenceLink,
} from "../src/local-purchasing-lifecycle-demo.js";
import { runLocalPurchasingLifecycleDemoCli } from "../src/local-purchasing-lifecycle-demo-cli.js";
import {
  McpExactActionGateway,
  createDefaultMcpBusinessPolicyRequest,
  type McpBusinessPolicyResult,
} from "../src/mcp-exact-action-gateway.js";
import { validateJsonSchemaFile } from "../src/json-schema-validator.js";

const directories: string[] = [];
afterEach(() => {
  while (directories.length > 0) rmSync(directories.pop()!, { recursive: true, force: true });
});

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "atg-p3-m161-test-"));
  directories.push(root);
  return root;
}

async function issue(path: string, nonce: string): Promise<{ store: LocalDurableLifecycleStore; result: McpBusinessPolicyResult }> {
  const store = new LocalDurableLifecycleStore({ statePath: path });
  const request = createDefaultMcpBusinessPolicyRequest("enforced", { nonce });
  const result = await new McpExactActionGateway({ durableStore: store }).evaluateAction(request) as McpBusinessPolicyResult;
  assert.equal(result.outcome, "ACCEPT", result.reasonCodes.join(","));
  assert.ok(result.gatePass);
  assert.ok(result.policyDecisionReceipt);
  return { store, result };
}

function actionInput(result: McpBusinessPolicyResult): CanonicalActionEnvelopeInput {
  assert.ok(result.gatePass);
  const { actionEnvelopeVersion: _a, canonicalizationVersion: _c, digestAlgorithm: _d, actionDigest: _h, ...input } = result.gatePass.action;
  return structuredClone(input);
}

test("the demonstration contains exactly the ten controlled cases and outcomes", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  assert.deepEqual(pack.cases.map((item) => [item.caseId, item.outcome]), [
    ["01_exact_authorised_purchase", "ACCEPT"],
    ["02_quantity_substitution", "REJECT"],
    ["03_supplier_substitution", "REJECT"],
    ["04_price_band_breach", "REFER"],
    ["05_gatepass_reuse", "REJECT"],
    ["06_gatepass_revocation", "REJECT"],
    ["07_shadow_mode", "SHADOW"],
    ["08_aggregate_ceiling", "REFER"],
    ["09_authority_expansion_attempt", "REJECT"],
    ["10_emergency_recovery_lifecycle", "REJECT"],
  ]);
});

test("exact authorised purchase produces linked decision and synthetic execution evidence", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  const exact = pack.cases[0]!;
  assert.equal(exact.gatePassStatus, "ISSUED_AND_CONSUMED");
  assert.equal(exact.executionStatus, "SYNTHETIC_EXECUTED");
  assert.equal(pack.executionEvidence.executionReceipt.resultStatus, "executed");
  assert.equal(pack.executionEvidence.executionReceipt.externalActionOccurred, false);
  assert.equal(verifyPurchasingExecutionEvidenceLink(
    pack.executionEvidence.link,
    pack.executionEvidence.decisionReceipt,
    pack.executionEvidence.executionReceipt,
  ), true);
});

test("quantity and supplier substitutions reject while the price review band refers", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  for (const index of [1, 2, 3]) {
    const item = pack.cases[index]!;
    assert.equal(item.gatePassStatus, "NOT_ISSUED");
    assert.equal(item.executionStatus, "NOT_ATTEMPTED");
  }
  assert.ok(pack.cases[1]!.reasonCodes.some((reason) => reason.includes("QUANTITY") || reason.includes("PROHIBITED")));
  assert.ok(pack.cases[2]!.reasonCodes.some((reason) => reason.includes("SUPPLIER") || reason.includes("PROHIBITED")));
  assert.ok(pack.cases[3]!.reasonCodes.includes("HUMAN_REVIEW_AMOUNT_BAND"));
  assert.ok(pack.cases[3]!.reasonCodes.includes("PRICE_REVIEW_BAND_REFERRED"));
});

test("consumed one-use authority and revocation both survive restart", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  assert.equal(pack.cases[4]!.executionStatus, "BLOCKED");
  assert.equal(pack.cases[4]!.evidence.lifecycleStatus, "EXECUTED");
  assert.equal(pack.cases[5]!.gatePassStatus, "REVOKED");
  assert.equal(pack.cases[5]!.evidence.lifecycleStatus, "REVOKED");
  assert.ok(pack.cases[5]!.evidence.revocationReceiptId);
});

test("Shadow Mode is observational and produces no authority", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  const shadow = pack.cases[6]!;
  assert.equal(shadow.outcome, "SHADOW");
  assert.equal(shadow.wouldOutcome, "ACCEPT");
  assert.equal(shadow.gatePassStatus, "NOT_ISSUED");
  assert.equal(shadow.executionStatus, "NOT_ATTEMPTED");
  assert.ok(shadow.evidence.shadowReceiptId);
});

test("aggregate exposure permits two actions and refers the overcommitting concurrent action", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  const aggregate = pack.cases[7]!;
  assert.equal(aggregate.outcome, "REFER");
  assert.ok(aggregate.reasonCodes.includes("EXPOSURE_AMOUNT_LIMIT_EXCEEDED"));
  assert.ok(aggregate.reasonCodes.includes("CONCURRENT_OVERCOMMIT_PREVENTED"));
  assert.equal(aggregate.gatePassStatus, "NOT_ISSUED");
});

test("agent authority expansion is rejected without inferred permission", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  const expansion = pack.cases[8]!;
  assert.equal(expansion.outcome, "REJECT");
  assert.equal(expansion.gatePassStatus, "NOT_ISSUED");
  assert.ok(expansion.reasonCodes.includes("PROHIBITED_ACTION_TIER"));
  assert.ok(expansion.reasonCodes.includes("AGENT_AUTHORITY_EXPANSION_REJECTED"));
});

test("emergency stop, durable state, UNKNOWN and explicit reconciliation fail closed", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  const recovery = pack.cases[9]!;
  assert.ok(recovery.reasonCodes.includes("EMERGENCY_STOP_ACTIVE"));
  assert.ok(recovery.reasonCodes.includes("RESTART_STATE_PRESERVED"));
  assert.ok(recovery.reasonCodes.includes("NONCE_STATE_PERSISTED"));
  assert.ok(recovery.reasonCodes.includes("REVOCATION_PERSISTED"));
  assert.ok(recovery.reasonCodes.includes("AGGREGATE_EXPOSURE_PERSISTED"));
  assert.ok(recovery.reasonCodes.includes("LIFECYCLE_UNKNOWN_NO_AUTOMATIC_RETRY"));
  assert.ok(recovery.reasonCodes.includes("RECONCILIATION_STILL_UNKNOWN"));
  assert.ok(recovery.reasonCodes.includes("RECONCILIATION_CONFIRMED_NOT_EXECUTED"));
  assert.equal(recovery.evidence.lifecycleStatus, "ABANDONED");
});

test("execution-link verification detects receipt and link tampering", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  const bundle = pack.executionEvidence;
  const alteredReceipt = structuredClone(bundle.executionReceipt);
  alteredReceipt.simulatedSideEffectReference = "synthetic-purchase://altered";
  assert.equal(verifyPurchasingExecutionEvidenceLink(bundle.link, bundle.decisionReceipt, alteredReceipt), false);
  const alteredLink = structuredClone(bundle.link);
  alteredLink.actionDigest = `sha256:${"0".repeat(64)}`;
  assert.equal(verifyPurchasingExecutionEvidenceLink(alteredLink, bundle.decisionReceipt, bundle.executionReceipt), false);
});

test("exact-action mutation is refused before the registered adapter is reached", async () => {
  const path = join(tempRoot(), "state.json");
  const { store, result } = await issue(path, "nonce_m161_mutation_test_001");
  const proposed = actionInput(result);
  proposed.amount = (proposed.amount ?? 0) + 1;
  const attempt = await executeThroughRegisteredSyntheticPurchasingAdapter({
    store, gatePass: result.gatePass, decisionReceipt: result.policyDecisionReceipt,
    proposedAction: proposed, adapterId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].adapterId,
    resourceId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].resourceId,
  });
  assert.equal(attempt.outcome, "REJECTED");
  assert.equal(attempt.adapterReached, false);
  assert.ok(attempt.reasonCodes.includes("GATEPASS_ACTION_DIGEST_MISMATCH"));
});

test("unregistered adapters and resources fail before reservation or invocation", async () => {
  for (const [adapterId, resourceId, expected] of [
    ["adapter.unregistered", REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].resourceId, "SYNTHETIC_ADAPTER_NOT_REGISTERED"],
    [REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].adapterId, "resource.unregistered", "SYNTHETIC_RESOURCE_NOT_REGISTERED"],
  ] as const) {
    const path = join(tempRoot(), "state.json");
    const { store, result } = await issue(path, `nonce_${expected.toLowerCase()}`);
    const attempt = await executeThroughRegisteredSyntheticPurchasingAdapter({
      store, gatePass: result.gatePass, decisionReceipt: result.policyDecisionReceipt,
      proposedAction: actionInput(result), adapterId, resourceId,
    });
    assert.deepEqual(attempt.reasonCodes, [expected]);
    assert.equal(attempt.adapterReached, false);
    assert.equal(store.getLifecycleByGatePassId(result.gatePass!.gatePassId)?.status, "ISSUED");
  }
});

test("missing authority cannot reach the registered synthetic adapter", async () => {
  const store = new LocalDurableLifecycleStore({ statePath: join(tempRoot(), "state.json") });
  const attempt = await executeThroughRegisteredSyntheticPurchasingAdapter({
    store, gatePass: null, decisionReceipt: null, proposedAction: null,
    adapterId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].adapterId,
    resourceId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].resourceId,
  });
  assert.deepEqual(attempt.reasonCodes, ["EXECUTION_AUTHORITY_MISSING"]);
  assert.equal(attempt.adapterReached, false);
});

test("concurrent reservation of one GatePass succeeds exactly once", async () => {
  const { store, result } = await issue(join(tempRoot(), "state.json"), "nonce_m161_concurrent_reserve_001");
  const attempts = await Promise.all(Array.from({ length: 6 }, async () =>
    store.reserve(result.gatePass!, 1, "2026-09-02T09:01:00.000Z")));
  assert.equal(attempts.filter((item) => item.changed).length, 1);
  assert.equal(store.getLifecycleByGatePassId(result.gatePass!.gatePassId)?.status, "RESERVED");
});

test("future-dated evidence and trusted-clock rollback reject without GatePass", async () => {
  const futureRequest = createDefaultMcpBusinessPolicyRequest("enforced", { nonce: "nonce_m161_future_001" });
  futureRequest.evidenceSetReference = "evidence-set.future-dated.v1";
  const future = await new McpExactActionGateway({
    durableStatePath: join(tempRoot(), "future.json"),
  }).evaluateAction(futureRequest) as McpBusinessPolicyResult;
  assert.equal(future.outcome, "REJECT");
  assert.equal(future.gatePass, null);

  const rollback = await new McpExactActionGateway({
    durableStatePath: join(tempRoot(), "rollback.json"),
    clock: createFixedTrustedClock("2026-09-02T08:58:00.000Z"),
  }).evaluateAction(createDefaultMcpBusinessPolicyRequest("enforced", { nonce: "nonce_m161_rollback_001" })) as McpBusinessPolicyResult;
  assert.equal(rollback.outcome, "REJECT");
  assert.equal(rollback.gatePass, null);
  assert.ok(rollback.reasonCodes.includes("CLOCK_ROLLBACK_DETECTED"));
});

test("expired or stale GatePass authority is rejected before adapter invocation", async () => {
  const { store, result } = await issue(join(tempRoot(), "state.json"), "nonce_m161_expired_use_001");
  const attempt = await executeThroughRegisteredSyntheticPurchasingAdapter({
    store, gatePass: result.gatePass, decisionReceipt: result.policyDecisionReceipt,
    proposedAction: actionInput(result), adapterId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].adapterId,
    resourceId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].resourceId,
    executedAt: "2026-09-02T09:06:00.000Z",
  });
  assert.equal(attempt.outcome, "REJECTED");
  assert.equal(attempt.adapterReached, false);
  assert.deepEqual(attempt.reasonCodes, ["LIFECYCLE_EXPIRED"]);
  assert.equal(store.getLifecycleByGatePassId(result.gatePass!.gatePassId)?.status, "EXPIRED");
});

test("demo and receipt evidence conform to additive schemas", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  for (const [schema, value] of [
    ["schemas/purchasing-lifecycle-demo.schema.json", pack],
    ["schemas/purchasing-execution-evidence-link.schema.json", pack.executionEvidence.link],
    ["schemas/policy-decision-receipt.schema.json", pack.executionEvidence.decisionReceipt],
    ["schemas/execution-receipt.schema.json", pack.executionEvidence.executionReceipt],
  ] as const) {
    const validation = validateJsonSchemaFile(schema, value);
    assert.equal(validation.valid, true, `${schema}: ${validation.errors.join("; ")}`);
  }
});

test("repeat runs and readable rendering are deterministic", async () => {
  const first = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  const second = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  assert.deepEqual(second, first);
  const rendered = renderLocalPurchasingLifecycleDemo(first);
  assert.match(rendered, /01 \| Exact authorised purchase/);
  assert.match(rendered, /10 \| Emergency and recovery lifecycle/);
  assert.match(rendered, /no external action occurred/i);
});

test("CLI emits readable and machine-readable ten-case results", async () => {
  for (const args of [[], ["--json"]]) {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = await runLocalPurchasingLifecycleDemoCli(args, { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) });
    assert.equal(code, 0);
    assert.equal(stderr.length, 0);
    assert.equal(stdout.length, 1);
    if (args.length === 1) assert.equal((JSON.parse(stdout[0]!) as { cases: unknown[] }).cases.length, 10);
    else assert.match(stdout[0]!, /Exact authorised purchase/);
  }
});

test("exactly one synthetic adapter and only atg.evaluate_action remain exposed", async () => {
  assert.equal(REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS.length, 1);
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  assert.deepEqual(pack.exposedMcpTools, ["atg.evaluate_action"]);
  const serverSource = readFileSync(join("src", "mcp-stdio-server.ts"), "utf8");
  assert.doesNotMatch(serverSource, /atg\.(?:execute|purchase|reserve|revoke|reconcile|emergency|admin)_/);
});

test("all evidence remains local, synthetic, non-production and non-commercial", async () => {
  const pack = await runLocalPurchasingLifecycleDemo({ stateRoot: tempRoot() });
  assert.equal(pack.localOnly, true);
  assert.equal(pack.syntheticOnly, true);
  assert.equal(pack.productionReady, false);
  assert.equal(pack.externalActionOccurred, false);
  assert.equal(pack.commercialWisdomAssessed, false);
  assert.equal(pack.executionEvidence.executionReceipt.externalActionOccurred, false);
});
