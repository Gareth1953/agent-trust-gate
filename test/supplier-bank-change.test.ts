import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  loadSupplierBankChangeScenario,
  runSupplierBankChangeCli,
  type SupplierBankChangeCliIo,
} from "../src/supplier-bank-change-cli.js";
import {
  SUPPLIER_BANK_CHANGE_NO_EXTERNAL_ACTION,
  SUPPLIER_BANK_CHANGE_REFERENCE_TIME,
  SUPPLIER_BANK_CHANGE_SCENARIO_IDS,
  createSupplierBankChangeActionDigest,
  evaluateSupplierBankChange,
  type SupplierBankChangeDecision,
  type SupplierBankChangeScenario,
} from "../src/supplier-bank-change-model.js";

const root = process.cwd();

test("all sixteen required supplier-change fixture files exist and parse", () => {
  const files = readdirSync(join(root, "examples"))
    .filter((file) => /^supplier-bank-change-.*\.json$/.test(file))
    .sort();
  assert.equal(files.length, 16);
  for (const file of files) {
    assert.doesNotThrow(() => JSON.parse(readFileSync(join(root, "examples", file), "utf8")));
  }
});

for (const scenarioId of SUPPLIER_BANK_CHANGE_SCENARIO_IDS) {
  test(`supplier-change scenario ${scenarioId} returns its deterministic expected decision`, () => {
    const scenario = loadSupplierBankChangeScenario(scenarioId);
    const first = evaluateSupplierBankChange(scenario);
    const second = evaluateSupplierBankChange(scenario);

    assert.deepEqual(first, second);
    assert.equal(first.scenarioId, scenarioId);
    assert.equal(first.decision, scenario.expected.decision);
    assert.equal(first.reasonCode, scenario.expected.reasonCode);
    assert.deepEqual(first.reasonCodes, [scenario.expected.reasonCode]);
    assert.equal(first.externalActionPerformed, false);
    assert.equal(first.executionEvidence.externalActionPerformed, false);
    assert.equal(first.localOnly, true);
    assert.equal(first.syntheticOnly, true);
    assert.equal(first.noExternalActionStatement, SUPPLIER_BANK_CHANGE_NO_EXTERNAL_ACTION);
    assert.match(first.actionDigest, /^[a-f0-9]{64}$/);
    assert.match(first.approvedActionDigest, /^[a-f0-9]{64}$/);
    assert.equal(scenario.synthetic, true);
    assert.equal(scenario.realData, false);
    assert.equal(scenario.networkAccess, false);
    assert.equal(scenario.externalActionPerformed, false);
    assert.equal(scenario.referenceTime, SUPPLIER_BANK_CHANGE_REFERENCE_TIME);

    if (first.decision === "REFUSED") assertCompleteRefusal(first);
  });
}

test("valid exact change issues a one-use master-data-only GatePass with separate simulated receipt", () => {
  const decision = evaluateSupplierBankChange(loadSupplierBankChangeScenario("valid_exact_change"));
  assert.equal(decision.decision, "GATEPASS_ISSUED");
  assert.equal(decision.reasonCode, "ALL_CONTROLS_PASSED");
  assert.equal(decision.digestComparison.match, true);
  assert.equal(decision.gatePass.status, "issued");
  assert.match(decision.gatePass.gatePassId ?? "", /^gatepass_supplier_[a-f0-9]{20}$/);
  assert.equal(decision.gatePass.exactActionDigest, decision.actionDigest);
  assert.equal(decision.gatePass.supplierReference, "SUP-10482");
  assert.equal(decision.gatePass.accountEndingTransition, "1846->7319");
  assert.equal(decision.gatePass.oneUse, true);
  assert.equal(decision.gatePass.permitsMasterDataChangeOnly, true);
  assert.equal(decision.gatePass.permitsPayment, false);
  assert.equal(decision.gatePass.permitsSettlement, false);
  assert.equal(decision.gatePass.permitsBroaderErpAccess, false);
  assert.equal(decision.gatePass.signedFixtureEvidence.status, "verified");
  assert.equal(decision.gatePass.signedFixtureEvidence.algorithm, "ed25519-local-demo");
  assert.match(decision.gatePass.signedFixtureEvidence.keyId ?? "", /supplier-bank-change/);
  assert.match(decision.gatePass.signedFixtureEvidence.signature ?? "", /^[A-Za-z0-9+/]+={0,2}$/);
  assert.equal(decision.gatePass.signedFixtureEvidence.localFixtureOnly, true);
  assert.equal(decision.gatePass.signedFixtureEvidence.productionKeyCustody, false);
  assert.equal(decision.executionEvidence.status, "simulated_receipt_present");
  assert.equal(decision.executionEvidence.simulatedOnly, true);
  assert.equal(decision.identityVerification, "verified");
  assert.equal(decision.authorityVerification, "verified");
  assert.equal(decision.businessPolicyEvaluation, "passed");
  assert.equal(decision.gatePassDecision, "issued");
});

test("account supplier and general action changes expose exact digest comparisons", () => {
  const cases = [
    ["changed_account_details", "proposedAccountEnding"],
    ["changed_supplier", "supplierReference"],
    ["action_digest_mismatch", "reason"],
  ] as const;
  for (const [scenarioId, changedField] of cases) {
    const decision = evaluateSupplierBankChange(loadSupplierBankChangeScenario(scenarioId));
    assert.equal(decision.digestComparison.match, false);
    assert.notEqual(decision.actionDigest, decision.approvedActionDigest);
    assert.ok(decision.digestComparison.changedFields.includes(changedField));
  }
});

test("independent verification and both human approvals bind the approved supplier change", () => {
  const scenario = loadSupplierBankChangeScenario("valid_exact_change");
  const approvedDigest = createSupplierBankChangeActionDigest(scenario.approvedAction);
  assert.equal(scenario.independentVerification.supplierReference, scenario.approvedAction.supplierReference);
  assert.equal(scenario.independentVerification.proposedAccountEnding, scenario.approvedAction.proposedAccountEnding);
  assert.equal(scenario.humanApprovals.length, 2);
  for (const approval of scenario.humanApprovals) {
    assert.equal(approval.approvedActionDigest, approvedDigest);
  }
});

test("commercial master-data authority never permits payment or settlement", () => {
  const decision = evaluateSupplierBankChange(
    loadSupplierBankChangeScenario("commercial_authority_confusion"),
  );
  assert.equal(decision.reasonCode, "COMMERCIAL_AUTHORITY_CONFUSION");
  assert.equal(decision.gatePass.status, "not_issued");
  assert.equal(decision.gatePass.permitsPayment, false);
  assert.equal(decision.gatePass.permitsSettlement, false);
  assert.equal(decision.externalActionPerformed, false);
});

test("execution claim requires a receipt separate from the prior GatePass", () => {
  const decision = evaluateSupplierBankChange(
    loadSupplierBankChangeScenario("execution_claim_without_execution_receipt"),
  );
  assert.equal(decision.decisionStage, "execution_claim");
  assert.equal(decision.reasonCode, "EXECUTION_RECEIPT_MISSING");
  assert.equal(decision.gatePass.status, "previously_issued");
  assert.equal(decision.gatePassDecision, "previously_issued");
  assert.equal(decision.executionEvidence.status, "claim_not_proven");
  assert.equal(decision.executionEvidence.claimAccepted, false);
});

test("replay refuses a consumed GatePass without creating execution evidence", () => {
  const decision = evaluateSupplierBankChange(loadSupplierBankChangeScenario("replayed_gatepass"));
  assert.equal(decision.reasonCode, "GATEPASS_ALREADY_CONSUMED");
  assert.equal(decision.gatePass.status, "presented_consumed");
  assert.equal(decision.executionEvidence.status, "not_claimed");
  assert.equal(decision.externalActionPerformed, false);
});

test("enterprise wording limits independent-verification and authority results to configured evidence", () => {
  const independentPaths = [
    "docs/executive-decision-brief.md",
    "docs/enterprise-positioning-validation-pack.md",
    "docs/supplier-bank-change-control-model.md",
    "docs/workflow-governance-assessment-offer.md",
    "site/supplier-bank-change-demo.html",
    "src/supplier-bank-change-model.ts",
  ];
  const authorityPaths = [
    ...independentPaths,
    "docs/iam-workflow-observability-atg-comparison.md",
  ];
  const normalizeWording = (value: string): string => value.replaceAll("’", "'");
  const independentClarification = "Configured evidence shows that the organisation's independent-verification step was completed; ATG does not determine whether the bank details are correct.";
  const authorityClarification = "configured evidence of current organisational authority for this exact action";

  for (const path of independentPaths) {
    const source = normalizeWording(readFileSync(join(root, path), "utf8"));
    assert.ok(source.includes(independentClarification), path);
  }
  for (const path of authorityPaths) {
    const source = normalizeWording(readFileSync(join(root, path), "utf8"));
    assert.ok(source.toLowerCase().includes(authorityClarification), path);
    assert.match(source, /ATG does not independently establish legal authority\./i, path);
  }

  const combined = authorityPaths
    .map((path) => readFileSync(join(root, path), "utf8"))
    .join("\n");
  assert.doesNotMatch(
    combined,
    /approved independent-verification evidence|current human authority|current approved verification evidence/i,
  );
});

test("canonical action digest is stable and binds every action field", () => {
  const scenario = loadSupplierBankChangeScenario("valid_exact_change");
  const digest = createSupplierBankChangeActionDigest(scenario.action);
  assert.equal(digest, createSupplierBankChangeActionDigest(structuredClone(scenario.action)));
  for (const field of Object.keys(scenario.action) as Array<keyof typeof scenario.action>) {
    const changed = structuredClone(scenario.action) as unknown as Record<string, unknown>;
    const value = changed[field];
    changed[field] = typeof value === "number" ? value + 1 : `${String(value)}!`;
    assert.notEqual(
      createSupplierBankChangeActionDigest(changed as unknown as typeof scenario.action),
      digest,
      field,
    );
  }
});

test("unsafe non-synthetic or externally active fixtures fail closed", () => {
  const scenario = loadSupplierBankChangeScenario("valid_exact_change");
  const unsafe = structuredClone(scenario) as unknown as Record<string, unknown>;
  unsafe["synthetic"] = false;
  unsafe["externalActionPerformed"] = true;
  assert.throws(
    () => evaluateSupplierBankChange(unsafe as unknown as SupplierBankChangeScenario),
    /local synthetic no-action scenario/,
  );
});

test("CLI lists and renders every deterministic scenario without network or external action", () => {
  const listed: string[] = [];
  const errors: string[] = [];
  const listIo: SupplierBankChangeCliIo = {
    stdout: (value) => listed.push(value),
    stderr: (value) => errors.push(value),
  };
  assert.equal(runSupplierBankChangeCli(["--list"], listIo), 0);
  assert.equal(errors.length, 0);
  assert.deepEqual(listed[0]?.split("\n"), [...SUPPLIER_BANK_CHANGE_SCENARIO_IDS]);

  for (const scenarioId of SUPPLIER_BANK_CHANGE_SCENARIO_IDS) {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io: SupplierBankChangeCliIo = {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    };
    assert.equal(runSupplierBankChangeCli(["--scenario", scenarioId], io), 0, scenarioId);
    assert.equal(stderr.length, 0, scenarioId);
    assert.match(stdout[0] ?? "", new RegExp(`scenario: ${scenarioId}`));
    assert.match(stdout[0] ?? "", /externalActionPerformed: false/);
    assert.match(stdout[0] ?? "", /no ERP, bank or payment connection/i);
  }
});

test("CLI JSON preserves the five-stage distinction and no-action boundary", () => {
  const stdout: string[] = [];
  const io: SupplierBankChangeCliIo = {
    stdout: (value) => stdout.push(value),
    stderr: () => assert.fail("CLI wrote stderr"),
  };
  assert.equal(runSupplierBankChangeCli(["--scenario", "valid_exact_change", "--json"], io), 0);
  const value = JSON.parse(stdout[0] ?? "{}") as SupplierBankChangeDecision;
  assert.equal(value.identityVerification, "verified");
  assert.equal(value.authorityVerification, "verified");
  assert.equal(value.businessPolicyEvaluation, "passed");
  assert.equal(value.gatePassDecision, "issued");
  assert.equal(value.executionEvidence.status, "simulated_receipt_present");
  assert.equal(value.externalActionPerformed, false);
});

function assertCompleteRefusal(decision: SupplierBankChangeDecision): void {
  assert.notEqual(decision.reasonCode, "ALL_CONTROLS_PASSED");
  assert.ok(decision.humanReadableReason.length >= 20);
  assert.ok((decision.failedControl ?? "").length >= 3);
  assert.match(decision.actionDigest, /^[a-f0-9]{64}$/);
  assert.match(decision.approvedActionDigest, /^[a-f0-9]{64}$/);
  assert.equal(decision.externalActionPerformed, false);
  assert.equal(decision.executionEvidence.externalActionPerformed, false);
  assert.equal(decision.noExternalActionStatement, SUPPLIER_BANK_CHANGE_NO_EXTERNAL_ACTION);
}
