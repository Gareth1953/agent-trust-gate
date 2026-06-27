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
  for (const method of ["health", "decide", "createApprovalPack", "createEvidenceBundle", "openapi"]) {
    assert.match(source, new RegExp(`\\b${method}\\(`));
  }
});

test("PowerShell SDK wrapper defines the expected functions", () => {
  const source = readFileSync(files.powershellClient, "utf8");
  for (const functionName of ["New-AgentTrustGateClient", "Invoke-ATGHealth", "Invoke-ATGDecision", "Invoke-ATGApprovalPack", "Invoke-ATGEvidenceBundle", "Invoke-ATGOpenApi"]) {
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
