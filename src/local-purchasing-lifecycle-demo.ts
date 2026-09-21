import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  DEFAULT_AGGREGATE_EXPOSURE_RULE,
  LocalDurableLifecycleStore,
  createOperatorAuthorityEvidence,
  type AggregateExposureRule,
  type DurableStoreSnapshot,
  type GatePassRevocationReceipt,
  type LifecycleReconciliationRecord,
} from "./durable-action-lifecycle.js";
import {
  InMemoryNonceStore,
  createFixedTrustedClock,
  createVerifierContext,
  verifyAndExecuteSimulatedAction,
  type CanonicalActionEnvelope,
  type CanonicalActionEnvelopeInput,
  type ExactActionGatePass,
  type ExecutionReceipt,
  type PolicyDecisionReceipt,
} from "./exact-action-gatepass.js";
import { createCanonicalPayloadHash } from "./local-signed-proof.js";
import {
  McpExactActionGateway,
  createDefaultMcpBusinessPolicyRequest,
  type McpBusinessPolicyResult,
} from "./mcp-exact-action-gateway.js";

export const PURCHASING_LIFECYCLE_DEMO_VERSION = "atg.purchasing-lifecycle-demo.local.v1" as const;
export const PURCHASING_EXECUTION_LINK_VERSION = "atg.purchasing-execution-link.local.v1" as const;
export const PURCHASING_DEMO_REFERENCE_TIME = "2026-09-02T09:00:00.000Z" as const;
export const PURCHASING_DEMO_EXECUTION_TIME = "2026-09-02T09:01:00.000Z" as const;

const REGISTERED_SYNTHETIC_PURCHASING_ADAPTER = Object.freeze({
  adapterId: "adapter.local.synthetic-purchasing.v1",
  adapterClass: "local_synthetic_purchasing_adapter",
  resourceId: "resource.local.synthetic-purchase-ledger.v1",
  executableExternally: false as const,
  localOnly: true as const,
  syntheticOnly: true as const,
});

export const REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS = Object.freeze([
  REGISTERED_SYNTHETIC_PURCHASING_ADAPTER,
] as const);

export type PurchasingLifecycleCaseId =
  | "01_exact_authorised_purchase"
  | "02_quantity_substitution"
  | "03_supplier_substitution"
  | "04_price_band_breach"
  | "05_gatepass_reuse"
  | "06_gatepass_revocation"
  | "07_shadow_mode"
  | "08_aggregate_ceiling"
  | "09_authority_expansion_attempt"
  | "10_emergency_recovery_lifecycle";

export type PurchasingDemoOutcome = "ACCEPT" | "REJECT" | "REFER" | "SHADOW";
export type PurchasingGatePassStatus = "ISSUED_AND_CONSUMED" | "ISSUED" | "REVOKED" | "NOT_ISSUED";
export type PurchasingExecutionStatus = "SYNTHETIC_EXECUTED" | "BLOCKED" | "NOT_ATTEMPTED";

export interface PurchasingExecutionEvidenceLink {
  linkVersion: typeof PURCHASING_EXECUTION_LINK_VERSION;
  linkId: string;
  decisionReceiptId: string;
  decisionReceiptDigest: string;
  executionReceiptId: string;
  executionReceiptDigest: string;
  gatePassId: string;
  actionDigest: string;
  adapterId: string;
  resourceId: string;
  linkDigest: string;
  localOnly: true;
  syntheticOnly: true;
  externalActionOccurred: false;
}

export interface PurchasingCaseEvidence {
  humanMandateReference: string | null;
  exactActionDigest: string | null;
  decisionReceiptId: string | null;
  shadowReceiptId: string | null;
  gatePassId: string | null;
  executionReceiptId: string | null;
  executionLinkDigest: string | null;
  revocationReceiptId: string | null;
  reconciliationId: string | null;
  lifecycleStatus: string | null;
}

export interface PurchasingLifecycleDemoCase {
  caseId: PurchasingLifecycleCaseId;
  title: string;
  outcome: PurchasingDemoOutcome;
  wouldOutcome: "ACCEPT" | "REFER" | "REJECT" | null;
  gatePassStatus: PurchasingGatePassStatus;
  executionStatus: PurchasingExecutionStatus;
  reasonCodes: string[];
  plainEnglish: string;
  evidence: PurchasingCaseEvidence;
}

export interface PurchasingExecutionEvidenceBundle {
  decisionReceipt: PolicyDecisionReceipt;
  executionReceipt: ExecutionReceipt;
  link: PurchasingExecutionEvidenceLink;
}

export interface PurchasingLifecycleDemoPack {
  demoVersion: typeof PURCHASING_LIFECYCLE_DEMO_VERSION;
  referenceTime: typeof PURCHASING_DEMO_REFERENCE_TIME;
  title: "Agent Trust Gate local purchasing lifecycle demonstration";
  cases: PurchasingLifecycleDemoCase[];
  executionEvidence: PurchasingExecutionEvidenceBundle;
  registeredAdapterCount: 1;
  exposedMcpTools: readonly ["atg.evaluate_action"];
  localOnly: true;
  syntheticOnly: true;
  productionReady: false;
  externalActionOccurred: false;
  commercialWisdomAssessed: false;
  limitations: string[];
}

export interface SyntheticExecutionAttempt {
  outcome: "EXECUTED" | "REJECTED";
  reasonCodes: string[];
  adapterReached: boolean;
  executionReceipt: ExecutionReceipt | null;
  evidenceLink: PurchasingExecutionEvidenceLink | null;
  lifecycleStatus: string | null;
}

class RegisteredSyntheticPurchasingAdapter {
  #invocationCount = 0;

  get invocationCount(): number {
    return this.#invocationCount;
  }

  invoke(action: CanonicalActionEnvelope): { acknowledged: true; simulatedSideEffectReference: string } {
    this.#invocationCount += 1;
    return {
      acknowledged: true,
      simulatedSideEffectReference: `synthetic-purchase://${action.actionDigest.slice("sha256:".length, 24)}`,
    };
  }
}

export function createPurchasingExecutionEvidenceLink(
  decisionReceipt: PolicyDecisionReceipt,
  executionReceipt: ExecutionReceipt,
): PurchasingExecutionEvidenceLink {
  if (executionReceipt.decisionReceiptReference !== decisionReceipt.receiptId
    || executionReceipt.gatePassId !== decisionReceipt.gatePassIssuance?.gatePassId
    || executionReceipt.actionDigest !== decisionReceipt.gatePassIssuance?.actionDigest) {
    throw new TypeError("Decision and execution receipts are not bound to the same exact action.");
  }
  const adapter = REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0];
  const body = {
    linkVersion: PURCHASING_EXECUTION_LINK_VERSION,
    linkId: `purchase_link_${executionReceipt.receiptId.slice("execution_receipt_".length)}`,
    decisionReceiptId: decisionReceipt.receiptId,
    decisionReceiptDigest: createCanonicalPayloadHash(decisionReceipt),
    executionReceiptId: executionReceipt.receiptId,
    executionReceiptDigest: createCanonicalPayloadHash(executionReceipt),
    gatePassId: executionReceipt.gatePassId,
    actionDigest: executionReceipt.actionDigest,
    adapterId: adapter.adapterId,
    resourceId: adapter.resourceId,
    localOnly: true as const,
    syntheticOnly: true as const,
    externalActionOccurred: false as const,
  };
  return { ...body, linkDigest: createCanonicalPayloadHash(body) };
}

export function verifyPurchasingExecutionEvidenceLink(
  link: PurchasingExecutionEvidenceLink,
  decisionReceipt: PolicyDecisionReceipt,
  executionReceipt: ExecutionReceipt,
): boolean {
  const { linkDigest, ...body } = link;
  return link.linkVersion === PURCHASING_EXECUTION_LINK_VERSION
    && link.decisionReceiptId === decisionReceipt.receiptId
    && link.decisionReceiptDigest === createCanonicalPayloadHash(decisionReceipt)
    && link.executionReceiptId === executionReceipt.receiptId
    && link.executionReceiptDigest === createCanonicalPayloadHash(executionReceipt)
    && link.gatePassId === executionReceipt.gatePassId
    && link.actionDigest === executionReceipt.actionDigest
    && executionReceipt.decisionReceiptReference === decisionReceipt.receiptId
    && decisionReceipt.gatePassIssuance?.gatePassId === executionReceipt.gatePassId
    && decisionReceipt.gatePassIssuance.actionDigest === executionReceipt.actionDigest
    && link.adapterId === REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].adapterId
    && link.resourceId === REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].resourceId
    && linkDigest === createCanonicalPayloadHash(body);
}

export async function executeThroughRegisteredSyntheticPurchasingAdapter(input: {
  store: LocalDurableLifecycleStore;
  gatePass: ExactActionGatePass | null;
  decisionReceipt: PolicyDecisionReceipt | null;
  proposedAction: CanonicalActionEnvelopeInput | null;
  adapterId: string;
  resourceId: string;
  executedAt?: string;
}): Promise<SyntheticExecutionAttempt> {
  const registered = REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0];
  if (input.adapterId !== registered.adapterId) return blocked("SYNTHETIC_ADAPTER_NOT_REGISTERED", false, null);
  if (input.resourceId !== registered.resourceId) return blocked("SYNTHETIC_RESOURCE_NOT_REGISTERED", false, null);
  if (input.gatePass === null || input.decisionReceipt === null || input.proposedAction === null) {
    return blocked("EXECUTION_AUTHORITY_MISSING", false, null);
  }
  const lifecycle = input.store.getLifecycleByGatePassId(input.gatePass.gatePassId);
  if (lifecycle === null) return blocked("LIFECYCLE_RECORD_NOT_FOUND", false, null);
  const at = input.executedAt ?? PURCHASING_DEMO_EXECUTION_TIME;
  const reservation = input.store.reserve(input.gatePass, lifecycle.lifecycleRevision, at);
  if (!reservation.changed || reservation.lifecycle?.status !== "RESERVED") {
    return blocked(reservation.reasonCode, false, reservation.lifecycle?.status ?? null);
  }

  const nonceStore = new InMemoryNonceStore();
  nonceStore.registerUnused(input.gatePass);
  const adapter = new RegisteredSyntheticPurchasingAdapter();
  const before = adapter.invocationCount;
  const receipt = await verifyAndExecuteSimulatedAction(
    input.gatePass,
    input.proposedAction,
    createVerifierContext(
      { gatePass: input.gatePass, decisionReceipt: input.decisionReceipt },
      nonceStore,
      { trustedClock: createFixedTrustedClock(at) },
    ),
    (action) => adapter.invoke(action),
  );
  const reached = adapter.invocationCount === before + 1;
  if (receipt.resultStatus !== "executed" || !reached) {
    input.store.reconcile({
      gatePassId: input.gatePass.gatePassId,
      finding: "confirmed_not_executed",
      evidenceReference: "fixture://p3-m161/verification-refusal/no-adapter-invocation",
      reconciledAt: at,
      authorityEvidence: createOperatorAuthorityEvidence(),
    });
    return {
      outcome: "REJECTED",
      reasonCodes: receipt.reasonCodes.length === 0 ? ["SYNTHETIC_EXECUTION_NOT_ACKNOWLEDGED"] : [...receipt.reasonCodes],
      adapterReached: reached,
      executionReceipt: receipt,
      evidenceLink: null,
      lifecycleStatus: input.store.getLifecycleByGatePassId(input.gatePass.gatePassId)?.status ?? null,
    };
  }
  const completed = input.store.markExecuted(input.gatePass.gatePassId, at);
  if (!completed.changed || completed.lifecycle?.status !== "EXECUTED") {
    throw new Error("Synthetic acknowledgement could not be committed to the durable lifecycle.");
  }
  const link = createPurchasingExecutionEvidenceLink(input.decisionReceipt, receipt);
  return {
    outcome: "EXECUTED",
    reasonCodes: ["EXACT_ACTION_VERIFIED", "SYNTHETIC_ADAPTER_ACKNOWLEDGED", "LIFECYCLE_EXECUTED"],
    adapterReached: true,
    executionReceipt: receipt,
    evidenceLink: link,
    lifecycleStatus: "EXECUTED",
  };
}

export async function runLocalPurchasingLifecycleDemo(options: {
  stateRoot?: string;
  retainState?: boolean;
} = {}): Promise<PurchasingLifecycleDemoPack> {
  const ownedRoot = options.stateRoot === undefined;
  const root = options.stateRoot ?? mkdtempSync(join(tmpdir(), "atg-p3-m161-"));
  mkdirSync(root, { recursive: true });
  try {
    const cases: PurchasingLifecycleDemoCase[] = [];

    const exactStore = storeAt(root, "case-01-and-05");
    const exact = await evaluate(exactStore, "nonce_m161_exact_001", 400_000);
    const exactGatePass = requireGatePass(exact);
    const exactDecision = requireDecisionReceipt(exact);
    const executed = await executeThroughRegisteredSyntheticPurchasingAdapter({
      store: exactStore,
      gatePass: exactGatePass,
      decisionReceipt: exactDecision,
      proposedAction: actionInput(exactGatePass),
      adapterId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].adapterId,
      resourceId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].resourceId,
    });
    if (executed.executionReceipt === null || executed.evidenceLink === null) {
      throw new Error("The exact authorised case did not produce linked synthetic execution evidence.");
    }
    cases.push(caseResult({
      caseId: "01_exact_authorised_purchase", title: "Exact authorised purchase", outcome: "ACCEPT",
      gatePassStatus: "ISSUED_AND_CONSUMED", executionStatus: "SYNTHETIC_EXECUTED",
      reasonCodes: [...exact.reasonCodes, ...executed.reasonCodes],
      plainEnglish: "The exact 100-unit Supplier A purchase remained within declared authority and policy, so its one-use GatePass reached the registered synthetic adapter.",
      result: exact, executionReceipt: executed.executionReceipt, executionLink: executed.evidenceLink,
      lifecycleStatus: "EXECUTED",
    }));

    const quantity = await evaluate(storeAt(root, "case-02"), "nonce_m161_quantity_001", 400_000, { quantity: 120 });
    cases.push(caseResult({
      caseId: "02_quantity_substitution", title: "Quantity substitution", outcome: "REJECT",
      gatePassStatus: "NOT_ISSUED", executionStatus: "NOT_ATTEMPTED", reasonCodes: [...quantity.reasonCodes, "QUANTITY_SUBSTITUTION_REJECTED"],
      plainEnglish: "Changing the authorised quantity from 100 to 120 exceeded the bounded policy; no GatePass or execution authority was created.", result: quantity,
    }));

    const supplier = await evaluate(storeAt(root, "case-03"), "nonce_m161_supplier_001", 400_000, {
      supplierId: "SUP-UNREGISTERED-999", supplierName: "Unregistered Synthetic Supplier",
    });
    cases.push(caseResult({
      caseId: "03_supplier_substitution", title: "Supplier substitution", outcome: "REJECT",
      gatePassStatus: "NOT_ISSUED", executionStatus: "NOT_ATTEMPTED", reasonCodes: [...supplier.reasonCodes, "SUPPLIER_SUBSTITUTION_REJECTED"],
      plainEnglish: "The substituted supplier was outside the human mandate and buyer policy; ATG failed closed before GatePass issuance.", result: supplier,
    }));

    const price = await evaluate(storeAt(root, "case-04"), "nonce_m161_price_001", 600_000, { totalAmount: 6_000 });
    cases.push(caseResult({
      caseId: "04_price_band_breach", title: "Price-band breach", outcome: "REFER",
      gatePassStatus: "NOT_ISSUED", executionStatus: "NOT_ATTEMPTED", reasonCodes: [...price.reasonCodes, "PRICE_REVIEW_BAND_REFERRED"],
      plainEnglish: "The £6,000 proposal is within the absolute policy maximum but above automatic authority, so a separate verified human review is required.", result: price,
    }));

    const restartedExact = new LocalDurableLifecycleStore({ statePath: exactStore.statePath });
    const replay = await executeThroughRegisteredSyntheticPurchasingAdapter({
      store: restartedExact, gatePass: exactGatePass, decisionReceipt: exactDecision,
      proposedAction: actionInput(exactGatePass), adapterId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].adapterId,
      resourceId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].resourceId,
    });
    cases.push(caseResult({
      caseId: "05_gatepass_reuse", title: "GatePass reuse", outcome: "REJECT",
      gatePassStatus: "ISSUED_AND_CONSUMED", executionStatus: "BLOCKED", reasonCodes: [...replay.reasonCodes, "GATEPASS_REUSE_REJECTED"],
      plainEnglish: "The durable EXECUTED lifecycle survived restart and blocked reuse of the consumed one-use GatePass before the adapter.", result: exact,
      lifecycleStatus: replay.lifecycleStatus,
    }));

    const revocationStore = storeAt(root, "case-06");
    const revocable = await evaluate(revocationStore, "nonce_m161_revoke_001", 200_000, { totalAmount: 2_000 });
    const revocableGatePass = requireGatePass(revocable);
    const revocation = revocationStore.revoke({
      gatePass: revocableGatePass, reason: "Synthetic buyer withdrew this exact authority",
      revokedAt: PURCHASING_DEMO_EXECUTION_TIME, authorityEvidence: createOperatorAuthorityEvidence(),
    });
    const restartedRevocation = new LocalDurableLifecycleStore({ statePath: revocationStore.statePath });
    const revokedAttempt = await executeThroughRegisteredSyntheticPurchasingAdapter({
      store: restartedRevocation, gatePass: revocableGatePass, decisionReceipt: requireDecisionReceipt(revocable),
      proposedAction: actionInput(revocableGatePass), adapterId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].adapterId,
      resourceId: REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0].resourceId,
    });
    cases.push(caseResult({
      caseId: "06_gatepass_revocation", title: "GatePass revocation", outcome: "REJECT",
      gatePassStatus: "REVOKED", executionStatus: "BLOCKED",
      reasonCodes: [revocation.reasonCode, ...revokedAttempt.reasonCodes, "REVOKED_GATEPASS_USE_REJECTED"],
      plainEnglish: "Operator revocation persisted across restart and the revoked GatePass could not be reserved or used.", result: revocable,
      revocationReceipt: revocation.receipt, lifecycleStatus: revokedAttempt.lifecycleStatus,
    }));

    const shadow = await evaluate(storeAt(root, "case-07"), "nonce_m161_shadow_001", 400_000, {}, "shadow");
    cases.push(caseResult({
      caseId: "07_shadow_mode", title: "Shadow Mode", outcome: "SHADOW", wouldOutcome: shadow.wouldOutcome,
      gatePassStatus: "NOT_ISSUED", executionStatus: "NOT_ATTEMPTED", reasonCodes: shadow.reasonCodes,
      plainEnglish: "Shadow Mode observed that the proposal would be accepted but created no GatePass, lifecycle authority or execution permission.", result: shadow,
    }));

    const exposureStore = storeAt(root, "case-08");
    const aggregate = await Promise.all([1, 2, 3].map((index) =>
      evaluate(exposureStore, `nonce_m161_aggregate_00${index}`, 400_000)));
    const aggregateBlocked = aggregate.find((result) => result.outcome === "REFER");
    if (aggregateBlocked === undefined) throw new Error("Aggregate ceiling did not refer the overcommitting proposal.");
    cases.push(caseResult({
      caseId: "08_aggregate_ceiling", title: "Aggregate ceiling", outcome: "REFER",
      gatePassStatus: "NOT_ISSUED", executionStatus: "NOT_ATTEMPTED",
      reasonCodes: [...aggregateBlocked.reasonCodes, "TWO_OUTSTANDING_ACTIONS_COUNTED", "CONCURRENT_OVERCOMMIT_PREVENTED"],
      plainEnglish: "Two £4,000 outstanding GatePasses counted toward the £10,000 ceiling; the concurrent third proposal was referred without double counting.",
      result: aggregateBlocked,
    }));

    const expansion = await evaluate(
      storeAt(root, "case-09"), "nonce_m161_expansion_001", 400_000, {}, "enforced",
      { requestedAuthorityExpansion: true, agentClaimsPolicyApproval: true },
    );
    cases.push(caseResult({
      caseId: "09_authority_expansion_attempt", title: "Authority expansion attempt", outcome: "REJECT",
      gatePassStatus: "NOT_ISSUED", executionStatus: "NOT_ATTEMPTED", reasonCodes: [...expansion.reasonCodes, "AGENT_AUTHORITY_EXPANSION_REJECTED"],
      plainEnglish: "Agent-supplied claims could not widen or approve its policy, mandate, supplier, purpose, amount or other bounded authority.", result: expansion,
    }));

    const recovery = await runEmergencyRecoveryCase(root);
    cases.push(recovery.caseResult);

    if (cases.length !== 10 || new Set(cases.map((item) => item.caseId)).size !== 10) {
      throw new Error("The purchasing lifecycle demonstration must contain exactly ten unique cases.");
    }
    return {
      demoVersion: PURCHASING_LIFECYCLE_DEMO_VERSION,
      referenceTime: PURCHASING_DEMO_REFERENCE_TIME,
      title: "Agent Trust Gate local purchasing lifecycle demonstration",
      cases,
      executionEvidence: {
        decisionReceipt: exactDecision,
        executionReceipt: executed.executionReceipt,
        link: executed.evidenceLink,
      },
      registeredAdapterCount: 1,
      exposedMcpTools: ["atg.evaluate_action"],
      localOnly: true,
      syntheticOnly: true,
      productionReady: false,
      externalActionOccurred: false,
      commercialWisdomAssessed: false,
      limitations: [
        "Local single-process synthetic demonstration only.",
        "No procurement, payment, settlement, customer communication or external action occurs.",
        "ATG verifies declared authority and deterministic policy boundaries; it does not decide commercial wisdom or outcome correctness.",
        "The filesystem store and fixture keys are not production-grade, distributed or tamper-proof.",
      ],
    };
  } finally {
    if (ownedRoot && options.retainState !== true) rmSync(root, { recursive: true, force: true });
  }
}

export function renderLocalPurchasingLifecycleDemo(pack: PurchasingLifecycleDemoPack): string {
  const rows = pack.cases.map((item) => [
    item.caseId.slice(0, 2), item.title, item.outcome,
    item.gatePassStatus, item.executionStatus,
  ]);
  const widths = [2, 32, 7, 19, 18];
  const line = (values: string[]) => values.map((value, index) => value.padEnd(widths[index] ?? value.length)).join(" | ").trimEnd();
  return [
    pack.title,
    "Local synthetic evidence only — no external action occurred.",
    "",
    line(["#", "Case", "Verdict", "GatePass", "Execution"]),
    line(widths.map((width) => "-".repeat(width))),
    ...rows.map(line),
    "",
    `Linked execution evidence: ${pack.executionEvidence.link.linkDigest}`,
    "ATG verifies declared authority and limits; it does not decide whether a purchase is commercially wise.",
  ].join("\n");
}

async function runEmergencyRecoveryCase(root: string): Promise<{ caseResult: PurchasingLifecycleDemoCase; snapshot: DurableStoreSnapshot }> {
  const store = storeAt(root, "case-10");
  const outstanding = await evaluate(store, "nonce_m161_recovery_outstanding_001", 100_000, { totalAmount: 1_000 });
  const gatePass = requireGatePass(outstanding);
  const revocable = await evaluate(store, "nonce_m161_recovery_revoked_001", 100_000, { totalAmount: 1_000 });
  const revocation = store.revoke({
    gatePass: requireGatePass(revocable), reason: "Synthetic recovery persistence fixture",
    revokedAt: "2026-09-02T09:00:30.000Z", authorityEvidence: createOperatorAuthorityEvidence(),
  });
  const activated = store.setEmergencyStop({
    active: true, reason: "Synthetic local recovery exercise",
    recordedAt: PURCHASING_DEMO_EXECUTION_TIME, authorityEvidence: createOperatorAuthorityEvidence(),
  });
  const restarted = new LocalDurableLifecycleStore({ statePath: store.statePath });
  const blockedByStop = restarted.reserve(gatePass, 1, "2026-09-02T09:01:15.000Z");
  restarted.setEmergencyStop({
    active: false, reason: "Synthetic operator completed stop review",
    recordedAt: "2026-09-02T09:01:30.000Z", authorityEvidence: createOperatorAuthorityEvidence(),
  });
  const reserved = restarted.reserve(gatePass, 1, "2026-09-02T09:02:00.000Z");
  if (!reserved.changed) throw new Error("Recovery fixture could not reserve after explicit stop deactivation.");
  restarted.markPossibleExternalEffect(gatePass.gatePassId, "2026-09-02T09:02:30.000Z");
  const afterCrash = new LocalDurableLifecycleStore({ statePath: store.statePath });
  const retry = afterCrash.reserve(gatePass, 3, "2026-09-02T09:03:00.000Z");
  const unresolved = afterCrash.reconcile({
    gatePassId: gatePass.gatePassId, finding: "still_unknown",
    evidenceReference: "fixture://p3-m161/reconciliation/still-unknown",
    reconciledAt: "2026-09-02T09:03:30.000Z", authorityEvidence: createOperatorAuthorityEvidence(),
  });
  const resolved = afterCrash.reconcile({
    gatePassId: gatePass.gatePassId, finding: "confirmed_not_executed",
    evidenceReference: "fixture://p3-m161/reconciliation/confirmed-not-executed",
    reconciledAt: "2026-09-02T09:04:00.000Z", authorityEvidence: createOperatorAuthorityEvidence(),
  });
  const later = await evaluate(afterCrash, "nonce_m161_recovery_after_resolution_001", 100_000, { totalAmount: 1_000 });
  const snapshot = afterCrash.snapshot();
  const persisted = snapshot.revocations.some((item) => item.receiptId === revocation.receipt?.receiptId)
    && snapshot.exposureEntries.length === 3
    && snapshot.lifecycles.some((item) => item.nonce === gatePass.action.nonce)
    && snapshot.emergencyStop.records.some((item) => item.recordId === activated.record?.recordId);
  if (!persisted || later.outcome !== "ACCEPT") throw new Error("Recovery persistence or explicit resolution evidence was incomplete.");
  return {
    snapshot,
    caseResult: caseResult({
      caseId: "10_emergency_recovery_lifecycle", title: "Emergency and recovery lifecycle", outcome: "REJECT",
      gatePassStatus: "ISSUED", executionStatus: "BLOCKED",
      reasonCodes: [
        activated.reasonCode, blockedByStop.reasonCode, "RESTART_STATE_PRESERVED",
        "NONCE_STATE_PERSISTED", "REVOCATION_PERSISTED", "AGGREGATE_EXPOSURE_PERSISTED",
        retry.reasonCode, unresolved.reasonCode, resolved.reasonCode,
        "NO_AUTOMATIC_RETRY", "EXPLICIT_RECONCILIATION_REQUIRED",
      ],
      plainEnglish: "The stop, nonce, revocation and exposure state survived restart; an uncertain action stayed UNKNOWN without retry until explicit confirmed-not-executed reconciliation.",
      result: outstanding, reconciliation: resolved.reconciliation, lifecycleStatus: resolved.lifecycle?.status ?? null,
    }),
  };
}

function storeAt(root: string, name: string): LocalDurableLifecycleStore {
  const directory = join(root, name);
  mkdirSync(directory, { recursive: true });
  return new LocalDurableLifecycleStore({ statePath: join(directory, "state.json") });
}

async function evaluate(
  store: LocalDurableLifecycleStore,
  nonce: string,
  amountMinorUnits: number,
  actionPatch: Record<string, unknown> = {},
  mode: "enforced" | "shadow" = "enforced",
  contextPatch: Record<string, unknown> = {},
  exposureRule: AggregateExposureRule = DEFAULT_AGGREGATE_EXPOSURE_RULE,
): Promise<McpBusinessPolicyResult> {
  const request = createDefaultMcpBusinessPolicyRequest(
    mode,
    { nonce, totalAmount: amountMinorUnits / 100, ...actionPatch },
    contextPatch,
  );
  request.amountMinorUnits = amountMinorUnits;
  return await new McpExactActionGateway({ durableStore: store, exposureRule }).evaluateAction(request) as McpBusinessPolicyResult;
}

function actionInput(gatePass: ExactActionGatePass): CanonicalActionEnvelopeInput {
  const { actionEnvelopeVersion: _envelope, canonicalizationVersion: _canonical, digestAlgorithm: _algorithm, actionDigest: _digest, ...input } = gatePass.action;
  return structuredClone(input);
}

function requireGatePass(result: McpBusinessPolicyResult): ExactActionGatePass {
  if (result.outcome !== "ACCEPT" || result.gatePass === null) throw new Error(`Expected GatePass: ${result.reasonCodes.join(",")}`);
  return result.gatePass;
}

function requireDecisionReceipt(result: McpBusinessPolicyResult): PolicyDecisionReceipt {
  if (result.policyDecisionReceipt === null) throw new Error("Expected a policy decision receipt.");
  return result.policyDecisionReceipt;
}

function blocked(reasonCode: string, adapterReached: boolean, lifecycleStatus: string | null): SyntheticExecutionAttempt {
  return { outcome: "REJECTED", reasonCodes: [reasonCode], adapterReached, executionReceipt: null, evidenceLink: null, lifecycleStatus };
}

function caseResult(input: {
  caseId: PurchasingLifecycleCaseId;
  title: string;
  outcome: PurchasingDemoOutcome;
  wouldOutcome?: "ACCEPT" | "REFER" | "REJECT" | null;
  gatePassStatus: PurchasingGatePassStatus;
  executionStatus: PurchasingExecutionStatus;
  reasonCodes: readonly string[];
  plainEnglish: string;
  result: McpBusinessPolicyResult;
  executionReceipt?: ExecutionReceipt | null;
  executionLink?: PurchasingExecutionEvidenceLink | null;
  revocationReceipt?: GatePassRevocationReceipt | null;
  reconciliation?: LifecycleReconciliationRecord | null;
  lifecycleStatus?: string | null;
}): PurchasingLifecycleDemoCase {
  return {
    caseId: input.caseId,
    title: input.title,
    outcome: input.outcome,
    wouldOutcome: input.wouldOutcome ?? input.result.wouldOutcome,
    gatePassStatus: input.gatePassStatus,
    executionStatus: input.executionStatus,
    reasonCodes: [...new Set(input.reasonCodes)],
    plainEnglish: input.plainEnglish,
    evidence: {
      humanMandateReference: input.result.gatePass?.action.mandateReference ?? null,
      exactActionDigest: input.result.exactActionDigest,
      decisionReceiptId: input.result.policyDecisionReceipt?.receiptId ?? null,
      shadowReceiptId: input.result.shadowDecisionReceipt?.receiptId ?? null,
      gatePassId: input.result.gatePass?.gatePassId ?? null,
      executionReceiptId: input.executionReceipt?.receiptId ?? null,
      executionLinkDigest: input.executionLink?.linkDigest ?? null,
      revocationReceiptId: input.revocationReceipt?.receiptId ?? null,
      reconciliationId: input.reconciliation?.reconciliationId ?? null,
      lifecycleStatus: input.lifecycleStatus ?? input.result.lifecycle?.status ?? null,
    },
  };
}
