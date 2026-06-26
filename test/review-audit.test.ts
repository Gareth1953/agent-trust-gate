import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  auditReviewRecords,
  createHumanReviewRecord,
  listReviewRecords,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

function makeTempDirectory(): string {
  return mkdtempSync(`${tmpdir()}\\atg-review-audit-`);
}

function approvalPack(overrides: Record<string, unknown> = {}) {
  return {
    contract_version: "atg.v1",
    checked_at: "2026-06-26T08:00:00.000Z",
    action_type: "public_post",
    actor: "review-audit-agent",
    target: "public-channel",
    description: "Approval pack for review audit test.",
    allowed: false,
    risk_level: "high",
    human_approval_required: true,
    policy_profile: "regulated",
    regulated_policy: true,
    approval_reason: "Public actions require explicit human approval.",
    reasons: ["Public actions require explicit human approval."],
    human_review_status: "pending",
    human_reviewer: null,
    human_reviewed_at: null,
    approval_statement: "Human approval is required before this action may proceed.",
    safety_statement:
      "Agent Trust Gate does not execute actions. It returns a local trust decision for human review.",
    receipt_id: "atg_review_audit_test",
    ...overrides,
  };
}

function writeApprovalPack(directory: string, filename = "approval-pack.json"): string {
  const filePath = resolve(directory, filename);
  writeFileSync(filePath, JSON.stringify(approvalPack(), null, 2), "utf8");
  return filePath;
}

function writeReviewRecord(directory: string, filename: string, reviewRecord: unknown): void {
  writeFileSync(resolve(directory, filename), JSON.stringify(reviewRecord, null, 2), "utf8");
}

function validReviewRecord(directory: string, decision = "approved") {
  const approvalPackPath = writeApprovalPack(directory);
  return createHumanReviewRecord({
    approval_pack_path: approvalPackPath,
    decision,
    reviewer: "Gareth Price",
  });
}

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("audit reviews with no approval-reviews directory", () => {
  const directory = makeTempDirectory();

  try {
    const result = auditReviewRecords(resolve(directory, "approval-reviews"));
    assert.equal(result.summary.total_files, 0);
    assert.equal(result.summary.valid_review_records, 0);
    assert.deepEqual(result.records, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("audit reviews with valid review records", () => {
  const directory = makeTempDirectory();
  const reviewsDirectory = resolve(directory, "approval-reviews");

  try {
    mkdirSync(reviewsDirectory);
    writeReviewRecord(reviewsDirectory, "approved.json", validReviewRecord(directory, "approved"));
    writeReviewRecord(reviewsDirectory, "rejected.json", validReviewRecord(directory, "rejected"));
    writeReviewRecord(
      reviewsDirectory,
      "needs-more-info.json",
      validReviewRecord(directory, "needs_more_info"),
    );

    const result = auditReviewRecords(reviewsDirectory);
    assert.equal(result.summary.total_files, 3);
    assert.equal(result.summary.valid_review_records, 3);
    assert.equal(result.summary.approved_count, 1);
    assert.equal(result.summary.rejected_count, 1);
    assert.equal(result.summary.needs_more_info_count, 1);
    assert.equal(result.summary.regulated_policy_count, 3);
    assert.equal(result.summary.high_risk_count, 3);
    assert.deepEqual(result.summary.policy_profile_counts, { regulated: 3 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("list review records with valid review records", () => {
  const directory = makeTempDirectory();
  const reviewsDirectory = resolve(directory, "approval-reviews");

  try {
    mkdirSync(reviewsDirectory);
    writeReviewRecord(reviewsDirectory, "approved.json", validReviewRecord(directory));

    const [entry] = listReviewRecords(reviewsDirectory);
    assert.equal(entry?.status, "valid");
    assert.equal(entry?.human_decision, "approved");
    assert.equal(entry?.approval_pack_integrity_status, "match");
    assert.equal(entry?.original_action_type, "public_post");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("non-json files are ignored", () => {
  const directory = makeTempDirectory();
  const reviewsDirectory = resolve(directory, "approval-reviews");

  try {
    mkdirSync(reviewsDirectory);
    writeReviewRecord(reviewsDirectory, "approved.json", validReviewRecord(directory));
    writeFileSync(resolve(reviewsDirectory, "notes.txt"), "ignore me", "utf8");

    const result = auditReviewRecords(reviewsDirectory);
    assert.equal(result.summary.total_files, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("malformed review JSON is reported without crashing", () => {
  const directory = makeTempDirectory();
  const reviewsDirectory = resolve(directory, "approval-reviews");

  try {
    mkdirSync(reviewsDirectory);
    writeFileSync(resolve(reviewsDirectory, "bad.json"), "{ invalid json", "utf8");

    const result = auditReviewRecords(reviewsDirectory);
    assert.equal(result.summary.malformed_review_records_count, 1);
    assert.equal(result.records[0]?.status, "malformed");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("invalid review record is reported without crashing", () => {
  const directory = makeTempDirectory();
  const reviewsDirectory = resolve(directory, "approval-reviews");

  try {
    mkdirSync(reviewsDirectory);
    writeReviewRecord(reviewsDirectory, "invalid.json", { contract_version: "atg.v1" });

    const result = auditReviewRecords(reviewsDirectory);
    assert.equal(result.summary.invalid_review_records_count, 1);
    assert.equal(result.records[0]?.status, "invalid");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("approval pack hash mismatch is detected", () => {
  const directory = makeTempDirectory();
  const reviewsDirectory = resolve(directory, "approval-reviews");

  try {
    mkdirSync(reviewsDirectory);
    const record = validReviewRecord(directory);
    writeFileSync(record.approval_pack_path, JSON.stringify(approvalPack({ target: "changed" })));
    writeReviewRecord(reviewsDirectory, "mismatch.json", record);

    const result = auditReviewRecords(reviewsDirectory);
    assert.equal(result.summary.approval_pack_hash_mismatch_count, 1);
    assert.equal(result.records[0]?.approval_pack_integrity_status, "mismatch");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("missing approval pack is detected", () => {
  const directory = makeTempDirectory();
  const reviewsDirectory = resolve(directory, "approval-reviews");

  try {
    mkdirSync(reviewsDirectory);
    const record = {
      ...validReviewRecord(directory),
      approval_pack_path: resolve(directory, "missing-approval-pack.json"),
    };
    writeReviewRecord(reviewsDirectory, "missing.json", record);

    const result = auditReviewRecords(reviewsDirectory);
    assert.equal(result.summary.approval_pack_missing_count, 1);
    assert.equal(result.records[0]?.approval_pack_integrity_status, "missing");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("approval pack hash match count is detected", () => {
  const directory = makeTempDirectory();
  const reviewsDirectory = resolve(directory, "approval-reviews");

  try {
    mkdirSync(reviewsDirectory);
    const record = validReviewRecord(directory);
    const approvalPackBytes = Buffer.from(JSON.stringify(approvalPack(), null, 2), "utf8");
    assert.equal(
      record.approval_pack_hash,
      createHash("sha256").update(approvalPackBytes).digest("hex"),
    );
    writeReviewRecord(reviewsDirectory, "match.json", record);

    const result = auditReviewRecords(reviewsDirectory);
    assert.equal(result.summary.approval_pack_hash_match_count, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--audit-reviews --json outputs parseable JSON", () => {
  const result = runCli("--audit-reviews", "--json");

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const output = JSON.parse(result.stdout) as {
    contract_version: string;
    summary: { total_files: number };
  };
  assert.equal(output.contract_version, "atg.v1");
  assert.equal(typeof output.summary.total_files, "number");
});

test("--list-review-records --json outputs parseable JSON", () => {
  const result = runCli("--list-review-records", "--json");

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.ok(Array.isArray(JSON.parse(result.stdout)));
});

test("incompatible mode combinations return clear errors", () => {
  for (const args of [
    ["--audit-reviews", "--review-approval-pack", "approval-packs/example_approval_pack.json"],
    ["--list-review-records", "--review-approval-pack", "approval-packs/example_approval_pack.json"],
    ["--audit-reviews", "--batch", "examples/integrations"],
    ["--list-review-records", "--batch", "examples/integrations"],
    ["--audit-reviews", "examples/public-post.json"],
    ["--list-review-records", "examples/public-post.json"],
  ]) {
    const result = runCli(...args, "--json");
    assert.equal(result.status, 1, args.join(" "));
    const output = JSON.parse(result.stdout) as { error: { code: string } };
    assert.equal(output.error.code, "INCOMPATIBLE_REVIEW_AUDIT_MODE");
  }
});
