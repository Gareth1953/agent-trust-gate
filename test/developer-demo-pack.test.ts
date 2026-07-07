import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const docs = [
  "docs/developer-demo-pack.md",
  "docs/quickstart-local-demo.md",
  "docs/agent-readable-capability-statement.md",
  "docs/demo-transcripts/allow-demo.md",
  "docs/demo-transcripts/review-required-demo.md",
  "docs/demo-transcripts/refusal-demo.md",
];
const coreRule = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

test("developer demo pack documents and README links exist", () => {
  for (const path of docs) assert.equal(existsSync(path), true, path);
  const readme = readFileSync("README.md", "utf8");
  for (const path of [
    "docs/developer-demo-pack.md",
    "docs/quickstart-local-demo.md",
    "docs/local-developer-cli.md",
    "docs/receipt-audit-trail.md",
    "docs/agent-readable-capability-statement.md",
  ]) {
    assert.match(readme, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), path);
    assert.equal(existsSync(path), true, path);
  }
});

test("capability statement is explicitly local and non-operational", () => {
  const source = readFileSync("docs/agent-readable-capability-statement.md", "utf8");
  assert.match(source, /"current_status": "local_demo_only"/);
  assert.match(source, /"live_payments": false/);
  assert.match(source, /"live_settlement": false/);
  assert.match(source, /"external_agent_contact": false/);
  assert.match(source, new RegExp(coreRule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("demo guide preserves the core rule and inactive future boundaries", () => {
  const source = readFileSync("docs/developer-demo-pack.md", "utf8");
  assert.match(source, new RegExp(coreRule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(source, /No bridge, outreach, post-quantum integration, or live infrastructure is active today/);
  assert.match(source, /no cryptographic signature is created/i);
  assert.match(source, /does not move money, settle transactions, call APIs, contact agents, or execute actions/i);
});

test("static transcripts contain no endpoints credentials secrets or real payment rails", () => {
  const unsafe = /https?:\/\/|endpoint[_-]?url|api[_-]?key|access[_-]?token|bearer|password|secret|wallet|stripe|checkout|bank[_-]?account/i;
  for (const path of docs.filter((item) => item.includes("demo-transcripts"))) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, unsafe, path);
    assert.match(source, /no action or settlement was executed/i, path);
  }
});

test("quickstart uses configured scripts and states the local safety boundary", () => {
  const source = readFileSync("docs/quickstart-local-demo.md", "utf8");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  assert.equal(packageJson.scripts["demo:gate:allow"], "npm run demo:gate -- --input examples/local-demo-low-risk-allow.json");
  assert.match(source, /npm install/);
  assert.match(source, /npm test/);
  assert.match(source, /npm run demo:gate:allow/);
  assert.match(source, /performs no action, payment, settlement, network call, or external agent contact/i);
});
