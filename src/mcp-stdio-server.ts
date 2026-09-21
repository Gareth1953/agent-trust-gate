import type { Readable, Writable } from "node:stream";
import {
  MCP_EXACT_ACTION_PROTOCOL_VERSION,
  MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA,
  MCP_EXACT_ACTION_TOOL_OUTPUT_SCHEMA,
  McpExactActionGateway,
  McpExactActionInputError,
} from "./mcp-exact-action-gateway.js";
import {
  MCP_EXACT_ACTION_SERVER_IDENTITY,
  MCP_EXACT_ACTION_TOOL_NAME,
} from "./action-capability-passport.js";

export const MCP_STDIO_SERVER_VERSION = "atg.mcp-stdio-server.local.v1" as const;
export const MCP_STDIO_MAX_LINE_BYTES = 65_536 as const;

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
}

interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: unknown;
}

export interface JsonRpcError {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

export class McpStdioProtocolServer {
  readonly #gateway: McpExactActionGateway;
  #initializeResponded = false;
  #initialized = false;

  constructor(gateway = new McpExactActionGateway()) {
    this.#gateway = gateway;
  }

  async handleLine(line: string): Promise<JsonRpcResponse | null> {
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      return errorResponse(null, -32700, "Parse error");
    }
    if (!isRecord(value) || Array.isArray(value)) {
      return errorResponse(null, -32600, "Invalid Request");
    }
    const id = validId(value.id) ? value.id : null;
    if (value.jsonrpc !== "2.0" || typeof value.method !== "string") {
      return errorResponse(id, -32600, "Invalid Request");
    }
    if (!("id" in value)) {
      return this.#handleNotification(value as unknown as JsonRpcNotification);
    }
    if (typeof value.id !== "string" && typeof value.id !== "number") {
      return errorResponse(null, -32600, "Invalid Request");
    }
    return this.#handleRequest(value as unknown as JsonRpcRequest);
  }

  async #handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (request.method === "initialize") return this.#initialize(request);
    if (request.method === "ping") {
      if (request.params !== undefined && !isRecord(request.params)) {
        return errorResponse(request.id, -32602, "Invalid ping parameters");
      }
      return successResponse(request.id, {});
    }
    if (!this.#initialized) {
      return errorResponse(request.id, -32002, "Server is not initialized");
    }
    if (request.method === "tools/list") {
      if (request.params !== undefined
        && (!isRecord(request.params)
          || Object.keys(request.params).some((key) => key !== "_meta")
          || (request.params._meta !== undefined && !isRecord(request.params._meta)))) {
        return errorResponse(request.id, -32602, "Invalid tools/list parameters");
      }
      return successResponse(request.id, {
        tools: [{
          name: MCP_EXACT_ACTION_TOOL_NAME,
          title: "ATG Exact-Action Evaluation",
          description: "Evaluate one local synthetic exact action against repository-registered authority, standing, mandate, evidence and capability-passport records. Evaluation only: no action is executed.",
          inputSchema: MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA,
          outputSchema: MCP_EXACT_ACTION_TOOL_OUTPUT_SCHEMA,
          annotations: {
            title: "ATG Exact-Action Evaluation",
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
          },
        }],
      });
    }
    if (request.method === "tools/call") return this.#callTool(request);
    return errorResponse(request.id, -32601, "Method not found");
  }

  #initialize(request: JsonRpcRequest): JsonRpcResponse {
    if (this.#initializeResponded || this.#initialized) {
      return errorResponse(request.id, -32600, "Server is already initialized");
    }
    if (!isRecord(request.params)
      || request.params.protocolVersion !== MCP_EXACT_ACTION_PROTOCOL_VERSION
      || !isRecord(request.params.capabilities)
      || !isRecord(request.params.clientInfo)
      || typeof request.params.clientInfo.name !== "string"
      || typeof request.params.clientInfo.version !== "string") {
      return errorResponse(request.id, -32602, "Unsupported or invalid initialization parameters", {
        supportedProtocolVersions: [MCP_EXACT_ACTION_PROTOCOL_VERSION],
      });
    }
    this.#initializeResponded = true;
    return successResponse(request.id, {
      protocolVersion: MCP_EXACT_ACTION_PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: {
        name: MCP_EXACT_ACTION_SERVER_IDENTITY,
        title: "Agent Trust Gate Local Exact-Action Gateway",
        version: MCP_STDIO_SERVER_VERSION,
      },
      instructions: "Local synthetic evaluation only. MCP metadata creates no authority. No action execution is available.",
    });
  }

  #handleNotification(notification: JsonRpcNotification): null {
    if (notification.method === "notifications/initialized"
      && this.#initializeResponded
      && (notification.params === undefined
        || (isRecord(notification.params)
          && Object.keys(notification.params).every((key) => key === "_meta")
          && (notification.params._meta === undefined || isRecord(notification.params._meta))))) {
      this.#initialized = true;
    }
    return null;
  }

  async #callTool(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!isRecord(request.params)
      || Object.keys(request.params).some((key) => key !== "name" && key !== "arguments" && key !== "_meta")
      || typeof request.params.name !== "string"
      || !("arguments" in request.params)
      || (request.params._meta !== undefined && !isRecord(request.params._meta))) {
      return errorResponse(request.id, -32602, "Invalid tools/call parameters");
    }
    if (request.params.name !== MCP_EXACT_ACTION_TOOL_NAME) {
      return errorResponse(request.id, -32602, "Unknown tool");
    }
    try {
      const result = await this.#gateway.evaluateAction(request.params.arguments);
      return successResponse(request.id, {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
        isError: false,
      });
    } catch (error) {
      if (error instanceof McpExactActionInputError) {
        return successResponse(request.id, {
          content: [{
            type: "text",
            text: JSON.stringify({
              outcome: "REJECT",
              reasonCodes: [error.reasonCode],
              message: error.message,
              gatePassIssued: false,
              executionAvailable: false,
            }),
          }],
          isError: true,
        });
      }
      return successResponse(request.id, {
        content: [{
          type: "text",
          text: JSON.stringify({
            outcome: "REJECT",
            reasonCodes: ["EVALUATION_FAILED_CLOSED"],
            message: "Exact-action evaluation failed closed.",
            gatePassIssued: false,
            executionAvailable: false,
          }),
        }],
        isError: true,
      });
    }
  }
}

export async function runMcpStdioServer(
  input: Readable = process.stdin,
  output: Writable = process.stdout,
  diagnostics: Writable = process.stderr,
): Promise<void> {
  const server = new McpStdioProtocolServer();
  let pending = Buffer.alloc(0);
  let discardingOversizedLine = false;

  const writeResponse = (response: JsonRpcResponse): void => {
    output.write(`${JSON.stringify(response)}\n`);
  };
  const oversized = (): void => {
    writeResponse(errorResponse(null, -32600, "Request exceeds maximum line size", {
      maximumBytes: MCP_STDIO_MAX_LINE_BYTES,
    }));
  };

  try {
    for await (const rawChunk of input) {
      let chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(String(rawChunk), "utf8");
      if (discardingOversizedLine) {
        const newline = chunk.indexOf(0x0a);
        if (newline === -1) continue;
        chunk = chunk.subarray(newline + 1);
        discardingOversizedLine = false;
      }
      pending = Buffer.concat([pending, chunk]);
      while (true) {
        const newline = pending.indexOf(0x0a);
        if (newline === -1) break;
        let lineBytes = pending.subarray(0, newline);
        pending = pending.subarray(newline + 1);
        if (lineBytes.at(-1) === 0x0d) lineBytes = lineBytes.subarray(0, -1);
        if (lineBytes.length === 0) continue;
        if (lineBytes.length > MCP_STDIO_MAX_LINE_BYTES) {
          oversized();
          continue;
        }
        const response = await processLine(server, lineBytes);
        if (response !== null) writeResponse(response);
      }
      if (pending.length > MCP_STDIO_MAX_LINE_BYTES) {
        pending = Buffer.alloc(0);
        discardingOversizedLine = true;
        oversized();
      }
    }
    if (!discardingOversizedLine && pending.length > 0) {
      const response = await processLine(server, pending);
      if (response !== null) writeResponse(response);
    }
  } catch {
    diagnostics.write("ATG MCP stdio transport closed after an input/output failure.\n");
  }
}

async function processLine(
  server: McpStdioProtocolServer,
  bytes: Buffer,
): Promise<JsonRpcResponse | null> {
  try {
    const line = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return await server.handleLine(line);
  } catch {
    return errorResponse(null, -32700, "Parse error");
  }
}

function successResponse(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcError {
  return data === undefined
    ? { jsonrpc: "2.0", id, error: { code, message } }
    : { jsonrpc: "2.0", id, error: { code, message, data } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is JsonRpcId {
  return value === null || typeof value === "string" || typeof value === "number";
}

if (require.main === module) {
  void runMcpStdioServer();
}
