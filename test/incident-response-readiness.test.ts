import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createGatewayServer,
  createIncidentRecordTemplate,
  createIncidentResponseReadinessReport,
  type GatewayRequestLogEntry,
  type IncidentRecordTemplate,
  type IncidentResponseReadinessReport,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

test("incident readiness is versioned and keeps production services disabled", () => {
  const now = new Date("2026-06-28T12:00:00.000Z");
  const report = createIncidentResponseReadinessReport(now);
  assert.equal(report.incident_response_version, "atg.incident-response.v1");
  assert.equal(report.generated_at, now.toISOString());
  assert.equal(report.production_incident_response_enabled, false);
  assert.equal(report.external_alerting_enabled, false);
  assert.equal(report.customer_notification_automation_enabled, false);
  assert.equal(report.overall.incident_response_readiness_percent, 30);
});

test("incident readiness includes severity, checks, containment, recovery, and operational gates", () => {
  const report = createIncidentResponseReadinessReport();
  assert.deepEqual(report.severity_model.map((item) => item.id), [
    "sev0_critical",
    "sev1_high",
    "sev2_medium",
    "sev3_low",
  ]);
  for (const id of [
    "incident_response_template_available",
    "severity_model_available",
    "external_alerting_missing",
    "customer_notification_process_missing",
  ]) {
    assert.ok(report.checks.some((check) => check.id === id), id);
  }
  assert.match(report.containment_steps.join("\n"), /rotate suspected exposed keys/i);
  assert.match(report.recovery_steps.join("\n"), /rerun tests/i);
  assert.match(report.required_before_public_hosting.join("\n"), /named incident owner/i);
  assert.match(report.required_before_public_hosting.join("\n"), /external alerting/i);
  assert.match(report.recommended_operational_controls.join("\n"), /incident timeline record/i);
});

test("blank incident record is local, deterministic in shape, and non-operational", () => {
  const now = new Date("2026-06-28T12:00:00.000Z");
  const template = createIncidentRecordTemplate(now);
  assert.equal(template.incident_record_version, "atg.incident-record.v1");
  assert.equal(template.created_at, now.toISOString());
  assert.equal(template.incident_id, "local-incident-placeholder");
  assert.equal(template.severity, "sev2_medium");
  assert.equal(template.status, "draft");
  assert.deepEqual(template.timeline, []);
  assert.match(template.safety_statement, /does not notify customers/i);
});

test("incident readiness CLI JSON and output modes are parseable", () => {
  const json = spawnSync(process.execPath, [cliPath, "--incident-response-readiness", "--json"], {
    cwd: process.cwd(), encoding: "utf8",
  });
  assert.equal(json.status, 0);
  assert.equal(json.stderr, "");
  assert.equal((JSON.parse(json.stdout) as IncidentResponseReadinessReport).incident_response_version, "atg.incident-response.v1");

  const directory = mkdtempSync(`${tmpdir()}\\atg-incident-readiness-cli-`);
  const outputPath = resolve(directory, "nested", "readiness.json");
  try {
    const output = spawnSync(process.execPath, [cliPath, "--incident-response-readiness", "--output", outputPath], {
      cwd: process.cwd(), encoding: "utf8",
    });
    assert.equal(output.status, 0);
    assert.equal(existsSync(outputPath), true);
    assert.equal((JSON.parse(readFileSync(outputPath, "utf8")) as IncidentResponseReadinessReport).production_incident_response_enabled, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("incident template CLI JSON and output modes are parseable", () => {
  const json = spawnSync(process.execPath, [cliPath, "--incident-template", "--json"], {
    cwd: process.cwd(), encoding: "utf8",
  });
  assert.equal(json.status, 0);
  assert.equal(json.stderr, "");
  assert.equal((JSON.parse(json.stdout) as IncidentRecordTemplate).incident_record_version, "atg.incident-record.v1");

  const directory = mkdtempSync(`${tmpdir()}\\atg-incident-template-cli-`);
  const outputPath = resolve(directory, "nested", "incident.json");
  try {
    const output = spawnSync(process.execPath, [cliPath, "--incident-template", "--output", outputPath], {
      cwd: process.cwd(), encoding: "utf8",
    });
    assert.equal(output.status, 0);
    assert.equal(existsSync(outputPath), true);
    assert.equal((JSON.parse(readFileSync(outputPath, "utf8")) as IncidentRecordTemplate).status, "draft");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET incident response readiness returns request ID and logs the request", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-incident-http-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({ gatewayLogPath: logPath });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/incident-response-readiness`);
    const body = await response.json() as IncidentResponseReadinessReport & { request_id: string };
    assert.equal(response.status, 200);
    assert.equal(body.incident_response_version, "atg.incident-response.v1");
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as GatewayRequestLogEntry;
    assert.equal(entry.endpoint, "/v1/incident-response-readiness");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("incident docs and ignore rules preserve the local-only boundary", () => {
  const directory = resolve("docs/incident-response");
  const files = ["README.md", "incident-severity-model.md", "containment-and-recovery.md", "incident-record-template.md", "future-production-incident-response.md"];
  const source = files.map((file) => readFileSync(resolve(directory, file), "utf8")).join("\n");
  assert.match(source, /no external alert|does not enable external alerting/i);
  assert.match(source, /customer notification automation|does not automate customer notification/i);
  assert.match(source, /not production incident response/i);
  assert.match(readFileSync(".gitignore", "utf8"), /incidents\/\*\.json/);
  assert.equal(existsSync("incidents/.gitkeep"), true);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/);
});
