import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const cliPath = resolve("dist/src/cli.js");
const lowRiskExamplePath = resolve("examples/low-risk-internal.json");

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

test("CLI --save writes a receipt to a local receipts archive", async () => {
  const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-cli-`);

  try {
    const result = spawnSync(process.execPath, [cliPath, lowRiskExamplePath, "--save"], {
      cwd: tempDirectory,
      encoding: "utf8",
    });

    assert.equal(result.status, 0);
    assert.match(result.stderr, /Saved receipt to receipts/);

    const files = await readdir(resolve(tempDirectory, "receipts"));
    assert.equal(files.length, 1);
    const [fileName] = files;
    assert.ok(fileName);
    assert.match(fileName, /^20\d{6}T\d{6}Z_atg_[0-9a-f-]{36}\.json$/);

    const savedReceipt = JSON.parse(
      await readFile(resolve(tempDirectory, "receipts", fileName), "utf8"),
    ) as { allowed: boolean; receipt_id: string };
    const printedReceipt = JSON.parse(result.stdout) as {
      allowed: boolean;
      receipt_id: string;
    };

    assert.equal(savedReceipt.allowed, true);
    assert.equal(savedReceipt.receipt_id, printedReceipt.receipt_id);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});
