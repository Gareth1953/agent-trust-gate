import {
  MACHINE_DISCOVERY_COMMAND,
  MACHINE_DISCOVERY_CORE_PHRASES,
  MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
  MACHINE_DISCOVERY_FIRST_COMMAND,
  MACHINE_DISCOVERY_SITE_VALIDATION_COMMAND,
  getMachineDiscoveryRecord,
  getMachineDiscoveryReport,
  getMachineDiscoverySafetyBoundary,
  summariseMachineDiscovery,
  validateMachineDiscoveryRecord,
  type MachineDiscoveryRecord,
} from "./machine-discovery.js";

export type MachineDiscoveryCliErrorCode =
  | "UNKNOWN_OPTION"
  | "UNEXPECTED_ARGUMENT"
  | "MACHINE_DISCOVERY_ERROR";

export interface MachineDiscoveryCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class MachineDiscoveryCliError extends Error {
  constructor(readonly code: MachineDiscoveryCliErrorCode, message: string) {
    super(message);
    this.name = "MachineDiscoveryCliError";
  }
}

const defaultIo: MachineDiscoveryCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runMachineDiscoveryCli(
  args: readonly string[],
  io: MachineDiscoveryCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const record = getMachineDiscoveryRecord();
    if (options.json) {
      io.stdout(JSON.stringify(options.summaryOnly ? summariseMachineDiscovery(record) : getMachineDiscoveryReport(record)));
      return 0;
    }
    io.stdout(renderMachineDiscovery(record, options.summaryOnly));
    return 0;
  } catch (error) {
    const known = error instanceof MachineDiscoveryCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "MACHINE_DISCOVERY_ERROR",
        message: known
          ? error.message
          : "The machine discovery demo could not complete safely.",
      },
      localDemoOnly: true,
      networkCalls: false,
      actionExecution: false,
      a2aServer: false,
      mcpServer: false,
      npmPublished: false,
      githubPagesDeploymentActive: true,
      paymentExecution: false,
      settlementExecution: false,
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
      throw cliError("UNKNOWN_OPTION", "The machine discovery command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The machine discovery command does not accept positional input files.");
  }
  return { summaryOnly, json };
}

function renderMachineDiscovery(record: MachineDiscoveryRecord, summaryOnly: boolean): string {
  const validation = validateMachineDiscoveryRecord(record);
  const report = getMachineDiscoveryReport(record);
  const lines = [
    "Agent Trust Gate machine discovery",
    `format: ${record.formatVersion}`,
    `canonical record: agent-trust-gate.discovery.json`,
    `recommended first run: ${MACHINE_DISCOVERY_FIRST_COMMAND}`,
    `discovery command: ${MACHINE_DISCOVERY_COMMAND}`,
    `static site validation: ${MACHINE_DISCOVERY_SITE_VALIDATION_COMMAND}`,
    `live Pages URL: ${MACHINE_DISCOVERY_EXPECTED_PAGES_URL}`,
    "",
    MACHINE_DISCOVERY_CORE_PHRASES[0],
    MACHINE_DISCOVERY_CORE_PHRASES[1],
    "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.",
    "",
    "current inactive statuses:",
    `- A2A server: ${record.statuses.a2aServer}`,
    `- MCP server: ${record.statuses.mcpServer}`,
    `- npm published: ${record.statuses.npmPublished}`,
    `- GitHub Pages workflow prepared: ${record.statuses.githubPagesWorkflowPrepared}`,
    `- GitHub Pages deployment workflow active: ${record.statuses.githubPagesDeploymentWorkflowActive}`,
    `- GitHub Pages configured: ${record.statuses.githubPagesConfigured}`,
    `- GitHub Pages active: ${record.statuses.githubPagesActive}`,
    `- GitHub Pages publicly reachable: ${record.statuses.githubPagesPubliclyReachable}`,
    `- GitHub Pages HTTPS verified: ${record.statuses.githubPagesHttpsVerified}`,
    `- GitHub Pages live URL verified: ${record.statuses.githubPagesLiveUrlVerified}`,
    `- GitHub Pages deployment active: ${record.statuses.githubPagesDeploymentActive}`,
    `- real action execution: ${record.statuses.realActionExecution}`,
    `- real payment execution: ${record.statuses.realPaymentExecution}`,
    `- real settlement execution: ${record.statuses.realSettlementExecution}`,
    "",
    "paid pilot:",
    `- ${record.paidPilot.name}`,
    `- starts from GBP ${record.paidPilot.indicativeStartingPriceGbp}, subject to scope and written agreement`,
    `- contact: ${record.publicContactEmail}`,
    "",
    "embedded commerce GatePass:",
    `- command: ${record.embeddedCommerceGatepass.command}`,
    `- status: ${record.embeddedCommerceGatepass.status}`,
    `- boundary: ${record.embeddedCommerceGatepass.integrationBoundary}`,
    "",
    "validation:",
    ...validation.checks.map((check) => `- ${check.id}: ${check.passed ? "pass" : "fail"} - ${check.detail}`),
    "",
    "safety boundary:",
    `- ${getMachineDiscoverySafetyBoundary()}`,
  ];

  if (!summaryOnly) {
    lines.push(
      "",
      "machine-readable entry points:",
      ...Object.entries(record.machineReadableResourceLinks).map(([key, value]) => `- ${key}: ${value}`),
      "",
      "claims boundary:",
      ...record.claimsBoundary.map((claim) => `- ${claim}`),
    );
  }

  lines.push("", JSON.stringify(summaryOnly ? summariseMachineDiscovery(record) : report, null, 2));
  return lines.join("\n");
}

function cliError(
  code: MachineDiscoveryCliErrorCode,
  message: string,
): MachineDiscoveryCliError {
  return new MachineDiscoveryCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runMachineDiscoveryCli(process.argv.slice(2));
}
