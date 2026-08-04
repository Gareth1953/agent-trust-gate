import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  SUPPLIER_BANK_CHANGE_NO_EXTERNAL_ACTION,
  SUPPLIER_BANK_CHANGE_SCENARIO_IDS,
  evaluateSupplierBankChange,
  type SupplierBankChangeDecision,
  type SupplierBankChangeScenario,
  type SupplierBankChangeScenarioId,
} from "./supplier-bank-change-model.js";

export interface SupplierBankChangeCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

const scenarioFiles: Record<SupplierBankChangeScenarioId, string> = {
  valid_exact_change: "supplier-bank-change-approved.json",
  changed_account_details: "supplier-bank-change-account-mismatch.json",
  changed_supplier: "supplier-bank-change-supplier-mismatch.json",
  missing_independent_verification: "supplier-bank-change-missing-verification.json",
  self_verification: "supplier-bank-change-self-verification.json",
  wrong_approver_role: "supplier-bank-change-wrong-approver-role.json",
  authority_limit_exceeded: "supplier-bank-change-authority-limit-exceeded.json",
  dual_approval_missing: "supplier-bank-change-dual-approval-missing.json",
  approval_expired: "supplier-bank-change-expired.json",
  replayed_gatepass: "supplier-bank-change-replay.json",
  action_digest_mismatch: "supplier-bank-change-action-digest-mismatch.json",
  agent_standing_unverifiable: "supplier-bank-change-unverifiable-standing.json",
  delegation_out_of_scope: "supplier-bank-change-delegation-out-of-scope.json",
  commercial_authority_confusion: "supplier-bank-change-commercial-authority-refused.json",
  execution_claim_without_execution_receipt: "supplier-bank-change-execution-receipt-missing.json",
  revoked_human_authority: "supplier-bank-change-revoked-human-authority.json",
};

const defaultIo: SupplierBankChangeCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function loadSupplierBankChangeScenario(
  scenarioId: SupplierBankChangeScenarioId,
): SupplierBankChangeScenario {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "examples", scenarioFiles[scenarioId]), "utf8"),
  ) as Record<string, unknown>;
  if (raw["baseFixture"] === undefined) return raw as unknown as SupplierBankChangeScenario;
  if (raw["baseFixture"] !== "supplier-bank-change-approved.json") {
    throw new TypeError("Supplier-change scenario patches may reference only the approved local base fixture.");
  }
  const base = JSON.parse(
    readFileSync(join(process.cwd(), "examples", "supplier-bank-change-approved.json"), "utf8"),
  ) as Record<string, unknown>;
  const overrides = raw["overrides"];
  if (!isPlainObject(overrides)) {
    throw new TypeError("A scenario patch must provide an overrides object.");
  }
  const { baseFixture: _baseFixture, overrides: _overrides, ...metadata } = raw;
  return deepMerge(deepMerge(base, metadata), overrides) as unknown as SupplierBankChangeScenario;
}

export function runSupplierBankChangeCli(
  args: readonly string[],
  io: SupplierBankChangeCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    if (options.list) {
      io.stdout(SUPPLIER_BANK_CHANGE_SCENARIO_IDS.join("\n"));
      return 0;
    }
    const scenario = loadSupplierBankChangeScenario(options.scenarioId);
    const decision = evaluateSupplierBankChange(scenario);
    io.stdout(options.json
      ? JSON.stringify(decision, null, 2)
      : renderSupplierBankChangeDecision(scenario, decision));
    return decision.reasonCode === scenario.expected.reasonCode
      && decision.decision === scenario.expected.decision
      ? 0
      : 1;
  } catch (error) {
    io.stderr(JSON.stringify({
      error: {
        code: "SUPPLIER_BANK_CHANGE_CLI_ERROR",
        message: error instanceof Error ? error.message : "The local scenario could not be evaluated safely.",
      },
      localOnly: true,
      syntheticOnly: true,
      networkAccess: false,
      externalActionPerformed: false,
      statement: SUPPLIER_BANK_CHANGE_NO_EXTERNAL_ACTION,
    }, null, 2));
    return 1;
  }
}

export function renderSupplierBankChangeDecision(
  scenario: SupplierBankChangeScenario,
  decision: SupplierBankChangeDecision,
): string {
  return [
    "Agent Trust Gate — supplier bank-detail change local evaluation",
    `scenario: ${scenario.scenarioId} — ${scenario.title}`,
    "boundary: fictional, synthetic, local-only; no ERP, bank or payment connection",
    "",
    "proposed action:",
    `- supplier: ${scenario.action.supplierName} (${scenario.action.supplierReference})`,
    `- account ending: ${scenario.action.currentAccountEnding} -> ${scenario.action.proposedAccountEnding}`,
    `- action type: ${scenario.action.actionType}`,
    `- reason: ${scenario.action.reason}`,
    `- destination: ${scenario.action.destinationSystem}`,
    "",
    "identity / principal / delegation:",
    `- agent: ${scenario.agent.identity}`,
    `- accountable principal: ${scenario.agent.accountablePrincipal}`,
    `- identity verification: ${decision.identityVerification}`,
    `- authority verification: ${decision.authorityVerification}`,
    "",
    "independent verification:",
    `- evidence present: ${scenario.independentVerification.evidencePresent}`,
    `- independent: ${scenario.independentVerification.independentlyObtained}`,
    `- verifier: ${scenario.independentVerification.verifierIdentity ?? "none"}`,
    "",
    "human authority:",
    ...scenario.humanApprovals.map((approval) =>
      `- ${approval.humanIdentity}: ${approval.role}; active=${approval.active}; revoked=${approval.authorityRevoked}`
    ),
    "",
    `exact-action digest: ${decision.actionDigest}`,
    `approved digest: ${decision.approvedActionDigest}`,
    `digest match: ${decision.digestComparison.match}`,
    decision.digestComparison.changedFields.length > 0
      ? `changed fields: ${decision.digestComparison.changedFields.join(", ")}`
      : "changed fields: none",
    "",
    `decision: ${decision.decision}`,
    `decision stage: ${decision.decisionStage}`,
    `reason code: ${decision.reasonCode}`,
    `reason: ${decision.humanReadableReason}`,
    `failed control: ${decision.failedControl ?? "none"}`,
    `GatePass status: ${decision.gatePass.status}`,
    `GatePass fixture signature: ${decision.gatePass.signedFixtureEvidence.status}`,
    `GatePass scope: exact master-data change only; payment=false; settlement=false; broader ERP access=false`,
    `execution evidence status: ${decision.executionEvidence.status}`,
    `externalActionPerformed: ${decision.externalActionPerformed}`,
    decision.noExternalActionStatement,
    "",
    "stage separation:",
    `- identity verification: ${decision.identityVerification}`,
    `- authority verification: ${decision.authorityVerification}`,
    `- business-policy evaluation: ${decision.businessPolicyEvaluation}`,
    `- GatePass decision: ${decision.gatePassDecision}`,
    `- execution evidence: ${decision.executionEvidence.status}`,
  ].join("\n");
}

function parseArgs(args: readonly string[]): {
  scenarioId: SupplierBankChangeScenarioId;
  json: boolean;
  list: boolean;
} {
  let scenarioId: SupplierBankChangeScenarioId = "valid_exact_change";
  let json = false;
  let list = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--list") {
      list = true;
      continue;
    }
    if (arg === "--scenario") {
      const value = args[index + 1];
      if (value === undefined || !isScenarioId(value)) {
        throw new TypeError(`--scenario must be one of: ${SUPPLIER_BANK_CHANGE_SCENARIO_IDS.join(", ")}`);
      }
      scenarioId = value;
      index += 1;
      continue;
    }
    throw new TypeError(`Unsupported option: ${arg ?? "undefined"}`);
  }
  return { scenarioId, json, list };
}

function isScenarioId(value: string): value is SupplierBankChangeScenarioId {
  return (SUPPLIER_BANK_CHANGE_SCENARIO_IDS as readonly string[]).includes(value);
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = structuredClone(base);
  for (const [key, value] of Object.entries(override)) {
    const existing = result[key];
    if (Array.isArray(existing) && Array.isArray(value)) {
      result[key] = value.map((item, index) => {
        const existingItem = existing[index];
        return isPlainObject(existingItem) && isPlainObject(item)
          ? deepMerge(existingItem, item)
          : structuredClone(item);
      });
    } else {
      result[key] = isPlainObject(existing) && isPlainObject(value)
        ? deepMerge(existing, value)
        : structuredClone(value);
    }
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (require.main === module) {
  process.exitCode = runSupplierBankChangeCli(process.argv.slice(2));
}
