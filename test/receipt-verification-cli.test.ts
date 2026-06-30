import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createReceiptVerificationCliId,
  createReceiptVerificationCliResult,
  runLocalReceiptVerificationFromObject,
  type ReceiptVerificationInput,
} from "../src/index.js";

const paths = {
  cli: resolve("dist/src/receipt-verification-cli.js"),
  doc: resolve("docs/receipt-verification-cli.md"),
  config: resolve("config/receipt-verification-cli-safety.json"),
  validInput: resolve("examples/receipt-verification-cli-input-valid.json"),
  validOutput: resolve("examples/receipt-verification-cli-output-valid.json"),
  invalidInput: resolve("examples/receipt-verification-cli-input-invalid.json"),
  invalidOutput: resolve("examples/receipt-verification-cli-output-invalid.json"),
  rejected: resolve("examples/receipt-verification-cli-private-data-rejected.json"),
  blocked: resolve("examples/receipt-verification-cli-live-verification-blocked.json"),
};
const priorTests = [
  "agent-to-agent-trust-handshake", "refusalgraph-core", "agent-clearing-house-foundation",
  "refusalgraph-signal-engine", "refusalgraph-query-engine", "agent-clearing-decision-engine",
  "agent-clearing-receipt-engine", "unique-advantage-radar", "receipt-verification-readiness",
  "fee-metering-readiness", "agent-clearing-pipeline-demo", "agent-clearing-demo-cli",
  "agent-clearing-demo-report", "agent-clearing-public-demo-narrative",
  "agent-clearing-investor-partner-brief", "local-clearing-ledger",
  "refusalgraph-local-signal-store", "batch-agent-clearing-runner",
].map((name) => resolve(`test/${name}.test.ts`));
const outputKeys = [
  "verification_cli_id", "verification_type", "source_receipt_id", "receipt_status",
  "verification_result", "verification_passed", "verification_failed", "failure_reasons",
  "checked_fields", "safety_summary", "private_data_included",
  "network_lookup_performed", "external_lookup_performed", "tracking_triggered",
  "analytics_triggered", "payment_or_fee_triggered", "billing_triggered",
  "settlement_triggered", "action_executed", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function validContainer(): { receipt: ReceiptVerificationInput } {
  return readJson(paths.validInput) as { receipt: ReceiptVerificationInput };
}

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [paths.cli, ...args], { encoding: "utf8" });
}

function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

function assertSafeFlags(value: Record<string, unknown>): void {
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "action_executed"]) {
    assert.equal(value[field], false, field);
  }
  assert.equal(value.status, "draft_only");
}

test("receipt verification CLI files exist and all prior infrastructure tests remain present", () => {
  for (const path of [...Object.values(paths), ...priorTests]) assert.equal(existsSync(path), true, path);
});

test("helper creates exact allowlisted valid local verification output", () => {
  const input = validContainer();
  const result = runLocalReceiptVerificationFromObject(input);
  assert.deepEqual(result, readJson(paths.validOutput));
  assert.deepEqual(result, createReceiptVerificationCliResult(input.receipt));
  assert.deepEqual(Object.keys(result).sort(), outputKeys);
  assert.equal(result.verification_result, "locally_valid");
  assert.equal(result.verification_passed, true);
  assert.equal(result.verification_failed, false);
  assert.deepEqual(result.failure_reasons, []);
  assertSafeFlags(result as unknown as Record<string, unknown>);
});

test("invalid local receipt produces exact safe failed output and reasons", () => {
  const result = runLocalReceiptVerificationFromObject(readJson(paths.invalidInput));
  assert.deepEqual(result, readJson(paths.invalidOutput));
  assert.equal(result.verification_passed, false);
  assert.equal(result.verification_failed, true);
  assert.equal(result.verification_result, "decision_link_missing");
  for (const reason of ["invalid_receipt_type", "missing_source_decision_id", "missing_source_request_id", "reason_codes_invalid", "next_steps_invalid"]) {
    assert.ok(result.failure_reasons.includes(reason), reason);
  }
  assertSafeFlags(result as unknown as Record<string, unknown>);
});

test("verification CLI IDs are deterministic and contain no private receipt ID", () => {
  const marker = "PRIVATE_RECEIPT_IDENTIFIER_MUST_NOT_COPY";
  const id = createReceiptVerificationCliId(marker);
  assert.equal(id, createReceiptVerificationCliId(marker));
  assert.match(id, /^receipt_verify_cli_[a-f0-9]{24}$/);
  assert.doesNotMatch(id, new RegExp(marker));
});

test("CLI accepts valid local JSON and supports pretty output", () => {
  const compact = runCli(paths.validInput);
  assert.equal(compact.status, 0);
  assert.equal(compact.stderr, "");
  assert.deepEqual(JSON.parse(compact.stdout), readJson(paths.validOutput));
  const pretty = runCli(paths.validInput, "--pretty");
  assert.equal(pretty.status, 0);
  assert.equal(pretty.stderr, "");
  assert.match(pretty.stdout, /^\{\r?\n  "verification_cli_id"/);
  assert.deepEqual(JSON.parse(pretty.stdout), readJson(paths.validOutput));
});

test("CLI returns structured safe errors for path, file, JSON, and receipt failures", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-receipt-cli-errors-`);
  try {
    const marker = "PRIVATE_ERROR_PATH_MUST_NOT_COPY";
    const invalidJson = resolve(directory, `${marker}.json`);
    const missingReceipt = resolve(directory, "missing-receipt.json");
    const unsupported = resolve(directory, "unsupported-receipt.json");
    writeFileSync(invalidJson, `{ "private": "${marker}"`);
    writeFileSync(missingReceipt, JSON.stringify({ local_value: marker }));
    writeFileSync(unsupported, JSON.stringify({ receipt: [] }));
    const cases = [
      [runCli(), "MISSING_INPUT_FILE"],
      [runCli(resolve(directory, `${marker}-missing.json`)), "INPUT_FILE_UNREADABLE"],
      [runCli(invalidJson), "INVALID_JSON"],
      [runCli(missingReceipt), "MISSING_RECEIPT"],
      [runCli(unsupported), "UNSUPPORTED_RECEIPT_SHAPE"],
    ] as const;
    for (const [command, code] of cases) {
      assert.equal(command.status, 1);
      assert.equal(command.stdout, "");
      const error = JSON.parse(command.stderr) as Record<string, unknown>;
      assert.equal((error.error as { code: string }).code, code);
      assertSafeFlags(error);
      assert.doesNotMatch(command.stderr, new RegExp(marker));
      assert.doesNotMatch(command.stderr, /at run|Error:|receipt-verification-cli\.js:\d+/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("private receipt fields and private values never enter helper or CLI output", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-receipt-cli-private-`);
  try {
    const marker = "PRIVATE_RECEIPT_VALUE_MUST_NOT_COPY";
    const value = validContainer();
    value.receipt.receipt_id = marker;
    value.receipt.source_clearing_decision_id = marker;
    value.receipt.source_clearing_request_id = marker;
    for (const field of ["customer_name", "customer_email", "company_name", "bank_account", "card_number", "wallet_address", "api_key", "access_token", "private_document_text", "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"]) {
      value.receipt[field] = marker;
    }
    const helper = runLocalReceiptVerificationFromObject(value);
    assert.doesNotMatch(JSON.stringify(helper), new RegExp(marker));
    const path = resolve(directory, "input.json");
    writeFileSync(path, JSON.stringify(value));
    const command = runCli(path);
    assert.equal(command.status, 0);
    assert.doesNotMatch(command.stdout, new RegExp(marker));
    assertSafeFlags(JSON.parse(command.stdout) as Record<string, unknown>);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI safety summary confirms no live, blockchain, network, commerce, or execution activity", () => {
  const result = runLocalReceiptVerificationFromObject(validContainer());
  assert.deepEqual(result.safety_summary, {
    local_input_only: true,
    live_verification_performed: false,
    blockchain_verification_performed: false,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
  });
  assert.ok(result.checked_fields.includes("receipt_id"));
  assert.ok(result.checked_fields.includes("action_executed"));
});

test("receipt verification CLI safety config disables every activation surface", () => {
  const config = readJson(paths.config) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(readJson(paths.blocked));
  for (const requirement of ["requires_human_approval", "requires_gareth_final_approval", "requires_technical_validation", "requires_security_review", "requires_privacy_review", "requires_legal_review", "requires_commercial_validation"]) assert.equal(config[requirement], true, requirement);
});

test("receipt CLI docs and examples preserve local private-data and verification boundaries", () => {
  const source = Object.values(paths).filter((path) => path !== paths.cli).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /does not write files/i);
  assert.match(source, /does not.*blockchain verification/i);
  assert.match(source, /Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  for (const marker of ["customer_name", "customer_email", "company_name", "bank_account", "card_number", "wallet_address", "api_key", "access_token", "private_document_text", "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"]) {
    assert.doesNotMatch(JSON.stringify(readJson(paths.validOutput)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.invalidOutput)), new RegExp(marker));
  }
});
