import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { createGatewayServer } from "../src/index.js";

const directory = resolve("examples/mcp-adapter");
const toolsPath = resolve(directory, "agent-trust-gate-mcp-tools.json");
const adapterPath = resolve(directory, "node-mcp-style-adapter.mjs");
const readmePath = resolve(directory, "README.md");

test("MCP-style tool definitions are parseable and never execute actions", () => {
  const source = readFileSync(toolsPath, "utf8");
  const definition = JSON.parse(source) as {
    tools: Array<{ name: string; executes_actions: boolean; inputSchema: unknown }>;
    usage_model: { purchase_enabled: boolean; automatic_purchase_enabled: boolean; billing_enabled: boolean };
  };
  assert.deepEqual(definition.tools.map((tool) => tool.name), [
    "atg_health",
    "atg_decide",
    "atg_get_entitlement",
    "atg_get_commercial_readiness",
    "atg_get_hosted_readiness",
    "atg_get_security_readiness",
    "atg_get_rate_limit_status",
    "atg_get_monitoring_health",
    "atg_get_incident_response_readiness",
    "atg_create_approval_pack",
    "atg_create_evidence_bundle",
  ]);
  assert.equal(definition.tools.every((tool) => tool.executes_actions === false), true);
  assert.equal(definition.tools.every((tool) => typeof tool.inputSchema === "object"), true);
  assert.equal(definition.usage_model.purchase_enabled, false);
  assert.equal(definition.usage_model.automatic_purchase_enabled, false);
  assert.equal(definition.usage_model.billing_enabled, false);
});

test("MCP-style adapter and README document local-only safe operation", () => {
  assert.equal(existsSync(adapterPath), true);
  assert.equal(existsSync(readmePath), true);
  const adapter = readFileSync(adapterPath, "utf8");
  const readme = readFileSync(readmePath, "utf8");
  assert.match(adapter, /atg_health/);
  assert.match(adapter, /atg_decide/);
  assert.match(adapter, /atg_get_entitlement/);
  assert.match(adapter, /atg_get_commercial_readiness/);
  assert.match(adapter, /atg_get_hosted_readiness/);
  assert.match(adapter, /atg_get_security_readiness/);
  assert.match(adapter, /atg_get_rate_limit_status/);
  assert.match(adapter, /atg_get_monitoring_health/);
  assert.match(adapter, /atg_get_incident_response_readiness/);
  assert.match(adapter, /No action was executed/);
  assert.match(readme, /local-only/i);
  assert.match(readme, /not a production MCP server/i);
  assert.match(readme, /does not perform the proposed action/i);
});

test("manifest and MCP examples contain no raw real API keys", () => {
  const source = [toolsPath, adapterPath, readmePath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/);
});

test("Node MCP-style adapter dispatches health and decision tools locally", async () => {
  const temporaryDirectory = mkdtempSync(`${tmpdir()}\\atg-mcp-adapter-`);
  const server = createGatewayServer({
    gatewayLogPath: resolve(temporaryDirectory, "gateway.jsonl"),
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const module = await import(pathToFileURL(adapterPath).href) as {
      createMcpStyleAdapter(options: Record<string, unknown>): {
        callTool(name: string, input?: Record<string, unknown>): Promise<Record<string, unknown>>;
      };
    };
    const adapter = module.createMcpStyleAdapter({
      baseUrl: `http://127.0.0.1:${address.port}`,
      clientId: "mcp-test-agent",
    });
    const health = await adapter.callTool("atg_health");
    assert.equal(health.ok, true);
    assert.equal(health.client_id, "mcp-test-agent");

    const decision = await adapter.callTool("atg_decide", {
      action: {
        action_type: "public_post",
        description: "Test a synthetic public post through the local MCP adapter.",
        actor: "mcp-test-agent",
        target: "synthetic-public-channel",
        public_action: true,
        human_approval_status: "not_requested",
      },
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.human_approval_required, true);

    const entitlement = await adapter.callTool("atg_get_entitlement");
    assert.equal(entitlement.entitlement_status, "unlimited_local");
    assert.equal((entitlement.upgrade as { purchase_enabled: boolean }).purchase_enabled, false);

    const readiness = await adapter.callTool("atg_get_commercial_readiness");
    assert.equal(readiness.readiness_version, "atg.commercial-readiness.v1");

    const hosted = await adapter.callTool("atg_get_hosted_readiness");
    assert.equal(hosted.hosted_readiness_version, "atg.hosted-readiness.v1");
    assert.equal(hosted.production_ready, false);

    const security = await adapter.callTool("atg_get_security_readiness");
    assert.equal(security.security_readiness_version, "atg.security-readiness.v1");
    assert.equal(security.production_security_certified, false);

    const rateLimit = await adapter.callTool("atg_get_rate_limit_status");
    assert.equal(rateLimit.rate_limit_version, "atg.rate-limit.v1");

    const monitoring = await adapter.callTool("atg_get_monitoring_health");
    assert.equal(monitoring.monitoring_health_version, "atg.monitoring-health.v1");

    const incident = await adapter.callTool("atg_get_incident_response_readiness");
    assert.equal(incident.incident_response_version, "atg.incident-response.v1");
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
