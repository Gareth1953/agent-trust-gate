#!/usr/bin/env node
import {
  SCENARIOS,
  createSummary,
  runAllScenarios,
  runScenario,
} from "../src/human-authority-demo.mjs";

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const summaryOnly = args.includes("--summary-only");
const scenarioId = valueAfter(args, "--scenario");

let results;
if (scenarioId) {
  const scenario = SCENARIOS.find((item) => item.id === scenarioId);
  if (!scenario) {
    console.error(`Unknown scenario: ${scenarioId}`);
    console.error(`Available: ${SCENARIOS.map((item) => item.id).join(", ")}`);
    process.exit(2);
  }
  results = [runScenario(scenario)];
} else {
  results = runAllScenarios();
}

const summary = createSummary(results);

if (jsonMode) {
  console.log(JSON.stringify({ summary, results }, null, 2));
} else {
  console.log("Agent Trust Gate™");
  console.log("P3-M153 — Verified Human Authority Working Demonstrator");
  console.log("Local, deterministic and synthetic only. No real identities or actions.\n");

  if (!summaryOnly) {
    for (const result of results) {
      console.log(`SCENARIO: ${result.scenarioTitle}`);
      console.log(`  Expected: ${result.expected.toUpperCase()}`);
      console.log(`  Observed: ${result.observed.toUpperCase()}`);
      console.log(`  Decision: ${result.decision.code}`);
      for (const check of result.checks) {
        console.log(
          `  ${check.passed ? "PASS" : "BLOCK"} — ${check.check}: ${check.detail}`,
        );
      }
      if (result.humanAuthorityProof) {
        console.log(
          `  Human Authority Proof: ${result.humanAuthorityProof.proofId}`,
        );
      }
      if (result.gatePass) {
        console.log(`  GatePass: ${result.gatePass.gatePassId}`);
      }
      if (result.executionReceipt) {
        console.log(`  Execution receipt: ${result.executionReceipt.receiptId}`);
      }
      console.log("");
    }
  }

  console.log("SCORECARD");
  console.log(`  Scenarios: ${summary.total}`);
  console.log(`  Expected outcomes matched: ${summary.matched}/${summary.total}`);
  console.log(`  Allowed: ${summary.allowed}`);
  console.log(`  Refused: ${summary.refused}`);
  console.log(`  Result: ${summary.allMatched ? "PASS" : "FAIL"}`);
  console.log("");
  console.log(
    "Core rule: No verified identity. No confirmed authority. No exact-action Human Authority Proof. No valid GatePass. No action.",
  );
}

process.exit(summary.allMatched ? 0 : 1);
