import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createCustomerTenantReadinessReport,
  createGatewayServer,
  getGatewayEntitlementStatus,
  readLocalCustomerTenantsFile,
  type CustomerTenantReadinessReport,
  type GatewayRequestLogEntry,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const examplePath = resolve("examples/customer-tenants/customer-tenants.example.json");

test("customer tenant readiness is versioned and all production commerce remains disabled", () => {
  const now = new Date("2026-06-28T12:00:00.000Z");
  const report = createCustomerTenantReadinessReport({ now });
  assert.equal(report.customer_tenant_readiness_version, "atg.customer-tenant-readiness.v1");
  assert.equal(report.generated_at, now.toISOString());
  assert.equal(report.production_customer_accounts_enabled, false);
  assert.equal(report.real_customer_data_enabled, false);
  assert.equal(report.billing_enabled, false);
  assert.equal(report.payment_processing_enabled, false);
  assert.equal(report.automatic_purchase_enabled, false);
  assert.equal(report.overall.customer_tenant_readiness_percent, 25);
});

test("account, tenant, and client mapping models expose planning concepts only", () => {
  const report = createCustomerTenantReadinessReport();
  assert.equal(report.account_model.supports_tenants, true);
  assert.equal(report.account_model.production_login_enabled, false);
  assert.equal(report.account_model.personal_data_collection_enabled, false);
  for (const concept of ["tenant_id", "account_id", "plan_code", "billing_status", "payment_status"]) {
    assert.ok(report.tenant_model.concepts.includes(concept), concept);
  }
  for (const concept of ["client_id", "tenant_id", "account_id", "usage_owner", "billing_owner"]) {
    assert.ok(report.client_mapping_model.concepts.includes(concept), concept);
  }
  assert.equal(report.client_mapping_model.production_mapping_enabled, false);
});

test("safe example tenant config is parseable and contains no personal data or secrets", () => {
  assert.equal(existsSync(examplePath), true);
  const result = readLocalCustomerTenantsFile(examplePath);
  assert.equal(result.tenants_file_found, true);
  assert.equal(result.tenant_count, 1);
  assert.equal(result.tenants[0]?.account_id, "acct_demo_placeholder");
  assert.equal(result.tenants[0]?.billing_status, "not_enabled");
  const source = readFileSync(examplePath, "utf8");
  assert.doesNotMatch(source, /@[A-Za-z0-9.-]+|api[_-]?key|password|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/i);
});

test("customer tenant readiness CLI supports JSON, output, and placeholder tenant config", () => {
  const json = spawnSync(process.execPath, [cliPath, "--customer-tenant-readiness", "--json"], {
    cwd: process.cwd(), encoding: "utf8",
  });
  assert.equal(json.status, 0);
  assert.equal(json.stderr, "");
  assert.equal((JSON.parse(json.stdout) as CustomerTenantReadinessReport).customer_tenant_readiness_version, "atg.customer-tenant-readiness.v1");

  const configured = spawnSync(process.execPath, [cliPath, "--customer-tenant-readiness", "--tenants-file", examplePath, "--json"], {
    cwd: process.cwd(), encoding: "utf8",
  });
  assert.equal(configured.status, 0);
  assert.equal((JSON.parse(configured.stdout) as CustomerTenantReadinessReport).local_tenant_config.tenant_count, 1);

  const directory = mkdtempSync(`${tmpdir()}\\atg-customer-tenant-cli-`);
  const outputPath = resolve(directory, "nested", "readiness.json");
  try {
    const output = spawnSync(process.execPath, [cliPath, "--customer-tenant-readiness", "--output", outputPath], {
      cwd: process.cwd(), encoding: "utf8",
    });
    assert.equal(output.status, 0);
    assert.equal(existsSync(outputPath), true);
    assert.equal((JSON.parse(readFileSync(outputPath, "utf8")) as CustomerTenantReadinessReport).billing_enabled, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("explicit missing tenant config fails clearly without creating an account", () => {
  const result = spawnSync(process.execPath, [cliPath, "--customer-tenant-readiness", "--tenants-file", "missing-customer-tenants.json", "--json"], {
    cwd: process.cwd(), encoding: "utf8",
  });
  assert.equal(result.status, 1);
  const body = JSON.parse(result.stdout) as { ok: boolean; error: { code: string } };
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "CUSTOMER_TENANT_READINESS_ERROR");
});

test("GET customer tenant readiness returns request ID and logs the request", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-customer-tenant-http-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({ gatewayLogPath: logPath });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/customer-tenant-readiness`);
    const body = await response.json() as CustomerTenantReadinessReport & { request_id: string };
    assert.equal(response.status, 200);
    assert.equal(body.customer_tenant_readiness_version, "atg.customer-tenant-readiness.v1");
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.production_customer_accounts_enabled, false);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as GatewayRequestLogEntry;
    assert.equal(entry.endpoint, "/v1/customer-tenant-readiness");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("entitlement ownership fields are backward compatible and commerce remains disabled", () => {
  const entitlement = getGatewayEntitlementStatus();
  assert.equal(entitlement.client_id, "local-anonymous");
  assert.equal(entitlement.tenant_id, null);
  assert.equal(entitlement.account_id, null);
  assert.equal(entitlement.billing_enabled, false);
  assert.equal(entitlement.payment_processing_enabled, false);
  assert.equal(entitlement.automatic_purchase_enabled, false);
  assert.equal(entitlement.upgrade.purchase_enabled, false);
});

test("customer tenant docs state the local privacy and account boundary", () => {
  const directory = resolve("docs/customer-tenant-readiness");
  const files = ["README.md", "customer-account-model.md", "tenant-client-mapping.md", "future-billing-relationship.md", "privacy-and-data-boundaries.md"];
  const source = files.map((file) => readFileSync(resolve(directory, file), "utf8")).join("\n");
  assert.match(source, /no real customer accounts|not real customer account management/i);
  assert.match(source, /no personal data|collects no personal data/i);
  assert.match(source, /no login or signup/i);
  assert.match(source, /Billing and payment processing are not enabled/i);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/);
});
