import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  clampUniqueAdvantageScore,
  scoreUniqueAdvantage,
  type AdvantageBand,
  type AdvantageRecommendation,
  type UniqueAdvantageInput,
} from "../src/index.js";

const radarDocPath = resolve("docs/unique-advantage-radar.md");
const scoringDocPath = resolve("docs/advantage-scoring-model.md");
const templatePath = resolve("docs/future-mission-advantage-review-template.md");
const configPath = resolve("config/unique-advantage-radar-safety.json");
const refusalGraphPath = resolve("examples/advantage-review-refusalgraph.json");
const genericPath = resolve("examples/advantage-review-generic-governance.json");
const receiptPath = resolve("examples/advantage-review-receipt-verification.json");
const scanningPath = resolve("examples/advantage-review-live-scanning-blocked.json");
const priorTests = [
  resolve("test/agent-to-agent-trust-handshake.test.ts"),
  resolve("test/refusalgraph-core.test.ts"),
  resolve("test/agent-clearing-house-foundation.test.ts"),
  resolve("test/refusalgraph-signal-engine.test.ts"),
  resolve("test/refusalgraph-query-engine.test.ts"),
  resolve("test/agent-clearing-decision-engine.test.ts"),
  resolve("test/agent-clearing-receipt-engine.test.ts"),
];
const outputKeys = [
  "feature_name", "overall_advantage_score", "advantage_band", "recommendation",
  "strongest_dimensions", "weakest_dimensions", "private_data_included",
  "live_scanning_performed", "external_lookup_performed",
  "payment_or_fee_triggered", "action_executed", "status",
].sort();

function scores(value: number, featureName = "local_feature"): UniqueAdvantageInput {
  return {
    feature_name: featureName,
    uniqueness_score: value,
    defensibility_score: value,
    agent_to_agent_value_score: value,
    machine_to_machine_fee_potential_score: value,
    refusalgraph_value_score: value,
    private_data_safety_score: value,
    developer_adoption_score: value,
    commercial_clarity_score: value,
    big_company_resistance_score: value,
    simplicity_score: value,
  };
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

test("advantage radar files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [
    radarDocPath, scoringDocPath, templatePath, configPath, refusalGraphPath,
    genericPath, receiptPath, scanningPath, ...priorTests,
  ]) assert.equal(existsSync(path), true, path);
});

test("scores clamp to zero through ten and average deterministically", () => {
  assert.equal(clampUniqueAdvantageScore(-5), 0);
  assert.equal(clampUniqueAdvantageScore(15), 10);
  assert.equal(clampUniqueAdvantageScore(Number.POSITIVE_INFINITY), 0);

  const result = scoreUniqueAdvantage({
    ...scores(5),
    uniqueness_score: -5,
    defensibility_score: 15,
  });
  assert.equal(result.overall_advantage_score, 5);
  assert.deepEqual(result.strongest_dimensions, ["defensibility_score"]);
  assert.deepEqual(result.weakest_dimensions, ["uniqueness_score"]);
});

test("every score band maps to its documented recommendation", () => {
  const cases: Array<[number, AdvantageBand, AdvantageRecommendation]> = [
    [3.9, "weak", "reject_or_defer"],
    [5.9, "ordinary", "improve_before_building"],
    [7, "promising", "build_if_safe"],
    [8.9, "strong", "high_priority"],
    [9, "exceptional", "strategic_priority"],
  ];
  for (const [value, band, recommendation] of cases) {
    const result = scoreUniqueAdvantage(scores(value));
    assert.equal(result.advantage_band, band, String(value));
    assert.equal(result.recommendation, recommendation, String(value));
  }
});

test("tracked reviews align with scorer and RefusalGraph exceeds generic governance", () => {
  const paths = [refusalGraphPath, genericPath, receiptPath, scanningPath];
  for (const path of paths) {
    const review = readJson(path);
    const result = scoreUniqueAdvantage(review as unknown as UniqueAdvantageInput);
    for (const key of outputKeys) assert.deepEqual(review[key], result[key as keyof typeof result], `${path}:${key}`);
    assertNoEnabledFlags(review, path);
  }

  const refusalGraph = scoreUniqueAdvantage(readJson(refusalGraphPath) as unknown as UniqueAdvantageInput);
  const generic = scoreUniqueAdvantage(readJson(genericPath) as unknown as UniqueAdvantageInput);
  assert.ok(refusalGraph.overall_advantage_score > generic.overall_advantage_score);
  assert.equal(refusalGraph.advantage_band, "exceptional");
  assert.equal(generic.advantage_band, "weak");
});

test("output is strictly allowlisted and copies no private fields", () => {
  const privateMarker = "PRIVATE_ADVANTAGE_VALUE_MUST_NOT_COPY";
  const result = scoreUniqueAdvantage({
    ...scores(8, "Safe Feature Name"),
    customer_name: privateMarker,
    customer_email: privateMarker,
    company_name: privateMarker,
    api_key: privateMarker,
    private_document_text: privateMarker,
    competitor_notes: privateMarker,
  });

  assert.deepEqual(Object.keys(result).sort(), outputKeys);
  assert.equal(result.feature_name, "safe_feature_name");
  assert.equal(result.private_data_included, false);
  assert.equal(result.live_scanning_performed, false);
  assert.equal(result.external_lookup_performed, false);
  assert.equal(result.payment_or_fee_triggered, false);
  assert.equal(result.action_executed, false);
  assert.equal(result.status, "draft_only");
  assert.doesNotMatch(JSON.stringify(result), new RegExp(privateMarker));
});

test("radar safety config disables scanning, scraping, network, commerce, and execution", () => {
  const config = readJson(configPath);
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  for (const requirement of [
    "requires_human_approval", "requires_gareth_final_approval",
    "requires_technical_validation", "requires_security_review",
    "requires_privacy_review", "requires_legal_review",
    "requires_commercial_validation",
  ]) assert.equal(config[requirement], true, requirement);
  assertNoEnabledFlags(config);

  for (const flag of [
    "advantage_radar_enabled", "live_market_scanning_enabled",
    "competitor_scraping_enabled", "network_enabled", "external_lookup_enabled",
    "public_api_enabled", "public_protocol_enabled",
    "tracking_enabled", "analytics_enabled", "outreach_enabled", "publishing_enabled",
    "deployment_enabled", "signup_enabled", "billing_enabled", "payment_enabled",
    "settlement_enabled", "machine_to_machine_fee_enabled", "webhook_enabled",
    "third_party_connections_enabled", "live_customer_data_enabled",
    "private_data_export_enabled", "action_execution_enabled",
    "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("radar documents define strategic discipline without live collection or activation", () => {
  const source = [radarDocPath, scoringDocPath, templatePath, configPath, refusalGraphPath, genericPath, receiptPath, scanningPath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /should not compete as a generic AI governance platform/i);
  assert.match(source, /agent-to-agent clearing, RefusalGraph refusal intelligence, safe receipts, and future fee-ready verification/i);
  assert.match(source, /Nothing in the radar activates live scanning, outreach, tracking, billing, payment, deployment, or network use/i);
  assert.match(source, /Gareth final approval is required before any commercial or live activation/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
