import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const documents = [
  "docs/P3-M155-buyer-pilot-pack.md",
  "docs/P3-M155-buyer-demo-script.md",
  "docs/P3-M155-controlled-pilot-integration-guide.md",
  "docs/P3-M155-public-screenshot-plan.md",
  "docs/P3-M155-prototype-adversarial-hardening-buyer-pilot-report.md",
] as const;

const read = (path: string): string => readFileSync(path, "utf8");

test("M155 buyer deliverables exist and keep the working local pilot-ready status", () => {
  for (const path of documents) {
    assert.equal(existsSync(path), true, path);
    assert.match(read(path), /working local pilot-ready prototype/i, path);
  }
});
test("buyer pilot pack covers all twenty required conversation topics", () => {
  const source = read(documents[0]);
  for (const heading of [
    "What ATG is", "exact problem ATG solves", "working prototype proves", "Six-stage control flow",
    "Allowed example", "Refused £31,000 example", "Replay-block example", "Human Authority Proof",
    "Agent Standing", "Exact Action Binding", "GatePass", "Trust Receipt", "Integration boundary",
    "controlled buyer pilot would require", "data the buyer would provide", "ATG would evaluate",
    "buyer would receive", "Current limitations", "Pilot safety boundaries", "Claims boundary",
  ]) assert.match(source, new RegExp(heading, "i"), heading);
});

test("buyer demo script follows the allow, receipt, replay and overspend story", () => {
  const source = read(documents[1]);
  const ordered = ["Here is the human", "Run ATG", "Simulate purchase", "Open Trust Receipt", "Replay the GatePass", "£31,000 refusal", "integration boundary"];
  let previous = -1;
  for (const item of ordered) {
    const index = source.indexOf(item);
    assert.ok(index > previous, item);
    previous = index;
  }
  assert.match(source, /ATG does not ask whether an AI agent is generally trusted/);
});

test("README and reviewer start make the browser prototype the public first experience", () => {
  const readme = read("README.md");
  const reviewer = read("REVIEWER_START_HERE.md");
  assert.match(readme, /WORKING EXACT ACTION TRUST GATEWAY PROTOTYPE/);
  assert.match(readme, /npm install/);
  assert.match(readme, /npm run prototype:exact-action\b/);
  assert.match(readme, /npm run prototype:exact-action:smoke/);
  assert.ok(reviewer.indexOf("npm run prototype:exact-action") < reviewer.indexOf("npm run reviewer"));
});

test("buyer UI exposes root-cause, executive/detail and local receipt controls", () => {
  const html = read("prototype/exact-action/index.html");
  const app = read("prototype/exact-action/app.js");
  assert.match(html, /Executive Summary/);
  assert.match(html, /Full human-readable audit detail/);
  assert.match(html, /Download JSON/);
  assert.match(html, /Download text/);
  assert.match(app, /WHY ATG BLOCKED THIS ACTION/);
  assert.match(app, /Additional checks affected/);
  assert.match(app, /URL\.createObjectURL/);
});

test("M155 public artifacts contain no secret pattern, private local path or production overclaim", () => {
  const paths = [...documents, "prototype/exact-action/index.html", "prototype/exact-action/app.js"];
  const secret = /sk_(?:live|test)_[a-z0-9]{12,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i;
  const privatePath = /[A-Z]:\\Users\\|\/Users\/[^/]+\//i;
  const overclaim = /\b(?:production ready|certified compliant|regulator approved|bank grade|guaranteed secure|guaranteed compliance)\b/i;
  for (const path of paths) {
    const source = read(path);
    assert.doesNotMatch(source, secret, path);
    assert.doesNotMatch(source, privatePath, path);
    assert.doesNotMatch(source, overclaim, path);
  }
});
