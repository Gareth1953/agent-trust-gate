import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const docPath = "docs/pricing-and-paid-pilot-menu.md";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
const priceBands = [
  "£250–£750",
  "£500–£1,500",
  "£1,500–£5,000",
  "£2,500–£7,500",
  "£1,000–£5,000",
  "£5,000+ by separate agreement",
];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("pricing and paid pilot menu exists and README links it", () => {
  assert.equal(existsSync(join(root, docPath)), true, docPath);
  assert.match(read("README.md"), /\(docs\/pricing-and-paid-pilot-menu\.md\)/);
});

test("indicative GBP price bands and options are present", () => {
  const doc = read(docPath);

  for (const band of priceBands) {
    assert.match(doc, new RegExp(escapeRegExp(band)), band);
  }

  for (const option of [
    "Paid Technical Review",
    "Developer Integration Feasibility Review",
    "Local Trust Gate Pilot",
    "Agent Payment / Pre-Settlement Review",
    "AI Governance and Safety Review",
    "Enterprise Evaluation Pack",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(option)), option);
  }
});

test("prices are explicitly indicative non-binding and human-approved", () => {
  const doc = read(docPath);

  assert.match(doc, /indicative discussion ranges only/i);
  assert.match(doc, /not offers,\s+invoices,\s+quotes,\s+or\s+guarantees/i);
  assert.match(doc, /confirmed by human review and separate agreement/i);
  assert.match(doc, /Payment is human-approved and external to the repo/i);
  assert.match(doc, /does not grant\s+automatic acceptance,\s+automatic access/i);
});

test("pricing menu carries contact, old-email absence, and core safety line", () => {
  const doc = read(docPath);

  assert.match(doc, new RegExp(escapeRegExp(contactEmail)));
  assert.match(doc, new RegExp(escapeRegExp(coreLine)));
  assert.doesNotMatch(doc, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("related docs and records mention P3-M114 pricing menu", () => {
  assert.match(read("docs/p3-mission-register.md"), /P3-M114 \| Pricing and Paid Pilot Menu Draft/i);
  assert.match(read("docs/paid-pilot-offer.md"), /\(pricing-and-paid-pilot-menu\.md\)/);
  assert.match(read("docs/commercial-payment-capture-pack.md"), /\(pricing-and-paid-pilot-menu\.md\)/);
  assert.match(read("docs/commercial-contact-copy.md"), /\(pricing-and-paid-pilot-menu\.md\)/);
  assert.match(read("docs/public-launch-record.md"), /P3-M114 adds an indicative non-binding GBP pricing/i);
  assert.match(read("PUBLIC_LAUNCH_CHECKLIST.md"), /\(docs\/pricing-and-paid-pilot-menu\.md\)/);
  assert.match(read("RELEASE_NOTES.md"), /P3-M114: Pricing and Paid Pilot Menu Draft/i);
  assert.match(read("CHANGELOG.md"), /P3-M114 indicative non-binding GBP pricing/i);
});

test("pricing menu does not introduce active payment, checkout, webhook, or live-action language", () => {
  const combined = [
    read(docPath),
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
    /\bprices are binding\b/i,
    /\bguaranteed settlement\b/i,
    /\bguaranteed compliance\b/i,
    /\bguaranteed security\b/i,
    /\bguaranteed procurement\b/i,
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
