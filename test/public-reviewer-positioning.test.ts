import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  PUBLIC_REVIEWER_POSITIONING_FIRST_COMMAND,
  getPublicReviewerPositioningSummary,
  summarisePublicReviewerPositioning,
  type PublicReviewerPositioningSummary,
} from "../src/public-reviewer-positioning.js";
import {
  runPublicReviewerPositioningCli,
  type PublicReviewerPositioningCliIo,
} from "../src/public-reviewer-positioning-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/public-readme-reviewer-positioning-polish.md",
  "docs/reviewer-first-public-positioning.md",
  "docs/public-positioning-claims-boundary.md",
];
const reviewerKitDocs = [
  "docs/one-command-reviewer-demo-kit.md",
  "docs/reviewer-demo-kit-quickstart.md",
  "docs/reviewer-demo-output-guide.md",
  "docs/reviewer-demo-limitations-and-safety-boundary.md",
  "docs/reviewer-evaluation-checklist.md",
];
const scorecardDocs = [
  "docs/gatepass-adversarial-metrics-and-latency-scorecard.md",
  "docs/gatepass-metrics-methodology.md",
  "docs/gatepass-adversarial-scenario-catalog.md",
  "docs/gatepass-latency-measurement-guide.md",
  "docs/gatepass-reviewer-scorecard-guide.md",
];
const wrapperDocs = [
  "docs/gatepass-developer-wrapper-and-local-integration-example.md",
  "docs/gatepass-wrap-tool-developer-guide.md",
  "docs/local-agent-framework-integration-example.md",
  "docs/gatepass-wrapper-policy-guide.md",
  "docs/gatepass-wrapper-limitations-and-safety-boundary.md",
];
const examplePath = "examples/public-reviewer-positioning-summary.json";
const corePhrases = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "No signed GatePass. No settlement.",
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

function assertSafety(summary: PublicReviewerPositioningSummary | ReturnType<typeof summarisePublicReviewerPositioning>): void {
  assert.equal(summary.localDemoOnly, true);
  assert.equal(summary.realToolExecution, false);
  assert.equal(summary.actionExecution, false);
  assert.equal(summary.networkCalls, false);
  assert.equal(summary.productionMiddleware, false);
  assert.equal(summary.productionBenchmark, false);
  assert.equal(summary.productionCertification, false);
  assert.equal(summary.securityCertification, false);
  assert.equal(summary.legalComplianceGuarantee, false);
  assert.equal(summary.paymentAuthorisation, false);
  assert.equal(summary.settlementAuthorisation, false);
}

test("README is reviewer-first and points to the one-command kit before secondary demos", () => {
  const readme = read("README.md");
  assert.match(readme, /30-second reviewer summary/i);
  assert.match(readme, /What to run first/i);
  assert.match(readme, /Reviewer quickstart/i);
  assert.match(readme, /Reviewer path/i);
  assert.match(readme, /Core proof flow/i);
  assert.match(readme, /What this proves locally/i);
  assert.match(readme, /What this does not prove/i);
  assert.match(readme, /Core demos/i);
  assert.match(readme, /Why GatePass exists/i);
  assert.match(readme, /Safety boundary/i);
  assert.match(readme, /Public contact/i);

  const firstReviewerKit = readme.indexOf("npm run demo:reviewer-kit");
  const firstRoundTrip = readme.indexOf("npm run demo:gatepass-round-trip");
  const firstScorecard = readme.indexOf("npm run demo:gatepass-scorecard");
  const firstWrapper = readme.indexOf("npm run demo:gatepass-wrapper");
  assert.ok(firstReviewerKit >= 0);
  assert.ok(firstReviewerKit < firstRoundTrip);
  assert.ok(firstReviewerKit < firstScorecard);
  assert.ok(firstReviewerKit < firstWrapper);

  assert.match(readme, /npm run demo:reviewer-kit -- --summary-only/);
  assert.match(readme, /npm run demo:reviewer-kit -- --json/);
  assert.match(readme, /local-only proof-of-concept/i);
  assert.match(readme, /local deterministic demos only/i);
  assert.match(readme, /No real tool execution occurs/i);
  assert.match(readme, /No payment or settlement is authorised/i);
  assert.match(readme, /No production benchmark or security certification is claimed/i);
  assert.match(readme, /Agent\s+Trust Language remains supporting material only/i);
  assert.match(readme, /GatePass proof vocabulary/i);
  assert.match(readme, /GatePass claims vocabulary/i);
});

test("README links to reviewer kit scorecard wrapper and positioning docs", () => {
  const readme = read("README.md");
  for (const path of [...docs, ...reviewerKitDocs, ...scorecardDocs, ...wrapperDocs, examplePath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
});

test("public positioning helper and CLI expose deterministic summary data", () => {
  const summary = getPublicReviewerPositioningSummary();
  assertSafety(summary);
  assert.equal(summary.recommendedFirstCommand, PUBLIC_REVIEWER_POSITIONING_FIRST_COMMAND);
  assert.equal(summary.publicContact, contactEmail);
  assert.equal(summary.agentTrustLanguageRole, "supporting_material_only");
  assert.ok(summary.allowedClaims.includes("local-first proof-of-concept"));
  assert.ok(summary.allowedClaims.includes("GatePass proof vocabulary and GatePass claims vocabulary as supporting material"));
  assert.ok(summary.disallowedClaims.includes("production ready"));
  assert.ok(summary.disallowedClaims.includes("guaranteed trust"));
  assert.match(summary.safetyBoundary, /reviewer kit is the recommended first run/i);

  const compact = summarisePublicReviewerPositioning(summary);
  assertSafety(compact);
  assert.equal("allowedClaims" in compact, false);
  assert.equal("disallowedClaims" in compact, false);

  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: PublicReviewerPositioningCliIo = {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  };
  assert.equal(runPublicReviewerPositioningCli(["--summary-only"], io), 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /Public README \/ reviewer positioning summary/);
  assert.doesNotMatch(stdout[0] ?? "", /disallowed claims:/);
});

test("public positioning CLI JSON mode prints valid JSON only", () => {
  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/public-reviewer-positioning-cli.js"),
    "--json",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as PublicReviewerPositioningSummary;
  assertSafety(parsed);
  assert.equal(parsed.recommendedFirstCommand, "npm run demo:reviewer-kit");
});

test("machine-readable public reviewer positioning summary preserves safety flags", () => {
  const example = readJson<PublicReviewerPositioningSummary>(examplePath);
  assert.equal(example.project, "Agent Trust Gate");
  assert.equal(example.recommendedFirstCommand, "npm run demo:reviewer-kit");
  assert.ok(example.secondaryCommands.includes("npm run demo:gatepass-round-trip"));
  assert.ok(example.secondaryCommands.includes("npm run demo:gatepass-scorecard"));
  assert.ok(example.secondaryCommands.includes("npm run demo:gatepass-wrapper"));
  assert.ok(example.allowedClaims.includes("local-first proof-of-concept"));
  assert.ok(example.disallowedClaims.includes("automatic access after payment"));
  assert.equal(example.publicContact, contactEmail);
  assertSafety(example);
});

test("P3-M140A metadata docs and core phrases are present", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read("llms.txt"),
    read("agent-trust-gate.manifest.json"),
    read("agent-trust-gate.agent-card.json"),
  ].join("\n");

  assert.match(combined, /P3-M140A/);
  assert.match(combined, /reviewer kit is (?:now )?the recommended first run/i);
  assert.match(combined, /GatePass remains the headline/i);
  assert.match(combined, /Agent Trust Language remains supporting material/i);
  assert.match(combined, /GatePass proof vocabulary/i);
  assert.match(combined, /GatePass claims vocabulary/i);
  assert.match(combined, /common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence/i);
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  for (const phrase of corePhrases) assert.match(combined, new RegExp(escapeRegExp(phrase)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("public positioning docs introduce no forbidden positive claims", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read(examplePath),
  ].join("\n");
  const forbidden = [
    /\b(?:is|are|has been|have been) production ready\b/i,
    /\bproduction-grade crypto (?:is|has been) (?:implemented|enabled|provided|certified)\b/i,
    /\b(?:is|are|has been|have been) certified secure\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?legal guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?compliance guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?security guarantee\b/i,
    /\b(?:claims|states|says|asserts) (?:that )?(?:an|the) agent is proven safe\b/i,
    /\bGatePass makes (?:an|the) agent proven safe\b/i,
    /\bguaranteed trust (?:is|has been) (?:provided|confirmed|granted|achieved)\b/i,
    /\breal payment readiness (?:is|has been) (?:confirmed|achieved|provided)\b/i,
    /\breal settlement readiness (?:is|has been) (?:confirmed|achieved|provided)\b/i,
    /\bautomatic paid-pilot acceptance (?:is|has been) (?:confirmed|provided|granted)\b/i,
    /\bautomatic access after payment (?:is|has been) (?:confirmed|provided|granted)\b/i,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(combined, pattern);
});

test("package script and exports exist", () => {
  const packageJson = read("package.json");
  assert.match(packageJson, /demo:public-positioning/);
  assert.match(packageJson, /public-reviewer-positioning\.test\.js/);
  assert.equal(existsSync(join(root, "src/public-reviewer-positioning.ts")), true);
  assert.equal(existsSync(join(root, "src/public-reviewer-positioning-cli.ts")), true);
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
