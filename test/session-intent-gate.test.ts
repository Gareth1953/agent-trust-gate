import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  SESSION_INTENT_EXAMPLE_FILES,
  SESSION_INTENT_GATE_RULE,
  createSessionIntentGateExampleInputs,
  evaluateSessionIntentGate,
  runSessionIntentGateExamples,
  runSessionIntentGateScenario,
  type SessionIntentGateResult,
  type SessionIntentGateSafetyFlags,
  type SessionIntentScenarioId,
} from "../src/session-intent-gate.js";
import { runSessionIntentGateCli } from "../src/session-intent-gate-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertSafe(value: SessionIntentGateSafetyFlags): void {
  assert.equal(value.localDemoOnly, true);
  assert.equal(value.localOnly, true);
  assert.equal(value.liveTrafficMonitoring, false);
  assert.equal(value.botDetectionProduct, false);
  assert.equal(value.realBotDetection, false);
  assert.equal(value.crawlerBlocking, false);
  assert.equal(value.browserFingerprinting, false);
  assert.equal(value.realUserTracking, false);
  assert.equal(value.scraping, false);
  assert.equal(value.analyticsTracking, false);
  assert.equal(value.telemetry, false);
  assert.equal(value.networkCallPerformed, false);
  assert.equal(value.cloudCallPerformed, false);
  assert.equal(value.externalAgentContacted, false);
  assert.equal(value.autonomousContact, false);
  assert.equal(value.paymentAuthorisation, false);
  assert.equal(value.settlementAuthorisation, false);
  assert.equal(value.productionSigning, false);
  assert.equal(value.actionExecution, false);
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

test("AI agent traffic and session intent docs exist and README links them", () => {
  const docs = [
    "docs/ai-agent-traffic-and-session-intent-gate.md",
    "docs/spoofed-agent-risk-model.md",
    "docs/session-specific-access-framework.md",
  ];
  const readme = read("README.md");
  for (const path of docs) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(`\\(${escapeRegExp(path)}\\)`), path);
    assert.match(read(path), new RegExp(escapeRegExp(coreLine)), path);
    assert.match(read(path), new RegExp(escapeRegExp(contactEmail)), path);
  }
  assert.match(readme, /not a bot detection product today/i);
  assert.match(readme, /local-only concept pack/i);
});

test("session intent gate model exists and claimed identity alone is not trusted", () => {
  assert.equal(existsSync(join(root, "src/session-intent-gate.ts")), true);
  const result = evaluateSessionIntentGate({
    scenarioId: "identity_only_is_not_trust",
    claimedAgentName: "KnownReferralAgent",
    claimedAgentType: "known_ai_agent",
    claimedPurpose: "Trust me because of my name.",
    mandateId: null,
    evidenceId: null,
    verifiedIntentStatus: "missing",
    sessionPattern: "unknown",
    requestVolumeTier: "low",
    behaviourSignals: [],
    riskTier: "low",
    freshnessStatus: "missing",
    localDemoOnly: true,
  });
  assert.notEqual(result.decision, "allow");
  assert.equal(result.claimedIdentityAloneTrusted, false);
  assert.ok(result.reasons.includes("claimed_identity_not_trust"));
  assert.ok(result.reasons.includes("mandate_missing"));
  assert.ok(result.reasons.includes("evidence_missing"));
  assertSafe(result);
});

test("required local session intent scenarios produce expected outcomes", () => {
  const expected: Record<SessionIntentScenarioId, SessionIntentGateResult["decision"]> = {
    claimed_known_agent_allowed: "allow",
    spoofed_agent_blocked: "block",
    extractive_pattern_throttled: "throttle",
    missing_mandate_escalated: "escalate",
    high_risk_human_review: "require_human_review",
    valid_local_control: "allow",
  };
  for (const [scenarioId, decision] of Object.entries(expected)) {
    const result = runSessionIntentGateScenario(scenarioId as SessionIntentScenarioId);
    assert.equal(result.decision, decision, scenarioId);
    assert.equal(result.claimedIdentityAloneTrusted, false);
    assert.ok(result.reasons.includes("claimed_identity_not_trust"), scenarioId);
    assertSafe(result);
  }
  assert.ok(runSessionIntentGateScenario("spoofed_agent_blocked").reasons.includes("spoofed_agent_identity_blocked"));
  assert.ok(runSessionIntentGateScenario("extractive_pattern_throttled").reasons.includes("extractive_session_pattern"));
  assert.ok(runSessionIntentGateScenario("missing_mandate_escalated").reasons.includes("mandate_missing"));
  assert.ok(runSessionIntentGateScenario("high_risk_human_review").reasons.includes("risk_high_requires_human_review"));
});

test("local pack covers allow throttle block escalate and human-review outcomes", () => {
  const pack = runSessionIntentGateExamples();
  assert.equal(pack.rule, SESSION_INTENT_GATE_RULE);
  assert.equal(pack.scenarioCount, 6);
  assert.equal(pack.decisions.allow, 2);
  assert.equal(pack.decisions.throttle, 1);
  assert.equal(pack.decisions.block, 1);
  assert.equal(pack.decisions.escalate, 1);
  assert.equal(pack.decisions.require_human_review, 1);
  assert.equal(pack.decisions.require_evidence, 0);
  assertSafe(pack);
  for (const scenario of pack.scenarios) assertSafe(scenario);
});

test("session intent example JSON files match deterministic local outputs", () => {
  for (const [scenarioId, path] of Object.entries(SESSION_INTENT_EXAMPLE_FILES)) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.deepEqual(
      readJson<SessionIntentGateResult>(path),
      runSessionIntentGateScenario(scenarioId as SessionIntentScenarioId),
      path,
    );
  }
});

test("CLI emits local pack summary and package script is registered", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runSessionIntentGateCli(["--summary-only"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  }), 0);
  assert.equal(stderr.length, 0);
  const summary = JSON.parse(stdout[0] ?? "{}") as ReturnType<typeof runSessionIntentGateExamples>;
  assert.equal(summary.scenarioCount, 6);
  assert.equal("scenarios" in summary, false);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/session-intent-gate-cli.js"),
    "--scenario",
    "spoofed_agent_blocked",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0);
  assert.equal((JSON.parse(compiled.stdout) as SessionIntentGateResult).decision, "block");

  const packageJson = readJson<{ scripts: Record<string, string> }>("package.json");
  assert.match(packageJson.scripts["demo:session-intent"] ?? "", /session-intent-gate-cli\.js --pretty/);
});

test("P3-M123 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/agent-readable-discovery-and-system-metadata.md",
    "docs/system-integration-metadata.md",
    "docs/example-agent-discovery-prompts.md",
    "docs/paid-pilot-readiness-review.md",
    "docs/reference-integration-examples.md",
    "docs/external-reviewer-signal-and-hardening-roadmap.md",
    "docs/p3-mission-register.md",
    "docs/public-launch-record.md",
    "PUBLIC_LAUNCH_CHECKLIST.md",
    "RELEASE_NOTES.md",
    "CHANGELOG.md",
  ];
  for (const path of paths) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(read(path), /P3-M123/, path);
  }
});

test("public contact old-email absence and core safety line are preserved", () => {
  const combined = [
    read("README.md"),
    read("docs/ai-agent-traffic-and-session-intent-gate.md"),
    read("docs/spoofed-agent-risk-model.md"),
    read("docs/session-specific-access-framework.md"),
    read("llms.txt"),
  ].join("\n");
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  assert.match(combined, new RegExp(escapeRegExp(coreLine)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const tracked = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  assert.equal(tracked.status, 0);
  for (const path of tracked.stdout.split(/\r?\n/).filter(Boolean)) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("no forbidden live-action payment deployment or bot-detection claims are introduced", () => {
  const combined = [
    read("README.md"),
    read("docs/ai-agent-traffic-and-session-intent-gate.md"),
    read("docs/spoofed-agent-risk-model.md"),
    read("docs/session-specific-access-framework.md"),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
    read("llms.txt"),
  ].join("\n");

  for (const forbidden of [
    /\bAgent Trust Gate(?:™)? is a (?:web )?bot detection product\b/i,
    /\blive traffic monitoring is (?:enabled|active|available|configured)\b/i,
    /\breal bot detection is (?:enabled|active|available|configured)\b/i,
    /\bcrawler blocking is (?:enabled|active|available|configured)\b/i,
    /\bbrowser fingerprinting is (?:enabled|active|available|configured)\b/i,
    /\bscraping is (?:enabled|active|available|configured)\b/i,
    /\btracking is (?:enabled|active|available|configured)\b/i,
    /\banalytics (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\btelemetry is (?:enabled|active|available|configured)\b/i,
    /\blive API is (?:enabled|active|available|configured)\b/i,
    /\bMCP server (?:is|has been) (?:enabled|active|available|configured|created)\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bcheckout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
    /\bdeployment is (?:performed|active|available|configured)\b/i,
    /\bexternal-agent contact is (?:enabled|active|available|configured)\b/i,
    /\bAUC is integrated\b/i,
    /\bAgent Contact System is integrated\b/i,
    /\bexecutes actions\b/i,
    /\bweb security certification is (?:granted|complete|active|available)\b/i,
    /\bbot-detection guarantee\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("all repository JSON examples schemas and metadata remain valid", () => {
  const jsonFiles = [
    ...jsonFilesUnder("examples"),
    ...jsonFilesUnder("schemas"),
    "agent-trust-gate.manifest.json",
    "agent-trust-gate.agent-card.json",
  ];
  assert.ok(jsonFiles.length > 300);
  for (const path of jsonFiles) assert.doesNotThrow(() => JSON.parse(read(path)), path);
});
