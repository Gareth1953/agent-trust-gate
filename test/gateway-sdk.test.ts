import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { createGatewayServer } from "../src/index.js";

const sdkDirectory = resolve("examples/gateway-sdk");
const files = {
  nodeClient: resolve(sdkDirectory, "agent-trust-gate-client.mjs"),
  nodeDemo: resolve(sdkDirectory, "node-sdk-demo.mjs"),
  powershellClient: resolve(sdkDirectory, "AgentTrustGateClient.ps1"),
  powershellDemo: resolve(sdkDirectory, "powershell-sdk-demo.ps1"),
  readme: resolve(sdkDirectory, "README.md"),
};

test("gateway SDK starter files exist", () => {
  for (const path of Object.values(files)) {
    assert.doesNotThrow(() => readFileSync(path, "utf8"), path);
  }
});

test("Node SDK wrapper exports the expected client operations", () => {
  const source = readFileSync(files.nodeClient, "utf8");
  assert.match(source, /export class AgentTrustGateClient/);
  assert.match(source, /export class AgentTrustGateError/);
  assert.match(source, /export function createAgentTrustGateClient/);
  for (const method of ["health", "decide", "createApprovalPack", "createEvidenceBundle", "openapi", "entitlement", "commercialReadiness", "hostedReadiness", "securityReadiness", "rateLimitStatus", "monitoringHealth", "incidentResponseReadiness", "customerTenantReadiness", "billingPaymentReadiness", "machinePurchasePolicyReadiness"]) {
    assert.match(source, new RegExp(`\\b${method}\\(`));
  }
});

test("PowerShell SDK wrapper defines the expected functions", () => {
  const source = readFileSync(files.powershellClient, "utf8");
  for (const functionName of ["New-AgentTrustGateClient", "Invoke-ATGHealth", "Invoke-ATGDecision", "Invoke-ATGApprovalPack", "Invoke-ATGEvidenceBundle", "Invoke-ATGOpenApi", "Invoke-ATGEntitlement", "Invoke-ATGCommercialReadiness", "Invoke-ATGHostedReadiness", "Invoke-ATGSecurityReadiness", "Invoke-ATGRateLimitStatus", "Invoke-ATGMonitoringHealth", "Invoke-ATGIncidentResponseReadiness", "Invoke-ATGCustomerTenantReadiness", "Invoke-ATGBillingPaymentReadiness", "Invoke-ATGMachinePurchasePolicyReadiness"]) {
    assert.match(source, new RegExp(`function ${functionName.replace("-", "\\-")}`));
  }
});

test("SDK wrappers contain no obvious real secrets", () => {
  const source = `${readFileSync(files.nodeClient, "utf8")}\n${readFileSync(files.powershellClient, "utf8")}`;
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(source, /ghp_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(source, /AKIA[0-9A-Z]{16}/);
  assert.doesNotMatch(source, /BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/);
  assert.doesNotMatch(source, /quickstart-demo-key/);
});

test("SDK demos explicitly avoid executing actions", () => {
  for (const path of [files.nodeDemo, files.powershellDemo]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /No action was executed/);
    assert.match(source, /REQUEST HUMAN/);
    assert.match(source, /BLOCK/);
    assert.match(source, /No purchase was made/);
  }
});

test("SDK README documents local-only safety and demo commands", () => {
  const source = readFileSync(files.readme, "utf8");
  assert.match(source, /not a published/i);
  assert.match(source, /local-only/i);
  assert.match(source, /never execute/i);
  assert.match(source, /node examples\/gateway-sdk\/node-sdk-demo\.mjs/);
  assert.match(source, /powershell -ExecutionPolicy Bypass/);
});

test("Node SDK wrapper calls the local gateway and surfaces JSON errors", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-sdk-`);
  const server = createGatewayServer({ gatewayLogPath: resolve(directory, "gateway.jsonl") });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;

  try {
    const sdk = await import(pathToFileURL(files.nodeClient).href) as {
      createAgentTrustGateClient(options: Record<string, unknown>): {
        health(): Promise<Record<string, unknown>>;
        decide(action: Record<string, unknown>): Promise<Record<string, unknown>>;
        openapi(): Promise<Record<string, unknown>>;
        entitlement(): Promise<Record<string, unknown>>;
        commercialReadiness(): Promise<Record<string, unknown>>;
        hostedReadiness(): Promise<Record<string, unknown>>;
        securityReadiness(): Promise<Record<string, unknown>>;
        rateLimitStatus(): Promise<Record<string, unknown>>;
        monitoringHealth(): Promise<Record<string, unknown>>;
        incidentResponseReadiness(): Promise<Record<string, unknown>>;
        customerTenantReadiness(): Promise<Record<string, unknown>>;
        billingPaymentReadiness(): Promise<Record<string, unknown>>;
        machinePurchasePolicyReadiness(): Promise<Record<string, unknown>>;
      };
    };
    const client = sdk.createAgentTrustGateClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      clientId: "sdk-test-agent",
    });

    const health = await client.health();
    assert.equal(health.ok, true);
    assert.equal(health.client_id, "sdk-test-agent");

    const openapi = await client.openapi();
    assert.equal(openapi.openapi, "3.1.0");

    const entitlement = await client.entitlement();
    assert.equal(entitlement.entitlement_version, "atg.entitlement.v1");

    const readiness = await client.commercialReadiness();
    assert.equal(readiness.readiness_version, "atg.commercial-readiness.v1");

    const hosted = await client.hostedReadiness();
    assert.equal(hosted.hosted_readiness_version, "atg.hosted-readiness.v1");

    const security = await client.securityReadiness();
    assert.equal(security.security_readiness_version, "atg.security-readiness.v1");

    const rateLimit = await client.rateLimitStatus();
    assert.equal(rateLimit.rate_limit_version, "atg.rate-limit.v1");

    const monitoring = await client.monitoringHealth();
    assert.equal(monitoring.monitoring_health_version, "atg.monitoring-health.v1");

    const incident = await client.incidentResponseReadiness();
    assert.equal(incident.incident_response_version, "atg.incident-response.v1");

    const customerTenant = await client.customerTenantReadiness();
    assert.equal(customerTenant.customer_tenant_readiness_version, "atg.customer-tenant-readiness.v1");

    const billingPayment = await client.billingPaymentReadiness();
    assert.equal(billingPayment.billing_payment_readiness_version, "atg.billing-payment-readiness.v1");
    const policy = await client.machinePurchasePolicyReadiness();
    assert.equal(policy.machine_purchase_policy_readiness_version,"atg.machine-purchase-policy-readiness.v1");

    await assert.rejects(
      client.decide({ action_type: "public_post" }),
      (error: unknown) => {
        const candidate = error as { status?: number; code?: string };
        return candidate.status === 400 && candidate.code === "INVALID_ACTION_DESCRIPTOR";
      },
    );
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    rmSync(directory, { recursive: true, force: true });
  }
});
