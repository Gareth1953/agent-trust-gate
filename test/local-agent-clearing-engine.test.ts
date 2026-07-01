import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createLocalAgentClearingEngineRunId,
  runLocalAgentClearingEngine,
  summariseLocalAgentClearingEngineRun,
  type LocalAgentClearingEngineInput,
} from "../src/local-agent-clearing-engine.js";
import { runLocalAgentClearingEngineCli } from "../src/local-agent-clearing-engine-cli.js";

const root = process.cwd();
const privateFields = ["customer_name", "customer_email", "company_name", "bank_account",
  "card_number", "wallet_address", "api_key", "access_token", "private_document_text",
  "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"];

function input(overrides: Record<string, unknown> = {}): LocalAgentClearingEngineInput {
  return {
    source_id: "engine-test-001",
    clearing_request: {
      request_id: "request-001", agent_id: "agent-a", target_agent_id: "agent-b",
      intent_category: "internal_action", action_category: "internal_review",
      requested_action: "internal_review", risk_level: "low",
      evidence_level: "complete", approval_status: "not_required",
      created_at: "2026-07-01T10:00:00.000Z",
    },
    local_refusal_signals: [],
    created_at: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

test("local engine processes a request through all local product stages", () => {
  const result = runLocalAgentClearingEngine(input());
  for (const key of ["decision", "caution_level", "approval_required", "action_allowed",
    "action_blocked", "matched_signal_count", "clearing_decision_id", "clearing_receipt_id",
    "verification_id", "verification_result", "ledger_summary", "fee_metering_summary",
    "evidence_bundle_id", "replay_id", "replay_status", "integrity_snapshot_id",
    "integrity_status", "integrity_score", "final_recommendation"] as const) {
    assert.ok(key in result, key);
  }
  assert.equal(result.verification_passed, true);
  assert.equal(result.replay_consistent, true);
  assert.ok(result.ledger_summary.total_records > 0);
  assert.equal(result.fee_metering_summary.total_events, 1);
  assert.ok(result.integrity_score >= 90);
});

test("blocked request produces a blocked recommendation", () => {
  const request = { ...input().clearing_request, intent_category: "deployment",
    action_category: "deploy_code", requested_action: "deploy_code", risk_level: "high",
    evidence_level: "missing", approval_status: "missing" };
  const result = runLocalAgentClearingEngine(input({ clearing_request: request,
    local_refusal_signals: [{ signal_type: "blocked_request", source_id: "signal-blocked",
      intent_category: "deployment", action_category: "deploy_code",
      refusal_reason: "missing_evidence", caution_level: "high", approval_required: true,
      action_allowed: false, action_blocked: true, evidence_level: "missing",
      signal_status: "draft_only", created_at: "2026-07-01T09:00:00.000Z" }] }));
  assert.equal(result.action_allowed, false);
  assert.equal(result.action_blocked, true);
  assert.match(result.final_recommendation, /must not proceed/i);
});

test("approval-required request produces a human approval recommendation", () => {
  const request = { ...input().clearing_request, intent_category: "publishing",
    action_category: "publish_content", requested_action: "publish_content",
    risk_level: "medium", approval_status: "missing" };
  const result = runLocalAgentClearingEngine(input({ clearing_request: request }));
  assert.equal(result.approval_required, true);
  assert.match(result.final_recommendation, /Gareth or human approval/i);
  assert.equal(result.action_executed, false);
});

test("locally allowed request remains draft-only and is never executed", () => {
  const result = runLocalAgentClearingEngine(input());
  assert.equal(result.action_allowed, true);
  assert.equal(result.action_executed, false);
  assert.match(result.final_recommendation, /draft mode only/i);
});

test("engine and summary keep every operational safety flag false", () => {
  const result = runLocalAgentClearingEngine(input());
  const summary = summariseLocalAgentClearingEngineRun(result);
  for (const value of [result, summary]) {
    for (const key of ["private_data_included", "network_lookup_performed",
      "external_lookup_performed", "tracking_triggered", "analytics_triggered",
      "payment_or_fee_triggered", "billing_triggered", "settlement_triggered",
      "machine_to_machine_fee_triggered", "action_executed", "published"] as const) {
      assert.equal(value[key], false, key);
    }
    assert.equal(value.status, "draft_only");
  }
});

test("engine IDs are deterministic and do not contain source data", () => {
  const first = createLocalAgentClearingEngineRunId("private@example.test");
  assert.equal(first, createLocalAgentClearingEngineRunId("private@example.test"));
  assert.doesNotMatch(first, /private|example/i);
});

test("private input fields never enter engine result or summary", () => {
  const contaminated = input({ customer_name: "Private Person", api_key: "secret-key",
    clearing_request: { ...input().clearing_request, bank_account: "private-account",
      private_document_text: "private text" } });
  const output = JSON.stringify(runLocalAgentClearingEngine(contaminated));
  for (const field of privateFields) assert.equal(output.includes(field), false, field);
  assert.doesNotMatch(output, /Private Person|secret-key|private-account|private text/);
});

test("CLI accepts local JSON and supports pretty safe output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runLocalAgentClearingEngineCli([
    join(root, "examples", "local-agent-clearing-engine-input-draft.json"), "--pretty",
  ], { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) });
  assert.equal(code, 0);
  assert.equal(stderr.length, 0);
  const result = JSON.parse(stdout[0] ?? "{}") as Record<string, unknown>;
  assert.equal(result.action_executed, false);
  assert.match(stdout[0] ?? "", /\n  "engine_run_id"/);
});

test("CLI handles missing path, missing file, invalid JSON, and missing request safely", () => {
  const cases: Array<{ args: string[]; code: string }> = [
    { args: [], code: "MISSING_INPUT_FILE" },
    { args: [join(root, "missing-engine-input.json")], code: "INPUT_FILE_UNREADABLE" },
  ];
  const invalidPath = join(root, "local-engine-invalid.tmp.json");
  const missingRequestPath = join(root, "local-engine-missing-request.tmp.json");
  writeFileSync(invalidPath, "{invalid", "utf8");
  writeFileSync(missingRequestPath, JSON.stringify({ source_id: "safe" }), "utf8");
  cases.push({ args: [invalidPath], code: "INVALID_JSON" });
  cases.push({ args: [missingRequestPath], code: "INVALID_INPUT" });
  try {
    for (const item of cases) {
      const stderr: string[] = [];
      const code = runLocalAgentClearingEngineCli(item.args,
        { stdout: () => undefined, stderr: (value) => stderr.push(value) });
      assert.equal(code, 1);
      assert.equal((JSON.parse(stderr[0] ?? "{}") as { error?: { code?: string } }).error?.code, item.code);
      for (const field of privateFields) assert.equal((stderr[0] ?? "").includes(field), false);
    }
  } finally {
    rmSync(invalidPath, { force: true });
    rmSync(missingRequestPath, { force: true });
  }
});

test("required docs and examples exist and examples keep activation disabled", () => {
  for (const relative of ["docs/local-agent-clearing-engine.md",
    "examples/local-agent-clearing-engine-input-draft.json",
    "examples/local-agent-clearing-engine-output-local.json",
    "examples/local-agent-clearing-engine-private-data-rejected.json",
    "examples/local-agent-clearing-engine-live-activation-blocked.json"]) {
    assert.equal(existsSync(join(root, relative)), true, relative);
  }
  const blocked = JSON.parse(readFileSync(join(root,
    "examples/local-agent-clearing-engine-live-activation-blocked.json"), "utf8")) as Record<string, unknown>;
  for (const [key, value] of Object.entries(blocked)) {
    if (key.endsWith("_enabled")) assert.equal(value, false, key);
  }
});
