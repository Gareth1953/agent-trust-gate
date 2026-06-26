import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createGatewayServer, loadGatewayAuthConfig } from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const localClient = {
  client_id: "local-demo-agent",
  api_key: "replace-with-local-dev-key",
  label: "Local Demo Agent",
};

const publicPostAction = {
  action_type: "public_post",
  description: "Publish a project update on a public channel.",
  actor: "communications-agent",
  target: "public-channel",
  estimated_cost_gbp: 0,
  public_action: true,
  external_commitment: false,
  money_movement: false,
  legal_or_compliance_sensitive: false,
  customer_or_user_facing: true,
  evidence: ["Draft content is available for human review."],
  rollback_plan: "Delete the post and issue a correction if approved by a human.",
  human_approval_status: "not_requested",
};

async function withGateway<T>(
  options: Parameters<typeof createGatewayServer>[0],
  callback: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const server = createGatewayServer(options);

  await new Promise<void>((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();
  assert.ok(address !== null && typeof address === "object");

  try {
    return await callback(`http://127.0.0.1:${(address as AddressInfo).port}`);
  } finally {
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => {
        if (error !== undefined) {
          rejectClose(error);
          return;
        }
        resolveClose();
      });
    });
  }
}

test("missing client ID defaults to local-anonymous", async () => {
  await withGateway({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/health`);
    const body = await response.json() as { client_id: string };

    assert.equal(response.status, 200);
    assert.equal(body.client_id, "local-anonymous");
  });
});

test("gateway response includes provided client_id", async () => {
  await withGateway({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/health`, {
      headers: { "X-ATG-Client-ID": "local-dashboard" },
    });
    const body = await response.json() as { client_id: string };

    assert.equal(response.status, 200);
    assert.equal(body.client_id, "local-dashboard");
  });
});

test("GET /v1/health includes api_key_required false by default", async () => {
  await withGateway({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/health`);
    const body = await response.json() as { api_key_required: boolean };

    assert.equal(response.status, 200);
    assert.equal(body.api_key_required, false);
  });
});

test("GET /v1/health includes api_key_required true when enabled", async () => {
  await withGateway({ requireApiKey: true, clients: [localClient] }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/health`);
    const body = await response.json() as { api_key_required: boolean };

    assert.equal(response.status, 200);
    assert.equal(body.api_key_required, true);
  });
});

test("protected endpoint works without API key when require-api-key is false", async () => {
  await withGateway({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      body: JSON.stringify(publicPostAction),
    });
    const body = await response.json() as { ok: boolean; client_id: string };

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.client_id, "local-anonymous");
  });
});

test("protected endpoint returns 401 when API key required but missing", async () => {
  await withGateway({ requireApiKey: true, clients: [localClient] }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      body: JSON.stringify(publicPostAction),
    });
    const body = await response.json() as {
      ok: boolean;
      client_id: string;
      error: { code: string };
    };

    assert.equal(response.status, 401);
    assert.equal(body.ok, false);
    assert.equal(body.client_id, "local-anonymous");
    assert.equal(body.error.code, "UNAUTHORIZED_GATEWAY_REQUEST");
  });
});

test("protected endpoint returns 401 when API key required but invalid", async () => {
  await withGateway({ requireApiKey: true, clients: [localClient] }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: { "X-ATG-API-Key": "wrong-key" },
      body: JSON.stringify(publicPostAction),
    });
    const body = await response.json() as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, "UNAUTHORIZED_GATEWAY_REQUEST");
  });
});

test("protected endpoint succeeds when valid API key is supplied", async () => {
  await withGateway({ requireApiKey: true, clients: [localClient] }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: {
        "X-ATG-Client-ID": "local-demo-agent",
        "X-ATG-API-Key": "replace-with-local-dev-key",
      },
      body: JSON.stringify(publicPostAction),
    });
    const body = await response.json() as { ok: boolean; client_id: string };

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.client_id, "local-demo-agent");
  });
});

test("valid API key infers client_id when header is omitted", async () => {
  await withGateway({ requireApiKey: true, clients: [localClient] }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: { "X-ATG-API-Key": "replace-with-local-dev-key" },
      body: JSON.stringify(publicPostAction),
    });
    const body = await response.json() as { client_id: string };

    assert.equal(response.status, 200);
    assert.equal(body.client_id, "local-demo-agent");
  });
});

test("mismatched client ID and API key is rejected", async () => {
  await withGateway({ requireApiKey: true, clients: [localClient] }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: {
        "X-ATG-Client-ID": "other-agent",
        "X-ATG-API-Key": "replace-with-local-dev-key",
      },
      body: JSON.stringify(publicPostAction),
    });
    const body = await response.json() as { client_id: string; error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.client_id, "other-agent");
    assert.equal(body.error.code, "UNAUTHORIZED_GATEWAY_REQUEST");
  });
});

test("gateway clients file loads local clients", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-clients-`);
  const clientsFile = resolve(directory, "gateway-clients.json");

  try {
    writeFileSync(clientsFile, JSON.stringify({ clients: [localClient] }), "utf8");
    const config = loadGatewayAuthConfig({ requireApiKey: true, clientsFile });

    assert.equal(config.require_api_key, true);
    assert.equal(config.clients[0]?.client_id, "local-demo-agent");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("generated gateway-clients.json remains ignored", () => {
  const result = spawnSync("git", ["check-ignore", "gateway-clients.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /gateway-clients\.json/);
});

test("gateway-clients.example.json is safe and tracked", () => {
  const ignoreResult = spawnSync("git", ["check-ignore", "gateway-clients.example.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const contents = readFileSync(resolve("gateway-clients.example.json"), "utf8");

  assert.equal(ignoreResult.status, 1);
  assert.match(contents, /replace-with-local-dev-key/);
});

test("--serve --require-api-key fails clearly when clients file is missing", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-missing-clients-`);

  try {
    const result = spawnSync(
      process.execPath,
      [cliPath, "--serve", "--require-api-key", "--json"],
      {
        cwd: directory,
        encoding: "utf8",
      },
    );
    const output = JSON.parse(result.stdout) as { error: { code: string } };

    assert.equal(result.status, 1);
    assert.equal(output.error.code, "INVALID_GATEWAY_AUTH_CONFIG");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
