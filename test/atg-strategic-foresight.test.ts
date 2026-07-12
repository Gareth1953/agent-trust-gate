import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  ATG_STRATEGIC_FORESIGHT_WORKFLOW,
  buildStrategicForesightReport,
  getForesightSignalCategories,
  scoreForesightSignal,
  summariseStrategicForesightReport,
  type ForesightReport,
} from "../src/atg-strategic-foresight.js";
import {
  runStrategicForesightCli,
  type StrategicForesightCliIo,
} from "../src/atg-strategic-foresight-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/atg-strategic-foresight-layer.md",
  "docs/agent-market-radar-methodology.md",
  "docs/foresight-signal-categories.md",
  "docs/foresight-recommendation-scoring-guide.md",
  "docs/foresight-human-approval-workflow.md",
  "docs/foresight-sample-market-radar-report.md",
];
const examplePath = "examples/atg-strategic-foresight-report.json";
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

function assertSafetyFlags(report: Pick<
  ForesightReport,
  | "localDemoOnly"
  | "advisoryOnly"
  | "manualInputOnly"
  | "liveMonitoring"
  | "autonomousLearning"
  | "autonomousProductChanges"
  | "autonomousRoadmapChanges"
  | "autonomousCodeChanges"
  | "autonomousOutreach"
  | "scraping"
  | "networkCalls"
  | "liveAgentContact"
  | "directBotMessaging"
  | "actionExecution"
  | "predictionGuarantee"
  | "humanApprovalRequired"
>): void {
  assert.equal(report.localDemoOnly, true);
  assert.equal(report.advisoryOnly, true);
  assert.equal(report.manualInputOnly, true);
  assert.equal(report.liveMonitoring, false);
  assert.equal(report.autonomousLearning, false);
  assert.equal(report.autonomousProductChanges, false);
  assert.equal(report.autonomousRoadmapChanges, false);
  assert.equal(report.autonomousCodeChanges, false);
  assert.equal(report.autonomousOutreach, false);
  assert.equal(report.scraping, false);
  assert.equal(report.networkCalls, false);
  assert.equal(report.liveAgentContact, false);
  assert.equal(report.directBotMessaging, false);
  assert.equal(report.actionExecution, false);
  assert.equal(report.predictionGuarantee, false);
  assert.equal(report.humanApprovalRequired, true);
}

test("foresight docs and machine-readable report exist and README links them", () => {
  const readme = read("README.md");
  for (const path of [...docs, examplePath]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /ATG Strategic Foresight Layer/);
  assert.match(readme, /npm run demo:foresight/);
  assert.match(readme, /npm run demo:foresight -- --summary-only/);
  assert.match(readme, /npm run demo:foresight -- --json/);
  assert.match(readme, /local advisory layer only/i);
  assert.match(readme, /does not fetch live market data/i);
  assert.match(readme, /does not scrape/i);
  assert.match(readme, /does not monitor in the background/i);
  assert.match(readme, /does not change the\s+roadmap or product automatically/i);
  assert.match(readme, /Gareth approval is required before any build\s+mission/i);

  const firstReviewerKit = readme.indexOf("npm run demo:reviewer-kit");
  const firstForesight = readme.indexOf("npm run demo:foresight");
  assert.ok(firstReviewerKit >= 0);
  assert.ok(firstForesight >= 0);
  assert.ok(firstReviewerKit < firstForesight);
});

test("foresight report includes categories signals recommendations and approval workflow", () => {
  const report = buildStrategicForesightReport();
  assertSafetyFlags(report);
  assert.equal(report.project, "Agent Trust Gate");
  assert.equal(report.layerName, "ATG Strategic Foresight Layer");
  assert.equal(report.publicContact, contactEmail);
  assert.deepEqual(report.workflow, ATG_STRATEGIC_FORESIGHT_WORKFLOW);
  assert.ok(report.signalCategories.length >= 16);
  assert.ok(report.sampleSignals.length >= 5);
  assert.equal(report.recommendedMissions.length, report.sampleSignals.length);
  assert.ok(report.recommendedMissions.every((mission) => mission.humanApprovalRequired));
  assert.ok(report.recommendedMissions.every((mission) => mission.buildAutomatically === false));
  assert.match(report.safetyBoundary, /Human approval is required/);
  assert.equal(report.agentTrustLanguageRole, "supporting_material_only");
});

test("foresight categories cover required signal areas", () => {
  const names = getForesightSignalCategories().map((category) => category.name);
  for (const expected of [
    "AI agent frameworks",
    "tool-calling patterns",
    "developer wrapper patterns",
    "MCP-style protocols",
    "agent-to-agent protocols",
    "AI payment protocols",
    "machine-to-machine payment signals",
    "pre-settlement trust signals",
    "agent security/governance competitors",
    "enterprise agent adoption",
    "developer integration trends",
    "AGI and agent-risk signals",
    "quantum computing signals",
    "post-quantum security signals",
    "standards and regulation signals",
    "reviewer/developer feedback signals",
  ]) {
    assert.ok(names.includes(expected), expected);
  }
});

test("scoring is advisory and human-approved only", () => {
  const report = buildStrategicForesightReport();
  const signal = report.sampleSignals[0];
  assert.ok(signal);
  const score = scoreForesightSignal(signal);
  assert.equal(score.humanApprovalRequired, true);
  assert.ok(score.relevanceToGatePass >= 1 && score.relevanceToGatePass <= 5);
  assert.ok(score.urgency >= 1 && score.urgency <= 5);
  assert.ok(score.safetyRisk >= 1 && score.safetyRisk <= 5);

  const summary = summariseStrategicForesightReport(report);
  assertSafetyFlags(summary);
  assert.equal(summary.recommendedFirstReviewerCommand, "npm run demo:reviewer-kit");
  assert.equal(summary.foresightCommand, "npm run demo:foresight");
  assert.equal(summary.signalCategoryCount, report.signalCategories.length);
});

test("foresight CLI supports summary and JSON modes", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: StrategicForesightCliIo = {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  };
  assert.equal(runStrategicForesightCli(["--summary-only"], io), 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /ATG Strategic Foresight Layer/);
  assert.match(stdout[0] ?? "", /recommended first reviewer command remains: npm run demo:reviewer-kit/);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/atg-strategic-foresight-cli.js"),
    "--json",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as ForesightReport;
  assertSafetyFlags(parsed);
  assert.ok(parsed.signalCategories.length >= 16);
  assert.ok(parsed.sampleSignals.length >= 5);
  assert.ok(parsed.recommendedMissions.length >= 5);
});

test("machine-readable foresight example preserves safety flags", () => {
  const example = readJson<ForesightReport>(examplePath);
  assert.equal(example.project, "Agent Trust Gate");
  assert.equal(example.layerName, "ATG Strategic Foresight Layer");
  assert.equal(example.publicContact, contactEmail);
  assertSafetyFlags(example);
  assert.ok(example.workflow.includes("Gareth approves"));
  assert.ok(example.signalCategories.length >= 16);
  assert.ok(example.sampleSignals.length >= 5);
  assert.ok(example.recommendedMissions.length >= 2);
});

test("metadata records P3-M140 and advisory-only flags", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read("llms.txt"),
    read("agent-trust-gate.manifest.json"),
    read("agent-trust-gate.agent-card.json"),
    read("docs/p3-mission-register.md"),
    read("docs/public-launch-record.md"),
  ].join("\n");

  assert.match(combined, /P3-M140/);
  assert.match(combined, /ATG Strategic Foresight Layer/);
  assert.match(combined, /Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally/);
  assert.match(combined, /advisoryOnly["_: ]+true/i);
  assert.match(combined, /manualInputOnly["_: ]+true/i);
  assert.match(combined, /liveMonitoring["_: ]+false/i);
  assert.match(combined, /autonomousLearning["_: ]+false/i);
  assert.match(combined, /autonomousProductChanges["_: ]+false/i);
  assert.match(combined, /autonomousRoadmapChanges["_: ]+false/i);
  assert.match(combined, /autonomousCodeChanges["_: ]+false/i);
  assert.match(combined, /predictionGuarantee["_: ]+false/i);
  assert.match(combined, /humanApprovalRequired["_: ]+true/i);
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  for (const phrase of corePhrases) assert.match(combined, new RegExp(escapeRegExp(phrase)));
});

test("foresight docs make no forbidden positive claims", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read(examplePath),
    read("llms.txt"),
  ].join("\n");
  const forbidden = [
    /\b(?:is|are|has been|have been) production ready\b/i,
    /\bcertified secure\b/i,
    /\b(?:provides|offers|grants) (?:a )?legal\/compliance\/security guarantee\b/i,
    /\bGatePass makes (?:an|the) agent proven safe\b/i,
    /\bthis agent is proven safe\b/i,
    /\bguaranteed trust (?:is|has been|will be) (?:provided|granted|achieved|confirmed)\b/i,
    /\blive monitoring (?:is|has been) (?:enabled|added|provided)\b/i,
    /\bscraping (?:is|has been) (?:enabled|added|provided)\b/i,
    /\bautonomous learning (?:is|has been) (?:enabled|added|provided)\b/i,
    /\bpredicts the future\b/i,
    /\bautonomous product changes (?:are|have been) (?:enabled|added|provided)\b/i,
    /\bautonomous code changes (?:are|have been) (?:enabled|added|provided)\b/i,
    /\bautonomous roadmap changes (?:are|have been) (?:enabled|added|provided)\b/i,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(combined, pattern);
});

test("package script model and exports exist", () => {
  assert.match(read("package.json"), /demo:foresight/);
  assert.match(read("package.json"), /atg-strategic-foresight\.test\.js/);
  assert.equal(existsSync(join(root, "src/atg-strategic-foresight.ts")), true);
  assert.equal(existsSync(join(root, "src/atg-strategic-foresight-cli.ts")), true);
  assert.match(read("src/index.ts"), /buildStrategicForesightReport/);
  assert.match(read("src/index.ts"), /runStrategicForesightCli/);
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
