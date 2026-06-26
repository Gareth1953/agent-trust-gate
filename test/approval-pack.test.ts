import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createApprovalPack, verifyBeforeAction } from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const lowRiskExamplePath = resolve("examples/low-risk-internal.json");
const publicPostExamplePath = resolve("examples/public-post.json");

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("approval packet generated for action requiring approval", () => {
  const receipt = verifyBeforeAction({
    action_type: "public_post",
    actor: "test-agent",
    target: "public-channel",
    description: "Draft a public post.",
    public_action: true,
    customer_or_user_facing: true,
    rollback_plan: "Do not publish automatically.",
  });

  const approvalPack = createApprovalPack(receipt);

  assert.equal(approvalPack.contract_version, "atg.v1");
  assert.equal(approvalPack.human_approval_required, true);
  assert.equal(approvalPack.human_review_status, "pending");
  assert.match(approvalPack.approval_statement, /Human approval is required/);
});

test("approval packet includes pending human review fields", () => {
  const approvalPack = createApprovalPack(
    verifyBeforeAction({
      action_type: "public_post",
      actor: "test-agent",
      target: "public-channel",
      description: "Draft a public post.",
      public_action: true,
      rollback_plan: "Do not publish automatically.",
    }),
  );

  assert.equal(approvalPack.human_reviewer, null);
  assert.equal(approvalPack.human_reviewed_at, null);
  assert.equal(approvalPack.human_review_status, "pending");
});

test("regulated approval packet includes regulated policy metadata", () => {
  const approvalPack = createApprovalPack(
    verifyBeforeAction(
      {
        action_type: "public_post",
        actor: "test-agent",
        target: "public-channel",
        description: "Draft a public post.",
        public_action: true,
        rollback_plan: "Do not publish automatically.",
      },
      { policy_profile: "regulated" },
    ),
  );

  assert.equal(approvalPack.policy_profile, "regulated");
  assert.equal(approvalPack.regulated_policy, true);
});

test("--approval-pack --json outputs parseable JSON", () => {
  const result = runCli(publicPostExamplePath, "--approval-pack", "--json");

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");

  const approvalPack = JSON.parse(result.stdout) as {
    contract_version: string;
    human_review_status: string;
    approval_pack_saved: boolean;
  };
  assert.equal(approvalPack.contract_version, "atg.v1");
  assert.equal(approvalPack.human_review_status, "pending");
  assert.equal(approvalPack.approval_pack_saved, false);
});

test("--save-approval-pack creates local JSON file", async () => {
  const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-approval-pack-`);

  try {
    const result = spawnSync(
      process.execPath,
      [cliPath, publicPostExamplePath, "--approval-pack", "--save-approval-pack", "--json"],
      {
        cwd: tempDirectory,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");

    const output = JSON.parse(result.stdout) as {
      approval_pack_saved: boolean;
      approval_pack_path: string;
    };
    assert.equal(output.approval_pack_saved, true);
    assert.match(output.approval_pack_path, /^approval-packs[\\/]/);

    const files = await readdir(resolve(tempDirectory, "approval-packs"));
    assert.equal(files.length, 1);

    const savedApprovalPack = JSON.parse(
      await readFile(resolve(tempDirectory, "approval-packs", files[0] ?? ""), "utf8"),
    ) as { contract_version: string };
    assert.equal(savedApprovalPack.contract_version, "atg.v1");
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("approval packet for action not requiring approval uses not_required", () => {
  const result = runCli(lowRiskExamplePath, "--approval-pack", "--json");

  assert.equal(result.status, 0);

  const approvalPack = JSON.parse(result.stdout) as {
    human_approval_required: boolean;
    human_review_status: string;
    approval_statement: string;
  };
  assert.equal(approvalPack.human_approval_required, false);
  assert.equal(approvalPack.human_review_status, "not_required");
  assert.match(approvalPack.approval_statement, /not required/i);
});

test("approval-packs generated JSON files are ignored", () => {
  const result = spawnSync("git", ["check-ignore", "approval-packs/demo.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /approval-packs\/demo\.json/);
});

test("invalid input with --approval-pack --json returns parseable JSON error", () => {
  const result = runCli("test/fixtures/invalid.json", "--approval-pack", "--json");

  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");

  const output = JSON.parse(result.stdout) as {
    ok: boolean;
    contract_version: string;
    error: { code: string };
  };
  assert.equal(output.ok, false);
  assert.equal(output.contract_version, "atg.v1");
  assert.equal(output.error.code, "INVALID_ACTION_JSON");
});

test("batch approval pack mode nests approval packets for valid results", () => {
  const result = runCli("--batch", "examples/integrations", "--approval-pack", "--json");

  assert.equal(result.status, 0);

  const output = JSON.parse(result.stdout) as {
    results: Array<{ status: string; approval_packet?: { contract_version: string } }>;
  };
  assert.equal(
    output.results
      .filter((entry) => entry.status === "valid")
      .every((entry) => entry.approval_packet?.contract_version === "atg.v1"),
    true,
  );
});
