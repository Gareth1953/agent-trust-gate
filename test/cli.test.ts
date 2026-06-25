import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const cliPath = resolve("dist/src/cli.js");

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("CLI returns receipt JSON for a valid example", () => {
  const result = runCli("examples/low-risk-internal.json");

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");

  const receipt = JSON.parse(result.stdout) as {
    allowed: boolean;
    risk_level: string;
    receipt_id: string;
  };
  assert.equal(receipt.allowed, true);
  assert.equal(receipt.risk_level, "low");
  assert.match(receipt.receipt_id, /^atg_/);
});

test("CLI exits non-zero and prints usage when the argument is missing", () => {
  const result = runCli();

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Usage: npm run verify -- <path-to-action\.json>/);
});

test("CLI exits non-zero and reports invalid JSON", () => {
  const result = runCli("test/fixtures/invalid.json");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid JSON in action file/);
});
