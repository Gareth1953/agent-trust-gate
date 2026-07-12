import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  PAID_PILOT_OFFER_CONTACT,
  PAID_PILOT_OFFER_FIRST_COMMAND,
  getPaidPilotOffer,
  summarisePaidPilotOffer,
  type PaidPilotOffer,
} from "../src/paid-pilot-offer.js";
import {
  runPaidPilotOfferCli,
  type PaidPilotOfferCliIo,
} from "../src/paid-pilot-offer-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/paid-pilot-commercial-entry.md",
  "docs/paid-pilot-scope-and-deliverables.md",
  "docs/buyer-evaluation-journey.md",
  "docs/paid-pilot-pricing-boundary.md",
  "docs/paid-pilot-enquiry-template.md",
];
const examplePath = "examples/paid-pilot-offer.json";
const corePhrases = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jsonFilesUnder(path: string): string[] {
  const full = join(root, path);
  const files: string[] = [];
  for (const entry of readdirSync(full)) {
    const child = join(path, entry);
    const childFull = join(root, child);
    if (statSync(childFull).isDirectory()) files.push(...jsonFilesUnder(child));
    else if (entry.endsWith(".json")) files.push(child);
  }
  return files;
}

function gitFiles(args: string[]): string[] {
  const result = spawnSync("git", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function assertSafety(offer: PaidPilotOffer | ReturnType<typeof summarisePaidPilotOffer>): void {
  assert.equal(offer.localDemoOnly, true);
  assert.equal(offer.manualInputOnly, true);
  assert.equal(offer.humanApproved, true);
  assert.equal(offer.nonProduction, true);
  assert.equal(offer.nonCustodial, true);
  assert.equal(offer.nonAutonomous, true);
  assert.equal(offer.advisoryOnly, true);
  assert.equal(offer.realToolExecution, false);
  assert.equal(offer.actionExecution, false);
  assert.equal(offer.networkCalls, false);
  assert.equal(offer.liveApi, false);
  assert.equal(offer.mcpServerFunctionality, false);
  assert.equal(offer.paymentIntegration, false);
  assert.equal(offer.paymentLinks, false);
  assert.equal(offer.checkout, false);
  assert.equal(offer.livePaymentProcessing, false);
  assert.equal(offer.paypalApiIntegration, false);
  assert.equal(offer.stripeIntegration, false);
  assert.equal(offer.webhookIntegration, false);
  assert.equal(offer.walletBankingLogic, false);
  assert.equal(offer.settlementExecution, false);
  assert.equal(offer.productionSigning, false);
  assert.equal(offer.productionCertification, false);
  assert.equal(offer.securityCertification, false);
  assert.equal(offer.legalComplianceGuarantee, false);
  assert.equal(offer.guaranteedResults, false);
  assert.equal(offer.automaticAcceptance, false);
  assert.equal(offer.automaticAccessAfterPayment, false);
}

test("paid pilot docs example README links and package command exist", () => {
  const readme = read("README.md");
  for (const path of [...docs, examplePath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /Paid Evaluation Pilot/i);
  assert.match(readme, /SEE IT/i);
  assert.match(readme, /TEST IT/i);
  assert.match(readme, /BUY A PILOT/i);
  assert.match(readme, /npm run demo:paid-pilot/);
  assert.match(read("package.json"), /demo:paid-pilot/);
});

test("reviewer kit remains the first recommended README command", () => {
  const readme = read("README.md");
  const firstReviewerKit = readme.indexOf("npm run demo:reviewer-kit");
  const firstPaidPilot = readme.indexOf("npm run demo:paid-pilot");
  assert.ok(firstReviewerKit >= 0);
  assert.ok(firstPaidPilot > firstReviewerKit);
});

test("paid pilot model exposes cautious commercial offer and safety flags", () => {
  const offer = getPaidPilotOffer();
  assertSafety(offer);
  assert.equal(offer.name, "Agent Trust Gate Paid Evaluation Pilot");
  assert.equal(offer.status, "human_reviewed_enquiry_only");
  assert.equal(offer.publicContact, PAID_PILOT_OFFER_CONTACT);
  assert.equal(offer.recommendedFirstCommand, PAID_PILOT_OFFER_FIRST_COMMAND);
  assert.equal(offer.startingCurrency, "GBP");
  assert.equal(offer.indicativeStartingPrice, 1500);
  assert.match(offer.priceQualifier, /£1,500/);
  assert.ok(offer.evaluatedControls.includes("mandate"));
  assert.ok(offer.evaluatedControls.includes("evidence"));
  assert.ok(offer.evaluatedControls.includes("verified intent"));
  assert.ok(offer.evaluatedControls.includes("approval status"));
  assert.ok(offer.evaluatedControls.includes("action scope"));
  assert.ok(offer.evaluatedControls.includes("value or spend limits"));
  assert.ok(offer.evaluatedControls.includes("GatePass validity"));
  assert.ok(offer.evaluatedControls.includes("refusal reasons"));
  assert.ok(offer.evaluatedControls.includes("audit and trust-receipt output"));
  assert.match(offer.paymentBoundary, /PayPal may be used for manually approved invoices if separately agreed/);
  assert.match(offer.paymentBoundary, /no PayPal API integration/);
});

test("paid pilot summary omits long detail arrays but keeps safety and commercial fields", () => {
  const summary = summarisePaidPilotOffer();
  assertSafety(summary);
  assert.equal(summary.offerIdentifier, "atg-paid-evaluation-pilot");
  assert.equal(summary.indicativeStartingPrice, 1500);
  assert.equal("includedDeliverables" in summary, false);
  assert.equal("exclusions" in summary, false);
});

test("paid pilot CLI supports summary-only and JSON-only output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: PaidPilotOfferCliIo = {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  };
  assert.equal(runPaidPilotOfferCli(["--summary-only"], io), 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /Agent Trust Gate Paid Evaluation Pilot/);
  assert.doesNotMatch(stdout[0] ?? "", /included deliverables:/);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/paid-pilot-offer-cli.js"),
    "--json",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as PaidPilotOffer;
  assertSafety(parsed);
  assert.equal(parsed.indicativeStartingPrice, 1500);
});

test("machine-readable paid pilot offer example preserves boundaries", () => {
  const example = readJson<PaidPilotOffer & {
    schemaVersion: string;
    lastUpdated: string;
    paymentIntegrationStatus: string;
    manualPayPalInvoiceMayBeAgreedSeparately: boolean;
    contactEmail: string;
  }>(examplePath);
  assert.equal(example.schemaVersion, "atg.paid-pilot-offer.example.v1");
  assert.equal(example.name, "Agent Trust Gate Paid Evaluation Pilot");
  assert.equal(example.contactEmail, contactEmail);
  assert.equal(example.indicativeStartingPrice, 1500);
  assert.equal(example.paymentIntegrationStatus, "none_in_repository");
  assert.equal(example.manualPayPalInvoiceMayBeAgreedSeparately, true);
  assertSafety(example);
});

test("P3-M141 metadata docs and core phrases are present", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read("llms.txt"),
    read("agent-trust-gate.manifest.json"),
    read("agent-trust-gate.agent-card.json"),
  ].join("\n");

  assert.match(combined, /P3-M141/);
  assert.match(combined, /Agent Trust Gate(?:™|\(TM\)) Paid Evaluation Pilot/);
  assert.match(combined, /reviewer kit remains the recommended first/i);
  assert.match(combined, /GatePass remains (?:the )?headline/i);
  assert.match(combined, /Agent Trust Language remains supporting material/i);
  assert.match(combined, /starts? from\s+(?:\*\*)?£1,500/i);
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  for (const phrase of corePhrases) assert.match(combined, new RegExp(escapeRegExp(phrase)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("paid pilot docs introduce no forbidden positive commercial or live-action claims", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read(examplePath),
  ].join("\n");
  const forbidden = [
    /\b(?:is|are|has been|have been) production ready\b/i,
    /\bproduction-grade crypto (?:is|has been) (?:implemented|enabled|provided|certified)\b/i,
    /\b(?:is|are|has been|have been) certified secure\b/i,
    /\bguaranteed safety (?:is|has been) (?:provided|confirmed|granted|achieved)\b/i,
    /\bguaranteed trust (?:is|has been) (?:provided|confirmed|granted|achieved)\b/i,
    /\bguaranteed commercial results? (?:is|are|has been|have been) (?:provided|confirmed|granted|achieved)\b/i,
    /\breal payment readiness (?:is|has been) (?:confirmed|achieved|provided)\b/i,
    /\breal settlement readiness (?:is|has been) (?:confirmed|achieved|provided)\b/i,
    /\bPayPal API integration (?:is|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\bStripe integration (?:is|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\bcheckout (?:is|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\bpayment links? (?:are|is|have been|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\bwebhooks? (?:are|is|have been|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\bsettlement execution (?:is|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\baction execution (?:is|has been) (?:implemented|enabled|provided|configured)\b/i,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(combined, pattern);
  assert.doesNotMatch(combined, /https?:\/\/(?:www\.)?(?:paypal|stripe)\./i);
  assert.doesNotMatch(combined, /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+/);
});

test("package version is unchanged and paid pilot files are exported", () => {
  const packageJson = readJson<{ version: string; scripts: Record<string, string> }>("package.json");
  assert.equal(packageJson.version, "0.1.0");
  const demoScript = packageJson.scripts["demo:paid-pilot"];
  if (typeof demoScript !== "string") throw new Error("demo:paid-pilot script is missing");
  assert.match(demoScript, /paid-pilot-offer-cli\.js/);
  assert.match(read("src/index.ts"), /paid-pilot-offer/);
});

test("all repository JSON examples schemas and metadata remain valid", () => {
  const files = [
    ...jsonFilesUnder("examples"),
    ...jsonFilesUnder("schemas"),
    "agent-trust-gate.manifest.json",
    "agent-trust-gate.agent-card.json",
  ];
  for (const file of files) assert.doesNotThrow(() => readJson<unknown>(file), file);
});

test("old public email is absent from tracked files", () => {
  const tracked = gitFiles(["ls-files"]);
  for (const file of tracked) {
    if (!existsSync(join(root, file))) continue;
    const content = read(file);
    assert.doesNotMatch(content, new RegExp(escapeRegExp(oldEmail), "i"), file);
  }
});
