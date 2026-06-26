import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createApprovalPack,
  createHumanReviewRecord,
  verifyBeforeAction,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const exampleApprovalPackPath = resolve("approval-packs/example_approval_pack.json");

function approvalPack() {
  return createApprovalPack(
    verifyBeforeAction({
      action_type: "public_post",
      actor: "test-agent",
      target: "public-channel",
      description: "Draft a public post.",
      public_action: true,
      rollback_plan: "Do not publish automatically.",
    }),
  );
}

function writeApprovalPack(directory: string, filename = "approval-pack.json"): string {
  const filePath = resolve(directory, filename);
  writeFileSync(filePath, JSON.stringify(approvalPack(), null, 2), "utf8");
  return filePath;
}

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

for (const decision of ["approved", "rejected", "needs_more_info"] as const) {
  test(`${decision} review record generated`, () => {
    const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-review-`);

    try {
      const approvalPackPath = writeApprovalPack(tempDirectory);
      const reviewRecord = createHumanReviewRecord({
        approval_pack_path: approvalPackPath,
        decision,
        reviewer: "Gareth Price",
      });

      assert.equal(reviewRecord.human_decision, decision);
      assert.equal(reviewRecord.human_review_status, decision);
      assert.equal(reviewRecord.human_reviewer, "Gareth Price");
      assert.equal(reviewRecord.review_record_version, "atg.review.v1");
    } finally {
      rmSync(tempDirectory, { recursive: true, force: true });
    }
  });
}

test("missing reviewer fails", () => {
  const result = runCli(
    "--review-approval-pack",
    exampleApprovalPackPath,
    "--decision",
    "approved",
    "--json",
  );

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout) as {
    error: { code: string; details: Array<{ field: string }> };
  };
  assert.equal(output.error.code, "INVALID_HUMAN_REVIEW");
  assert.equal(output.error.details.some((detail) => detail.field === "reviewer"), true);
});

test("empty reviewer fails", () => {
  const result = runCli(
    "--review-approval-pack",
    exampleApprovalPackPath,
    "--decision",
    "approved",
    "--reviewer",
    " ",
    "--json",
  );

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout) as {
    error: { code: string; details: Array<{ field: string }> };
  };
  assert.equal(output.error.code, "INVALID_HUMAN_REVIEW");
  assert.equal(output.error.details.some((detail) => detail.field === "reviewer"), true);
});

test("unknown decision fails", () => {
  const result = runCli(
    "--review-approval-pack",
    exampleApprovalPackPath,
    "--decision",
    "maybe",
    "--reviewer",
    "Gareth Price",
    "--json",
  );

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout) as {
    error: { code: string; details: Array<{ field: string }> };
  };
  assert.equal(output.error.code, "INVALID_HUMAN_REVIEW");
  assert.equal(output.error.details.some((detail) => detail.field === "decision"), true);
});

test("missing approval pack file fails", () => {
  const result = runCli(
    "--review-approval-pack",
    "approval-packs/missing.json",
    "--decision",
    "approved",
    "--reviewer",
    "Gareth Price",
    "--json",
  );

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout) as { error: { code: string } };
  assert.equal(output.error.code, "INVALID_HUMAN_REVIEW");
});

test("malformed approval pack JSON fails", () => {
  const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-review-bad-`);

  try {
    const badPath = resolve(tempDirectory, "bad.json");
    writeFileSync(badPath, "{ invalid json", "utf8");

    const result = runCli(
      "--review-approval-pack",
      badPath,
      "--decision",
      "approved",
      "--reviewer",
      "Gareth Price",
      "--json",
    );

    assert.equal(result.status, 1);
    const output = JSON.parse(result.stdout) as { error: { code: string } };
    assert.equal(output.error.code, "INVALID_HUMAN_REVIEW");
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("approval pack hash is included", async () => {
  const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-review-hash-`);

  try {
    const approvalPackPath = writeApprovalPack(tempDirectory);
    const bytes = await readFile(approvalPackPath);
    const expectedHash = createHash("sha256").update(bytes).digest("hex");

    const reviewRecord = createHumanReviewRecord({
      approval_pack_path: approvalPackPath,
      decision: "approved",
      reviewer: "Gareth Price",
    });

    assert.equal(reviewRecord.approval_pack_hash, expectedHash);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("--json output is parseable", () => {
  const result = runCli(
    "--review-approval-pack",
    exampleApprovalPackPath,
    "--decision",
    "approved",
    "--reviewer",
    "Gareth Price",
    "--json",
  );

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");

  const output = JSON.parse(result.stdout) as {
    contract_version: string;
    review_record_version: string;
    human_decision: string;
  };
  assert.equal(output.contract_version, "atg.v1");
  assert.equal(output.review_record_version, "atg.review.v1");
  assert.equal(output.human_decision, "approved");
});

test("--save-review-record creates local JSON file", async () => {
  const tempDirectory = mkdtempSync(`${tmpdir()}\\atg-review-save-`);

  try {
    const approvalPackPath = writeApprovalPack(tempDirectory);
    const originalContents = await readFile(approvalPackPath, "utf8");

    const result = spawnSync(
      process.execPath,
      [
        cliPath,
        "--review-approval-pack",
        approvalPackPath,
        "--decision",
        "approved",
        "--reviewer",
        "Gareth Price",
        "--save-review-record",
        "--json",
      ],
      {
        cwd: tempDirectory,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout) as {
      review_record_saved: boolean;
      review_record_path: string;
    };
    assert.equal(output.review_record_saved, true);
    assert.match(output.review_record_path, /^approval-reviews[\\/]/);

    const files = await readdir(resolve(tempDirectory, "approval-reviews"));
    assert.equal(files.length, 1);
    const savedReview = JSON.parse(
      await readFile(resolve(tempDirectory, "approval-reviews", files[0] ?? ""), "utf8"),
    ) as { contract_version: string; review_record_version: string };
    assert.equal(savedReview.contract_version, "atg.v1");
    assert.equal(savedReview.review_record_version, "atg.review.v1");

    assert.equal(await readFile(approvalPackPath, "utf8"), originalContents);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("generated approval review JSON files are ignored", () => {
  const result = spawnSync("git", ["check-ignore", "approval-reviews/demo.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /approval-reviews\/demo\.json/);
});

test("batch and review approval pack cannot be combined", () => {
  const result = runCli(
    "--batch",
    "examples/integrations",
    "--review-approval-pack",
    exampleApprovalPackPath,
    "--decision",
    "approved",
    "--reviewer",
    "Gareth Price",
    "--json",
  );

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout) as { error: { code: string } };
  assert.equal(output.error.code, "UNSUPPORTED_REVIEW_MODE");
});
