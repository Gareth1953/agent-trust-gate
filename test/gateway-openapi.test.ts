import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createGatewayOpenApiDocument,
  createGatewayServer,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

function contractParts() {
  const contract = createGatewayOpenApiDocument();
  return {
    contract,
    paths: contract.paths as Record<string, unknown>,
    components: contract.components as Record<string, unknown>,
  };
}

test("OpenAPI contract includes versions and every local gateway endpoint", () => {
  const { contract, paths } = contractParts();
  assert.equal(contract.openapi, "3.1.0");
  assert.equal(contract["x-atg-contract-version"], "atg.v1");
  assert.equal(contract["x-atg-gateway-api-version"], "atg.gateway.v1");
  for (const path of ["/v1/health", "/v1/decision", "/v1/approval-pack", "/v1/evidence-bundle", "/v1/openapi.json", "/v1/agent-manifest.json"]) {
    assert.ok(paths[path], `missing ${path}`);
  }
});

test("OpenAPI contract documents local headers, required schemas, and usage limit error", () => {
  const { contract, components } = contractParts();
  const serialized = JSON.stringify(contract);
  for (const schemaName of ["ActionDescriptor", "GatewayDecisionRequest", "GatewayApprovalPackRequest", "GatewayEvidenceBundleRequest", "ErrorResponse", "UsageInfo", "HealthResponse", "DecisionResponse", "ApprovalPackResponse", "EvidenceBundleResponse"]) {
    assert.ok((components.schemas as Record<string, unknown>)[schemaName], `missing ${schemaName}`);
  }
  assert.match(serialized, /X-ATG-Client-ID/);
  assert.match(serialized, /X-ATG-API-Key/);
  assert.match(serialized, /CLIENT_USAGE_LIMIT_EXCEEDED/);
  assert.match(serialized, /UnknownRoute/);
  assert.doesNotMatch(serialized, /quickstart-demo-key|replace-with-local-dev-key/);
});

test("tracked OpenAPI document stays aligned with the contract module", () => {
  const tracked = JSON.parse(readFileSync("docs/agent-trust-gate.openapi.json", "utf8"));
  assert.deepEqual(tracked, createGatewayOpenApiDocument());
});

test("GET /v1/openapi.json returns contract JSON without an API key", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-openapi-gateway-`);
  const gatewayLogPath = resolve(directory, "gateway-requests.jsonl");
  const server = createGatewayServer({
    requireApiKey: true,
    clients: [{ client_id: "test-client", api_key: "test-only-secret" }],
    gatewayLogPath,
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/openapi.json`);
    const body = await response.json() as Record<string, unknown>;
    assert.equal(response.status, 200);
    assert.equal(body.openapi, "3.1.0");
    assert.equal(body["x-atg-gateway-api-version"], "atg.gateway.v1");
    assert.match(response.headers.get("x-atg-request-id") ?? "", /^gw_[0-9a-f-]{36}$/);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(gatewayLogPath, "utf8").trim()) as {
      endpoint: string;
      method: string;
      status_code: number;
    };
    assert.equal(entry.endpoint, "/v1/openapi.json");
    assert.equal(entry.method, "GET");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI --openapi --json outputs parseable OpenAPI JSON", () => {
  const result = spawnSync(process.execPath, [cliPath, "--openapi", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal((JSON.parse(result.stdout) as { openapi: string }).openapi, "3.1.0");
});

test("CLI --openapi --output creates directories and writes JSON", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-openapi-`);
  const output = resolve(directory, "nested", "agent-trust-gate.openapi.json");
  try {
    const result = spawnSync(process.execPath, [cliPath, "--openapi", "--output", output], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(existsSync(output), true);
    assert.equal((JSON.parse(readFileSync(output, "utf8")) as { openapi: string }).openapi, "3.1.0");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
