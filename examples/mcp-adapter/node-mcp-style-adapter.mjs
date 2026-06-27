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
    atg_get_entitlement: async () => client.entitlement(),
    atg_get_commercial_readiness: async () => client.commercialReadiness(),
    atg_get_hosted_readiness: async () => client.hostedReadiness(),
    atg_get_security_readiness: async () => client.securityReadiness(),
    atg_get_rate_limit_status: async () => client.rateLimitStatus(),
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
  const entitlement = await adapter.callTool("atg_get_entitlement");
  console.log(`tool=atg_get_entitlement status=${entitlement.entitlement_status}`);
  console.log(`upgrade_required=${entitlement.upgrade.upgrade_required} purchase_enabled=${entitlement.upgrade.purchase_enabled}`);
  console.log("No purchase was made. Automatic purchase and billing are disabled.");
  const readiness = await adapter.callTool("atg_get_commercial_readiness");
  console.log(`tool=atg_get_commercial_readiness local=${readiness.overall.local_product_readiness_percent} commercial_mvp=${readiness.overall.commercial_mvp_readiness_percent} full_target=${readiness.overall.full_target_readiness_percent}`);
  console.log("Commercial readiness is a local planning snapshot only.");
  const hosted = await adapter.callTool("atg_get_hosted_readiness");
  console.log(`tool=atg_get_hosted_readiness hosted=${hosted.overall.hosted_readiness_percent} production_ready=${hosted.production_ready}`);
  console.log("No deployment occurred. Hosted readiness is preparation only.");
  const security = await adapter.callTool("atg_get_security_readiness");
  console.log(`tool=atg_get_security_readiness security=${security.overall.security_readiness_percent} production_security_certified=${security.production_security_certified}`);
  console.log("Security readiness is a planning snapshot only, not a certification.");
  const rateLimit = await adapter.callTool("atg_get_rate_limit_status");
  console.log(`tool=atg_get_rate_limit_status status=${rateLimit.rate_limit_status} abuse=${rateLimit.abuse_signal.abuse_status}`);
  console.log("Rate-limit status is local only. No action was executed or capacity purchased.");
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
