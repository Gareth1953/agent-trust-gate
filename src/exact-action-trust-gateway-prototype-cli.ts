import {
  EXACT_ACTION_TRUST_GATEWAY_CORE_RULE,
  EXACT_ACTION_TRUST_GATEWAY_DISCLAIMER,
  EXACT_ACTION_TRUST_GATEWAY_STATUS,
  runExactActionPrototypeSmoke,
} from "./exact-action-trust-gateway-prototype.js";
import {
  DEFAULT_EXACT_ACTION_PROTOTYPE_HOST,
  DEFAULT_EXACT_ACTION_PROTOTYPE_PORT,
  startExactActionPrototypeServer,
} from "./exact-action-trust-gateway-prototype-server.js";

export interface ExactActionPrototypeCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

export async function runExactActionPrototypeCli(
  args: readonly string[],
  io: ExactActionPrototypeCliIo = {
    stdout: (value) => console.log(value),
    stderr: (value) => console.error(value),
  },
): Promise<number> {
  if (args.includes("--smoke")) {
    const result = await runExactActionPrototypeSmoke();
    io.stdout(JSON.stringify(result, null, 2));
    return result.passed ? 0 : 1;
  }
  if (args.includes("--help")) {
    io.stdout([
      "Agent Trust Gate™ — Exact Action Trust Gateway",
      EXACT_ACTION_TRUST_GATEWAY_STATUS,
      "",
      "Usage:",
      "  npm run prototype:exact-action",
      "  npm run prototype:exact-action -- --port 8794",
      "  npm run prototype:exact-action:smoke",
      "",
      EXACT_ACTION_TRUST_GATEWAY_CORE_RULE,
      EXACT_ACTION_TRUST_GATEWAY_DISCLAIMER,
    ].join("\n"));
    return 0;
  }
  try {
    const port = parsePort(args) ?? DEFAULT_EXACT_ACTION_PROTOTYPE_PORT;
    startExactActionPrototypeServer({
      host: DEFAULT_EXACT_ACTION_PROTOTYPE_HOST,
      port,
    });
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function parsePort(args: readonly string[]): number | undefined {
  const index = args.indexOf("--port");
  if (index < 0) return undefined;
  const raw = args[index + 1];
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("--port requires an integer between 0 and 65535.");
  }
  return port;
}

if (require.main === module) {
  void runExactActionPrototypeCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
