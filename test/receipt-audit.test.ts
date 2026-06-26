import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { auditReceipts, listReceipts } from "../src/receipt-audit.js";
import type { RiskLevel } from "../src/types.js";

function makeTempDirectory(): string {
  return mkdtempSync(`${tmpdir()}\\atg-audit-`);
}

function receipt(overrides: {
  receipt_id: string;
  allowed: boolean;
  risk_level: RiskLevel;
  human_approval_required: boolean;
}) {
  return {
    allowed: overrides.allowed,
    risk_level: overrides.risk_level,
    human_approval_required: overrides.human_approval_required,
    approval_reason: null,
    checks: [],
    receipt_id: overrides.receipt_id,
    timestamp: "2026-06-26T10:00:00.000Z",
    input_summary: {
      action_type: "test_action",
      description: "Test receipt",
      actor: "test-agent",
      target: "local-target",
      estimated_cost_gbp: 0,
      public_action: false,
      external_commitment: false,
      money_movement: false,
      legal_or_compliance_sensitive: false,
      customer_or_user_facing: false,
      evidence_count: 1,
      has_rollback_plan: true,
      human_approval_status: "not_requested",
    },
    recommended_next_step: "Retain this receipt.",
    limitations: [],
  };
}

test("audit summary handles a missing receipts directory", () => {
  const tempDirectory = makeTempDirectory();

  try {
    const result = auditReceipts(resolve(tempDirectory, "receipts"));

    assert.deepEqual(result.summary, {
      total_receipts: 0,
      allowed_count: 0,
      blocked_count: 0,
      high_risk_count: 0,
      medium_risk_count: 0,
      low_risk_count: 0,
      approval_required_count: 0,
      malformed_receipts_count: 0,
    });
    assert.deepEqual(result.receipts, []);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("audit summary counts valid receipts and ignores non-json files", () => {
  const tempDirectory = makeTempDirectory();
  const receiptsDirectory = resolve(tempDirectory, "receipts");

  try {
    mkdirSync(receiptsDirectory);
    writeFileSync(
      resolve(receiptsDirectory, "low.json"),
      JSON.stringify(
        receipt({
          receipt_id: "atg_low",
          allowed: true,
          risk_level: "low",
          human_approval_required: false,
        }),
      ),
    );
    writeFileSync(
      resolve(receiptsDirectory, "high.json"),
      JSON.stringify(
        receipt({
          receipt_id: "atg_high",
          allowed: false,
          risk_level: "high",
          human_approval_required: true,
        }),
      ),
    );
    writeFileSync(resolve(receiptsDirectory, ".gitkeep"), "");

    const result = auditReceipts(receiptsDirectory);

    assert.equal(result.summary.total_receipts, 2);
    assert.equal(result.summary.allowed_count, 1);
    assert.equal(result.summary.high_risk_count, 1);
    assert.equal(result.summary.low_risk_count, 1);
    assert.equal(result.summary.approval_required_count, 1);
    assert.equal(result.summary.malformed_receipts_count, 0);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("audit summary counts malformed receipt JSON without throwing", () => {
  const tempDirectory = makeTempDirectory();
  const receiptsDirectory = resolve(tempDirectory, "receipts");

  try {
    mkdirSync(receiptsDirectory);
    writeFileSync(resolve(receiptsDirectory, "bad.json"), "{ invalid json");

    const result = auditReceipts(receiptsDirectory);
    const entries = listReceipts(receiptsDirectory);

    assert.equal(result.summary.total_receipts, 1);
    assert.equal(result.summary.malformed_receipts_count, 1);
    assert.equal(entries[0]?.status, "malformed");
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});
