import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createEvidenceBundle,
  createHumanReviewRecord,
  type EvidenceBundle,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const exampleReviewPath = resolve("approval-reviews/example_review.json");

function approvalPack(overrides: Record<string, unknown> = {}) {
  return {
    contract_version: "atg.v1",
    checked_at: "2026-06-26T08:00:00.000Z",
    action_type: "public_post",
    actor: "evidence-test-agent",
    target: "public-channel",
    description: "Evidence bundle approval pack.",
    allowed: false,
    risk_level: "high",
    human_approval_required: true,
    policy_profile: "standard",
    regulated_policy: false,
    approval_reason: "Public actions require explicit human approval.",
    reasons: ["Public actions require explicit human approval."],
    human_review_status: "pending",
    human_reviewer: null,
    human_reviewed_at: null,
    approval_statement: "Human approval is required before this action may proceed.",
    safety_statement:
      "Agent Trust Gate does not execute actions. It returns a local trust decision for human review.",
    receipt_id: "atg_evidence_test",
    ...overrides,
  };
}

function makeReviewFixture(): { directory: string; reviewPath: string; approvalPackPath: string } {
  const directory = mkdtempSync(`${tmpdir()}\\atg-evidence-`);
  const approvalPackPath = resolve(directory, "approval-pack.json");
  writeFileSync(approvalPackPath, JSON.stringify(approvalPack(), null, 2), "utf8");
  const reviewRecord = createHumanReviewRecord({
    approval_pack_path: approvalPackPath,
    decision: "approved",
    reviewer: "Gareth Price",
    review_note: "Reviewed for evidence bundle test.",
  });
  const reviewPath = resolve(directory, "review.json");
  writeFileSync(reviewPath, JSON.stringify(reviewRecord, null, 2), "utf8");
  return { directory, reviewPath, approvalPackPath };
}

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("evidence bundle generated from valid review record", () => {
  const fixture = makeReviewFixture();

  try {
    const bundle = createEvidenceBundle(fixture.reviewPath);
    assert.equal(bundle.contract_version, "atg.v1");
    assert.equal(bundle.evidence_bundle_version, "atg.evidence.v1");
    assert.equal(bundle.approval_pack_integrity_status, "match");
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("evidence bundle includes action, trust_decision, human_review, and timeline", () => {
  const fixture = makeReviewFixture();

  try {
    const bundle = createEvidenceBundle(fixture.reviewPath);
    assert.equal(bundle.action.action_type, "public_post");
    assert.equal(bundle.trust_decision.risk_level, "high");
    assert.equal(bundle.human_review.human_decision, "approved");
    assert.equal(bundle.timeline.checked_at, "2026-06-26T08:00:00.000Z");
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("missing approval pack gives integrity status missing without crashing", () => {
  const fixture = makeReviewFixture();

  try {
    rmSync(fixture.approvalPackPath, { force: true });
    const bundle = createEvidenceBundle(fixture.reviewPath);
    assert.equal(bundle.approval_pack_integrity_status, "missing");
    assert.equal(bundle.action.description, null);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("malformed linked approval pack gives mismatch without crashing", () => {
  const fixture = makeReviewFixture();

  try {
    writeFileSync(fixture.approvalPackPath, "{ invalid json", "utf8");
    const bundle = createEvidenceBundle(fixture.reviewPath);
    assert.equal(bundle.approval_pack_integrity_status, "mismatch");
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("malformed review record fails safely", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-evidence-bad-`);

  try {
    const reviewPath = resolve(directory, "bad-review.json");
    writeFileSync(reviewPath, "{ invalid json", "utf8");
    assert.throws(() => createEvidenceBundle(reviewPath), /Malformed review record JSON/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("invalid review record fails safely", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-evidence-invalid-`);

  try {
    const reviewPath = resolve(directory, "invalid-review.json");
    writeFileSync(reviewPath, JSON.stringify({ contract_version: "atg.v1" }), "utf8");
    assert.throws(() => createEvidenceBundle(reviewPath), /missing required fields/i);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("missing review record exits 1", () => {
  const result = runCli("--evidence-bundle", "approval-reviews/missing.json", "--json");
  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout) as { error: { code: string } };
  assert.equal(output.error.code, "INVALID_EVIDENCE_BUNDLE_INPUT");
});

test("--json output is parseable", () => {
  const result = runCli("--evidence-bundle", exampleReviewPath, "--json");
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const output = JSON.parse(result.stdout) as EvidenceBundle;
  assert.equal(output.evidence_bundle_version, "atg.evidence.v1");
});

test("--save-evidence-bundle creates local JSON file", async () => {
  const fixture = makeReviewFixture();

  try {
    const result = spawnSync(
      process.execPath,
      [cliPath, "--evidence-bundle", fixture.reviewPath, "--save-evidence-bundle", "--json"],
      {
        cwd: fixture.directory,
        encoding: "utf8",
      },
    );
    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout) as {
      evidence_bundle_saved: boolean;
      evidence_bundle_path: string;
    };
    assert.equal(output.evidence_bundle_saved, true);
    assert.match(output.evidence_bundle_path, /^evidence-bundles[\\/]/);

    const files = await readdir(resolve(fixture.directory, "evidence-bundles"));
    assert.equal(files.length, 1);
    const savedBundle = JSON.parse(
      await readFile(resolve(fixture.directory, "evidence-bundles", files[0] ?? ""), "utf8"),
    ) as EvidenceBundle;
    assert.equal(savedBundle.contract_version, "atg.v1");
    assert.equal(savedBundle.evidence_bundle_version, "atg.evidence.v1");
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("generated evidence bundle JSON files are ignored", () => {
  const result = spawnSync("git", ["check-ignore", "evidence-bundles/demo.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /evidence-bundles\/demo\.json/);
});

test("incompatible mode combinations return clear errors", () => {
  for (const args of [
    ["--evidence-bundle", exampleReviewPath, "examples/public-post.json"],
    ["--evidence-bundle", exampleReviewPath, "--batch", "examples/integrations"],
    ["--evidence-bundle", exampleReviewPath, "--review-approval-pack", "approval-packs/example_approval_pack.json"],
    ["--evidence-bundle", exampleReviewPath, "--audit"],
    ["--evidence-bundle", exampleReviewPath, "--audit-reviews"],
    ["--evidence-bundle", exampleReviewPath, "--list-review-records"],
    ["--evidence-bundle", exampleReviewPath, "--list-receipts"],
    ["--evidence-bundle", exampleReviewPath, "--contract"],
  ]) {
    const result = runCli(...args, "--json");
    assert.equal(result.status, 1, args.join(" "));
    const output = JSON.parse(result.stdout) as { error: { code: string } };
    assert.equal(output.error.code, "INVALID_EVIDENCE_BUNDLE_INPUT");
  }
});
