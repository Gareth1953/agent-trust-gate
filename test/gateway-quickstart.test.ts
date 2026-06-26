import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  loadGatewayAuthConfig,
  validateActionDescriptor,
  verifyBeforeAction,
  type GatewayClient,
} from "../src/index.js";

const quickstartDirectory = resolve("examples/gateway-quickstart");
const sampleActionFiles = [
  "public-post-action.json",
  "customer-email-action.json",
  "money-movement-action.json",
] as const;

test("quickstart sample action files are valid action descriptors", () => {
  for (const fileName of sampleActionFiles) {
    const action = readJson(resolve(quickstartDirectory, fileName));

    assert.doesNotThrow(() => validateActionDescriptor(action), fileName);
  }
});

test("gateway can verify each quickstart sample action through decision logic", () => {
  for (const fileName of sampleActionFiles) {
    const action = readJson(resolve(quickstartDirectory, fileName));
    const decision = verifyBeforeAction(action);

    assert.equal(decision.contract_version, "atg.v1");
    assert.equal(decision.allowed, false);
    assert.match(decision.risk_level, /^(high|blocked)$/);
    assert.equal(decision.human_approval_required, true);
  }
});

test("quickstart demo client config parses safely", () => {
  const configPath = resolve(quickstartDirectory, "gateway-clients.demo.json");
  const parsed = readJson(configPath) as { clients: GatewayClient[] };
  const config = loadGatewayAuthConfig({
    requireApiKey: true,
    clients: parsed.clients,
  });

  assert.equal(config.require_api_key, true);
  assert.equal(config.clients.length, 1);
  assert.equal(config.clients[0]?.client_id, "quickstart-demo-agent");
  assert.equal(config.clients[0]?.api_key, "quickstart-demo-key");
  assert.equal(config.clients[0]?.decision_allowance, 5);
  assert.equal(config.clients[0]?.allowance_window, "all_time");
});

test("quickstart demo client config does not contain obvious real secrets", () => {
  const contents = readFileSync(
    resolve(quickstartDirectory, "gateway-clients.demo.json"),
    "utf8",
  );

  assert.match(contents, /quickstart-demo-key/);
  assert.doesNotMatch(contents, /sk-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(contents, /ghp_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(contents, /AKIA[0-9A-Z]{16}/);
  assert.doesNotMatch(contents, /BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/);
});

test("gateway quickstart client files exist", () => {
  assert.equal(existsSync(resolve(quickstartDirectory, "node-gateway-client.mjs")), true);
  assert.equal(existsSync(resolve(quickstartDirectory, "powershell-gateway-client.ps1")), true);
});

test("quickstart README exists and mentions local-only safety", () => {
  const readmePath = resolve(quickstartDirectory, "README.md");
  const contents = readFileSync(readmePath, "utf8");

  assert.equal(existsSync(readmePath), true);
  assert.match(contents, /Local Gateway API Mode/);
  assert.match(contents, /local demos only/i);
  assert.match(contents, /does not execute actions/i);
  assert.match(contents, /npm run verify -- --gateway-admin/);
});

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}
