import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  ActionCapabilityPassportRegistry,
  createActionCapabilityPassport,
} from "../src/action-capability-passport.js";
import {
  DEFAULT_ACTION_CAPABILITY_PASSPORT,
  MCP_EXACT_ACTION_PROTOCOL_VERSION,
  McpExactActionGateway,
  createDefaultMcpExactActionRequest,
  type McpExactActionRequest,
  type McpExactActionResult,
} from "../src/mcp-exact-action-gateway.js";
import {
  MCP_STDIO_MAX_LINE_BYTES,
  McpStdioProtocolServer,
  type JsonRpcResponse,
} from "../src/mcp-stdio-server.js";
import { validateJsonSchemaFile } from "../src/json-schema-validator.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function request(method: string, params: unknown, id = 1): string {
  return JSON.stringify({ jsonrpc: "2.0", id, method, params });
}

async function initializedServer(): Promise<McpStdioProtocolServer> {
  const server = new McpStdioProtocolServer();
  const initialization = await server.handleLine(request("initialize", {
    protocolVersion: MCP_EXACT_ACTION_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "atg-test-client", version: "1.0.0" },
  }));
  assert.ok(initialization !== null && "result" in initialization);
  const notification = await server.handleLine(JSON.stringify({
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {},
  }));
  assert.equal(notification, null);
  return server;
}

function resultOf(response: JsonRpcResponse | null): Record<string, unknown> {
  assert.ok(response !== null && "result" in response);
  return response.result as Record<string, unknown>;
}

function structuredResult(response: JsonRpcResponse | null): McpExactActionResult {
  const result = resultOf(response);
  return result.structuredContent as McpExactActionResult;
}

test("MCP initialization negotiates the pinned protocol and tools capability", async () => {
  const server = new McpStdioProtocolServer();
  const response = await server.handleLine(request("initialize", {
    protocolVersion: MCP_EXACT_ACTION_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "atg-test-client", version: "1.0.0" },
  }));
  const result = resultOf(response);
  assert.equal(result.protocolVersion, "2025-06-18");
  assert.deepEqual(result.capabilities, { tools: { listChanged: false } });
});

test("ping is available without creating an application capability", async () => {
  const server = new McpStdioProtocolServer();
  const response = await server.handleLine(request("ping", {}, 8));
  assert.deepEqual(resultOf(response), {});
});

test("tools/list exposes exactly atg.evaluate_action", async () => {
  const server = await initializedServer();
  const response = await server.handleLine(request("tools/list", {}, 2));
  const result = resultOf(response) as { tools: Array<{ name: string }> };
  assert.deepEqual(result.tools.map((tool) => tool.name), ["atg.evaluate_action"]);
});

test("valid exact action returns ACCEPT, a GatePass, and no execution evidence", async () => {
  const server = await initializedServer();
  const response = await server.handleLine(request("tools/call", {
    name: "atg.evaluate_action",
    arguments: createDefaultMcpExactActionRequest(),
    _meta: { progressToken: "untrusted-client-metadata" },
  }, 3));
  const result = structuredResult(response);
  assert.equal(result.outcome, "ACCEPT");
  assert.equal(result.gatePassIssued, true);
  assert.ok(result.gatePass !== null);
  assert.equal(result.gatePass?.action.toolIdentity, "atg.evaluate_action");
  assert.equal(result.gatePass?.action.operationName, "evaluate_exact_action");
  assert.equal(result.gatePass?.action.toolSchemaVersion.includes(result.passport.passportDigest), false);
  assert.equal(result.executionReceipt, null);
  assert.equal(result.executionAvailable, false);
  assert.equal(result.actionExecuted, false);
});

test("overspend is REJECTED by existing authority and mandate checks with no GatePass", async () => {
  const gateway = new McpExactActionGateway();
  const result = await gateway.evaluateAction(createDefaultMcpExactActionRequest({ totalAmount: 31_000 }));
  assert.equal(result.outcome, "REJECT");
  assert.equal(result.gatePass, null);
  assert.equal(result.gatePassIssued, false);
  assert.ok(result.reasonCodes.includes("AUTHORITY_LIMIT_EXCEEDED"));
  assert.equal(result.policyDecisionReceipt?.decision, "refused");
});

test("unknown tool and malformed JSON-RPC fail with deterministic protocol errors", async () => {
  const server = await initializedServer();
  const unknown = await server.handleLine(request("tools/call", {
    name: "atg.execute_action",
    arguments: {},
  }, 4));
  assert.ok(unknown !== null && "error" in unknown);
  assert.equal(unknown.error.code, -32602);
  const malformed = await server.handleLine("{not-json");
  assert.ok(malformed !== null && "error" in malformed);
  assert.equal(malformed.error.code, -32700);
});

test("invalid tool input and self-asserted authority are rejected before evaluation", async () => {
  const server = await initializedServer();
  const invalid = createDefaultMcpExactActionRequest() as unknown as Record<string, unknown>;
  invalid.authority = { approved: true, role: "self-asserted" };
  const response = await server.handleLine(request("tools/call", {
    name: "atg.evaluate_action",
    arguments: invalid,
  }, 5));
  const result = resultOf(response);
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ text: string }>)[0]?.text ?? "";
  assert.match(text, /UNEXPECTED_OR_MISSING_FIELD/);
  assert.match(text, /"gatePassIssued":false/);
});

test("unknown, expired, and revoked passports fail closed", async () => {
  const unknown = createDefaultMcpExactActionRequest();
  unknown.passportReference.passportId = "passport.unknown";
  const unknownResult = await new McpExactActionGateway().evaluateAction(unknown);
  assert.deepEqual(unknownResult.reasonCodes, ["PASSPORT_UNKNOWN"]);
  assert.equal(unknownResult.gatePass, null);

  const { passportDigest: _expiredDigest, ...expiredUnsigned } = clone(DEFAULT_ACTION_CAPABILITY_PASSPORT);
  const expiredPassport = createActionCapabilityPassport({
    ...expiredUnsigned,
    expiresAt: "2026-09-02T08:59:59.000Z",
  });
  const expiredRequest = createDefaultMcpExactActionRequest();
  expiredRequest.passportReference = {
    passportId: expiredPassport.passportId,
    passportVersion: expiredPassport.passportVersion,
    passportDigest: expiredPassport.passportDigest,
  };
  const expiredGateway = new McpExactActionGateway({
    registry: new ActionCapabilityPassportRegistry([expiredPassport]),
  });
  const expiredResult = await expiredGateway.evaluateAction(expiredRequest);
  assert.deepEqual(expiredResult.reasonCodes, ["PASSPORT_EXPIRED"]);

  const { passportDigest: _revokedDigest, ...revokedUnsigned } = clone(DEFAULT_ACTION_CAPABILITY_PASSPORT);
  const revokedPassport = createActionCapabilityPassport({
    ...revokedUnsigned,
    status: "revoked",
    revocationReference: "fixture://revocation/passport-001",
  });
  const revokedRequest = createDefaultMcpExactActionRequest();
  revokedRequest.passportReference = {
    passportId: revokedPassport.passportId,
    passportVersion: revokedPassport.passportVersion,
    passportDigest: revokedPassport.passportDigest,
  };
  const revokedGateway = new McpExactActionGateway({
    registry: new ActionCapabilityPassportRegistry([revokedPassport]),
  });
  const revokedResult = await revokedGateway.evaluateAction(revokedRequest);
  assert.deepEqual(revokedResult.reasonCodes, ["PASSPORT_REVOKED"]);
});

test("passport digest mutation and altered registry content fail closed", async () => {
  const mutatedReference = createDefaultMcpExactActionRequest();
  mutatedReference.passportReference.passportDigest = `sha256:${"0".repeat(64)}`;
  const mismatch = await new McpExactActionGateway().evaluateAction(mutatedReference);
  assert.deepEqual(mismatch.reasonCodes, ["PASSPORT_DIGEST_MISMATCH"]);

  const alteredPassport = clone(DEFAULT_ACTION_CAPABILITY_PASSPORT);
  alteredPassport.operation = "altered_operation";
  const alteredGateway = new McpExactActionGateway({
    registry: new ActionCapabilityPassportRegistry([alteredPassport]),
  });
  const altered = await alteredGateway.evaluateAction(createDefaultMcpExactActionRequest());
  assert.deepEqual(altered.reasonCodes, ["PASSPORT_INTEGRITY_INVALID"]);
});

test("schema identity, version, digest, tool, and operation mutations are rejected", async () => {
  const mutations: Array<[keyof McpExactActionRequest["toolBinding"], string, string]> = [
    ["inputSchemaIdentity", "schema.other", "SCHEMA_IDENTITY_MISMATCH"],
    ["inputSchemaVersion", "9.9.9", "SCHEMA_VERSION_MISMATCH"],
    ["inputSchemaDigest", `sha256:${"1".repeat(64)}`, "SCHEMA_DIGEST_MISMATCH"],
    ["toolIdentity", "atg.other_tool", "TOOL_IDENTITY_MISMATCH"],
    ["operation", "other_operation", "OPERATION_MISMATCH"],
  ];
  for (const [field, value, expected] of mutations) {
    const input = createDefaultMcpExactActionRequest();
    input.toolBinding[field] = value;
    const result = await new McpExactActionGateway().evaluateAction(input);
    assert.deepEqual(result.reasonCodes, [expected]);
    assert.equal(result.gatePass, null);
  }
});

test("target, amount, currency, action arguments, and evidence mutations fail closed", async () => {
  const mutations: Array<[Partial<McpExactActionRequest["proposedAction"]>, string]> = [
    [{ supplierId: "SUP-UNREGISTERED-999" }, "SUPPLIER_NOT_PERMITTED"],
    [{ totalAmount: 31_000 }, "AUTHORITY_LIMIT_EXCEEDED"],
    [{ currency: "USD" }, "CURRENCY_NOT_PERMITTED"],
    [{ quantity: 201 }, "QUANTITY_NOT_PERMITTED"],
  ];
  for (const [patch, expected] of mutations) {
    const result = await new McpExactActionGateway().evaluateAction(createDefaultMcpExactActionRequest(patch));
    assert.equal(result.outcome, "REJECT");
    assert.ok(result.reasonCodes.includes(expected), `${expected}: ${result.reasonCodes.join(",")}`);
    assert.equal(result.gatePass, null);
  }
  const evidence = createDefaultMcpExactActionRequest();
  evidence.evidenceReferences.agentStanding = "agent-asserted://standing/allowed";
  const evidenceResult = await new McpExactActionGateway().evaluateAction(evidence);
  assert.deepEqual(evidenceResult.reasonCodes, ["EVIDENCE_REFERENCE_MISMATCH"]);
});

test("agent-supplied environment is not part of the closed request contract", async () => {
  const input = createDefaultMcpExactActionRequest();
  const action = input.proposedAction as unknown as Record<string, unknown>;
  action.operatingEnvironment = "production";
  const server = await initializedServer();
  const response = await server.handleLine(request("tools/call", {
    name: "atg.evaluate_action",
    arguments: input,
  }, 6));
  const result = resultOf(response);
  assert.equal(result.isError, true);
});

test("oversized stdio input fails safely and stdout remains JSON-RPC only", () => {
  const initialization = request("initialize", {
    protocolVersion: MCP_EXACT_ACTION_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "spawn-test", version: "1.0.0" },
  });
  const initialized = JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
  const list = request("tools/list", {}, 2);
  const oversized = `{"jsonrpc":"2.0","id":9,"method":"${"x".repeat(MCP_STDIO_MAX_LINE_BYTES)}"}`;
  const run = spawnSync(process.execPath, [resolve("dist/src/mcp-stdio-server.js")], {
    cwd: resolve("."),
    input: `${initialization}\n${initialized}\n${list}\n${oversized}\n`,
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, "");
  const lines = run.stdout.trim().split(/\r?\n/);
  assert.equal(lines.length, 3);
  const messages = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  assert.ok(messages.every((message) => message.jsonrpc === "2.0"));
  assert.deepEqual((messages[2]?.error as { code: number }).code, -32600);
});

test("fresh gateway runs are deterministic and never create downstream evidence", async () => {
  const first = await new McpExactActionGateway().evaluateAction(createDefaultMcpExactActionRequest());
  const second = await new McpExactActionGateway().evaluateAction(createDefaultMcpExactActionRequest());
  assert.deepEqual(first, second);
  const serialized = JSON.stringify(first);
  assert.doesNotMatch(serialized, /execution-receipt|simulatedSideEffectReference|externalActionOccurred/);
  assert.equal(first.executionReceipt, null);
});

test("new schemas and fixtures contain no credential, personal, or private-key material", () => {
  const files = [
    "schemas/action-capability-passport.schema.json",
    "schemas/mcp-exact-action-request.schema.json",
    "schemas/mcp-exact-action-result.schema.json",
    "examples/mcp-exact-action-gateway/action-capability-passport.json",
    "examples/mcp-exact-action-gateway/evaluate-action-request.json",
  ];
  const content = files.map((file) => readFileSync(resolve(file), "utf8")).join("\n");
  assert.doesNotMatch(content, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/);
});

test("MCP foundation source contains no HTTP, network, telemetry, or downstream execution surface", () => {
  const source = [
    "src/action-capability-passport.ts",
    "src/mcp-exact-action-gateway.ts",
    "src/mcp-stdio-server.ts",
  ].map((file) => readFileSync(resolve(file), "utf8")).join("\n");
  assert.doesNotMatch(source, /from ["']node:https?["']|\bfetch\s*\(|\.listen\s*\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(source, /executeWithGatePass|verifyAndExecuteSimulatedAction|ExecutionReceipt/);
});

test("machine-readable passport and request fixtures match the registered source", () => {
  const passport = JSON.parse(readFileSync(resolve("examples/mcp-exact-action-gateway/action-capability-passport.json"), "utf8"));
  const input = JSON.parse(readFileSync(resolve("examples/mcp-exact-action-gateway/evaluate-action-request.json"), "utf8"));
  assert.deepEqual(passport, DEFAULT_ACTION_CAPABILITY_PASSPORT);
  assert.deepEqual(input, createDefaultMcpExactActionRequest());
});

test("passport, request, ACCEPT, and REJECT values conform to additive schemas", async () => {
  const requestValue = createDefaultMcpExactActionRequest();
  const accept = await new McpExactActionGateway().evaluateAction(requestValue);
  const reject = await new McpExactActionGateway().evaluateAction(
    createDefaultMcpExactActionRequest({ totalAmount: 31_000 }),
  );
  for (const [schema, value] of [
    ["schemas/action-capability-passport.schema.json", DEFAULT_ACTION_CAPABILITY_PASSPORT],
    ["schemas/mcp-exact-action-request.schema.json", requestValue],
    ["schemas/mcp-exact-action-result.schema.json", accept],
    ["schemas/mcp-exact-action-result.schema.json", reject],
  ] as const) {
    const validation = validateJsonSchemaFile(resolve(schema), value);
    assert.equal(validation.valid, true, `${schema}: ${validation.errors.join("; ")}`);
  }
});
