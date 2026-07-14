import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const coreRule = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
const publicLaunchFiles = [
  "LICENSE",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "RELEASE_NOTES.md",
  "PUBLIC_LAUNCH_CHECKLIST.md",
] as const;
const launchDocs = [
  "docs/global-code-launch-readiness.md",
  "docs/public-repository-hygiene-checklist.md",
  "docs/global-launch-positioning.md",
] as const;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

test("public launch files and focused global launch documents exist", () => {
  for (const path of [...publicLaunchFiles, ...launchDocs]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("README links the launch pack and preserves the core rule", () => {
  const source = read("README.md");
  assert.ok(source.includes(coreRule));
  assert.match(source, /## Global Code Launch Readiness/);
  for (const path of [...publicLaunchFiles.slice(1), ...launchDocs]) {
    assert.ok(source.includes(path), path);
  }
});

test("global launch documents consistently state the local-only boundary", () => {
  for (const path of launchDocs) {
    const source = read(path);
    assert.match(source, /local-first|local_demo_only/i, path);
    assert.match(source, /AUC is not integrated/i, path);
    assert.match(source, /Agent Contact System is not integrated/i, path);
  }
});

test("security policy keeps real sensitive material out of public issues", () => {
  const source = read("SECURITY.md");
  assert.match(source, /Do not report real secrets[^.]*in public issues/i);
  assert.match(source, /No private security-reporting channel is configured/i);
});

test("public launch checklist retains every required inactive capability", () => {
  const source = read("PUBLIC_LAUNCH_CHECKLIST.md");
  for (const boundary of [
    "No live APIs",
    "No live or real payments",
    "No real settlement or settlement execution",
    "No external agent contact",
  ]) assert.ok(source.includes(boundary), boundary);
});

test("global launch positioning is public but not production payment positioning", () => {
  const source = read("docs/global-launch-positioning.md");
  assert.match(source, /No signed gate pass means no settlement/);
  assert.match(source, /not an official standard/i);
  assert.match(source, /not[^.]*production payment system[^.]*production payment readiness/i);
  assert.doesNotMatch(source, /\b(?:is|offers|provides) production payment readiness\b/i);
});

test("public launch documents contain no operational endpoint or sensitive value", () => {
  const paths = [...publicLaunchFiles, ...launchDocs];
  const endpoint = /https?:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|\b)|localhost(?::\d+)?(?:\/|\b)|\[?::1\]?(?::\d+)?(?:\/|\b))[^\s)`"']+/i;
  const allowedStaticUrls = new Set(["https://gareth1953.github.io/agent-trust-gate/"]);
  const realSecret = /sk_(?:live|test)_[a-z0-9]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i;
  const financialIdentifier = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b|\b0x[a-f0-9]{40}\b|\b(?:routing|sort code|card number)\s*[:=]\s*\d{6,19}\b/i;
  const railInstruction = /\b(?:enable|activate|configure|connect|execute)\s+(?:x402|AP2|Stripe|a payment rail|payment processing)\b/i;

  for (const path of paths) {
    const source = read(path);
    for (const match of source.match(new RegExp(endpoint.source, "gi")) ?? []) {
      const normalized = match.replace(/[.,;:]+$/, "");
      assert.ok(allowedStaticUrls.has(normalized), `${path}: ${match}`);
    }
    assert.doesNotMatch(source, realSecret, path);
    assert.doesNotMatch(source, financialIdentifier, path);
    assert.doesNotMatch(source, railInstruction, path);
  }
});
