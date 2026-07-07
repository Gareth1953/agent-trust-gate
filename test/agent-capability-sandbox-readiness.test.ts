import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { createLocalGatePassAuditReceipt } from "../src/local-gate-pass-receipt.js";
import type { LocalGatePassDemoInput } from "../src/local-gate-pass-demo.js";

const docs = [
  "docs/agent-readable-capability-statement.md",
  "docs/sandbox-readiness-pack.md",
  "docs/local-request-schema.md",
  "docs/local-response-receipt-schema.md",
  "docs/refusal-condition-matrix.md",
  "docs/integration-readiness-note.md",
] as const;
const examplePairs = [
  ["examples/sandbox-request-allow.json", "examples/sandbox-response-allow.json"],
  ["examples/sandbox-request-refuse.json", "examples/sandbox-response-refuse.json"],
  ["examples/sandbox-request-review.json", "examples/sandbox-response-review.json"],
] as const;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

test("capability and sandbox readiness documents exist and README links resolve", () => {
  const readme = read("README.md");
  for (const path of docs) {
    assert.equal(existsSync(path), true, path);
    assert.ok(readme.includes(path), path);
  }
});

test("capability statement declares every local-only operational flag", () => {
  const source = read(docs[0]);
  for (const declaration of [
    '"service_name": "Agent Trust Gate"',
    '"current_status": "local_demo_only"',
    '"live_payments": false',
    '"live_settlement": false',
    '"external_agent_contact": false',
    '"network_calls": false',
    '"action_execution": false',
  ]) assert.ok(source.includes(declaration), declaration);
  assert.match(source, /not a live endpoint, public agent registry entry, API service, or invitation/i);
});

test("sandbox request and receipt schema boundaries are explicit", () => {
  assert.match(read(docs[1]), /sandbox is not live/i);
  assert.match(read(docs[1]), /There is no network access, hosted service, external-agent access, payment, settlement, or action execution/i);
  assert.match(read(docs[2]), /not a production API contract/i);
  assert.match(read(docs[3]), /does not execute settlement, move money, call a service, or authorize a production transaction/i);
});

test("refusal matrix and integration note retain required boundaries", () => {
  const matrix = read(docs[4]);
  for (const condition of ["Missing mandate", "Stale evidence", "Missing verified intent", "Over limit"]) {
    assert.ok(matrix.includes(condition), condition);
  }
  assert.match(matrix, /No signed gate pass means no settlement/);
  const integration = read(docs[5]);
  assert.match(integration, /AUC is not integrated/i);
  assert.match(integration, /local developer\/demo readiness/i);
});

test("sandbox examples parse and responses exactly match local receipt logic", () => {
  for (const [requestPath, responsePath] of examplePairs) {
    const request = JSON.parse(read(requestPath)) as LocalGatePassDemoInput;
    const response = JSON.parse(read(responsePath)) as unknown;
    assert.deepEqual(response, createLocalGatePassAuditReceipt(request), responsePath);
  }
});

test("sandbox examples contain no URLs endpoints credentials secrets or real payment rails", () => {
  const unsafe = /https?:\/\/|endpoint[_-]?url|api[_-]?key|access[_-]?token|bearer|password|secret|wallet|x402|\bap2\b|stripe|checkout|bank[_-]?account|live[_ -]?api/i;
  for (const paths of examplePairs) {
    for (const path of paths) {
      const source = read(path);
      assert.doesNotThrow(() => JSON.parse(source), path);
      assert.doesNotMatch(source, unsafe, path);
    }
  }
});
