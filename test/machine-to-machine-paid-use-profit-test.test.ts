import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createLocalPaidUseEntitlement,
  createMachineToMachineProfitTestId,
  runMachineToMachinePaidUseProfitTest,
  summariseMachineToMachinePaidUseProfitTest,
  type MachineToMachinePaidUseProfitTestInput,
} from "../src/machine-to-machine-paid-use-profit-test.js";
import { runMachineToMachinePaidUseProfitTestCli } from "../src/machine-to-machine-paid-use-profit-test-cli.js";

const root = process.cwd();
const fixturePath = join(root, "examples", "machine-to-machine-paid-use-profit-test-input-draft.json");
const privateFields = ["customer_name", "customer_email", "company_name", "bank_account",
  "card_number", "wallet_address", "api_key", "access_token", "private_document_text",
  "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"];

function fixture(): MachineToMachinePaidUseProfitTestInput {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as MachineToMachinePaidUseProfitTestInput;
}

test("profit test gates machine use then runs the complete local clearing engine", () => {
  const result = runMachineToMachinePaidUseProfitTest(fixture());
  assert.equal(result.access_status, "paid_entitlement_accepted");
  assert.equal(result.paid_entitlement_present, true);
  for (const key of ["buyer_agent_id", "clearing_service_agent_id", "target_service_agent_id",
    "engine_run_id", "decision", "approval_required", "action_allowed", "action_blocked",
    "clearing_receipt_id", "verification_result", "evidence_bundle_id", "replay_status",
    "integrity_score", "fee_placeholder_count", "hypothetical_revenue_event_count",
    "final_profit_test_summary", "recommended_next_steps"] as const) assert.ok(key in result, key);
  assert.notEqual(result.engine_run_id, null);
  assert.equal(result.verification_result, "locally_valid");
  assert.equal(result.replay_status, "replay_consistent");
  assert.ok((result.integrity_score ?? 0) >= 90);
});

test("missing entitlement prevents engine and target action use", () => {
  const input = fixture();
  delete input.paid_use_entitlement;
  const result = runMachineToMachinePaidUseProfitTest(input);
  assert.equal(result.access_status, "paid_entitlement_required");
  assert.equal(result.engine_run_id, null);
  assert.equal(result.goal_status, "not_attempted");
  assert.equal(result.uses_consumed, 0);
  assert.equal(result.hypothetical_revenue_event_count, 0);
  assert.match(result.final_profit_test_summary, /pre-use payment gate/i);
});

test("repeat attempts consume bounded placeholder uses and expose revenue events", () => {
  const input = fixture();
  input.repeat_use_attempts = 8;
  input.paid_use_entitlement = { ...input.paid_use_entitlement!, uses_allowed: 3, uses_remaining: 3 };
  const result = runMachineToMachinePaidUseProfitTest(input);
  assert.equal(result.uses_consumed, 3);
  assert.equal(result.uses_remaining, 0);
  assert.equal(result.hypothetical_revenue_event_count, 3);
  assert.equal(result.repeat_use_approval_required_count, 2);
  assert.ok(result.recommended_next_steps.includes("renew_local_paid_use_placeholder_before_further_use"));
  assert.equal(result.action_executed, false);
});

test("exhausted entitlement requires another paid-use placeholder", () => {
  const input = fixture();
  input.paid_use_entitlement = { ...input.paid_use_entitlement!, uses_remaining: 0 };
  const result = runMachineToMachinePaidUseProfitTest(input);
  assert.equal(result.access_status, "paid_entitlement_required");
  assert.equal(result.engine_run_id, null);
});

test("entitlement helper is deterministic and cannot enable commerce", () => {
  const entitlement = createLocalPaidUseEntitlement({ source_id: "private@example.test",
    entitlement_status: "active_placeholder", paid_placeholder: true, billable_if_live: true,
    uses_allowed: 2, uses_remaining: 2, payment_enabled: true, billing_enabled: true,
    settlement_enabled: true, machine_to_machine_fee_enabled: true });
  assert.equal(entitlement.entitlement_status, "active_placeholder");
  assert.equal(entitlement.billable_if_live, true);
  assert.equal(entitlement.payment_enabled, false);
  assert.equal(entitlement.billing_enabled, false);
  assert.equal(entitlement.settlement_enabled, false);
  assert.equal(entitlement.machine_to_machine_fee_enabled, false);
  assert.doesNotMatch(entitlement.entitlement_id, /private|example/i);
  assert.equal(createMachineToMachineProfitTestId("same"), createMachineToMachineProfitTestId("same"));
});

test("result and summary keep every operational flag false", () => {
  const result = runMachineToMachinePaidUseProfitTest(fixture());
  const summary = summariseMachineToMachinePaidUseProfitTest(result);
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

test("private fields and values do not enter result or summary", () => {
  const input = fixture();
  Object.assign(input, { customer_name: "Private Person", api_key: "secret-key" });
  Object.assign(input.clearing_request, { bank_account: "private-account",
    private_document_text: "private-document" });
  const output = JSON.stringify(runMachineToMachinePaidUseProfitTest(input));
  for (const field of privateFields) assert.equal(output.includes(field), false, field);
  assert.doesNotMatch(output, /Private Person|secret-key|private-account|private-document/);
});

test("CLI accepts local JSON and supports pretty safe output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runMachineToMachinePaidUseProfitTestCli([fixturePath, "--pretty"],
    { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) });
  assert.equal(code, 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /\n  "profit_test_id"/);
  const output = JSON.parse(stdout[0] ?? "{}") as Record<string, unknown>;
  assert.equal(output.action_executed, false);
  assert.equal(output.payment_or_fee_triggered, false);
});

test("CLI safely rejects missing paths, bad JSON, and missing required objects", () => {
  const invalidPath = join(root, "m2m-profit-invalid.tmp.json");
  writeFileSync(invalidPath, "{invalid", "utf8");
  const cases: Array<[string[], string]> = [
    [[], "MISSING_INPUT_FILE"],
    [[join(root, "m2m-profit-missing.json")], "INPUT_FILE_UNREADABLE"],
    [[invalidPath], "INVALID_JSON"],
  ];
  const required = ["buyer_agent", "clearing_service_agent", "target_service_agent", "clearing_request"];
  const tempPaths: string[] = [invalidPath];
  for (const key of required) {
    const value = fixture() as unknown as Record<string, unknown>;
    delete value[key];
    const path = join(root, `m2m-profit-missing-${key}.tmp.json`);
    writeFileSync(path, JSON.stringify(value), "utf8");
    tempPaths.push(path);
    cases.push([[path], "INVALID_INPUT"]);
  }
  try {
    for (const [args, expected] of cases) {
      const stderr: string[] = [];
      const code = runMachineToMachinePaidUseProfitTestCli(args,
        { stdout: () => undefined, stderr: (value) => stderr.push(value) });
      assert.equal(code, 1);
      const error = JSON.parse(stderr[0] ?? "{}") as { error?: { code?: string } };
      assert.equal(error.error?.code, expected);
      for (const field of privateFields) assert.equal((stderr[0] ?? "").includes(field), false);
    }
  } finally { for (const path of tempPaths) rmSync(path, { force: true }); }
});

test("required docs and examples exist with all live-payment flags disabled", () => {
  const files = ["docs/machine-to-machine-paid-use-profit-test.md",
    "examples/machine-to-machine-paid-use-profit-test-input-draft.json",
    "examples/machine-to-machine-paid-use-profit-test-output-local.json",
    "examples/machine-to-machine-paid-use-profit-test-entitlement-required.json",
    "examples/machine-to-machine-paid-use-profit-test-repeat-use.json",
    "examples/machine-to-machine-paid-use-profit-test-private-data-rejected.json",
    "examples/machine-to-machine-paid-use-profit-test-live-payment-blocked.json"];
  for (const file of files) assert.equal(existsSync(join(root, file)), true, file);
  const blocked = JSON.parse(readFileSync(join(root,
    "examples/machine-to-machine-paid-use-profit-test-live-payment-blocked.json"), "utf8")) as Record<string, unknown>;
  for (const [key, value] of Object.entries(blocked)) {
    if (key.endsWith("_enabled")) assert.equal(value, false, key);
  }
});
