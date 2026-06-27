import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createAgentTrustGateClient } from "./agent-trust-gate-client.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const actionPath = resolve(directory, "../gateway-quickstart/public-post-action.json");
const client = createAgentTrustGateClient({
  baseUrl: process.env.ATG_GATEWAY_URL ?? "http://127.0.0.1:8787",
  clientId: process.env.ATG_CLIENT_ID ?? "quickstart-demo-agent",
  apiKey: process.env.ATG_API_KEY ?? "quickstart-demo-key",
});

async function main() {
  const health = await client.health();
  console.log(`health=${health.ok} service=${health.service}`);

  const action = JSON.parse(await readFile(actionPath, "utf8"));
  const decision = await client.decide(action);

  console.log(`request_id=${decision.request_id}`);
  console.log(`client_id=${decision.client_id}`);
  console.log(`allowed=${decision.allowed}`);
  console.log(`risk_level=${decision.risk_level}`);
  console.log(`human_approval_required=${decision.human_approval_required}`);
  console.log(`policy_profile=${decision.policy_profile}`);
  if (decision.usage !== undefined) {
    console.log(`remaining_decisions=${decision.usage.remaining_decisions}`);
  }

  const entitlement = await client.entitlement();
  console.log(`entitlement_status=${entitlement.entitlement_status}`);
  console.log(`upgrade_required=${entitlement.upgrade.upgrade_required}`);
  console.log(`purchase_enabled=${entitlement.upgrade.purchase_enabled}`);
  console.log("No purchase was made. Purchase, automatic purchase, and billing are disabled.");

  const readiness = await client.commercialReadiness();
  console.log(`local_product_readiness_percent=${readiness.overall.local_product_readiness_percent}`);
  console.log(`commercial_mvp_readiness_percent=${readiness.overall.commercial_mvp_readiness_percent}`);
  console.log(`full_target_readiness_percent=${readiness.overall.full_target_readiness_percent}`);
  console.log("Commercial readiness is a planning snapshot only.");

  if (decision.human_approval_required === true) {
    console.log("gateway_decision=REQUEST HUMAN");
    console.log("Stopping: explicit human review is required.");
  } else if (decision.allowed !== true) {
    console.log("gateway_decision=BLOCK");
    console.log("Stopping: the gateway did not allow this action.");
  } else {
    console.log("gateway_decision=ALLOW");
    console.log("The caller may separately decide whether to perform the exact approved action.");
  }

  console.log("No action was executed. This SDK demo requests a local trust decision only.");
}

main().catch((error) => {
  console.error(`SDK demo failed: ${error.code ?? error.name}: ${error.message}`);
  console.error("No action was executed.");
  process.exitCode = 1;
});
