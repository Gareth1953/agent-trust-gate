import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createProfitDemoScenarioRunnerId,
  runProfitDemoScenarioRunner,
  summariseProfitDemoScenarioRunner,
  type ProfitDemoScenarioRunnerInput,
} from "../src/profit-demo-scenario-runner.js";
import { runProfitDemoScenarioRunnerCli } from "../src/profit-demo-scenario-runner-cli.js";

const root = process.cwd();
const fixturePath = join(root, "examples", "profit-demo-scenario-runner-input.json");
const privateFields = ["customer_name", "customer_email", "company_name", "bank_account",
  "card_number", "wallet_address", "api_key", "access_token", "private_document_text",
  "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"];

function fixture(): ProfitDemoScenarioRunnerInput {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as ProfitDemoScenarioRunnerInput;
}

test("runner proves entitled, denied, and repeat-use scenarios", () => {
  const result = runProfitDemoScenarioRunner(fixture());
  assert.equal(result.scenario_count, 3);
  assert.equal(result.entitled_use_passed, true);
  assert.equal(result.missing_entitlement_denied, true);
  assert.ok(result.repeat_use_revenue_events > 0);
  assert.ok(result.total_hypothetical_revenue_events > 0);
  assert.ok(result.total_placeholder_uses_consumed > 0);
  assert.equal(result.total_blocked, 2);
  assert.equal(result.scenario_results[0]?.engine_run_id === null, false);
  assert.equal(result.scenario_results[1]?.access_status, "paid_entitlement_required");
  assert.equal(result.scenario_results[1]?.engine_run_id, null);
  assert.equal(result.scenario_results[2]?.uses_consumed, 4);
  assert.match(result.plain_english_result, /Missing entitlement was denied before use/i);
  assert.match(result.final_demo_summary, /hypothetical revenue event/i);
  assert.ok(result.recommended_next_steps.length > 0);
});

test("scenario rows use only the demo allowlist", () => {
  const result = runProfitDemoScenarioRunner(fixture());
  const expected = ["scenario_id", "scenario_type", "access_status",
    "paid_entitlement_present", "uses_consumed", "uses_remaining", "decision",
    "approval_required", "action_allowed", "action_blocked", "goal_status",
    "hypothetical_revenue_event_count", "engine_run_id", "final_profit_test_summary",
    "status"].sort();
  for (const scenario of result.scenario_results) {
    assert.deepEqual(Object.keys(scenario).sort(), expected);
  }
});

test("result and summary keep all operational safety flags false", () => {
  const result = runProfitDemoScenarioRunner(fixture());
  const summary = summariseProfitDemoScenarioRunner(result);
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

test("demo IDs are deterministic and contain no source data", () => {
  const id = createProfitDemoScenarioRunnerId("private@example.test");
  assert.equal(id, createProfitDemoScenarioRunnerId("private@example.test"));
  assert.doesNotMatch(id, /private|example/i);
});

test("private fields and values do not enter runner output", () => {
  const input = fixture();
  Object.assign(input, { customer_name: "Private Person", api_key: "secret-key" });
  Object.assign(input.scenarios[0]!, { private_document_text: "private-document" });
  Object.assign(input.scenarios[0]!.clearing_request, { bank_account: "private-account" });
  const output = JSON.stringify(runProfitDemoScenarioRunner(input));
  for (const field of privateFields) assert.equal(output.includes(field), false, field);
  assert.doesNotMatch(output, /Private Person|secret-key|private-document|private-account/);
});

test("CLI accepts local JSON and supports pretty output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runProfitDemoScenarioRunnerCli([fixturePath, "--pretty"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) });
  assert.equal(code, 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /\n  "demo_id"/);
  const output = JSON.parse(stdout[0] ?? "{}") as Record<string, unknown>;
  assert.equal(output.entitled_use_passed, true);
  assert.equal(output.action_executed, false);
});

test("CLI safely handles missing path, file, invalid JSON, missing and empty scenarios", () => {
  const invalid = join(root, "profit-demo-invalid.tmp.json");
  const missing = join(root, "profit-demo-missing-scenarios.tmp.json");
  const empty = join(root, "profit-demo-empty-scenarios.tmp.json");
  writeFileSync(invalid, "{invalid", "utf8");
  writeFileSync(missing, JSON.stringify({ source_id: "safe", created_at: "2026-07-01T00:00:00Z" }), "utf8");
  writeFileSync(empty, JSON.stringify({ source_id: "safe", scenarios: [], created_at: "2026-07-01T00:00:00Z" }), "utf8");
  const cases: Array<[string[], string]> = [
    [[], "MISSING_INPUT_FILE"], [[join(root, "profit-demo-absent.json")], "INPUT_FILE_UNREADABLE"],
    [[invalid], "INVALID_JSON"], [[missing], "INVALID_INPUT"], [[empty], "INVALID_INPUT"],
  ];
  try {
    for (const [args, expected] of cases) {
      const stderr: string[] = [];
      assert.equal(runProfitDemoScenarioRunnerCli(args,
        { stdout: () => undefined, stderr: (value) => stderr.push(value) }), 1);
      const error = JSON.parse(stderr[0] ?? "{}") as { error?: { code?: string } };
      assert.equal(error.error?.code, expected);
      for (const field of privateFields) assert.equal((stderr[0] ?? "").includes(field), false);
    }
  } finally { for (const path of [invalid, missing, empty]) rmSync(path, { force: true }); }
});

test("required docs and examples exist with activation disabled", () => {
  for (const file of ["docs/profit-demo-scenario-runner.md",
    "examples/profit-demo-scenario-runner-input.json",
    "examples/profit-demo-scenario-runner-output.json",
    "examples/profit-demo-scenario-runner-private-data-rejected.json",
    "examples/profit-demo-scenario-runner-live-activation-blocked.json"]) {
    assert.equal(existsSync(join(root, file)), true, file);
  }
  const blocked = JSON.parse(readFileSync(join(root,
    "examples/profit-demo-scenario-runner-live-activation-blocked.json"), "utf8")) as Record<string, unknown>;
  for (const [key, value] of Object.entries(blocked)) {
    if (key.endsWith("_enabled")) assert.equal(value, false, key);
  }
});
