import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { reviewBatch } from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

function makeTempDirectory(): string {
  return mkdtempSync(`${tmpdir()}\\atg-batch-`);
}

function action(overrides: Record<string, unknown> = {}) {
  return {
    action_type: "local_file_update",
    actor: "batch-test-agent",
    target: "local-workspace",
    description: "Update a local test fixture.",
    estimated_cost_gbp: 0,
    public_action: false,
    external_commitment: false,
    money_movement: false,
    legal_or_compliance_sensitive: false,
    customer_or_user_facing: false,
    evidence: ["Batch test fixture."],
    rollback_plan: "Revert the local fixture.",
    human_approval_status: "not_requested",
    ...overrides,
  };
}

function writeJson(directory: string, filename: string, value: unknown): void {
  writeFileSync(resolve(directory, filename), JSON.stringify(value, null, 2), "utf8");
}

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("batch mode reads multiple valid JSON action descriptors", () => {
  const directory = makeTempDirectory();

  try {
    writeJson(directory, "allowed.json", action());
    writeJson(directory, "blocked.json", action({ public_action: true }));

    const result = reviewBatch(directory);

    assert.equal(result.summary.total_files, 2);
    assert.equal(result.summary.valid_actions, 2);
    assert.equal(result.results.every((entry) => entry.status === "valid"), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("batch mode ignores non-json files", () => {
  const directory = makeTempDirectory();

  try {
    writeJson(directory, "allowed.json", action());
    writeFileSync(resolve(directory, "notes.txt"), "not an action descriptor", "utf8");

    const result = reviewBatch(directory);

    assert.equal(result.summary.total_files, 1);
    assert.equal(result.results[0]?.filename, "allowed.json");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("batch mode reports malformed JSON without crashing", () => {
  const directory = makeTempDirectory();

  try {
    writeFileSync(resolve(directory, "bad.json"), "{ invalid json", "utf8");

    const result = reviewBatch(directory);

    assert.equal(result.summary.total_files, 1);
    assert.equal(result.summary.malformed_json_count, 1);
    assert.equal(result.results[0]?.status, "malformed");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("batch mode reports invalid action descriptor without crashing", () => {
  const directory = makeTempDirectory();

  try {
    writeJson(directory, "invalid.json", {
      action_type: "public_post",
      actor: "batch-test-agent",
      target: "public-channel",
    });

    const result = reviewBatch(directory);

    assert.equal(result.summary.invalid_actions, 1);
    assert.equal(result.results[0]?.status, "invalid");
    assert.equal(result.results[0]?.error?.code, "INVALID_ACTION_DESCRIPTOR");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("batch summary counts allowed, blocked, risk, and approval fields correctly", () => {
  const directory = makeTempDirectory();

  try {
    writeJson(directory, "allowed.json", action());
    writeJson(directory, "blocked.json", action({ public_action: true }));

    const result = reviewBatch(directory);

    assert.equal(result.summary.allowed_count, 1);
    assert.equal(result.summary.blocked_count, 1);
    assert.equal(result.summary.low_risk_count, 1);
    assert.equal(result.summary.high_risk_count, 1);
    assert.equal(result.summary.approval_required_count, 1);
    assert.deepEqual(result.summary.policy_profile_counts, { standard: 2 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("regulated batch includes regulated policy metadata", () => {
  const result = reviewBatch("examples/integrations", {
    policy_profile: "regulated",
  });

  assert.equal(result.summary.policy_profile_counts.regulated, 3);
  assert.equal(
    result.results
      .filter((entry) => entry.status === "valid")
      .every((entry) => entry.policy_profile === "regulated" && entry.regulated_policy === true),
    true,
  );
});

test("batch --json outputs parseable JSON", () => {
  const result = runCli("--batch", "examples/integrations", "--json");

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");

  const parsed = JSON.parse(result.stdout) as {
    ok: boolean;
    contract_version: string;
    summary: { total_files: number };
  };
  assert.equal(parsed.ok, true);
  assert.equal(parsed.contract_version, "atg.v1");
  assert.equal(parsed.summary.total_files, 3);
});

test("batch --json --fail-on-block exits 2 when valid action is blocked", () => {
  const result = runCli("--batch", "examples/integrations", "--json", "--fail-on-block");

  assert.equal(result.status, 2);
  assert.equal(result.stderr, "");

  const parsed = JSON.parse(result.stdout) as {
    summary: { blocked_count: number };
  };
  assert.equal(parsed.summary.blocked_count > 0, true);
});

test("missing batch directory exits 1", () => {
  const result = runCli("--batch", "examples/does-not-exist", "--json");

  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");

  const parsed = JSON.parse(result.stdout) as {
    ok: boolean;
    error: { code: string };
  };
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "BATCH_DIRECTORY_ERROR");
});

test("batch --save saves receipts only for valid action descriptors", async () => {
  const directory = makeTempDirectory();
  const previousCwd = process.cwd();

  try {
    mkdirSync(resolve(directory, "actions"));
    writeJson(resolve(directory, "actions"), "valid.json", action());
    writeJson(resolve(directory, "actions"), "invalid.json", {
      action_type: "local_file_update",
      actor: "batch-test-agent",
      target: "local-workspace",
    });

    const result = spawnSync(
      process.execPath,
      [cliPath, "--batch", "actions", "--save", "--json"],
      {
        cwd: directory,
        encoding: "utf8",
      },
    );

    assert.equal(previousCwd, process.cwd());
    assert.equal(result.status, 0);

    const parsed = JSON.parse(result.stdout) as {
      results: Array<{ status: string; receipt_saved?: boolean; receipt_path?: string }>;
    };
    assert.equal(
      parsed.results.find((entry) => entry.status === "valid")?.receipt_saved,
      true,
    );
    assert.equal(
      parsed.results.find((entry) => entry.status === "invalid")?.receipt_saved,
      undefined,
    );

    const savedReceipts = await readdir(resolve(directory, "receipts"));
    assert.equal(savedReceipts.length, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
