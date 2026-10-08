import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AtgStandalonePlugin, createSyntheticPluginRequest } from "../src/standalone-plugin.js";

function setup() {
  const root = mkdtempSync(join(tmpdir(), "atg-plugin-test-"));
  const statePath = join(root, "state.json");
  return { root, statePath, plugin: new AtgStandalonePlugin({ statePath }) };
}

test("approved synthetic action executes once; caller receipt tampering cannot grant authority", async () => {
  const { root, plugin } = setup();
  try {
    const request = createSyntheticPluginRequest("enforced");
    const evaluation = await plugin.evaluate(request);
    assert.equal(evaluation.decision.outcome, "ACCEPT");
    evaluation.decision.gatePass!.signature.signature = "forged";
    const executed = await plugin.executeSynthetic(evaluation.evaluationId, request);
    assert.equal(executed.outcome, "EXECUTED");
    assert.equal(executed.adapterReached, true);
    assert.ok(executed.evidenceLink);
    const replay = await plugin.executeSynthetic(evaluation.evaluationId, request);
    assert.equal(replay.outcome, "REJECTED");
    assert.equal(replay.adapterReached, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("parameter substitution cannot reach adapter or consume the approved action", async () => {
  const { root, plugin } = setup();
  try {
    const request = createSyntheticPluginRequest("enforced");
    const evaluation = await plugin.evaluate(request);
    const changed = structuredClone(request);
    changed.proposedAction.supplierId = "attacker";
    const blocked = await plugin.executeSynthetic(evaluation.evaluationId, changed);
    assert.deepEqual(blocked.reasonCodes, ["PLUGIN_APPROVED_REQUEST_CHANGED"]);
    assert.equal(blocked.adapterReached, false);
    assert.equal((await plugin.executeSynthetic(evaluation.evaluationId, request)).outcome, "EXECUTED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("shadow, referral and rejection never reach the synthetic adapter", async () => {
  const { root, plugin } = setup();
  try {
    for (const [mode, amount, expected] of [["shadow", 4000, "SHADOW"],
      ["enforced", 6000, "REFER"], ["enforced", 50000, "REJECT"]] as const) {
      const request = createSyntheticPluginRequest(mode);
      request.proposedAction.totalAmount = amount;
      request.amountMinorUnits = amount * 100;
      const result = await plugin.evaluate(request);
      assert.equal(result.decision.outcome, expected);
      // Forging the returned decision does not modify the privately held record.
      result.decision.outcome = "ACCEPT";
      const execution = await plugin.executeSynthetic(result.evaluationId, request);
      assert.equal(execution.outcome, "REJECTED");
      assert.equal(execution.adapterReached, false);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("expired execution, unknown handles and malformed input fail closed", async () => {
  const { root, plugin } = setup();
  try {
    await assert.rejects(plugin.evaluate({}));
    const request = createSyntheticPluginRequest("enforced");
    const result = await plugin.evaluate(request);
    assert.equal((await plugin.executeSynthetic("unknown", request)).adapterReached, false);
    const injected = await plugin.executeSynthetic(result.evaluationId, request,
      { adapterId: "unauthorised" } as unknown as { executedAt?: string });
    assert.deepEqual(injected.reasonCodes, ["PLUGIN_EXECUTION_OPTIONS_INVALID"]);
    assert.equal((await plugin.executeSynthetic(result.evaluationId, {})).adapterReached, false);
    const expired = await plugin.executeSynthetic(result.evaluationId, request,
      { executedAt: "2026-09-03T09:00:00.000Z" });
    assert.equal(expired.outcome, "REJECTED");
    assert.equal(expired.adapterReached, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("restart cannot replay prior authority; corrupt durable state denies issuance", async () => {
  const { root, statePath, plugin } = setup();
  try {
    const request = createSyntheticPluginRequest("enforced");
    const initial = await plugin.evaluate(request);
    await plugin.executeSynthetic(initial.evaluationId, request);
    const restarted = new AtgStandalonePlugin({ statePath });
    assert.equal((await restarted.executeSynthetic(initial.evaluationId, request)).adapterReached, false);
    assert.notEqual((await restarted.evaluate(request)).decision.outcome, "ACCEPT");
    writeFileSync(statePath, '{"corrupt":true}');
    const broken = new AtgStandalonePlugin({ statePath });
    assert.equal((await broken.evaluate(createSyntheticPluginRequest("enforced"))).decision.outcome, "REJECT");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("explicit state, bounded session capacity and forgotten handles", async () => {
  assert.throws(() => new AtgStandalonePlugin({ statePath: "relative.json" }));
  const { root, statePath } = setup();
  try {
    const plugin = new AtgStandalonePlugin({ statePath, maximumEvaluations: 1 });
    const request = createSyntheticPluginRequest();
    const result = await plugin.evaluate(request);
    await assert.rejects(plugin.evaluate(createSyntheticPluginRequest()), /CAPACITY/);
    assert.equal(plugin.discardEvaluation(result.evaluationId), true);
    assert.equal((await plugin.executeSynthetic(result.evaluationId, request)).adapterReached, false);
    await plugin.evaluate(createSyntheticPluginRequest());
    assert.equal(plugin.capabilities.learningEnabled, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("concurrent evaluation calls respect the bounded session capacity", async () => {
  const { root, statePath } = setup();
  try {
    const plugin = new AtgStandalonePlugin({ statePath, maximumEvaluations: 1 });
    const results = await Promise.allSettled([
      plugin.evaluate(createSyntheticPluginRequest()),
      plugin.evaluate(createSyntheticPluginRequest()),
    ]);
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(results.filter(result => result.status === "rejected").length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
