import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

test("CLI audit mode prints a receipt audit summary without requiring an action file", () => {
  const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-cli-audit-`);

  try {
    const result = spawnSync(process.execPath, [cliPath, "--audit"], {
      cwd: tempDirectory,
      encoding: "utf8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");

    const audit = JSON.parse(result.stdout) as {
      summary: { total_receipts: number; malformed_receipts_count: number };
      receipts: unknown[];
    };
    assert.equal(audit.summary.total_receipts, 0);
    assert.equal(audit.summary.malformed_receipts_count, 0);
    assert.deepEqual(audit.receipts, []);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("CLI list receipts mode marks malformed receipts without crashing", () => {
  const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-cli-list-`);

  try {
    mkdirSync(resolve(tempDirectory, "receipts"));
    writeFileSync(resolve(tempDirectory, "receipts", "bad.json"), "{ invalid json");

    const result = spawnSync(process.execPath, [cliPath, "--list-receipts"], {
      cwd: tempDirectory,
      encoding: "utf8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");

    const entries = JSON.parse(result.stdout) as Array<{
      filename: string;
      status: string;
    }>;
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.filename, "bad.json");
    assert.equal(entries[0]?.status, "malformed");
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("CLI rejects an unknown policy profile clearly", () => {
  const result = runCli("examples/low-risk-internal.json", "--policy", "unknown");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown policy profile "unknown"/);
});

test("CLI --save includes the selected policy profile in the saved receipt", async () => {
  const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-cli-policy-`);

  try {
    const result = spawnSync(
      process.execPath,
      [cliPath, lowRiskExamplePath, "--policy", "regulated", "--save"],
      {
        cwd: tempDirectory,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0);

    const files = await readdir(resolve(tempDirectory, "receipts"));
    const [fileName] = files;
    assert.ok(fileName);

    const savedReceipt = JSON.parse(
      await readFile(resolve(tempDirectory, "receipts", fileName), "utf8"),
    ) as {
      policy_profile: string;
      regulated_policy: boolean;
      policy_notes: string[];
    };

    assert.equal(savedReceipt.policy_profile, "regulated");
    assert.equal(savedReceipt.regulated_policy, true);
    assert.match(savedReceipt.policy_notes.join(" "), /regulated-style policy/i);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});
