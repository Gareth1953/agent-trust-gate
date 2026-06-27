import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createAgentIntegrationManifest,
  createGatewayServer,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

test("agent manifest exposes stable discovery, capabilities, and disabled commerce", () => {
  const manifest = createAgentIntegrationManifest();
  assert.equal(manifest.manifest_version, "atg.agent-manifest.v1");
  assert.equal(manifest.contract_version, "atg.v1");
  assert.equal(manifest.gateway_api_version, "atg.gateway.v1");
  assert.equal(manifest.openapi_url, "/v1/openapi.json");
  for (const capability of ["pre_action_trust_decision", "approval_pack_generation", "human_review_evidence", "evidence_bundle_export", "gateway_usage_metering", "local_client_allowances", "local_admin_summary", "agent_entitlement_status"]) {
    assert.ok(manifest.capabilities.includes(capability), capability);
  }
  assert.equal(manifest.tools.every((tool) => tool.executes_actions === false), true);
  assert.equal(manifest.tools.some((tool) => (
    tool.name === "atg_get_entitlement" &&
    tool.path === "/v1/entitlement" &&
    tool.http_method === "GET"
  )), true);
  assert.equal(manifest.usage_model.purchase_enabled, false);
  assert.equal(manifest.usage_model.automatic_purchase_enabled, false);
  assert.equal(manifest.usage_model.billing_enabled, false);
});

test("tracked agent manifest stays aligned and contains no raw secrets", () => {
  const path = resolve("docs/agent-trust-gate.agent-manifest.json");
  assert.equal(existsSync(path), true);
  const source = readFileSync(path, "utf8");
  assert.deepEqual(JSON.parse(source), createAgentIntegrationManifest());
  assert.doesNotMatch(source, /quickstart-demo-key|replace-with-local-dev-key|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/);
});

test("GET /v1/agent-manifest.json is open, parseable, traced, and logged", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-agent-manifest-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({
    requireApiKey: true,
    clients: [{ client_id: "manifest-test", api_key: "test-only-secret" }],
    gatewayLogPath: logPath,
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/agent-manifest.json`);
    const body = await response.json() as Record<string, unknown>;
    assert.equal(response.status, 200);
    assert.equal(body.manifest_version, "atg.agent-manifest.v1");
    assert.match(response.headers.get("x-atg-request-id") ?? "", /^gw_[0-9a-f-]{36}$/);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as { endpoint: string; status_code: number };
    assert.equal(entry.endpoint, "/v1/agent-manifest.json");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI --agent-manifest --json outputs parseable JSON", () => {
  const result = spawnSync(process.execPath, [cliPath, "--agent-manifest", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal((JSON.parse(result.stdout) as { manifest_version: string }).manifest_version, "atg.agent-manifest.v1");
});

test("CLI --agent-manifest --output creates directories and writes JSON", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-manifest-export-`);
  const output = resolve(directory, "nested", "agent-manifest.json");
  try {
    const result = spawnSync(process.execPath, [cliPath, "--agent-manifest", "--output", output], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    assert.equal(result.status, 0);
    assert.equal(existsSync(output), true);
    assert.equal((JSON.parse(readFileSync(output, "utf8")) as { manifest_version: string }).manifest_version, "atg.agent-manifest.v1");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
