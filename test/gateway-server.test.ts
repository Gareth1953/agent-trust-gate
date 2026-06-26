import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createGatewayServer, createHumanReviewRecord } from "../src/index.js";

const publicPostAction = {
  action_type: "public_post",
  description: "Publish a project update on a public channel.",
  actor: "communications-agent",
  target: "public-channel",
  estimated_cost_gbp: 0,
  public_action: true,
  external_commitment: false,
  money_movement: false,
  legal_or_compliance_sensitive: false,
  customer_or_user_facing: true,
  evidence: ["Draft content is available for human review."],
  rollback_plan: "Delete the post and issue a correction if approved by a human.",
  human_approval_status: "not_requested",
};

async function withGateway<T>(callback: (baseUrl: string, address: AddressInfo) => Promise<T>): Promise<T> {
  const server = createGatewayServer();

  await new Promise<void>((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();
  assert.ok(address !== null && typeof address === "object");

  try {
    return await callback(`http://127.0.0.1:${address.port}`, address);
  } finally {
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => {
        if (error !== undefined) {
          rejectClose(error);
          return;
        }
        resolveClose();
      });
    });
  }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return await response.json() as Record<string, unknown>;
}

test("GET /v1/health returns ok JSON", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/health`);
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, "agent-trust-gate");
    assert.equal(body.contract_version, "atg.v1");
    assert.match(String(body.request_id), /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.mode, "local-gateway");
    assert.equal(typeof body.checked_at, "string");
  });
});

test("POST /v1/decision returns valid trust decision JSON", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      body: JSON.stringify(publicPostAction),
    });
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.contract_version, "atg.v1");
    assert.match(String(body.request_id), /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.allowed, false);
    assert.equal(body.risk_level, "high");
    assert.equal(body.human_approval_required, true);
    assert.equal(body.action_type, "public_post");
    assert.equal(body.actor, "communications-agent");
    assert.equal(body.target, "public-channel");
    assert.equal(body.policy_profile, "standard");
    assert.equal(body.gateway_mode, "local");
    assert.equal(
      body.safety_statement,
      "Agent Trust Gate returns local trust decisions only. It does not execute actions.",
    );
  });
});

test("POST /v1/decision with regulated policy includes regulated metadata", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      body: JSON.stringify({
        policy_profile: "regulated",
        action: publicPostAction,
      }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.policy_profile, "regulated");
    assert.equal(body.regulated_policy, true);
  });
});

test("POST /v1/decision rejects invalid action descriptor with JSON error", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      body: JSON.stringify({
        action_type: "public_post",
        actor: "communications-agent",
        target: "public-channel",
      }),
    });
    const body = await readJson(response);
    const error = body.error as { code: string; details: Array<{ field: string }> };

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.contract_version, "atg.v1");
    assert.equal(error.code, "INVALID_ACTION_DESCRIPTOR");
    assert.equal(error.details.some((detail) => detail.field === "description"), true);
  });
});

test("unknown route returns JSON 404", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/missing`);
    const body = await readJson(response);
    const error = body.error as { code: string };

    assert.equal(response.status, 404);
    assert.equal(body.ok, false);
    assert.equal(error.code, "NOT_FOUND");
  });
});

test("wrong method returns JSON error", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`);
    const body = await readJson(response);
    const error = body.error as { code: string };

    assert.equal(response.status, 405);
    assert.equal(body.ok, false);
    assert.equal(error.code, "METHOD_NOT_ALLOWED");
  });
});

test("POST /v1/approval-pack returns approval packet JSON", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/approval-pack`, {
      method: "POST",
      body: JSON.stringify({ action: publicPostAction }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.contract_version, "atg.v1");
    assert.equal(body.human_review_status, "pending");
    assert.equal(body.approval_pack_saved, false);
    assert.equal(body.action_type, "public_post");
  });
});

test("POST /v1/evidence-bundle returns evidence bundle JSON from example review record", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/evidence-bundle`, {
      method: "POST",
      body: JSON.stringify({
        review_record_path: "approval-reviews/example_review.json",
        save_evidence_bundle: false,
      }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.contract_version, "atg.v1");
    assert.equal(body.evidence_bundle_version, "atg.evidence.v1");
    assert.equal(body.evidence_bundle_saved, false);
    assert.equal(typeof body.action, "object");
    assert.equal(typeof body.trust_decision, "object");
  });
});

test("server binds to localhost in tests", async () => {
  await withGateway(async (_baseUrl, address) => {
    assert.equal(address.address, "127.0.0.1");
  });
});

test("POST /v1/evidence-bundle can save locally when requested", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-evidence-`);
  const approvalPackPath = resolve(directory, "approval-pack.json");
  const reviewPath = resolve(directory, "review.json");

  try {
    writeFileSync(
      approvalPackPath,
      JSON.stringify({
        contract_version: "atg.v1",
        checked_at: "2026-06-26T08:00:00.000Z",
        action_type: "public_post",
        actor: "gateway-test-agent",
        target: "public-channel",
        description: "Gateway evidence bundle approval pack.",
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
        receipt_id: "atg_gateway_test",
      }, null, 2),
      "utf8",
    );
    writeFileSync(
      reviewPath,
      JSON.stringify(createHumanReviewRecord({
        approval_pack_path: approvalPackPath,
        decision: "approved",
        reviewer: "Gareth Price",
      }), null, 2),
      "utf8",
    );

    await withGateway(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/v1/evidence-bundle`, {
        method: "POST",
        body: JSON.stringify({
          review_record_path: reviewPath,
          save_evidence_bundle: true,
        }),
      });
      const body = await readJson(response);

      assert.equal(response.status, 200);
      assert.equal(body.evidence_bundle_saved, true);
      assert.match(String(body.evidence_bundle_path), /^evidence-bundles[\\/]/);
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
