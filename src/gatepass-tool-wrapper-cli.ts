import {
  GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS,
  runGatePassToolWrapperDemo,
  summariseGatePassToolWrapperDemo,
  type GatePassToolWrapperDemo,
  type GatePassToolWrapperDemoSummary,
} from "./gatepass-tool-wrapper.js";
import {
  runLocalAgentFrameworkIntegrationExample,
  summariseLocalAgentFrameworkIntegration,
  type LocalAgentFrameworkIntegrationDemo,
  type LocalAgentFrameworkIntegrationSummary,
} from "./local-agent-framework-integration.js";

export type GatePassToolWrapperCliErrorCode =
  | "UNKNOWN_OPTION"
  | "UNEXPECTED_ARGUMENT"
  | "GATEPASS_WRAPPER_ERROR";

export interface GatePassToolWrapperCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

export interface GatePassToolWrapperCliOutput {
  wrapper: GatePassToolWrapperDemo | GatePassToolWrapperDemoSummary;
  localFrameworkIntegration: LocalAgentFrameworkIntegrationDemo | LocalAgentFrameworkIntegrationSummary;
}

class GatePassToolWrapperCliError extends Error {
  constructor(readonly code: GatePassToolWrapperCliErrorCode, message: string) {
    super(message);
    this.name = "GatePassToolWrapperCliError";
  }
}

const defaultIo: GatePassToolWrapperCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runGatePassToolWrapperCli(
  args: readonly string[],
  io: GatePassToolWrapperCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const wrapper = runGatePassToolWrapperDemo();
    const integration = runLocalAgentFrameworkIntegrationExample();
    const output: GatePassToolWrapperCliOutput = {
      wrapper: options.summaryOnly ? summariseGatePassToolWrapperDemo(wrapper) : wrapper,
      localFrameworkIntegration: options.summaryOnly
        ? summariseLocalAgentFrameworkIntegration(integration)
        : integration,
    };
    if (options.json) {
      io.stdout(JSON.stringify(output));
    } else {
      io.stdout(renderWrapperDemo(wrapper, integration, options.summaryOnly));
    }
    return 0;
  } catch (error) {
    const known = error instanceof GatePassToolWrapperCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "GATEPASS_WRAPPER_ERROR",
        message: known ? error.message : "The local GatePass developer wrapper demo could not complete safely.",
      },
      note: "No production middleware, live agent framework execution, live systems contact, direct bot messaging, live agent-to-agent communication, network call, real tool execution, payment, settlement, or action execution occurred.",
      ...GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): { summaryOnly: boolean; json: boolean } {
  let summaryOnly = false;
  let json = false;
  for (const arg of args) {
    if (arg === "--summary-only") {
      summaryOnly = true;
      continue;
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The GatePass wrapper command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The GatePass wrapper command does not accept positional input files.");
  }
  return { summaryOnly, json };
}

function renderWrapperDemo(
  wrapper: GatePassToolWrapperDemo,
  integration: LocalAgentFrameworkIntegrationDemo,
  summaryOnly: boolean,
): string {
  const lines = [
    "GatePass developer wrapper and local integration example",
    `version: ${wrapper.wrapperVersion}`,
    "copy-paste pattern:",
    "const wrappedTool = wrapGatePassTool(mockTool, policy);",
    "const result = wrappedTool.call({ input, gatePass, proofPackage, localDemoOnly: true });",
    `wrapper scenarios: ${wrapper.scenarioCount}`,
    `local framework steps: ${integration.stepCount}`,
    "safety: local deterministic developer wrapper example, not production middleware",
    "safety: local mock execution only; no real tool execution, network calls, payment, settlement, or action execution",
  ];
  if (!summaryOnly) {
    lines.push("", "wrapper scenario results:");
    for (const scenario of wrapper.scenarios) {
      lines.push(
        `- ${scenario.scenarioId}: expected=${scenario.expectedOutcome} actual=${scenario.outcome} allowed=${scenario.allowed} localMockExecuted=${scenario.localMockExecuted}`,
      );
      lines.push(`  reasons: ${scenario.reasons.slice(0, 5).join(", ")}`);
    }
    lines.push("", "local framework integration results:");
    for (const step of integration.steps) {
      lines.push(
        `- ${step.stepId}: expected=${step.expectedOutcome} actual=${step.wrapperResult.outcome} matched=${step.matchedExpectedOutcome}`,
      );
    }
  }
  lines.push("", JSON.stringify({
    wrapper: summariseGatePassToolWrapperDemo(wrapper),
    localFrameworkIntegration: summariseLocalAgentFrameworkIntegration(integration),
  }, null, 2));
  return lines.join("\n");
}

function cliError(
  code: GatePassToolWrapperCliErrorCode,
  message: string,
): GatePassToolWrapperCliError {
  return new GatePassToolWrapperCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runGatePassToolWrapperCli(process.argv.slice(2));
}
