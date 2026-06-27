import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createAgentTrustGateClient } from "../gateway-sdk/agent-trust-gate-client.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
export const toolDefinitions = JSON.parse(
  await readFile(resolve(directory, "agent-trust-gate-mcp-tools.json"), "utf8"),
);

// This is a local adapter example, not a production MCP server. It never executes actions.
export function createMcpStyleAdapter(options = {}) {
  const client = createAgentTrustGateClient(options);
  const tools = {
    atg_health: async () => client.health(),
    atg_decide: async ({ action, policy_profile } = {}) => (
      client.decide(action, policy_profile === undefined ? {} : { policyProfile: policy_profile })
    ),
    atg_create_approval_pack: async ({ action, policy_profile, save_approval_pack } = {}) => (
      client.createApprovalPack(action, {
        ...(policy_profile === undefined ? {} : { policyProfile: policy_profile }),
        ...(save_approval_pack === undefined ? {} : { saveApprovalPack: save_approval_pack }),
      })
    ),
    atg_create_evidence_bundle: async ({ review_record_path, save_evidence_bundle } = {}) => (
      client.createEvidenceBundle(review_record_path, {
        ...(save_evidence_bundle === undefined
          ? {}
          : { saveEvidenceBundle: save_evidence_bundle }),
      })
    ),
  };

  return {
    toolDefinitions,
    tools,
    async callTool(name, input = {}) {
      const tool = tools[name];
      if (tool === undefined) {
        throw new Error(`Unknown local Agent Trust Gate tool: ${name}`);
      }
      return tool(input);
    },
  };
}

async function demo() {
  const adapter = createMcpStyleAdapter({
    baseUrl: process.env.ATG_GATEWAY_URL ?? "http://127.0.0.1:8787",
    clientId: process.env.ATG_CLIENT_ID ?? "quickstart-demo-agent",
    apiKey: process.env.ATG_API_KEY ?? "quickstart-demo-key",
  });
  const action = JSON.parse(
    await readFile(resolve(directory, "../gateway-quickstart/public-post-action.json"), "utf8"),
  );

  const health = await adapter.callTool("atg_health");
  console.log(`tool=atg_health ok=${health.ok} request_id=${health.request_id}`);

  const decision = await adapter.callTool("atg_decide", { action });
  const status = decision.human_approval_required === true
    ? "REQUEST HUMAN"
    : decision.allowed === true ? "ALLOW" : "BLOCK";
  console.log(`tool=atg_decide request_id=${decision.request_id}`);
  console.log(`client_id=${decision.client_id} decision=${status} risk_level=${decision.risk_level}`);
  console.log("No action was executed. This local MCP-style adapter requested a trust decision only.");
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) {
  demo().catch((error) => {
    console.error(`MCP-style adapter demo failed: ${error.code ?? error.name}: ${error.message}`);
    console.error("No action was executed.");
    process.exitCode = 1;
  });
}
