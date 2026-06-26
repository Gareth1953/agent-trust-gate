import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validateActionDescriptor } from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const integrationDirectory = resolve("examples/integrations");
const sampleFiles = [
  "sample-public-post.json",
  "sample-customer-facing.json",
  "sample-money-movement.json",
] as const;

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("integration sample JSON files are valid action descriptors", () => {
  for (const fileName of sampleFiles) {
    const action = JSON.parse(
      readFileSync(resolve(integrationDirectory, fileName), "utf8"),
    );

    assert.doesNotThrow(() => validateActionDescriptor(action));
  }
});

test("JSON mode verifies each integration sample", () => {
  for (const fileName of sampleFiles) {
    const result = runCli(resolve(integrationDirectory, fileName), "--json");

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");

    const decision = JSON.parse(result.stdout) as {
      ok: boolean;
      contract_version: string;
      action_type: string;
    };
    assert.equal(decision.ok, true);
    assert.equal(decision.contract_version, "atg.v1");
    assert.equal(typeof decision.action_type, "string");
  }
});

test("blocked integration sample with --fail-on-block exits 2", () => {
  const result = runCli(
    resolve(integrationDirectory, "sample-public-post.json"),
    "--json",
    "--fail-on-block",
  );

  assert.equal(result.status, 2);
  assert.equal(result.stderr, "");

  const decision = JSON.parse(result.stdout) as {
    allowed: boolean;
    risk_level: string;
  };
  assert.equal(decision.allowed, false);
  assert.equal(decision.risk_level, "high");
});

test("integration examples do not include network access patterns", async () => {
  const files = await readdir(integrationDirectory);
  const checkedFiles = files.filter((fileName) =>
    /\.(mjs|ps1|json|md)$/i.test(fileName),
  );

  for (const fileName of checkedFiles) {
    const contents = readFileSync(resolve(integrationDirectory, fileName), "utf8");

    assert.doesNotMatch(contents, /https?:\/\//i, fileName);
    assert.doesNotMatch(contents, /\bfetch\s*\(/i, fileName);
    assert.doesNotMatch(contents, /\bInvoke-WebRequest\b/i, fileName);
    assert.doesNotMatch(contents, /\bInvoke-RestMethod\b/i, fileName);
    assert.doesNotMatch(contents, /\bcurl\b/i, fileName);
  }
});
