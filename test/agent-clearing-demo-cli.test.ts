import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const cliPath = resolve("dist/src/agent-clearing-demo-cli.js");
const docPath = resolve("docs/agent-clearing-demo-cli.md");
const configPath = resolve("config/agent-clearing-demo-cli-safety.json");
const inputPath = resolve("examples/agent-clearing-cli-input-draft.json");
const blockedPath = resolve("examples/agent-clearing-cli-output-blocked.json");
const lowRiskPath = resolve("examples/agent-clearing-cli-output-low-risk.json");
const rejectedPath = resolve("examples/agent-clearing-cli-private-data-rejected.json");
const activationPath = resolve("examples/agent-clearing-cli-live-activation-blocked.json");
const priorTests = [
  resolve("test/agent-to-agent-trust-handshake.test.ts"),
  resolve("test/refusalgraph-core.test.ts"),
  resolve("test/agent-clearing-house-foundation.test.ts"),
  resolve("test/refusalgraph-signal-engine.test.ts"),
  resolve("test/refusalgraph-query-engine.test.ts"),
  resolve("test/agent-clearing-decision-engine.test.ts"),
  resolve("test/agent-clearing-receipt-engine.test.ts"),
  resolve("test/unique-advantage-radar.test.ts"),
  resolve("test/receipt-verification-readiness.test.ts"),
  resolve("test/fee-metering-readiness.test.ts"),
  resolve("test/agent-clearing-pipeline-demo.test.ts"),
];
const outputKeys = [
  "pipeline_id", "pipeline_status", "refusalgraph_query_result",
  "clearing_decision", "clearing_receipt", "receipt_verification_result",
  "fee_metering_event", "action_executed", "network_lookup_performed",
  "external_lookup_performed", "payment_or_fee_triggered", "billing_triggered",
  "settlement_triggered", "machine_to_machine_fee_triggered", "tracking_triggered",
  "analytics_triggered", "private_data_included", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
  });
}

function lowRiskInput(): Record<string, unknown> {
  return {
    pipeline_id: "local-low-risk-pipeline-placeholder",
    clearing_request: {
      clearing_request_id: "local-low-risk-pipeline-request",
      requesting_agent_type: "internal_agent_placeholder",
      receiving_agent_type: "review_agent_placeholder",
      requested_action_category: "internal_action",
      requested_action_type: "internal_review",
      proposed_value: null,
      proposed_fee: null,
      risk_level: "low",
      impact_level: "low",
      evidence_status: "complete",
      approval_status: "not_required",
      agent_identity_status: "verified_locally",
      payment_intent_status: "not_applicable",
      requested_decision: "request_clearance",
      timestamp: "2026-06-29T18:05:00.000Z",
    },
    local_refusal_signals: [],
    fee_metering_requested: false,
    timestamp: "2026-06-29T18:05:00.000Z",
  };
}

function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

function assertTopLevelSafety(result: Record<string, unknown>): void {
  for (const field of [
    "action_executed", "network_lookup_performed", "external_lookup_performed",
    "payment_or_fee_triggered", "billing_triggered", "settlement_triggered",
    "machine_to_machine_fee_triggered", "tracking_triggered", "analytics_triggered",
    "private_data_included",
  ]) assert.equal(result[field], false, field);
  if (Object.hasOwn(result, "pipeline_status")) {
    assert.equal(result.pipeline_status, "draft_only_completed");
  }
  assert.equal(result.status, "draft_only");
}

test("demo CLI files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [docPath, configPath, inputPath, blockedPath, lowRiskPath, rejectedPath, activationPath, ...priorTests]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("demo CLI runs the full blocked pipeline and prints exact safe JSON", () => {
  const compact = runCli(inputPath);
  assert.equal(compact.status, 0);
  assert.equal(compact.stderr, "");
  const result = JSON.parse(compact.stdout) as Record<string, unknown>;
  assert.deepEqual(result, readJson(blockedPath));
  assert.deepEqual(Object.keys(result).sort(), outputKeys);
  assert.equal((result.clearing_decision as { decision: string }).decision, "require_human_approval");
  assert.ok(result.refusalgraph_query_result);
  assert.ok(result.clearing_receipt);
  assert.ok(result.receipt_verification_result);
  assert.ok(result.fee_metering_event);
  assertTopLevelSafety(result);

  const pretty = runCli(inputPath, "--pretty");
  assert.equal(pretty.status, 0);
  assert.match(pretty.stdout, /^\{\r?\n  "pipeline_id"/);
  assert.deepEqual(JSON.parse(pretty.stdout), result);
});

test("demo CLI runs a low-risk pipeline with metering disabled", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-clearing-cli-low-`);
  try {
    const path = resolve(directory, "input.json");
    writeFileSync(path, JSON.stringify(lowRiskInput()));
    const command = runCli(path);
    assert.equal(command.status, 0);
    assert.equal(command.stderr, "");
    const result = JSON.parse(command.stdout) as Record<string, unknown>;
    assert.deepEqual(result, readJson(lowRiskPath));
    assert.equal((result.clearing_decision as { decision: string }).decision, "accept_with_limits");
    assert.equal((result.fee_metering_event as { fee_readiness_status: string }).fee_readiness_status, "not_enabled");
    assertTopLevelSafety(result);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("demo CLI safely defaults pipeline ID, local signals, and fee metering", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-clearing-cli-defaults-`);
  try {
    const value = lowRiskInput();
    delete value.pipeline_id;
    delete value.local_refusal_signals;
    delete value.fee_metering_requested;
    const path = resolve(directory, "input.json");
    writeFileSync(path, JSON.stringify(value));
    const command = runCli(path);
    assert.equal(command.status, 0);
    const result = JSON.parse(command.stdout) as Record<string, unknown>;
    assert.match(result.pipeline_id as string, /^acp_local_[a-f0-9]{24}$/);
    assert.equal((result.refusalgraph_query_result as { result_status: string }).result_status, "no_matches");
    assert.equal((result.fee_metering_event as { fee_readiness_status: string }).fee_readiness_status, "not_enabled");
    assertTopLevelSafety(result);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("demo CLI errors are structured, local, and contain no path, input, or stack trace", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-clearing-cli-errors-`);
  try {
    const privateMarker = "PRIVATE_ERROR_VALUE_MUST_NOT_COPY";
    const invalidJsonPath = resolve(directory, `${privateMarker}.json`);
    const missingRequestPath = resolve(directory, "missing-request.json");
    writeFileSync(invalidJsonPath, `{ "private": "${privateMarker}"`);
    writeFileSync(missingRequestPath, JSON.stringify({ private_value: privateMarker }));

    const cases = [
      { command: runCli(), code: "MISSING_INPUT_FILE" },
      { command: runCli(resolve(directory, `${privateMarker}-missing.json`)), code: "INPUT_FILE_UNREADABLE" },
      { command: runCli(invalidJsonPath), code: "INVALID_JSON" },
      { command: runCli(missingRequestPath), code: "INVALID_INPUT" },
    ];
    for (const { command, code } of cases) {
      assert.equal(command.status, 1);
      assert.equal(command.stdout, "");
      const error = JSON.parse(command.stderr) as Record<string, unknown>;
      assert.equal((error.error as { code: string }).code, code);
      assertTopLevelSafety(error);
      assert.doesNotMatch(command.stderr, new RegExp(privateMarker));
      assert.doesNotMatch(command.stderr, /at run|Error:|agent-clearing-demo-cli\.js:\d+/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("demo CLI strips private fields before the pipeline and nested output", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-clearing-cli-private-`);
  try {
    const marker = "PRIVATE_CLI_VALUE_MUST_NOT_COPY";
    const value = lowRiskInput();
    value.pipeline_id = marker;
    const request = value.clearing_request as Record<string, unknown>;
    request.clearing_request_id = marker;
    request.requesting_agent_type = marker;
    request.receiving_agent_type = marker;
    for (const field of [
      "customer_name", "customer_email", "company_name", "bank_account",
      "card_number", "wallet_address", "api_key", "access_token",
      "private_document_text", "invoice_number", "contract_text",
      "real_agent_endpoint", "real_url", "real_email_content",
    ]) request[field] = marker;
    const path = resolve(directory, "input.json");
    writeFileSync(path, JSON.stringify(value));
    const command = runCli(path);
    assert.equal(command.status, 0);
    assert.doesNotMatch(command.stdout, new RegExp(marker));
    for (const field of Object.keys(request).filter((key) => key.startsWith("customer_") || [
      "company_name", "bank_account", "card_number", "wallet_address", "api_key",
      "access_token", "private_document_text", "invoice_number", "contract_text",
      "real_agent_endpoint", "real_url", "real_email_content",
    ].includes(key))) assert.doesNotMatch(command.stdout, new RegExp(field));
    assertTopLevelSafety(JSON.parse(command.stdout) as Record<string, unknown>);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("demo CLI safety config disables every activation surface and requires all reviews", () => {
  const config = readJson(configPath) as Record<string, unknown>;
  const blocked = readJson(activationPath) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(blocked);
  for (const requirement of [
    "requires_human_approval", "requires_gareth_final_approval",
    "requires_technical_validation", "requires_security_review",
    "requires_privacy_review", "requires_legal_review",
    "requires_commercial_validation",
  ]) assert.equal(config[requirement], true, requirement);

  for (const flag of [
    "demo_cli_enabled", "live_cli_enabled", "cli_network_enabled",
    "clearing_network_enabled", "external_lookup_enabled", "public_api_enabled",
    "public_protocol_enabled", "agent_to_agent_cli_enabled", "receipt_network_enabled",
    "live_receipt_verification_enabled", "external_receipt_verification_enabled",
    "live_fee_metering_enabled", "billable_events_enabled", "billing_enabled",
    "payment_enabled", "settlement_enabled", "machine_to_machine_fee_enabled",
    "external_metering_enabled", "tracking_enabled", "analytics_enabled",
    "deployment_enabled", "publishing_enabled", "signup_enabled", "outreach_enabled",
    "webhook_enabled", "third_party_connections_enabled", "live_customer_data_enabled",
    "private_data_export_enabled", "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("demo CLI docs and examples state the local non-operational boundary", () => {
  const source = [docPath, configPath, inputPath, blockedPath, lowRiskPath, rejectedPath, activationPath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /demo CLI does not execute actions/i);
  assert.match(source, /demo CLI does not perform network lookups/i);
  assert.match(source, /demo CLI does not move money/i);
  assert.match(source, /does not trigger payment, billing, settlement, signup, tracking, analytics, deployment, publishing, outreach, webhooks, or third-party connections/i);
  assert.match(source, /All live, commercial, network, payment, verification, metering, billing, or settlement use requires Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
