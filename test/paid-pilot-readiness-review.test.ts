import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const docPath = "docs/paid-pilot-readiness-review.md";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("paid pilot readiness review exists and README links it", () => {
  assert.equal(existsSync(join(root, docPath)), true, docPath);
  assert.match(read("README.md"), /\(docs\/paid-pilot-readiness-review\.md\)/);
});

test("readiness review mentions P3-M116 through P3-M120 hardening", () => {
  const doc = read(docPath);
  for (const mission of ["P3-M116", "P3-M117", "P3-M118", "P3-M119", "P3-M120"]) {
    assert.match(doc, new RegExp(mission), mission);
  }
  assert.match(doc, /schema and evidence model/i);
  assert.match(doc, /local signed receipt and proof/i);
  assert.match(doc, /adversarial evaluation pack/i);
  assert.match(doc, /simplified developer CLI/i);
  assert.match(doc, /reference integration examples/i);
});

test("staged readiness view is cautious and explicit", () => {
  const doc = read(docPath);
  assert.match(doc, /Public proof-of-concept readiness\s*\|\s*Strong/i);
  assert.match(doc, /Developer evaluation readiness\s*\|\s*Strong/i);
  assert.match(doc, /Paid technical review readiness\s*\|\s*Reasonable/i);
  assert.match(doc, /Local pilot discussion readiness\s*\|\s*Emerging/i);
  assert.match(doc, /Production deployment readiness\s*\|\s*Not yet/i);
  assert.match(doc, /Live payment\/settlement readiness\s*\|\s*Not yet/i);
});

test("paid technical review and local pilot discussion are framed cautiously", () => {
  const doc = read(docPath);
  assert.match(doc, /reasonable to discuss for paid technical review/i);
  assert.match(doc, /local pilot discussion/i);
  assert.match(doc, /integration feasibility review/i);
  assert.match(doc, /All commercial work remains human-reviewed and agreed separately/i);
  assert.match(doc, /No payment or enquiry grants automatic\s+acceptance,\s+automatic access/i);
});

test("readiness review preserves contact email old-email absence and core safety line", () => {
  const doc = read(docPath);
  assert.match(doc, new RegExp(escapeRegExp(contactEmail)));
  assert.match(doc, new RegExp(escapeRegExp(coreLine)));
  assert.doesNotMatch(doc, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("related docs and records mention P3-M121", () => {
  const paths = [
    "README.md",
    "docs/pricing-and-paid-pilot-menu.md",
    "docs/paid-pilot-offer.md",
    "docs/commercial-payment-capture-pack.md",
    "docs/reference-integration-examples.md",
    "docs/simplified-developer-cli.md",
    "docs/adversarial-evaluation-pack.md",
    "docs/local-signed-receipt-and-proof-prototype.md",
    "docs/schema-formalisation-and-evidence-model.md",
    "docs/external-reviewer-signal-and-hardening-roadmap.md",
    "docs/p3-mission-register.md",
    "docs/public-launch-record.md",
    "PUBLIC_LAUNCH_CHECKLIST.md",
    "RELEASE_NOTES.md",
    "CHANGELOG.md",
  ];
  for (const path of paths) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(read(path), /P3-M121/, path);
  }
});

test("old public email is absent from tracked files", () => {
  const tracked = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  assert.equal(tracked.status, 0);
  for (const path of tracked.stdout.split(/\r?\n/).filter(Boolean)) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("readiness review introduces no active live-action payment or deployment language", () => {
  const combined = [
    read(docPath),
    read("README.md"),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
  ].join("\n");

  for (const forbidden of [
    /\bis production-ready\b/i,
    /\bproduction deployment readiness\s*\|\s*(?:ready|strong|complete)\b/i,
    /\blive payment\/settlement readiness\s*\|\s*(?:ready|strong|complete)\b/i,
    /\bsecurity is certified\b/i,
    /\bsecurity certification is (?:granted|complete|active|available)\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?legal guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?financial guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?compliance guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?procurement guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?settlement guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?security guarantee\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bcheckout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bpayment automatically grants\b/i,
    /\bautomatic access is granted\b/i,
    /\bautomatic acceptance is granted\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
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
