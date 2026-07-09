import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const docPath = "docs/commercial-payment-capture-pack.md";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
const enquiryLine = "To request a paid pilot or commercial review, contact: `gpmiddleton71@gmail.com`";

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("commercial payment-capture pack exists and README links it", () => {
  assert.equal(existsSync(join(root, docPath)), true, docPath);
  assert.match(read("README.md"), /\(docs\/commercial-payment-capture-pack\.md\)/);
});

test("commercial enquiry wording and contact route are present", () => {
  const doc = read(docPath);

  assert.match(doc, new RegExp(escapeRegExp(contactEmail)));
  assert.match(doc, new RegExp(escapeRegExp(enquiryLine)));
  assert.match(doc, /Paid Technical Review/);
  assert.match(doc, /Local Integration Feasibility Review/);
  assert.match(doc, /Trust Gate Pilot Pack/);
  assert.match(doc, /Pre-Settlement Trust Review/);
  assert.match(doc, /Agent Safety \/ Governance Review/);
});

test("commercial pack preserves safety line and human approval boundary", () => {
  const doc = read(docPath);

  assert.match(doc, new RegExp(escapeRegExp(coreLine)));
  assert.match(doc, /Payment is human-approved and external to the repo/i);
  assert.match(doc, /no automatic acceptance/i);
  assert.match(doc, /No access, service, API key, hosted system, settlement capability, or agent\s+contact is automatically granted/i);
  assert.match(doc, /all commercial work is human-reviewed and agreed separately/i);
  assert.doesNotMatch(doc, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("launch records mention P3-M112 commercial payment-capture pack", () => {
  assert.match(read("docs/p3-mission-register.md"), /P3-M112 \| Commercial Payment Capture Pack/i);
  assert.match(read("docs/public-launch-record.md"), /P3-M112 adds a commercial payment-capture pack/i);
  assert.match(read("docs/public-repo-discovery-polish.md"), /\(commercial-payment-capture-pack\.md\)/);
  assert.match(read("PUBLIC_LAUNCH_CHECKLIST.md"), /\(docs\/commercial-payment-capture-pack\.md\)/);
  assert.match(read("RELEASE_NOTES.md"), /P3-M112: Commercial Payment Capture Pack/i);
  assert.match(read("CHANGELOG.md"), /P3-M112 commercial payment-capture pack/i);
});

test("commercial pack does not introduce active payment or live-action language", () => {
  const combined = [
    read(docPath),
    read("README.md"),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
    read("docs/public-repo-discovery-polish.md"),
  ].join("\n");

  for (const forbidden of [
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bhosted checkout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bpayment automatically grants\b/i,
    /\bautomatic access is granted\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
    /\blive agent connection is (?:enabled|active|available|configured)\b/i,
    /\bwallet functionality is (?:enabled|active|available|configured)\b/i,
    /\bbanking integration is (?:enabled|active|available|configured)\b/i,
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
  assert.doesNotMatch(combined, /https:\/\/(?:checkout|hooks|api)\./i);
});
