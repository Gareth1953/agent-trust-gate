import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import test from "node:test";

import {
  createExactActionPrototypeServer,
  startExactActionPrototypeServer,
} from "../src/exact-action-trust-gateway-prototype-server.js";

async function withServer(
  run: (baseUrl: string, logPath: string) => Promise<void>,
  options: { maxRequests?: number; requireApiKey?: boolean } = {},
): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), "atg-exact-action-server-"));
  const logPath = join(directory, "requests.jsonl");
  const server = createExactActionPrototypeServer({
    logPath,
    ...(options.maxRequests === undefined ? {} : { maxRequests: options.maxRequests }),
    ...(options.requireApiKey === undefined ? {} : { requireApiKey: options.requireApiKey }),
    ...(options.requireApiKey === true ? {
      clients: [{ client_id: "buyer-demo", api_key: "synthetic-local-key" }],
    } : {}),
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(typeof address === "object" && address !== null);
  try {
    await run(`http://127.0.0.1:${address.port}`, logPath);
  } finally {
    server.close();
    await once(server, "close");
  }
}

async function post(baseUrl: string, path: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

test("buyer UI and health endpoint are served locally with hardening headers", async () => {
  await withServer(async (baseUrl) => {
    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    const pageSource = await page.text();
    assert.match(pageSource, /Exact Action Trust Gateway/);
    assert.match(pageSource, /Download JSON/);
    const app = await fetch(`${baseUrl}/app.js`);
    const appSource = await app.text();
    assert.match(appSource, /WHY ATG BLOCKED THIS ACTION/);
    assert.match(page.headers.get("content-security-policy") ?? "", /default-src 'self'/);
    assert.equal(page.headers.get("x-frame-options"), "DENY");
    const health = await fetch(`${baseUrl}/api/health`);
    const body = await health.json() as Record<string, unknown>;
    assert.equal(health.status, 200);
    assert.equal(body.localOnly, true);
    assert.equal(body.networkCallPerformed, false);
  });
});

test("scenario preview exposes synthetic buyer evidence before evaluation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/preview?scenario=allowed`);
    const body = await response.json() as any;
    assert.equal(response.status, 200);
    assert.equal(body.preview.human.displayName, "Alex Morgan");
    assert.equal(body.preview.agent.displayName, "Northstar Procurement Agent 04");
    assert.equal(body.preview.scenario.proposedAction.totalAmount, 23750);
    assert.equal(body.preview.evidence.offersInspected.length, 3);
  });
});

test("HTTP integration boundary evaluates, executes, replays and verifies a receipt", async () => {
  await withServer(async (baseUrl, logPath) => {
    const evaluated = await post(baseUrl, "/api/evaluate", { scenarioId: "allowed" });
    const evaluationBody = await evaluated.json() as any;
    assert.equal(evaluated.status, 200);
    assert.equal(evaluationBody.evaluation.decision, "GATEPASS_ISSUED");
    assert.equal(evaluationBody.evaluation.checks.length, 20);
    const runId = evaluationBody.evaluation.runId as string;

    const executed = await post(baseUrl, "/api/execute", { runId });
    const executionBody = await executed.json() as any;
    assert.equal(executionBody.result.execution.status, "SIMULATED_PURCHASE_COMPLETED");
    assert.equal(executionBody.result.execution.networkCallPerformed, false);

    const replayed = await post(baseUrl, "/api/replay", { runId });
    const replayBody = await replayed.json() as any;
    assert.equal(replayBody.result.execution.status, "BLOCKED_REPLAY");

    const verified = await post(baseUrl, "/api/verify-receipt", { runId });
    const verificationBody = await verified.json() as any;
    assert.equal(verificationBody.verification.verified, true);

    const log = readFileSync(logPath, "utf8");
    assert.match(log, /"endpoint":"\/api\/evaluate"/);
    assert.match(log, /"endpoint":"\/api\/execute"/);
    assert.match(log, /"endpoint":"\/api\/replay"/);
  });
});

test("overspend is refused through HTTP and cannot execute", async () => {
  await withServer(async (baseUrl) => {
    const evaluated = await post(baseUrl, "/api/evaluate", { scenarioId: "overspend" });
    const evaluationBody = await evaluated.json() as any;
    assert.equal(evaluationBody.evaluation.decision, "ACTION_REFUSED");
    assert.equal(evaluationBody.evaluation.gatePass, null);
    assert.equal(evaluationBody.evaluation.refusal.primaryFailureCode, "AUTHORITY_LIMIT_EXCEEDED");
    assert.equal(evaluationBody.evaluation.refusal.primaryFailure.requestedValue, 31000);
    assert.equal(evaluationBody.evaluation.refusal.primaryFailure.permittedValue, 25000);
    const executed = await post(baseUrl, "/api/execute", { runId: evaluationBody.evaluation.runId });
    const executionBody = await executed.json() as any;
    assert.equal(executionBody.result.execution.status, "BLOCKED_NO_GATEPASS");
    assert.equal(executionBody.result.execution.realOrderCreated, false);
  });
});

test("tampering scenario changes the execution amount and is blocked", async () => {
  await withServer(async (baseUrl) => {
    const evaluated = await post(baseUrl, "/api/evaluate", { scenarioId: "action_tampering" });
    const evaluationBody = await evaluated.json() as any;
    const executed = await post(baseUrl, "/api/execute", {
      runId: evaluationBody.evaluation.runId,
      useScenarioMutation: true,
    });
    const executionBody = await executed.json() as any;
    assert.equal(executionBody.result.execution.totalAmount, 24250);
    assert.equal(executionBody.result.execution.status, "BLOCKED_ACTION_MISMATCH");
    assert.equal(executionBody.result.execution.simulatedPurchaseReference, null);
  });
});

test("optional local API-key authentication reuses the gateway authentication control", async () => {
  await withServer(async (baseUrl) => {
    const unauthorized = await post(baseUrl, "/api/evaluate", { scenarioId: "allowed" });
    assert.equal(unauthorized.status, 401);
    const authorized = await post(baseUrl, "/api/evaluate", { scenarioId: "allowed" }, {
      "x-atg-client-id": "buyer-demo",
      "x-atg-api-key": "synthetic-local-key",
    });
    assert.equal(authorized.status, 200);
  }, { requireApiKey: true });
});

test("local rate limiter fails closed after the configured request count", async () => {
  await withServer(async (baseUrl) => {
    const first = await post(baseUrl, "/api/evaluate", { scenarioId: "allowed" });
    assert.equal(first.status, 200);
    const second = await post(baseUrl, "/api/evaluate", { scenarioId: "allowed" });
    const body = await second.json() as any;
    assert.equal(second.status, 429);
    assert.equal(body.error.code, "LOCAL_RATE_LIMIT_EXCEEDED");
  }, { maxRequests: 1 });
});

test("unknown scenario and missing execution run fail closed", async () => {
  await withServer(async (baseUrl) => {
    const unknown = await post(baseUrl, "/api/evaluate", { scenarioId: "unknown" });
    assert.equal(unknown.status, 400);
    const missingRun = await post(baseUrl, "/api/execute", { runId: "missing" });
    assert.equal(missingRun.status, 404);
  });
});

test("server start rejects non-loopback binding", () => {
  assert.throws(
    () => startExactActionPrototypeServer({ host: "0.0.0.0", port: 0 }),
    /must remain local-only/,
  );
});

test("malformed JSON returns a bounded local error", async () => {
  await withServer(async (baseUrl) => {
    const url = new URL("/api/evaluate", baseUrl);
    const response = await new Promise<{ status: number; body: string }>((resolvePromise, reject) => {
      const request = httpRequest({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: { "content-type": "application/json" },
      }, (incoming) => {
        const chunks: Buffer[] = [];
        incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
        incoming.on("end", () => resolvePromise({
          status: incoming.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf8"),
        }));
      });
      request.on("error", reject);
      request.end("{invalid-json");
    });
    assert.equal(response.status, 400);
    assert.match(response.body, /INVALID_JSON/);
  });
});
