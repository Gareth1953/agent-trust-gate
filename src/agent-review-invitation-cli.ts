import { readFileSync } from "node:fs";

import {
  AGENT_REVIEW_INVITATION_FILE,
  renderAgentInvitationSummary,
  validateAgentInvitationPack,
} from "./agent-review-invitation.js";

export interface AgentInvitationCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

export function runAgentInvitationCli(
  args: readonly string[],
  io: AgentInvitationCliIo = {
    stdout: (value) => console.log(value),
    stderr: (value) => console.error(value),
  },
): number {
  const allowed = new Set(["--summary-only", "--json"]);
  if (args.length > 1 || args.some((arg) => !allowed.has(arg))) {
    io.stderr("Usage: npm run demo:agent-invitation -- [--summary-only|--json]");
    return 2;
  }
  try {
    const report = validateAgentInvitationPack();
    if (args.includes("--json")) {
      io.stdout(JSON.stringify(report, null, 2));
    } else if (args.includes("--summary-only")) {
      io.stdout(renderAgentInvitationSummary(report));
    } else {
      const invitation = JSON.parse(readFileSync(AGENT_REVIEW_INVITATION_FILE, "utf8")) as {
        purpose?: unknown;
        interactionModes?: unknown;
        localReviewerCommands?: unknown;
      };
      io.stdout([
        "Agent Trust Gate agent discovery and reviewer invitation",
        "P3-M155 — static and local-only review activation",
        `Purpose: ${typeof invitation.purpose === "string" ? invitation.purpose : "unavailable"}`,
        `Interaction modes: ${Array.isArray(invitation.interactionModes) ? invitation.interactionModes.join(", ") : "unavailable"}`,
        "Local reviewer commands:",
        ...(Array.isArray(invitation.localReviewerCommands)
          ? invitation.localReviewerCommands.map((command) => `- ${String(command)}`)
          : ["- unavailable"]),
        "",
        renderAgentInvitationSummary(report),
      ].join("\n"));
    }
    return report.overallPassed ? 0 : 1;
  } catch (error) {
    io.stderr("ATG AGENT DISCOVERY AND INVITATION RESULT");
    io.stderr(`Overall: AGENT DISCOVERY AND INVITATION ACTIVATION FAILED (${error instanceof Error ? error.message : "unknown error"})`);
    io.stderr("Automatic outreach performed: none");
    io.stderr("External agents contacted: none");
    io.stderr("External actions performed: none");
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = runAgentInvitationCli(process.argv.slice(2));
}
