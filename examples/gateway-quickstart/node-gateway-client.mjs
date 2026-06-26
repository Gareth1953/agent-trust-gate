import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const gatewayBaseUrl = process.env.ATG_GATEWAY_URL ?? "http://127.0.0.1:8787";
const clientId = process.env.ATG_CLIENT_ID ?? "quickstart-demo-agent";
const apiKey = process.env.ATG_API_KEY ?? "quickstart-demo-key";
const actionPath = process.env.ATG_ACTION_PATH ?? resolve(
  dirname(fileURLToPath(import.meta.url)),
  "public-post-action.json",
);

async function main() {
  const health = await getJson(`${gatewayBaseUrl}/v1/health`);
  console.log(`health ok=${health.ok} service=${health.service} request_id=${health.request_id}`);

  const action = JSON.parse(await readFile(actionPath, "utf8"));
  const decision = await postJson(`${gatewayBaseUrl}/v1/decision`, action, {
    "X-ATG-Client-ID": clientId,
    "X-ATG-API-Key": apiKey,
  });

  console.log(`request_id=${decision.request_id}`);
  console.log(`client_id=${decision.client_id}`);
  console.log(`allowed=${decision.allowed}`);
  console.log(`risk_level=${decision.risk_level}`);
  console.log(`human_approval_required=${decision.human_approval_required}`);
  console.log(`policy_profile=${decision.policy_profile}`);

  if (decision.usage !== undefined) {
    console.log(`remaining_decisions=${decision.usage.remaining_decisions}`);
  }

  const actionStatus = decision.allowed === true && decision.human_approval_required === false
    ? "ALLOW"
    : decision.human_approval_required === true
      ? "REQUEST HUMAN"
      : "BLOCK";

  console.log(`gateway_decision=${actionStatus}`);
  console.log("No action was executed. This quickstart only requests a local trust decision.");
}

async function getJson(url) {
  const response = await fetch(url);
  return parseResponse(response);
}

async function postJson(url, body, headers) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

async function parseResponse(response) {
  const body = await response.json();
  if (!response.ok) {
    const code = body.error?.code ?? "GATEWAY_REQUEST_FAILED";
    const message = body.error?.message ?? response.statusText;
    throw new Error(`${code}: ${message}`);
  }
  return body;
}

main().catch((error) => {
  console.error(`Gateway quickstart failed: ${error.message}`);
  console.error("Start the local gateway first with: npm run verify -- --serve --port 8787");
  process.exitCode = 1;
});
