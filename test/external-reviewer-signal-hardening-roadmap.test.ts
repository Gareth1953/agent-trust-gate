import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const docPath = "docs/external-reviewer-signal-and-hardening-roadmap.md";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("external reviewer signal roadmap exists and README links it", () => {
  assert.equal(existsSync(join(root, docPath)), true, docPath);
  assert.match(read("README.md"), /\(docs\/external-reviewer-signal-and-hardening-roadmap\.md\)/);
});

test("reviewer feedback is framed as signal and not endorsement", () => {
  const doc = read(docPath);

  assert.match(doc, /external AI reviewer signal/i);
  assert.match(doc, /not endorsement/i);
  assert.match(doc, /not an official endorsement/i);
  assert.match(doc, /not proof of adoption/i);
  assert.match(doc, /not proof of .*market validation/i);
});

test("hardening roadmap items are present", () => {
  const doc = read(docPath);

  for (const item of [
    "Schema formalisation",
    "mandate",
    "evidence",
    "verifiedIntent",
    "risk scoring",
    "Signed receipt and proof verification prototype",
    "Reference integration patterns",
    "Simplified developer CLI",
    "Money-gate proof flow hardening",
    "Adversarial evaluation",
    "replay",
    "forged evidence",
    "expired gate pass",
    "scope creep",
    "missing mandate",
    "invalid or unsigned proof",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(item), "i"), item);
  }
});

test("next mission sequence P3-M116 through P3-M121 is present", () => {
  const doc = read(docPath);

  for (const mission of [
    "P3-M116 — Schema Formalisation and Evidence Model Hardening",
    "P3-M117 — Local Signed Receipt and Proof Prototype",
    "P3-M118 — Adversarial Evaluation Pack",
    "P3-M119 — Simplified Developer CLI",
    "P3-M120 — Reference Integration Examples",
    "P3-M121 — Paid Pilot Readiness Review",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(mission)), mission);
  }
});

test("paid-pilot readiness overclaiming is explicitly avoided", () => {
  const doc = read(docPath);

  assert.match(doc, /should not claim paid-pilot readiness/i);
  assert.match(doc, /does not make the project paid-pilot-ready/i);
  assert.match(doc, /proof-of-concept\s+and\s+inspiration-level/i);
  assert.match(doc, /30-40%/);
  assert.match(doc, /trust theater/i);
});

test("roadmap carries public contact, old-email absence, and core safety line", () => {
  const doc = read(docPath);

  assert.match(doc, new RegExp(escapeRegExp(contactEmail)));
  assert.match(doc, new RegExp(escapeRegExp(coreLine)));
  assert.doesNotMatch(doc, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("related docs and records mention P3-M115", () => {
  assert.match(read("docs/p3-mission-register.md"), /P3-M115 \| External Reviewer Signal and Technical Hardening Roadmap/i);
  assert.match(read("docs/public-launch-record.md"), /P3-M115 captures external AI reviewer signal/i);
  assert.match(read("docs/paid-pilot-offer.md"), /\(external-reviewer-signal-and-hardening-roadmap\.md\)/);
  assert.match(read("docs/pricing-and-paid-pilot-menu.md"), /\(external-reviewer-signal-and-hardening-roadmap\.md\)/);
  assert.match(read("docs/commercial-payment-capture-pack.md"), /\(external-reviewer-signal-and-hardening-roadmap\.md\)/);
  assert.match(read("PUBLIC_LAUNCH_CHECKLIST.md"), /\(docs\/external-reviewer-signal-and-hardening-roadmap\.md\)/);
  assert.match(read("RELEASE_NOTES.md"), /P3-M115: External Reviewer Signal and Hardening Roadmap/i);
  assert.match(read("CHANGELOG.md"), /P3-M115 external AI reviewer signal/i);
});

test("roadmap docs do not introduce active payment, deployment, endorsement, or live-action language", () => {
  const combined = [
    read(docPath),
    read("README.md"),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
  ].join("\n");

  for (const forbidden of [
    /\bofficially endorsed by\b/i,
    /\bendorsed by Grok\b/i,
    /\bendorsed by xAI\b/i,
    /\bendorsed by OpenAI\b/i,
    /\bis paid-pilot-ready\b/i,
    /\bis production-ready\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bcheckout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bdeployment is (?:performed|active|available|configured)\b/i,
    /\bexternal-agent contact is (?:enabled|active|available|configured)\b/i,
    /\bAUC is integrated\b/i,
    /\bAgent Contact System is integrated\b/i,
    /\bexecutes actions\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }

  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));
  assert.doesNotMatch(combined, /sk_(?:live|test)_[a-z0-9]{16,}/i);
  assert.doesNotMatch(combined, /AKIA[0-9A-Z]{16}/);
  assert.doesNotMatch(combined, /gh[pousr]_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(combined, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i);
  assert.doesNotMatch(combined, /\b0x[a-f0-9]{40}\b/i);
});
