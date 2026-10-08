#!/usr/bin/env node
import { isAbsolute } from "node:path";
import { AtgStandalonePlugin, createSyntheticPluginRequest, STANDALONE_PLUGIN_BOUNDARY } from "./standalone-plugin.js";
import { McpExactActionGateway } from "./mcp-exact-action-gateway.js";
import { runMcpStdioServer } from "./mcp-stdio-server.js";

async function main(args: string[]): Promise<void> {
  const command = args[0];
  if (command === "request" && args.length === 1) {
    process.stdout.write(`${JSON.stringify(createSyntheticPluginRequest(), null, 2)}\n`);
    return;
  }
  if (command === "--help" || command === undefined) {
    process.stdout.write("ATG local synthetic plugin\nCommands: request | mcp --state ABSOLUTE_PATH | demo --state ABSOLUTE_PATH\nNo live execution or self-learning. Fixed synthetic clock and authority fixtures.\n");
    return;
  }
  if ((command !== "mcp" && command !== "demo") || args.length !== 3
    || args[1] !== "--state" || !args[2] || !isAbsolute(args[2])) {
    throw new TypeError("Use mcp or demo with --state and an absolute host-owned state file path.");
  }
  if (command === "mcp") {
    await runMcpStdioServer(process.stdin, process.stdout, process.stderr,
      new McpExactActionGateway({ durableStatePath: args[2] }));
    return;
  }
  const plugin = new AtgStandalonePlugin({ statePath: args[2] });
  const request = createSyntheticPluginRequest("enforced");
  const evaluation = await plugin.evaluate(request);
  const execution = await plugin.executeSynthetic(evaluation.evaluationId, request);
  const replay = await plugin.executeSynthetic(evaluation.evaluationId, request);
  const passed = evaluation.decision.outcome === "ACCEPT"
    && execution.outcome === "EXECUTED" && replay.outcome === "REJECTED";
  process.stdout.write(`${JSON.stringify({ capabilities: STANDALONE_PLUGIN_BOUNDARY, passed,
    evaluation, execution, replay }, null, 2)}\n`);
  if (!passed) process.exitCode = 1;
}

if (require.main === module) {
  void main(process.argv.slice(2)).catch(() => {
    process.stderr.write("ATG plugin failed closed. Check command syntax and local state availability.\n");
    process.exitCode = 1;
  });
}
