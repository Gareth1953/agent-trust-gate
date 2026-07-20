import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

import {
  ALLOWED_DOES_NOT_MEAN_EXECUTED,
  EXACT_ACTION_PERMISSION_STATEMENT,
  InMemoryNonceStore,
  canonicalizeJson,
  createBaseExactActionInput,
  createCanonicalActionEnvelope,
  createKeyStatusFixture,
  createLocalVerificationProfile,
  createPolicyDecisionReceipt,
  createVerifierContext,
  issueExactActionGatePass,
  recomputeCanonicalActionDigest,
  runExactActionGatePassDemo,
  verifyAndExecuteSimulatedAction,
  verifyExactActionAtExecution,
  type CanonicalActionEnvelopeInput,
  type ExactActionGatePass,
  type ExactActionIssuance,
  type ExactActionVerifierContext,
  type GatePassFailureReasonCode,
} from "../src/exact-action-gatepass.js";
import { runExactActionGatePassCli } from "../src/exact-action-gatepass-cli.js";

type JsonSchema = Record<string, unknown>;

const executionExamplePaths = [
  "examples/execution-receipt-success.json",
  "examples/execution-receipt-replay-refusal.json",
  "examples/execution-receipt-changed-amount-refusal.json",
  "examples/execution-receipt-changed-target-refusal.json",
  "examples/execution-receipt-expired-refusal.json",
  "examples/execution-receipt-revoked-key-refusal.json",
];

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function fixture(
  input: CanonicalActionEnvelopeInput = createBaseExactActionInput(),
  contextOverrides: Partial<ExactActionVerifierContext> = {},
): {
  input: CanonicalActionEnvelopeInput;
  issuance: ExactActionIssuance;
  store: InMemoryNonceStore;
  context: ExactActionVerifierContext;
} {
  const issuance = issueExactActionGatePass(input);
  const store = new InMemoryNonceStore();
  store.registerUnused(issuance.gatePass);
  return {
    input,
    issuance,
    store,
    context: createVerifierContext(issuance, store, contextOverrides),
  };
}

test("canonical digest is deterministic and independent of object key order", () => {
  const first = createBaseExactActionInput({
    canonicalArguments: {
      zeta: 9,
      nested: { second: true, first: null },
      alpha: "value",
      ordered: ["first", "second"],
    },
  });
  const second = createBaseExactActionInput({
    canonicalArguments: {
      ordered: ["first", "second"],
      alpha: "value",
      nested: { first: null, second: true },
      zeta: 9,
    },
  });
  const firstEnvelope = createCanonicalActionEnvelope(first);
  const secondEnvelope = createCanonicalActionEnvelope(second);
  assert.equal(firstEnvelope.actionDigest, secondEnvelope.actionDigest);
  assert.equal(recomputeCanonicalActionDigest(firstEnvelope), firstEnvelope.actionDigest);
  assert.equal(canonicalizeJson({ b: 2, a: 1 }), canonicalizeJson({ a: 1, b: 2 }));
  assert.notEqual(
    createCanonicalActionEnvelope({ ...first, canonicalArguments: { ordered: ["second", "first"] } }).actionDigest,
    firstEnvelope.actionDigest,
    "arrays retain meaningful order",
  );
});

test("canonical JSON handles JSON primitives predictably and rejects ambiguous or unsupported values", () => {
  assert.equal(canonicalizeJson({ nil: null, truth: true, count: -0, text: "x" }), "{\"count\":0,\"nil\":null,\"text\":\"x\",\"truth\":true}");
  for (const value of [
    { omitted: undefined },
    { invalid: Number.NaN },
    { invalid: Number.POSITIVE_INFINITY },
    { invalid: 1n },
    { invalid: () => true },
    new Date("2026-07-20T00:00:00.000Z"),
  ]) {
    assert.throws(() => canonicalizeJson(value), TypeError);
  }
  const sparse = Array(2) as unknown[];
  sparse[1] = "present";
  assert.throws(() => canonicalizeJson(sparse), /sparse array/);
  assert.throws(() => createCanonicalActionEnvelope({
    ...createBaseExactActionInput(),
    unexpectedField: true,
  } as CanonicalActionEnvelopeInput), /not allowed/);
});

test("every consequential envelope field is bound into the action digest", () => {
  const base = createBaseExactActionInput();
  const expected = createCanonicalActionEnvelope(base).actionDigest;
  const mutations: Array<[string, (value: CanonicalActionEnvelopeInput) => void]> = [
    ["issuerIdentity", (value) => { value.issuerIdentity += "_changed"; }],
    ["issuerKeyId", (value) => { value.issuerKeyId += "_changed"; }],
    ["verificationProfile", (value) => { value.verificationProfile += "_changed"; }],
    ["subjectAgentIdentity", (value) => { value.subjectAgentIdentity += "_changed"; }],
    ["nativeSessionId", (value) => { value.nativeSessionId += "_changed"; }],
    ["nativeRunId", (value) => { value.nativeRunId += "_changed"; }],
    ["operatorIdentity", (value) => { value.operatorIdentity = "changed_operator"; }],
    ["mandateIdentity", (value) => { value.mandateIdentity = "changed_mandate_identity"; }],
    ["mandateReference", (value) => { value.mandateReference += "_changed"; }],
    ["mandateDigest", (value) => { value.mandateDigest = `sha256:${"1".repeat(64)}`; }],
    ["policyReference", (value) => { value.policyReference += "_changed"; }],
    ["policyDigest", (value) => { value.policyDigest = `sha256:${"2".repeat(64)}`; }],
    ["evidenceReference", (value) => { value.evidenceReference += "_changed"; }],
    ["evidenceDigest", (value) => { value.evidenceDigest = `sha256:${"3".repeat(64)}`; }],
    ["approvalRequired", (value) => { value.approvalRequired = false; }],
    ["humanApprovalReference", (value) => { value.humanApprovalReference = "changed_approval"; }],
    ["humanApprovalDigest", (value) => { value.humanApprovalDigest = `sha256:${"4".repeat(64)}`; }],
    ["toolIdentity", (value) => { value.toolIdentity += "_changed"; }],
    ["toolSchemaVersion", (value) => { value.toolSchemaVersion = "2.0.0"; }],
    ["operationName", (value) => { value.operationName += "_changed"; }],
    ["canonicalArguments", (value) => { value.canonicalArguments = { changed: true }; }],
    ["targetIdentity", (value) => { value.targetIdentity += "_changed"; }],
    ["amount", (value) => { value.amount = 126.5; }],
    ["currency", (value) => { value.currency = "USD"; }],
    ["operatingEnvironment", (value) => { value.operatingEnvironment += "_changed"; }],
    ["issuedAt", (value) => { value.issuedAt = "2026-07-20T08:59:00.000Z"; }],
    ["notBefore", (value) => { value.notBefore = "2026-07-20T09:01:00.000Z"; }],
    ["expiresAt", (value) => { value.expiresAt = "2026-07-20T09:09:00.000Z"; }],
    ["nonce", (value) => { value.nonce += "_changed"; }],
    ["idempotencyKey", (value) => { value.idempotencyKey += "_changed"; }],
  ];
  for (const [field, mutate] of mutations) {
    const candidate = structuredClone(base);
    mutate(candidate);
    assert.notEqual(createCanonicalActionEnvelope(candidate).actionDigest, expected, field);
  }
});

test("one exact valid action is verified immediately before one local simulated side effect", async () => {
  const value = fixture();
  let simulatedExecutorCalls = 0;
  const receipt = await verifyAndExecuteSimulatedAction(
    value.issuance.gatePass,
    value.input,
    value.context,
    () => {
      simulatedExecutorCalls += 1;
      return { acknowledged: true, simulatedSideEffectReference: "simulated-side-effect://test/success" };
    },
  );
  assert.equal(receipt.resultStatus, "executed");
  assert.equal(receipt.verification.verified, true);
  assert.equal(receipt.verification.nonceConsumed, true);
  assert.equal(receipt.verification.signatureValid, true);
  assert.equal(receipt.verification.keyStatus, "active");
  assert.equal(simulatedExecutorCalls, 1);
  assert.equal(receipt.gatePassId, value.issuance.gatePass.gatePassId);
  assert.equal(receipt.actionDigest, value.issuance.gatePass.action.actionDigest);
  assert.equal(receipt.decisionReceiptReference, value.issuance.decisionReceipt.receiptId);
  assert.equal(receipt.externalActionOccurred, false);
});

test("replay and concurrent repeated attempts cannot both succeed in the local process model", async () => {
  const replay = fixture();
  const first = await verifyAndExecuteSimulatedAction(
    replay.issuance.gatePass,
    replay.input,
    replay.context,
    () => ({ acknowledged: true, simulatedSideEffectReference: "simulated-side-effect://test/first" }),
  );
  const second = await verifyAndExecuteSimulatedAction(
    replay.issuance.gatePass,
    replay.input,
    replay.context,
    () => ({ acknowledged: true, simulatedSideEffectReference: "must-not-run" }),
  );
  assert.equal(first.resultStatus, "executed");
  assert.equal(second.resultStatus, "replay_rejected");
  assert.ok(second.reasonCodes.includes("GATEPASS_ALREADY_CONSUMED"));

  const concurrent = fixture(createBaseExactActionInput({
    nonce: "nonce_exact_action_concurrent",
    idempotencyKey: "idempotency_exact_action_concurrent",
  }));
  let calls = 0;
  const execute = () => verifyAndExecuteSimulatedAction(
    concurrent.issuance.gatePass,
    concurrent.input,
    concurrent.context,
    async () => {
      calls += 1;
      await Promise.resolve();
      return { acknowledged: true, simulatedSideEffectReference: "simulated-side-effect://test/concurrent" };
    },
  );
  const receipts = await Promise.all([execute(), execute()]);
  assert.equal(receipts.filter((receipt) => receipt.resultStatus === "executed").length, 1);
  assert.equal(receipts.filter((receipt) => receipt.resultStatus === "replay_rejected").length, 1);
  assert.equal(calls, 1);
});

test("amount currency target environment tool schema and arguments changes fail closed", async () => {
  const cases: Array<[
    string,
    (input: CanonicalActionEnvelopeInput) => CanonicalActionEnvelopeInput,
    GatePassFailureReasonCode | null,
  ]> = [
    ["amount", (input) => ({ ...input, amount: 999 }), null],
    ["currency", (input) => ({ ...input, currency: "USD" }), null],
    ["target", (input) => ({ ...input, targetIdentity: "changed_target" }), "GATEPASS_TARGET_MISMATCH"],
    ["environment", (input) => ({ ...input, operatingEnvironment: "changed_environment" }), "GATEPASS_ENVIRONMENT_MISMATCH"],
    ["tool", (input) => ({ ...input, toolIdentity: "changed.tool" }), "GATEPASS_TOOL_MISMATCH"],
    ["schema", (input) => ({ ...input, toolSchemaVersion: "9.0.0" }), "GATEPASS_TOOL_MISMATCH"],
    ["arguments", (input) => ({ ...input, canonicalArguments: { changed: true } }), null],
  ];
  for (const [name, mutate, specificCode] of cases) {
    const value = fixture(createBaseExactActionInput({
      nonce: `nonce_mutation_${name}`,
      idempotencyKey: `idempotency_mutation_${name}`,
    }));
    let calls = 0;
    const receipt = await verifyAndExecuteSimulatedAction(
      value.issuance.gatePass,
      mutate(structuredClone(value.input)),
      value.context,
      () => {
        calls += 1;
        return { acknowledged: true, simulatedSideEffectReference: "must-not-run" };
      },
    );
    assert.equal(receipt.resultStatus, "action_mismatch", name);
    assert.ok(receipt.reasonCodes.includes("GATEPASS_ACTION_DIGEST_MISMATCH"), name);
    if (specificCode !== null) assert.ok(receipt.reasonCodes.includes(specificCode), name);
    assert.equal(calls, 0, name);
    assert.equal(value.store.get(value.input.nonce)?.status, "unused", name);
  }
});

test("agent session run and mandate context mismatches fail closed", () => {
  const cases: Array<[GatePassFailureReasonCode, Partial<ExactActionVerifierContext["constraints"]>]> = [
    ["GATEPASS_AGENT_MISMATCH", { subjectAgentIdentity: "different_agent" }],
    ["GATEPASS_SESSION_MISMATCH", { nativeSessionId: "different_session" }],
    ["GATEPASS_RUN_MISMATCH", { nativeRunId: "different_run" }],
    ["GATEPASS_MANDATE_MISMATCH", { mandateReference: "different_mandate" }],
  ];
  for (const [reasonCode, constraint] of cases) {
    const value = fixture(createBaseExactActionInput({
      nonce: `nonce_${reasonCode.toLowerCase()}`,
      idempotencyKey: `idempotency_${reasonCode.toLowerCase()}`,
    }));
    const context = {
      ...value.context,
      constraints: { ...value.context.constraints, ...constraint },
    };
    const result = verifyExactActionAtExecution(value.issuance.gatePass, value.input, context);
    assert.equal(result.verified, false, reasonCode);
    assert.ok(result.reasonCodes.includes(reasonCode), reasonCode);
    assert.equal(result.nonceConsumed, false, reasonCode);
  }
});

test("required approval not-before and expiry rules use verifier-owned time", () => {
  const missingApproval = fixture(createBaseExactActionInput({
    nonce: "nonce_missing_approval",
    idempotencyKey: "idempotency_missing_approval",
  }));
  const corruptedGatePass = structuredClone(missingApproval.issuance.gatePass);
  corruptedGatePass.action.humanApprovalReference = null;
  corruptedGatePass.action.humanApprovalDigest = null;
  const approvalResult = verifyExactActionAtExecution(
    corruptedGatePass,
    missingApproval.input,
    missingApproval.context,
  );
  assert.ok(approvalResult.reasonCodes.includes("GATEPASS_APPROVAL_MISSING"));
  assert.throws(() => issueExactActionGatePass(createBaseExactActionInput({
    nonce: "nonce_missing_approval_issuance",
    idempotencyKey: "idempotency_missing_approval_issuance",
    approvalRequired: true,
    humanApprovalReference: null,
    humanApprovalDigest: null,
  })), /approval must be present/);

  const future = fixture(createBaseExactActionInput({
    nonce: "nonce_future",
    idempotencyKey: "idempotency_future",
    notBefore: "2026-07-20T09:06:00.000Z",
  }));
  assert.ok(verifyExactActionAtExecution(future.issuance.gatePass, future.input, future.context)
    .reasonCodes.includes("GATEPASS_NOT_YET_VALID"));

  const expired = fixture(createBaseExactActionInput({
    nonce: "nonce_expired",
    idempotencyKey: "idempotency_expired",
    expiresAt: "2026-07-20T09:04:00.000Z",
  }));
  const expiredResult = verifyExactActionAtExecution(expired.issuance.gatePass, expired.input, expired.context);
  assert.ok(expiredResult.reasonCodes.includes("GATEPASS_EXPIRED"));
  assert.equal(expiredResult.nonceState?.status, "expired");
});

test("active and retained rotated keys verify while revoked unknown and invalid signatures are refused", () => {
  for (const status of ["active", "rotated"] as const) {
    const value = fixture(createBaseExactActionInput({
      nonce: `nonce_key_${status}`,
      idempotencyKey: `idempotency_key_${status}`,
    }));
    const profile = createLocalVerificationProfile(status, {
      profileId: value.input.verificationProfile,
      issuerIdentity: value.input.issuerIdentity,
      keyId: value.input.issuerKeyId,
    });
    const result = verifyExactActionAtExecution(
      value.issuance.gatePass,
      value.input,
      { ...value.context, verificationProfile: profile },
    );
    assert.equal(result.verified, true, status);
    assert.equal(result.keyStatus, status);
  }
  for (const status of ["revoked", "unknown"] as const) {
    const value = fixture(createBaseExactActionInput({
      nonce: `nonce_key_${status}`,
      idempotencyKey: `idempotency_key_${status}`,
    }));
    const profile = createLocalVerificationProfile(status, {
      profileId: value.input.verificationProfile,
      issuerIdentity: value.input.issuerIdentity,
      keyId: value.input.issuerKeyId,
    });
    const result = verifyExactActionAtExecution(
      value.issuance.gatePass,
      value.input,
      { ...value.context, verificationProfile: profile },
    );
    assert.equal(result.verified, false, status);
    assert.ok(result.reasonCodes.includes(status === "revoked" ? "GATEPASS_KEY_REVOKED" : "GATEPASS_UNKNOWN_KEY"));
  }

  const invalid = fixture(createBaseExactActionInput({
    nonce: "nonce_invalid_signature",
    idempotencyKey: "idempotency_invalid_signature",
  }));
  const tampered = structuredClone(invalid.issuance.gatePass) as ExactActionGatePass;
  tampered.signature.signature = `${tampered.signature.signature.slice(0, -4)}AAAA`;
  const invalidResult = verifyExactActionAtExecution(tampered, invalid.input, invalid.context);
  assert.ok(invalidResult.reasonCodes.includes("GATEPASS_INVALID_SIGNATURE"));
});

test("verifier profile nonce store and trusted-clock unavailability fail closed", async () => {
  const unavailableCases: Array<Partial<ExactActionVerifierContext>> = [
    { available: false },
    { verificationProfile: null },
    { nonceStore: null },
    { trustedClock: null },
    { trustedClock: { clockId: "unavailable_test_clock", now: () => undefined } },
  ];
  for (const [index, overrides] of unavailableCases.entries()) {
    const value = fixture(createBaseExactActionInput({
      nonce: `nonce_unavailable_${index}`,
      idempotencyKey: `idempotency_unavailable_${index}`,
    }));
    let calls = 0;
    const receipt = await verifyAndExecuteSimulatedAction(
      value.issuance.gatePass,
      value.input,
      { ...value.context, ...overrides },
      () => {
        calls += 1;
        return { acknowledged: true, simulatedSideEffectReference: "must-not-run" };
      },
    );
    assert.equal(receipt.resultStatus, "verifier_unavailable");
    assert.ok(receipt.reasonCodes.includes("GATEPASS_VERIFIER_UNAVAILABLE"));
    assert.equal(calls, 0);
  }

  const unresolved = fixture(createBaseExactActionInput({
    nonce: "nonce_unresolved",
    idempotencyKey: "idempotency_unresolved",
  }));
  const emptyStore = new InMemoryNonceStore();
  const result = verifyExactActionAtExecution(
    unresolved.issuance.gatePass,
    unresolved.input,
    createVerifierContext(unresolved.issuance, emptyStore),
  );
  assert.ok(result.reasonCodes.includes("GATEPASS_NONCE_UNRESOLVED"));
});

test("decision meaning remains separate from execution failure and non-acknowledgement", async () => {
  const failed = fixture(createBaseExactActionInput({
    nonce: "nonce_execution_failed",
    idempotencyKey: "idempotency_execution_failed",
  }));
  const failedReceipt = await verifyAndExecuteSimulatedAction(
    failed.issuance.gatePass,
    failed.input,
    failed.context,
    () => { throw new Error("synthetic local failure"); },
  );
  assert.equal(failed.issuance.decisionReceipt.decision, "allowed");
  assert.equal(failed.issuance.decisionReceipt.executionState, "not_executed");
  assert.equal(failedReceipt.resultStatus, "execution_failed");
  assert.equal(failedReceipt.reasonCode, "EXECUTION_FAILED");
  assert.equal(failed.store.get(failed.input.nonce)?.status, "failed");

  const abandoned = fixture(createBaseExactActionInput({
    nonce: "nonce_execution_unacknowledged",
    idempotencyKey: "idempotency_execution_unacknowledged",
  }));
  const abandonedReceipt = await verifyAndExecuteSimulatedAction(
    abandoned.issuance.gatePass,
    abandoned.input,
    abandoned.context,
    () => ({ acknowledged: false, simulatedSideEffectReference: null }),
  );
  assert.equal(abandonedReceipt.resultStatus, "abandoned_not_acknowledged");
  assert.equal(abandonedReceipt.reasonCode, "EXECUTION_NOT_ACKNOWLEDGED");
  assert.equal(abandoned.store.get(abandoned.input.nonce)?.status, "abandoned");
});

test("allowed-but-not-executed is explicit and has no execution receipt", async () => {
  const pack = await runExactActionGatePassDemo();
  const scenario = pack.scenarios.allowed_not_executed;
  assert.equal(scenario.decisionReceipt.decision, "allowed");
  assert.equal(scenario.decisionReceipt.executionState, "not_executed");
  assert.equal(scenario.executionReceipt, null);
  assert.equal(scenario.lifecycleState, "allowed_not_executed");
  assert.equal(pack.allowedDoesNotMeanExecuted, ALLOWED_DOES_NOT_MEAN_EXECUTED);
  assert.equal(pack.permissionStatement, EXACT_ACTION_PERMISSION_STATEMENT);

  const action = createCanonicalActionEnvelope(createBaseExactActionInput({
    nonce: "nonce_refused_or_escalated",
    idempotencyKey: "idempotency_refused_or_escalated",
  }));
  for (const decision of ["refused", "escalated"] as const) {
    const receipt = createPolicyDecisionReceipt({
      decision,
      action,
      gatePass: null,
      reasons: [`POLICY_${decision.toUpperCase()}`],
    });
    assert.equal(receipt.decision, decision);
    assert.equal(receipt.gatePassIssuance, null);
    assert.equal(receipt.executionState, "not_executed");
  }
});

test("generated examples match the deterministic local demo and validate against versioned schemas", async () => {
  const pack = await runExactActionGatePassDemo();
  const success = pack.scenarios.exact_action_executed;
  assert.deepEqual(readJson("examples/canonical-action-envelope.json"), success.gatePass.action);
  assert.deepEqual(readJson("examples/exact-action-gatepass.json"), success.gatePass);
  assert.deepEqual(readJson("examples/policy-decision-receipt.json"), success.decisionReceipt);
  assert.deepEqual(readJson("examples/execution-receipt-success.json"), success.executionReceipt);
  assert.deepEqual(readJson("examples/execution-receipt-replay-refusal.json"), pack.scenarios.replay_refused.executionReceipt);
  assert.deepEqual(readJson("examples/execution-receipt-changed-amount-refusal.json"), pack.scenarios.changed_amount_refused.executionReceipt);
  assert.deepEqual(readJson("examples/execution-receipt-changed-target-refusal.json"), pack.scenarios.changed_target_refused.executionReceipt);
  assert.deepEqual(readJson("examples/execution-receipt-expired-refusal.json"), pack.scenarios.expired_refused.executionReceipt);
  assert.deepEqual(readJson("examples/execution-receipt-revoked-key-refusal.json"), pack.scenarios.revoked_key_refused.executionReceipt);
  assert.deepEqual(readJson("examples/allowed-but-not-executed.json"), pack.scenarios.allowed_not_executed);
  assert.deepEqual(readJson("examples/exact-action-key-status-fixture.json"), createKeyStatusFixture());

  const schemaExamples: Array<[string, string]> = [
    ["schemas/canonical-action-envelope.schema.json", "examples/canonical-action-envelope.json"],
    ["schemas/exact-action-gatepass.schema.json", "examples/exact-action-gatepass.json"],
    ["schemas/policy-decision-receipt.schema.json", "examples/policy-decision-receipt.json"],
    ["schemas/nonce-state.schema.json", "examples/exact-action-nonce-state.json"],
    ["schemas/exact-action-verification-result.schema.json", "examples/exact-action-verification-result.json"],
    ["schemas/key-status-fixture.schema.json", "examples/exact-action-key-status-fixture.json"],
    ...executionExamplePaths.map((path) => ["schemas/execution-receipt.schema.json", path] as [string, string]),
  ];
  for (const [schemaPath, examplePath] of schemaExamples) {
    assert.deepEqual(validateSchema(schemaPath, readJson(examplePath)), [], examplePath);
  }
});

test("exact-action CLI shows separate decision and execution evidence without external actions", async () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(await runExactActionGatePassCli(["--scenario", "replay_refused"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  const scenario = JSON.parse(stdout[0] ?? "{}") as Record<string, unknown>;
  assert.equal((scenario.executionReceipt as Record<string, unknown>).resultStatus, "replay_rejected");
  assert.equal((scenario.decisionReceipt as Record<string, unknown>).executionState, "not_executed");
  assert.deepEqual(stderr, []);

  stdout.length = 0;
  const summaryStderr: string[] = [];
  assert.equal(await runExactActionGatePassCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => summaryStderr.push(value),
  }), 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as Record<string, unknown>;
  assert.equal(summary.scenarioCount, 10);
  assert.equal("scenarios" in summary, false);
  assert.equal(summary.realPayments, false);
  assert.equal(summary.externalApis, false);
  assert.deepEqual(summaryStderr, []);
});

test("P3-M150 documentation and README preserve restrained public claims", () => {
  const readme = readFileSync("README.md", "utf8");
  const doc = readFileSync("docs/exact-action-gatepass-and-execution-receipts.md", "utf8");
  const packageJson = readJson<{ version: string; scripts: Record<string, string> }>("package.json");
  assert.match(readme, /GatePasses are designed to bind authority to one exact consequential action/);
  assert.match(readme, /The public implementation remains a local reference demonstrator/);
  assert.match(readme, /Allowed does not mean executed\./);
  assert.match(readme, /Agent Trust Gate™ exists to make digital trust verifiable before action,\s+observable during execution and accountable afterwards\./);
  assert.match(readme, /Control before action\. Evidence during execution\. Accountability after the\s+event\./);
  assert.match(doc, /Permission must be verified at the point of action\. Decision does not equal execution\./);
  assert.match(doc, /GitHub Discussion #1/);
  assert.match(doc, /does not imply endorsement/i);
  assert.match(doc, /durable nonce store/i);
  assert.match(doc, /transactional outbox/i);
  assert.match(doc, /signed execution acknowledgement/i);
  assert.match(packageJson.scripts["demo:exact-action"] ?? "", /exact-action-gatepass-cli\.js/);
  assert.equal(packageJson.version, "0.1.0");
  const exactSectionStart = readme.indexOf("## Exact-action GatePass reference");
  const exactSectionEnd = readme.indexOf("## 30-second reviewer summary", exactSectionStart);
  const claims = `${readme.slice(exactSectionStart, exactSectionEnd)}\n${doc}`;
  assert.doesNotMatch(claims, /production[- ]ready|production enforcement is implemented|reviewer endorsement/i);
});

function validateSchema(schemaPath: string, value: unknown): string[] {
  const absolute = resolve(schemaPath);
  const schema = readJson<JsonSchema>(absolute);
  return errorsFor(schema, value, "$", absolute, schema);
}

function errorsFor(
  schema: JsonSchema,
  value: unknown,
  path: string,
  schemaPath: string,
  rootSchema: JsonSchema,
): string[] {
  if (typeof schema.$ref === "string") {
    const [filePart = "", fragment = ""] = schema.$ref.split("#", 2);
    const referencedPath = filePart === "" ? schemaPath : resolve(dirname(schemaPath), filePart);
    const referencedRoot = filePart === "" ? rootSchema : readJson<JsonSchema>(referencedPath);
    const referenced = resolveJsonPointer(referencedRoot, fragment);
    return errorsFor(referenced, value, path, referencedPath, referencedRoot);
  }
  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter((candidate) =>
      errorsFor(candidate as JsonSchema, value, path, schemaPath, rootSchema).length === 0
    );
    return matches.length === 1 ? [] : [`${path} must match exactly one schema`];
  }
  const errors: string[] = [];
  if (Object.hasOwn(schema, "const") && value !== schema.const) errors.push(`${path} must equal const`);
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) errors.push(`${path} must match enum`);
  if (!matchesSchemaType(schema.type, value)) {
    errors.push(`${path} has wrong type`);
    return errors;
  }
  if (isRecord(value)) {
    const properties = isRecord(schema.properties) ? schema.properties : {};
    for (const field of schema.required as string[] | undefined ?? []) {
      if (!Object.hasOwn(value, field)) errors.push(`${path}.${field} is required`);
    }
    if (schema.additionalProperties === false) {
      for (const field of Object.keys(value)) {
        if (!Object.hasOwn(properties, field)) errors.push(`${path}.${field} is not allowed`);
      }
    }
    for (const [field, childSchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, field)) {
        errors.push(...errorsFor(childSchema as JsonSchema, value[field], `${path}.${field}`, schemaPath, rootSchema));
      }
    }
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) errors.push(`${path} has too few items`);
    if (isRecord(schema.items)) {
      value.forEach((item, index) => {
        errors.push(...errorsFor(schema.items as JsonSchema, item, `${path}[${index}]`, schemaPath, rootSchema));
      });
    }
  }
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) errors.push(`${path} is too short`);
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value)) errors.push(`${path} pattern mismatch`);
    if (schema.format === "date-time" && Number.isNaN(Date.parse(value))) errors.push(`${path} is not date-time`);
  }
  if (typeof value === "number" && typeof schema.minimum === "number" && value < schema.minimum) {
    errors.push(`${path} is below minimum`);
  }
  return errors;
}

function resolveJsonPointer(root: JsonSchema, fragment: string): JsonSchema {
  if (fragment === "") return root;
  return fragment.replace(/^\//, "").split("/").reduce<unknown>((value, segment) => {
    if (!isRecord(value)) throw new Error(`Invalid schema pointer #${fragment}`);
    return value[segment.replace(/~1/g, "/").replace(/~0/g, "~")];
  }, root) as JsonSchema;
}

function matchesSchemaType(type: unknown, value: unknown): boolean {
  if (type === undefined) return true;
  if (Array.isArray(type)) return type.some((candidate) => matchesSchemaType(candidate, value));
  if (type === "null") return value === null;
  if (type === "object") return isRecord(value);
  if (type === "array") return Array.isArray(value);
  if (type === "string") return typeof value === "string";
  if (type === "boolean") return typeof value === "boolean";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "integer") return Number.isInteger(value);
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
