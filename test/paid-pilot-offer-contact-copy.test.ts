import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const offerPath = "docs/paid-pilot-offer.md";
const copyPath = "docs/commercial-contact-copy.md";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("paid pilot offer and commercial contact copy docs exist and README links them", () => {
  assert.equal(existsSync(join(root, offerPath)), true, offerPath);
  assert.equal(existsSync(join(root, copyPath)), true, copyPath);
  assert.match(read("README.md"), /\(docs\/paid-pilot-offer\.md\)/);
  assert.match(read("README.md"), /\(docs\/commercial-contact-copy\.md\)/);
  assert.match(read("README.md"), /\(docs\/commercial-payment-capture-pack\.md\)/);
});

test("paid pilot options and enquiry instructions are present", () => {
  const offer = read(offerPath);

  for (const expected of [
    "Paid Technical Review",
    "Local Trust Gate Pilot",
    "Agent Payment / Pre-Settlement Review",
    "AI Governance and Safety Review",
    "Developer Integration Feasibility Review",
    "What to include in an enquiry",
    "Suggested enquiry email subject lines",
  ]) {
    assert.match(offer, new RegExp(escapeRegExp(expected)), expected);
  }
});

test("contact copy contains required human-reviewed templates", () => {
  const copy = read(copyPath);

  for (const expected of [
    "Developer enquiry template",
    "Agent builder enquiry template",
    "Enterprise / governance reviewer enquiry template",
    "Gareth acknowledgement reply template",
    "Not-a-fit reply template",
    "Paid pilot next-step reply template",
  ]) {
    assert.match(copy, new RegExp(escapeRegExp(expected)), expected);
  }
});

test("P3-M113 docs preserve contact, core line, and human payment boundary", () => {
  const combined = [read(offerPath), read(copyPath)].join("\n");

  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  assert.match(combined, new RegExp(escapeRegExp(coreLine)));
  assert.match(combined, /Payment is human-approved and external to the repo/i);
  assert.match(combined, /There is no automatic acceptance and no automatic access/i);
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("launch records mention P3-M113 paid pilot offer and contact copy", () => {
  assert.match(read("docs/p3-mission-register.md"), /P3-M113 \| Paid Pilot Offer Page and Contact Copy/i);
  assert.match(read("docs/public-launch-record.md"), /P3-M113 adds a paid pilot offer page/i);
  assert.match(read("docs/commercial-payment-capture-pack.md"), /\(paid-pilot-offer\.md\)/);
  assert.match(read("docs/commercial-payment-capture-pack.md"), /\(commercial-contact-copy\.md\)/);
  assert.match(read("PUBLIC_LAUNCH_CHECKLIST.md"), /\(docs\/paid-pilot-offer\.md\)/);
  assert.match(read("PUBLIC_LAUNCH_CHECKLIST.md"), /\(docs\/commercial-contact-copy\.md\)/);
  assert.match(read("RELEASE_NOTES.md"), /P3-M113: Paid Pilot Offer and Contact Copy/i);
  assert.match(read("CHANGELOG.md"), /P3-M113 paid pilot offer page/i);
});

test("paid pilot docs do not introduce active payment, checkout, webhook, or live-action language", () => {
  const combined = [
    read(offerPath),
    read(copyPath),
    read("README.md"),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
  ].join("\n");

  for (const forbidden of [
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bcheckout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bpayment automatically grants\b/i,
    /\bautomatic access is granted\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
    /\blegal guarantee\b/i,
    /\bfinancial guarantee\b/i,
    /\bcompliance guarantee\b/i,
    /\bsecurity guarantee\b/i,
    /\bprocurement guarantee\b/i,
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
