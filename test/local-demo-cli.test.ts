import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const cli = resolve("dist/src/local-demo-cli.js");
const allowInput = resolve("examples/local-demo-low-risk-allow.json");
const refusalInput = resolve("examples/local-demo-no-mandate-refuse.json");

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

test("CLI processes allow and refusal examples with complete summaries", () => {
  const allow = runCli("--input", allowInput);
  assert.equal(allow.status, 0);
  assert.equal(allow.stderr, "");
  assert.match(allow.stdout, /Verdict: allow_signed_gate_pass/);
  assert.match(allow.stdout, /Receipt: signed_gate_pass/);
  assert.match(allow.stdout, /Settlement allowed: true/);
  assert.match(allow.stdout, /Failed checks: none/);
  assert.match(allow.stdout, /Reason codes: MANDATE_VALID/);

  const refusal = runCli("--input", refusalInput);
  assert.equal(refusal.status, 0);
  assert.match(refusal.stdout, /Verdict: refuse_no_mandate/);
  assert.match(refusal.stdout, /Receipt: refusal_receipt/);
  assert.match(refusal.stdout, /Settlement allowed: false/);
  assert.match(refusal.stdout, /Failed checks: mandate/);
  assert.match(refusal.stdout, /Reason codes: MANDATE_REQUIRED/);
});

test("summary-only omits full receipt and full mode prints receipt JSON", () => {
  const summary = runCli("--input", allowInput, "--summary-only");
  assert.equal(summary.status, 0);
  assert.doesNotMatch(summary.stdout, /"receipt_id"/);
  assert.doesNotMatch(summary.stdout, /"checks"/);

  const full = runCli("--input", allowInput, "--full");
  assert.equal(full.status, 0);
  const receipt = JSON.parse(full.stdout) as Record<string, unknown>;
  assert.equal(receipt.receipt_type, "signed_gate_pass");
  assert.equal(receipt.settlement_allowed, true);
  assert.equal(receipt.settlement_executed, false);
  assert.ok(receipt.checks);
});

test("save writes a parseable local receipt while retaining summary output", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-local-demo-cli-`);
  try {
    const output = resolve(directory, "receipt.json");
    const result = runCli("--input", refusalInput, "--save", output);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Verdict: refuse_no_mandate/);
    const receipt = JSON.parse(readFileSync(output, "utf8")) as Record<string, unknown>;
    assert.equal(receipt.receipt_type, "refusal_receipt");
    assert.equal(receipt.settlement_allowed, false);
    assert.equal(receipt.settlement_executed, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("missing paths unreadable files and malformed JSON fail safely", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-local-demo-errors-`);
  try {
    const marker = "PRIVATE_ERROR_MARKER";
    const malformed = resolve(directory, `${marker}.json`);
    writeFileSync(malformed, `{ "value": "${marker}"`);
    const cases = [
      [runCli(), "MISSING_INPUT_FILE"],
      [runCli("--input", resolve(directory, `${marker}-missing.json`)), "INPUT_FILE_UNREADABLE"],
      [runCli("--input", malformed), "INVALID_JSON"],
    ] as const;
    for (const [result, code] of cases) {
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, new RegExp(`Code: ${code}`));
      assert.doesNotMatch(result.stderr, new RegExp(marker));
      assert.match(result.stderr, /No action, payment, settlement, network call, or external contact occurred/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("all CLI verdicts keep settlement execution action and network activity disabled", () => {
  const names = [
    "local-demo-low-risk-allow.json",
    "local-demo-money-review.json",
    "local-demo-no-mandate-refuse.json",
    "local-demo-stale-evidence-refuse.json",
    "local-demo-over-limit-refuse.json",
  ];
  for (const name of names) {
    const result = runCli("--input", resolve(`examples/${name}`), "--full");
    assert.equal(result.status, 0, name);
    const receipt = JSON.parse(result.stdout) as {
      verdict: string;
      settlement_allowed: boolean;
      settlement_executed: boolean;
      audit_metadata: { network_call_performed: boolean; action_executed: boolean };
    };
    assert.equal(receipt.settlement_allowed, receipt.verdict === "allow_signed_gate_pass", name);
    assert.equal(receipt.settlement_executed, false, name);
    assert.equal(receipt.audit_metadata.network_call_performed, false, name);
    assert.equal(receipt.audit_metadata.action_executed, false, name);
  }
});

test("CLI source has no network client or action execution integration", () => {
  const source = readFileSync("src/local-demo-cli.ts", "utf8");
  assert.doesNotMatch(source, /node:(http|https|net|tls)|\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(source, /child_process|execSync|spawnSync/);
  assert.match(source, /createLocalGatePassAuditReceipt\(input\)/);
});
