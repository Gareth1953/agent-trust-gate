import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const readmePath = "README.md";
const coreRule = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
const expectedPagesUrl = "https://gareth1953.github.io/agent-trust-gate/";
const assetPaths = [
  "agent-trust-gate.manifest.json",
  "schemas/local-agent-action-request.schema.json",
  "schemas/local-trust-receipt.schema.json",
  "schemas/local-money-gate-proof.schema.json",
  "docs/agent-readable-capability-statement.md",
  "docs/code-readable-developer-integration-pack.md",
  "docs/developer-integration-checklist.md",
] as const;

function readme(): string {
  return readFileSync(readmePath, "utf8");
}

test("public README leads with the local-first trust-gate position and core rule", () => {
  const source = readme();
  assert.match(source, /^# Agent Trust Gate™/);
  assert.match(source, /local-first, pre-action and pre-settlement trust\s+enforcement layer/i);
  assert.ok(source.includes(coreRule));
  assert.match(source, /current status: local_demo_only/i);
  assert.match(source, /does not claim\s+production adoption, legal or compliance certification, or live payment\s+readiness/i);
});

test("README documents the complete local proof chain in order", () => {
  const source = readme();
  const stages = [
    "agent request",
    "gate decision",
    "receipt/audit artifact",
    "receipt verification",
    "gate pass validity/replay check",
    "settlement blocker simulation",
    "final money-gate proof decision",
  ];
  let previous = -1;
  for (const stage of stages) {
    const position = source.indexOf(stage);
    assert.ok(position > previous, stage);
    previous = position;
  }
  for (const statement of [
    "No action is executed.",
    "No money is moved.",
    "No payment rail is called.",
    "No agents are contacted.",
    "Only local proof artifacts are produced.",
  ]) assert.ok(source.includes(statement), statement);
});

test("quick demo uses only configured scripts and supported flags", () => {
  const source = readme();
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  for (const script of ["test", "build", "typecheck", "demo:gate:allow", "demo:gate", "proof:money-gate"]) {
    assert.equal(typeof packageJson.scripts[script], "string", script);
  }
  for (const command of [
    "npm test",
    "npm run build",
    "npm run typecheck",
    "npm run demo:gate:allow",
    "npm run proof:money-gate",
    "--verify-receipt",
    "--simulate-replay-protection",
    "--simulate-settlement-blocker",
  ]) assert.ok(source.includes(command), command);
  assert.doesNotMatch(source, /--validate-gate-pass|--money-gate-proof/);
});

test("README links all code-readable review assets", () => {
  const source = readme();
  for (const path of assetPaths) {
    assert.equal(existsSync(path), true, path);
    assert.ok(source.includes(path), path);
  }
  assert.match(source, /## Code-readable assets/);
  assert.match(source, /## Developer review path/);
});

test("README states every current safety boundary and separate project boundary", () => {
  const source = readme();
  for (const boundary of [
    "live APIs",
    "live payments",
    "real settlement",
    "x402 or AP2 activation",
    "banking or wallet logic",
    "cloud or network calls",
    "external agent contact",
    "Agent Update Consortium merge",
    "Agent Contact System integration",
    "public outreach automation",
    "production cryptographic signing",
    "action execution",
  ]) assert.ok(source.includes(boundary), boundary);
  assert.match(source, /AUC is not integrated/i);
  assert.match(source, /Agent Contact System remains separate and is not integrated/i);
});

test("README identifies the current readiness baseline and recent milestones", () => {
  const source = readme();
  assert.match(source, /reached P3-M101/i);
  for (const milestone of ["P3-M096", "P3-M097", "P3-M098", "P3-M099", "P3-M100", "P3-M101"]) {
    assert.ok(source.includes(milestone), milestone);
  }
});

test("README contains no live URLs, real credentials, financial details, or rail activation instructions", () => {
  const source = readme();
  const urls = source.match(/https?:\/\/[^\s)`]+/g) ?? [];
  for (const url of urls) {
    assert.ok(
      /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/.test(url) ||
        url === expectedPagesUrl,
      url,
    );
  }
  assert.doesNotMatch(source, /sk_(?:live|test)_[a-z0-9]+|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i);
  assert.doesNotMatch(source, /(?:bank[_ -]?account|wallet[_ -]?address|card[_ -]?number|routing[_ -]?number|sort[_ -]?code|\biban\b)\s*[:=]\s*["']?[a-z0-9]/i);
  assert.doesNotMatch(source, /\b(?:enable|activate|configure)\s+(?:x402|AP2|Stripe|checkout)\b/i);
});
