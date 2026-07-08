import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const omnichannelDocs = [
  "docs/public-omnichannel-code-launch-plan.md",
  "docs/omnichannel-architecture-principles.md",
  "docs/channel-readiness-matrix.md",
  "docs/global-code-launch-sequence.md",
  "docs/code-first-contact-model.md",
] as const;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

test("omnichannel planning documents exist", () => {
  for (const path of omnichannelDocs) assert.equal(existsSync(path), true, path);
});

test("README links every omnichannel planning document", () => {
  const source = read("README.md");
  assert.match(source, /## Public Omnichannel Code Launch Direction/);
  for (const path of omnichannelDocs) assert.ok(source.includes(path), path);
});

test("mission register records P3-M105", () => {
  assert.match(read("docs/p3-mission-register.md"), /P3-M105 \| Public Omnichannel Code Launch Plan/);
});

test("channel matrix preserves conservative integration boundaries", () => {
  const source = read("docs/channel-readiness-matrix.md");
  assert.match(source, /AUC is not integrated/i);
  assert.match(source, /Agent Contact System is not integrated/i);
  assert.match(source, /Live payment\/settlement is not approved/i);
  assert.match(source, /No active MCP\/A2A integration/i);
  assert.match(source, /No hosted sandbox is active/i);
});

test("code-first contact model prohibits direct and automated contact", () => {
  const source = read("docs/code-first-contact-model.md");
  assert.match(source, /No phone calls/i);
  assert.match(source, /No automated outreach/i);
  assert.match(source, /No live agent contact/i);
});

test("architecture principles require one shared Trust Gate core", () => {
  const source = read("docs/omnichannel-architecture-principles.md");
  assert.match(source, /One Trust Gate core\. Many future surfaces\. Same rules\. Same receipts\. Same safety boundary\./);
  assert.match(source, /Do not duplicate decision logic per channel/i);
});

test("omnichannel documents do not claim active future integrations", () => {
  const source = omnichannelDocs.map(read).join("\n");
  const activeClaim = /\b(?:MCP\/A2A (?:integration|adapter)|hosted sandbox|live (?:payment|settlement))\b[^.\n]*\bis active\b|\bactive (?:MCP\/A2A (?:integration|adapter)|hosted sandbox|live (?:payment|settlement))\b/i;
  for (const line of source.split(/\r?\n/)) {
    if (activeClaim.test(line)) {
      assert.match(line, /\b(?:no|not)\b/i, line);
    }
  }
  assert.match(source, /No MCP\/A2A integration is active/i);
  assert.match(source, /no hosted sandbox is active/i);
  assert.match(source, /Live payment\/settlement is not approved/i);
});

test("omnichannel documents contain no real endpoint or sensitive operational value", () => {
  const paths = [...omnichannelDocs, "docs/global-launch-positioning.md", "PUBLIC_LAUNCH_CHECKLIST.md"];
  const externalEndpoint = /https?:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|\b)|localhost(?::\d+)?(?:\/|\b)|\[?::1\]?(?::\d+)?(?:\/|\b))[^\s)`"']+/i;
  const realSecret = /sk_(?:live|test)_[a-z0-9]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i;
  const financialIdentifier = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b|\b0x[a-f0-9]{40}\b|\b(?:routing|sort code|card number)\s*[:=]\s*\d{6,19}\b/i;
  const railInstruction = /\b(?:enable|activate|configure|connect|execute)\s+(?:x402|AP2|Stripe|a payment rail|payment processing)\b/i;

  for (const path of paths) {
    const source = read(path);
    assert.doesNotMatch(source, externalEndpoint, path);
    assert.doesNotMatch(source, realSecret, path);
    assert.doesNotMatch(source, financialIdentifier, path);
    assert.doesNotMatch(source, railInstruction, path);
  }
});
