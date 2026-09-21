import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import type { ExactActionGatePass } from "./exact-action-gatepass.js";
import { createCanonicalPayloadHash } from "./local-signed-proof.js";

export const DURABLE_LIFECYCLE_STORE_VERSION = "atg.durable-lifecycle-store.local.v1" as const;
export const ACTION_LIFECYCLE_RECORD_VERSION = "atg.action-lifecycle.local.v1" as const;
export const AGGREGATE_EXPOSURE_ENTRY_VERSION = "atg.aggregate-exposure-entry.local.v1" as const;
export const REVOCATION_RECEIPT_VERSION = "atg.gatepass-revocation-receipt.local.v1" as const;
export const EMERGENCY_STOP_RECORD_VERSION = "atg.emergency-stop-record.local.v1" as const;
export const RECONCILIATION_RECORD_VERSION = "atg.lifecycle-reconciliation.local.v1" as const;
export const OPERATOR_AUTHORITY_EVIDENCE_VERSION = "atg.operator-authority-evidence.local.v1" as const;

export type ActionLifecycleStatus =
  | "ISSUED"
  | "RESERVED"
  | "EXECUTED"
  | "REJECTED"
  | "REFERRED"
  | "REVOKED"
  | "EXPIRED"
  | "FAILED"
  | "ABANDONED"
  | "UNKNOWN";

export type ExposureEntryStatus = "OUTSTANDING" | "RESERVED" | "COMMITTED" | "RELEASED" | "UNKNOWN";
export type AggregateExhaustionOutcome = "REFER" | "REJECT";
export type ReconciliationFinding = "confirmed_not_executed" | "confirmed_executed" | "still_unknown";

export type DurableLifecycleReasonCode =
  | "LIFECYCLE_ISSUED"
  | "LIFECYCLE_REJECTED_RECORDED"
  | "LIFECYCLE_REFERRED_RECORDED"
  | "LIFECYCLE_RESERVED"
  | "LIFECYCLE_EXECUTED"
  | "LIFECYCLE_FAILED"
  | "LIFECYCLE_ABANDONED"
  | "LIFECYCLE_EXPIRED"
  | "LIFECYCLE_UNKNOWN"
  | "LIFECYCLE_INVALID_TRANSITION"
  | "LIFECYCLE_RECORD_NOT_FOUND"
  | "LIFECYCLE_BINDING_MISMATCH"
  | "LIFECYCLE_COMPARE_AND_SET_FAILED"
  | "LIFECYCLE_TERMINAL"
  | "LIFECYCLE_RECONCILIATION_REQUIRED"
  | "LIFECYCLE_UNKNOWN_NO_AUTOMATIC_RETRY"
  | "DURABLE_STATE_UNAVAILABLE"
  | "DURABLE_STATE_CORRUPTED"
  | "DURABLE_STATE_VERSION_UNSUPPORTED"
  | "DURABLE_WRITE_FAILED"
  | "DURABLE_WRITE_NOT_CONFIRMED"
  | "EXPOSURE_WITHIN_LIMIT"
  | "EXPOSURE_AMOUNT_LIMIT_EXCEEDED"
  | "EXPOSURE_ACTION_COUNT_LIMIT_EXCEEDED"
  | "EXPOSURE_CURRENCY_MISMATCH"
  | "EXPOSURE_RULE_MISMATCH"
  | "EXPOSURE_RELEASED"
  | "EXPOSURE_ALREADY_RELEASED"
  | "GATEPASS_REVOKED"
  | "GATEPASS_ALREADY_REVOKED"
  | "GATEPASS_REVOCATION_AFTER_EXECUTION_REFUSED"
  | "GATEPASS_REVOCATION_REQUIRES_RECONCILIATION"
  | "OPERATOR_AUTHORITY_INVALID"
  | "EMERGENCY_STOP_ACTIVE"
  | "EMERGENCY_STOP_ACTIVATED"
  | "EMERGENCY_STOP_ALREADY_ACTIVE"
  | "EMERGENCY_STOP_DEACTIVATED"
  | "EMERGENCY_STOP_ALREADY_INACTIVE"
  | "RECONCILIATION_CONFIRMED_NOT_EXECUTED"
  | "RECONCILIATION_CONFIRMED_EXECUTED"
  | "RECONCILIATION_STILL_UNKNOWN";

export const LIFECYCLE_TRANSITION_TABLE: Readonly<Record<ActionLifecycleStatus, readonly ActionLifecycleStatus[]>> = {
  ISSUED: ["RESERVED", "REVOKED", "EXPIRED", "ABANDONED"],
  RESERVED: ["EXECUTED", "FAILED", "ABANDONED", "UNKNOWN"],
  EXECUTED: [],
  REJECTED: [],
  REFERRED: [],
  REVOKED: [],
  EXPIRED: [],
  FAILED: [],
  ABANDONED: [],
  UNKNOWN: ["EXECUTED", "ABANDONED", "UNKNOWN"],
};

export interface AggregateExposureRule {
  ruleId: string;
  policyId: string;
  policyVersion: string;
  actionFamily: string;
  currency: string;
  counterpartyClass: string;
  windowSeconds: number;
  maximumAggregateMinorUnits: number;
  maximumActionCount: number | null;
  exhaustionOutcome: AggregateExhaustionOutcome;
}

export const DEFAULT_AGGREGATE_EXPOSURE_RULE: AggregateExposureRule = {
  ruleId: "EXPOSURE-SYNTHETIC-PURCHASE-24H-001",
  policyId: "policy.synthetic-buyer.procurement.v1",
  policyVersion: "1.0.0",
  actionFamily: "purchase",
  currency: "GBP",
  counterpartyClass: "supplier_a",
  windowSeconds: 86_400,
  maximumAggregateMinorUnits: 1_000_000,
  maximumActionCount: 3,
  exhaustionOutcome: "REFER",
};

export interface OperatorAuthorityEvidence {
  evidenceVersion: typeof OPERATOR_AUTHORITY_EVIDENCE_VERSION;
  actorReference: string;
  authorityReference: string;
  role: "local_security_controller";
  effectiveAt: string;
  expiresAt: string;
  syntheticOnly: true;
  evidenceDigest: string;
}

export function createOperatorAuthorityEvidence(
  patch: Partial<Omit<OperatorAuthorityEvidence, "evidenceVersion" | "evidenceDigest" | "syntheticOnly">> = {},
): OperatorAuthorityEvidence {
  const unsigned = {
    evidenceVersion: OPERATOR_AUTHORITY_EVIDENCE_VERSION,
    actorReference: "operator://northstar/security-controller/EMP-NORTHSTAR-0042",
    authorityReference: "fixture://northstar/operator-authority/local-security-control-v1",
    role: "local_security_controller" as const,
    effectiveAt: "2026-09-02T08:00:00.000Z",
    expiresAt: "2026-09-02T17:00:00.000Z",
    syntheticOnly: true as const,
    ...patch,
  };
  return { ...unsigned, evidenceDigest: createCanonicalPayloadHash(unsigned) };
}

export const REGISTERED_OPERATOR_AUTHORITY_EVIDENCE = createOperatorAuthorityEvidence();

export interface LifecycleTransition {
  from: ActionLifecycleStatus | null;
  to: ActionLifecycleStatus;
  at: string;
  reasonCode: DurableLifecycleReasonCode;
}

export interface ActionLifecycleRecord {
  recordVersion: typeof ACTION_LIFECYCLE_RECORD_VERSION;
  lifecycleId: string;
  lifecycleRevision: number;
  status: ActionLifecycleStatus;
  gatePassId: string | null;
  actionDigest: string;
  policyDigest: string;
  passportDigest: string;
  subjectAgentIdentity: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  amountMinorUnits: number;
  currency: string;
  actionFamily: string;
  exposureEntryId: string | null;
  createdAt: string;
  updatedAt: string;
  transitions: LifecycleTransition[];
  localOnly: true;
  syntheticOnly: true;
}

export interface AggregateExposureLedgerEntry {
  entryVersion: typeof AGGREGATE_EXPOSURE_ENTRY_VERSION;
  exposureEntryId: string;
  lifecycleId: string;
  gatePassId: string;
  actionDigest: string;
  policyId: string;
  policyVersion: string;
  policyDigest: string;
  passportDigest: string;
  actionFamily: string;
  currency: string;
  counterpartyClass: string;
  amountMinorUnits: number;
  status: ExposureEntryStatus;
  windowStartedAt: string;
  windowEndsAt: string;
  createdAt: string;
  updatedAt: string;
  releaseReason: "revoked" | "expired" | "abandoned" | null;
  localOnly: true;
  syntheticOnly: true;
}

export interface GatePassRevocationReceipt {
  receiptVersion: typeof REVOCATION_RECEIPT_VERSION;
  receiptId: string;
  gatePassId: string;
  lifecycleId: string;
  actionDigest: string;
  reason: string;
  actorReference: string;
  authorityEvidenceDigest: string;
  revokedAt: string;
  idempotentReplay: boolean;
  reversedExternalAction: false;
  localOnly: true;
  syntheticOnly: true;
  receiptDigest: string;
}

export interface EmergencyStopEvidenceRecord {
  recordVersion: typeof EMERGENCY_STOP_RECORD_VERSION;
  recordId: string;
  sequence: number;
  active: boolean;
  operation: "activate" | "deactivate";
  reason: string;
  actorReference: string;
  authorityEvidenceDigest: string;
  recordedAt: string;
  affectedScope: "global_local_gateway";
  reservedOrUnknownReversed: false;
  localOnly: true;
  syntheticOnly: true;
  recordDigest: string;
}

export interface LifecycleReconciliationRecord {
  recordVersion: typeof RECONCILIATION_RECORD_VERSION;
  reconciliationId: string;
  lifecycleId: string;
  gatePassId: string;
  priorStatus: "RESERVED" | "UNKNOWN";
  finding: ReconciliationFinding;
  resultingStatus: "ABANDONED" | "EXECUTED" | "UNKNOWN";
  evidenceReference: string;
  actorReference: string;
  authorityEvidenceDigest: string;
  reconciledAt: string;
  automaticRetryPermitted: false;
  externalActionReversed: false;
  localOnly: true;
  syntheticOnly: true;
  recordDigest: string;
}

interface DurableLifecycleState {
  storeVersion: typeof DURABLE_LIFECYCLE_STORE_VERSION;
  storeRevision: number;
  lifecycles: ActionLifecycleRecord[];
  exposureEntries: AggregateExposureLedgerEntry[];
  revocations: GatePassRevocationReceipt[];
  emergencyStop: { active: boolean; sequence: number; records: EmergencyStopEvidenceRecord[] };
  reconciliations: LifecycleReconciliationRecord[];
  localSingleProcessOnly: true;
  productionGrade: false;
  integrityDigest: string;
}

export interface DurableStoreSnapshot extends DurableLifecycleState {}

export interface ExposurePreview {
  ruleId: string;
  currency: string;
  currentAmountMinorUnits: number;
  proposedAmountMinorUnits: number;
  resultingAmountMinorUnits: number;
  currentActionCount: number;
  resultingActionCount: number;
  maximumAggregateMinorUnits: number;
  maximumActionCount: number | null;
  withinLimit: boolean;
  reasonCode: DurableLifecycleReasonCode;
  simulatedOnly: boolean;
}

export interface DurableIssuanceInput {
  gatePass: ExactActionGatePass;
  passportDigest: string;
  policyId: string;
  policyVersion: string;
  amountMinorUnits: number;
  actionFamily: string;
  counterpartyClass: string;
  rule: AggregateExposureRule;
  recordedAt: string;
}

export interface DurableIssuanceResult {
  issued: boolean;
  outcome: "ACCEPT" | AggregateExhaustionOutcome | "REJECT";
  reasonCodes: DurableLifecycleReasonCode[];
  lifecycle: ActionLifecycleRecord | null;
  exposureEntry: AggregateExposureLedgerEntry | null;
  exposure: ExposurePreview | null;
}

export interface DurableTransitionResult {
  changed: boolean;
  reasonCode: DurableLifecycleReasonCode;
  lifecycle: ActionLifecycleRecord | null;
}

export interface RevocationResult extends DurableTransitionResult {
  receipt: GatePassRevocationReceipt | null;
}

export interface EmergencyStopResult {
  changed: boolean;
  reasonCode: DurableLifecycleReasonCode;
  active: boolean;
  record: EmergencyStopEvidenceRecord | null;
}

export interface ReconciliationResult extends DurableTransitionResult {
  reconciliation: LifecycleReconciliationRecord | null;
}

export type DurableWriteStage = "before_write" | "after_temp_fsync" | "after_replace";

export class DurableStateError extends Error {
  constructor(readonly reasonCode: DurableLifecycleReasonCode, message: string) {
    super(message);
    this.name = "DurableStateError";
  }
}

let anonymousStoreCounter = 0;

export function createAnonymousDurableStatePath(): string {
  anonymousStoreCounter += 1;
  return join(
    tmpdir(),
    "agent-trust-gate-p3-m160",
    `gateway-${process.pid}-${anonymousStoreCounter}-${randomUUID()}.json`,
  );
}

export class LocalDurableLifecycleStore {
  readonly statePath: string;
  readonly localSingleProcessOnly = true as const;
  readonly productionGrade = false as const;
  readonly #faultInjector: ((stage: DurableWriteStage) => void) | undefined;
  #state: DurableLifecycleState | null = null;
  #failure: DurableStateError | null = null;

  constructor(options: {
    statePath?: string;
    faultInjector?: (stage: DurableWriteStage) => void;
  } = {}) {
    this.statePath = options.statePath ?? process.env.ATG_LOCAL_STATE_PATH ?? createAnonymousDurableStatePath();
    this.#faultInjector = options.faultInjector;
    this.#load();
  }

  health(): { available: boolean; reasonCode: DurableLifecycleReasonCode | null; statePath: string } {
    return { available: this.#failure === null, reasonCode: this.#failure?.reasonCode ?? null, statePath: this.statePath };
  }

  snapshot(): DurableStoreSnapshot {
    return structuredClone(this.#requireState());
  }

  isEmergencyStopActive(): boolean {
    return this.#requireState().emergencyStop.active;
  }

  getLifecycleByGatePassId(gatePassId: string): ActionLifecycleRecord | null {
    const record = this.#requireState().lifecycles.find((candidate) => candidate.gatePassId === gatePassId);
    return record === undefined ? null : structuredClone(record);
  }

  getLifecycleByNonce(nonce: string): ActionLifecycleRecord | null {
    const record = this.#requireState().lifecycles.find((candidate) => candidate.nonce === nonce);
    return record === undefined ? null : structuredClone(record);
  }

  previewExposure(input: Omit<DurableIssuanceInput, "gatePass" | "passportDigest" | "recordedAt"> & {
    policyDigest: string;
    passportDigest: string;
    currency: string;
    recordedAt: string;
  }): ExposurePreview {
    const state = this.#requireState();
    return exposurePreview(state, input.rule, {
      policyId: input.policyId,
      policyVersion: input.policyVersion,
      actionFamily: input.actionFamily,
      currency: input.currency,
      counterpartyClass: input.counterpartyClass,
      amountMinorUnits: input.amountMinorUnits,
      recordedAt: input.recordedAt,
    }, true);
  }

  issue(input: DurableIssuanceInput): DurableIssuanceResult {
    validateIssuanceInput(input);
    const state = this.#requireState();
    if (state.emergencyStop.active) {
      return { issued: false, outcome: "REJECT", reasonCodes: ["EMERGENCY_STOP_ACTIVE"], lifecycle: null, exposureEntry: null, exposure: null };
    }
    if (state.lifecycles.some((record) => record.gatePassId === input.gatePass.gatePassId || record.nonce === input.gatePass.action.nonce)) {
      return { issued: false, outcome: "REJECT", reasonCodes: ["LIFECYCLE_COMPARE_AND_SET_FAILED"], lifecycle: null, exposureEntry: null, exposure: null };
    }
    const preview = exposurePreview(state, input.rule, {
      policyId: input.policyId,
      policyVersion: input.policyVersion,
      actionFamily: input.actionFamily,
      currency: input.gatePass.action.currency ?? "",
      counterpartyClass: input.counterpartyClass,
      amountMinorUnits: input.amountMinorUnits,
      recordedAt: input.recordedAt,
    }, false);
    if (!preview.withinLimit) {
      const lifecycle = createNonAuthorisingLifecycle({
        status: input.rule.exhaustionOutcome === "REFER" ? "REFERRED" : "REJECTED",
        actionDigest: input.gatePass.action.actionDigest,
        policyDigest: input.gatePass.action.policyDigest,
        passportDigest: input.passportDigest,
        subjectAgentIdentity: input.gatePass.action.subjectAgentIdentity,
        nonce: input.gatePass.action.nonce,
        issuedAt: input.gatePass.action.issuedAt,
        expiresAt: input.gatePass.action.expiresAt,
        amountMinorUnits: input.amountMinorUnits,
        currency: input.gatePass.action.currency ?? "",
        actionFamily: input.actionFamily,
        recordedAt: input.recordedAt,
        sequence: state.storeRevision + 1,
      });
      this.#commit((next) => { next.lifecycles.push(lifecycle); });
      return {
        issued: false,
        outcome: input.rule.exhaustionOutcome,
        reasonCodes: [preview.reasonCode, lifecycle.status === "REFERRED" ? "LIFECYCLE_REFERRED_RECORDED" : "LIFECYCLE_REJECTED_RECORDED"],
        lifecycle: structuredClone(lifecycle), exposureEntry: null, exposure: preview,
      };
    }
    const lifecycleId = `lifecycle_${shortHash(input.gatePass.gatePassId, input.gatePass.action.actionDigest)}`;
    const exposureEntryId = `exposure_${shortHash(lifecycleId, input.rule.ruleId)}`;
    const lifecycle: ActionLifecycleRecord = {
      recordVersion: ACTION_LIFECYCLE_RECORD_VERSION,
      lifecycleId,
      lifecycleRevision: 1,
      status: "ISSUED",
      gatePassId: input.gatePass.gatePassId,
      actionDigest: input.gatePass.action.actionDigest,
      policyDigest: input.gatePass.action.policyDigest,
      passportDigest: input.passportDigest,
      subjectAgentIdentity: input.gatePass.action.subjectAgentIdentity,
      nonce: input.gatePass.action.nonce,
      issuedAt: input.gatePass.action.issuedAt,
      expiresAt: input.gatePass.action.expiresAt,
      amountMinorUnits: input.amountMinorUnits,
      currency: input.gatePass.action.currency ?? "",
      actionFamily: input.actionFamily,
      exposureEntryId,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      transitions: [{ from: null, to: "ISSUED", at: input.recordedAt, reasonCode: "LIFECYCLE_ISSUED" }],
      localOnly: true,
      syntheticOnly: true,
    };
    const exposureEntry: AggregateExposureLedgerEntry = {
      entryVersion: AGGREGATE_EXPOSURE_ENTRY_VERSION,
      exposureEntryId,
      lifecycleId,
      gatePassId: input.gatePass.gatePassId,
      actionDigest: input.gatePass.action.actionDigest,
      policyId: input.policyId,
      policyVersion: input.policyVersion,
      policyDigest: input.gatePass.action.policyDigest,
      passportDigest: input.passportDigest,
      actionFamily: input.actionFamily,
      currency: input.gatePass.action.currency ?? "",
      counterpartyClass: input.counterpartyClass,
      amountMinorUnits: input.amountMinorUnits,
      status: "OUTSTANDING",
      windowStartedAt: input.recordedAt,
      windowEndsAt: new Date(Date.parse(input.recordedAt) + input.rule.windowSeconds * 1000).toISOString(),
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      releaseReason: null,
      localOnly: true,
      syntheticOnly: true,
    };
    this.#commit((next) => {
      next.lifecycles.push(lifecycle);
      next.exposureEntries.push(exposureEntry);
    });
    const confirmed = this.getLifecycleByGatePassId(input.gatePass.gatePassId);
    if (confirmed?.status !== "ISSUED") {
      throw this.#fail("DURABLE_WRITE_NOT_CONFIRMED", "Persisted ISSUED state could not be confirmed.");
    }
    return {
      issued: true, outcome: "ACCEPT", reasonCodes: ["LIFECYCLE_ISSUED", "EXPOSURE_WITHIN_LIMIT"],
      lifecycle: structuredClone(lifecycle), exposureEntry: structuredClone(exposureEntry), exposure: preview,
    };
  }

  recordNonAuthorisingDecision(input: {
    status: "REJECTED" | "REFERRED";
    actionDigest: string;
    policyDigest: string;
    passportDigest: string;
    subjectAgentIdentity: string;
    nonce: string;
    issuedAt: string;
    expiresAt: string;
    amountMinorUnits: number;
    currency: string;
    actionFamily: string;
    recordedAt: string;
  }): ActionLifecycleRecord {
    const state = this.#requireState();
    const existing = state.lifecycles.find((record) => record.nonce === input.nonce);
    if (existing !== undefined) return structuredClone(existing);
    const record = createNonAuthorisingLifecycle({ ...input, sequence: state.storeRevision + 1 });
    this.#commit((next) => { next.lifecycles.push(record); });
    return structuredClone(record);
  }

  reserve(gatePass: ExactActionGatePass, expectedLifecycleRevision: number, reservedAt: string): DurableTransitionResult {
    const state = this.#requireState();
    if (state.emergencyStop.active) return unchanged("EMERGENCY_STOP_ACTIVE", this.#findLifecycle(state, gatePass.gatePassId));
    const record = this.#findLifecycle(state, gatePass.gatePassId);
    if (record === null) return unchanged("LIFECYCLE_RECORD_NOT_FOUND", null);
    if (!bindingsMatch(record, gatePass)) return unchanged("LIFECYCLE_BINDING_MISMATCH", record);
    if (record.lifecycleRevision !== expectedLifecycleRevision) return unchanged("LIFECYCLE_COMPARE_AND_SET_FAILED", record);
    if (Date.parse(reservedAt) >= Date.parse(record.expiresAt)) {
      return this.#transitionAndRelease(record.lifecycleId, "EXPIRED", reservedAt, "LIFECYCLE_EXPIRED", "expired");
    }
    if (record.status !== "ISSUED") {
      return unchanged(record.status === "UNKNOWN" ? "LIFECYCLE_UNKNOWN_NO_AUTOMATIC_RETRY" : "LIFECYCLE_INVALID_TRANSITION", record);
    }
    return this.#transition(record.lifecycleId, "RESERVED", reservedAt, "LIFECYCLE_RESERVED", "RESERVED");
  }

  markPossibleExternalEffect(gatePassId: string, at: string): DurableTransitionResult {
    const record = this.#findLifecycle(this.#requireState(), gatePassId);
    if (record === null) return unchanged("LIFECYCLE_RECORD_NOT_FOUND", null);
    if (record.status !== "RESERVED") return unchanged("LIFECYCLE_INVALID_TRANSITION", record);
    return this.#transition(record.lifecycleId, "UNKNOWN", at, "LIFECYCLE_UNKNOWN", "UNKNOWN");
  }

  markExecuted(gatePassId: string, at: string): DurableTransitionResult {
    const record = this.#findLifecycle(this.#requireState(), gatePassId);
    if (record === null) return unchanged("LIFECYCLE_RECORD_NOT_FOUND", null);
    if (record.status !== "RESERVED") return unchanged(record.status === "EXECUTED" ? "LIFECYCLE_TERMINAL" : "LIFECYCLE_INVALID_TRANSITION", record);
    return this.#transition(record.lifecycleId, "EXECUTED", at, "LIFECYCLE_EXECUTED", "COMMITTED");
  }

  markFailed(gatePassId: string, at: string): DurableTransitionResult {
    const record = this.#findLifecycle(this.#requireState(), gatePassId);
    if (record === null) return unchanged("LIFECYCLE_RECORD_NOT_FOUND", null);
    if (record.status !== "RESERVED") return unchanged("LIFECYCLE_INVALID_TRANSITION", record);
    return this.#transition(record.lifecycleId, "FAILED", at, "LIFECYCLE_FAILED", "UNKNOWN");
  }

  abandonIssued(gatePassId: string, at: string, evidence: OperatorAuthorityEvidence): DurableTransitionResult {
    if (!operatorEvidenceValid(evidence, at)) return unchanged("OPERATOR_AUTHORITY_INVALID", null);
    const record = this.#findLifecycle(this.#requireState(), gatePassId);
    if (record === null) return unchanged("LIFECYCLE_RECORD_NOT_FOUND", null);
    if (record.status !== "ISSUED") return unchanged("LIFECYCLE_INVALID_TRANSITION", record);
    return this.#transitionAndRelease(record.lifecycleId, "ABANDONED", at, "LIFECYCLE_ABANDONED", "abandoned");
  }

  expire(gatePassId: string, at: string): DurableTransitionResult {
    const record = this.#findLifecycle(this.#requireState(), gatePassId);
    if (record === null) return unchanged("LIFECYCLE_RECORD_NOT_FOUND", null);
    if (record.status !== "ISSUED") return unchanged("LIFECYCLE_INVALID_TRANSITION", record);
    if (Date.parse(at) < Date.parse(record.expiresAt)) return unchanged("LIFECYCLE_INVALID_TRANSITION", record);
    return this.#transitionAndRelease(record.lifecycleId, "EXPIRED", at, "LIFECYCLE_EXPIRED", "expired");
  }

  revoke(input: {
    gatePass: ExactActionGatePass;
    reason: string;
    revokedAt: string;
    authorityEvidence: OperatorAuthorityEvidence;
  }): RevocationResult {
    if (!operatorEvidenceValid(input.authorityEvidence, input.revokedAt)) {
      return { ...unchanged("OPERATOR_AUTHORITY_INVALID", null), receipt: null };
    }
    const state = this.#requireState();
    const record = this.#findLifecycle(state, input.gatePass.gatePassId);
    if (record === null) return { ...unchanged("LIFECYCLE_RECORD_NOT_FOUND", null), receipt: null };
    if (!bindingsMatch(record, input.gatePass)) return { ...unchanged("LIFECYCLE_BINDING_MISMATCH", record), receipt: null };
    const priorReceipt = state.revocations.find((receipt) => receipt.gatePassId === input.gatePass.gatePassId);
    if (priorReceipt !== undefined) {
      return { changed: false, reasonCode: "GATEPASS_ALREADY_REVOKED", lifecycle: structuredClone(record), receipt: structuredClone(priorReceipt) };
    }
    if (record.status === "EXECUTED") {
      return { ...unchanged("GATEPASS_REVOCATION_AFTER_EXECUTION_REFUSED", record), receipt: null };
    }
    if (record.status === "RESERVED" || record.status === "UNKNOWN") {
      const changed = record.status === "RESERVED";
      if (changed) this.#transition(record.lifecycleId, "UNKNOWN", input.revokedAt, "LIFECYCLE_RECONCILIATION_REQUIRED", "UNKNOWN");
      return {
        changed,
        reasonCode: "GATEPASS_REVOCATION_REQUIRES_RECONCILIATION",
        lifecycle: this.getLifecycleByGatePassId(input.gatePass.gatePassId),
        receipt: null,
      };
    }
    if (record.status !== "ISSUED") return { ...unchanged("LIFECYCLE_INVALID_TRANSITION", record), receipt: null };
    const unsigned = {
      receiptVersion: REVOCATION_RECEIPT_VERSION,
      receiptId: `revocation_${shortHash(record.gatePassId ?? "", input.reason, input.revokedAt)}`,
      gatePassId: record.gatePassId!,
      lifecycleId: record.lifecycleId,
      actionDigest: record.actionDigest,
      reason: boundedText(input.reason, "reason", 240),
      actorReference: input.authorityEvidence.actorReference,
      authorityEvidenceDigest: input.authorityEvidence.evidenceDigest,
      revokedAt: timestamp(input.revokedAt, "revokedAt"),
      idempotentReplay: false,
      reversedExternalAction: false as const,
      localOnly: true as const,
      syntheticOnly: true as const,
    };
    const receipt: GatePassRevocationReceipt = { ...unsigned, receiptDigest: createCanonicalPayloadHash(unsigned) };
    this.#commit((next) => {
      const mutable = lifecycleById(next, record.lifecycleId);
      applyTransition(mutable, "REVOKED", input.revokedAt, "GATEPASS_REVOKED");
      releaseExposure(next, mutable, input.revokedAt, "revoked");
      next.revocations.push(receipt);
    });
    return { changed: true, reasonCode: "GATEPASS_REVOKED", lifecycle: this.getLifecycleByGatePassId(input.gatePass.gatePassId), receipt: structuredClone(receipt) };
  }

  setEmergencyStop(input: {
    active: boolean;
    reason: string;
    recordedAt: string;
    authorityEvidence: OperatorAuthorityEvidence;
  }): EmergencyStopResult {
    if (!operatorEvidenceValid(input.authorityEvidence, input.recordedAt)) {
      return { changed: false, reasonCode: "OPERATOR_AUTHORITY_INVALID", active: this.#requireState().emergencyStop.active, record: null };
    }
    const state = this.#requireState();
    if (state.emergencyStop.active === input.active) {
      return {
        changed: false,
        reasonCode: input.active ? "EMERGENCY_STOP_ALREADY_ACTIVE" : "EMERGENCY_STOP_ALREADY_INACTIVE",
        active: input.active,
        record: state.emergencyStop.records.at(-1) === undefined ? null : structuredClone(state.emergencyStop.records.at(-1)!),
      };
    }
    const sequence = state.emergencyStop.sequence + 1;
    const unsigned = {
      recordVersion: EMERGENCY_STOP_RECORD_VERSION,
      recordId: `emergency_${shortHash(String(sequence), String(input.active), input.recordedAt)}`,
      sequence,
      active: input.active,
      operation: input.active ? "activate" as const : "deactivate" as const,
      reason: boundedText(input.reason, "reason", 240),
      actorReference: input.authorityEvidence.actorReference,
      authorityEvidenceDigest: input.authorityEvidence.evidenceDigest,
      recordedAt: timestamp(input.recordedAt, "recordedAt"),
      affectedScope: "global_local_gateway" as const,
      reservedOrUnknownReversed: false as const,
      localOnly: true as const,
      syntheticOnly: true as const,
    };
    const record: EmergencyStopEvidenceRecord = { ...unsigned, recordDigest: createCanonicalPayloadHash(unsigned) };
    this.#commit((next) => {
      next.emergencyStop.active = input.active;
      next.emergencyStop.sequence = sequence;
      next.emergencyStop.records.push(record);
    });
    return {
      changed: true,
      reasonCode: input.active ? "EMERGENCY_STOP_ACTIVATED" : "EMERGENCY_STOP_DEACTIVATED",
      active: input.active,
      record: structuredClone(record),
    };
  }

  reconcile(input: {
    gatePassId: string;
    finding: ReconciliationFinding;
    evidenceReference: string;
    reconciledAt: string;
    authorityEvidence: OperatorAuthorityEvidence;
  }): ReconciliationResult {
    if (!operatorEvidenceValid(input.authorityEvidence, input.reconciledAt)) {
      return { ...unchanged("OPERATOR_AUTHORITY_INVALID", null), reconciliation: null };
    }
    const record = this.#findLifecycle(this.#requireState(), input.gatePassId);
    if (record === null) return { ...unchanged("LIFECYCLE_RECORD_NOT_FOUND", null), reconciliation: null };
    if (record.status !== "RESERVED" && record.status !== "UNKNOWN") {
      return { ...unchanged("LIFECYCLE_INVALID_TRANSITION", record), reconciliation: null };
    }
    const resultingStatus = input.finding === "confirmed_not_executed"
      ? "ABANDONED" as const
      : input.finding === "confirmed_executed" ? "EXECUTED" as const : "UNKNOWN" as const;
    const reasonCode = input.finding === "confirmed_not_executed"
      ? "RECONCILIATION_CONFIRMED_NOT_EXECUTED" as const
      : input.finding === "confirmed_executed"
        ? "RECONCILIATION_CONFIRMED_EXECUTED" as const
        : "RECONCILIATION_STILL_UNKNOWN" as const;
    const unsigned = {
      recordVersion: RECONCILIATION_RECORD_VERSION,
      reconciliationId: `reconciliation_${shortHash(record.lifecycleId, input.finding, input.reconciledAt)}`,
      lifecycleId: record.lifecycleId,
      gatePassId: input.gatePassId,
      priorStatus: record.status,
      finding: input.finding,
      resultingStatus,
      evidenceReference: boundedText(input.evidenceReference, "evidenceReference", 240),
      actorReference: input.authorityEvidence.actorReference,
      authorityEvidenceDigest: input.authorityEvidence.evidenceDigest,
      reconciledAt: timestamp(input.reconciledAt, "reconciledAt"),
      automaticRetryPermitted: false as const,
      externalActionReversed: false as const,
      localOnly: true as const,
      syntheticOnly: true as const,
    };
    const reconciliation: LifecycleReconciliationRecord = { ...unsigned, recordDigest: createCanonicalPayloadHash(unsigned) };
    this.#commit((next) => {
      const mutable = lifecycleById(next, record.lifecycleId);
      applyTransition(mutable, resultingStatus, input.reconciledAt, reasonCode);
      if (resultingStatus === "ABANDONED") releaseExposure(next, mutable, input.reconciledAt, "abandoned", true);
      else setExposureStatus(next, mutable, resultingStatus === "EXECUTED" ? "COMMITTED" : "UNKNOWN", input.reconciledAt);
      next.reconciliations.push(reconciliation);
    });
    return { changed: resultingStatus !== record.status, reasonCode, lifecycle: this.getLifecycleByGatePassId(input.gatePassId), reconciliation: structuredClone(reconciliation) };
  }

  #transition(
    lifecycleId: string,
    to: ActionLifecycleStatus,
    at: string,
    reasonCode: DurableLifecycleReasonCode,
    exposureStatus: ExposureEntryStatus,
  ): DurableTransitionResult {
    const before = lifecycleById(this.#requireState(), lifecycleId);
    if (!LIFECYCLE_TRANSITION_TABLE[before.status].includes(to)) return unchanged("LIFECYCLE_INVALID_TRANSITION", before);
    this.#commit((next) => {
      const mutable = lifecycleById(next, lifecycleId);
      applyTransition(mutable, to, at, reasonCode);
      setExposureStatus(next, mutable, exposureStatus, at);
    });
    return { changed: true, reasonCode, lifecycle: this.#lifecycleById(lifecycleId) };
  }

  #transitionAndRelease(
    lifecycleId: string,
    to: "REVOKED" | "EXPIRED" | "ABANDONED",
    at: string,
    reasonCode: DurableLifecycleReasonCode,
    releaseReason: "revoked" | "expired" | "abandoned",
  ): DurableTransitionResult {
    const before = lifecycleById(this.#requireState(), lifecycleId);
    if (!LIFECYCLE_TRANSITION_TABLE[before.status].includes(to)) return unchanged("LIFECYCLE_INVALID_TRANSITION", before);
    this.#commit((next) => {
      const mutable = lifecycleById(next, lifecycleId);
      applyTransition(mutable, to, at, reasonCode);
      releaseExposure(next, mutable, at, releaseReason);
    });
    return { changed: true, reasonCode, lifecycle: this.#lifecycleById(lifecycleId) };
  }

  #findLifecycle(state: DurableLifecycleState, gatePassId: string): ActionLifecycleRecord | null {
    const record = state.lifecycles.find((candidate) => candidate.gatePassId === gatePassId);
    return record === undefined ? null : structuredClone(record);
  }

  #lifecycleById(lifecycleId: string): ActionLifecycleRecord {
    return structuredClone(lifecycleById(this.#requireState(), lifecycleId));
  }

  #load(): void {
    try {
      if (!existsSync(this.statePath)) {
        this.#state = createEmptyState();
        return;
      }
      const text = readFileSync(this.statePath, "utf8");
      const parsed = JSON.parse(text) as unknown;
      this.#state = validateStoredState(parsed);
    } catch (error) {
      const reason = error instanceof DurableStateError ? error.reasonCode : "DURABLE_STATE_CORRUPTED";
      this.#failure = new DurableStateError(reason, "Local durable state could not be loaded safely.");
      this.#state = null;
    }
  }

  #requireState(): DurableLifecycleState {
    if (this.#failure !== null || this.#state === null) {
      throw this.#failure ?? new DurableStateError("DURABLE_STATE_UNAVAILABLE", "Durable state is unavailable.");
    }
    return this.#state;
  }

  #commit(mutator: (state: DurableLifecycleState) => void): void {
    const current = this.#requireState();
    const next = structuredClone(current);
    mutator(next);
    next.storeRevision += 1;
    next.integrityDigest = computeStateDigest(next);
    const directory = dirname(this.statePath);
    const temporaryPath = `${this.statePath}.tmp-${process.pid}-${next.storeRevision}`;
    let fd: number | null = null;
    try {
      mkdirSync(directory, { recursive: true });
      this.#faultInjector?.("before_write");
      writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
      fd = openSync(temporaryPath, "r+");
      fsyncSync(fd);
      closeSync(fd);
      fd = null;
      this.#faultInjector?.("after_temp_fsync");
      renameSync(temporaryPath, this.statePath);
      this.#faultInjector?.("after_replace");
      const confirmed = validateStoredState(JSON.parse(readFileSync(this.statePath, "utf8")) as unknown);
      if (confirmed.storeRevision !== next.storeRevision || confirmed.integrityDigest !== next.integrityDigest) {
        throw new DurableStateError("DURABLE_WRITE_NOT_CONFIRMED", "Atomic state replacement was not confirmed.");
      }
      this.#state = confirmed;
    } catch (error) {
      if (fd !== null) closeSync(fd);
      if (existsSync(temporaryPath)) {
        try { unlinkSync(temporaryPath); } catch { /* fail closed below */ }
      }
      const reason = error instanceof DurableStateError ? error.reasonCode : "DURABLE_WRITE_FAILED";
      throw this.#fail(reason, "Local durable state write failed closed.");
    }
  }

  #fail(reasonCode: DurableLifecycleReasonCode, message: string): DurableStateError {
    this.#failure = new DurableStateError(reasonCode, message);
    return this.#failure;
  }
}

function createEmptyState(): DurableLifecycleState {
  const state: DurableLifecycleState = {
    storeVersion: DURABLE_LIFECYCLE_STORE_VERSION,
    storeRevision: 0,
    lifecycles: [],
    exposureEntries: [],
    revocations: [],
    emergencyStop: { active: false, sequence: 0, records: [] },
    reconciliations: [],
    localSingleProcessOnly: true,
    productionGrade: false,
    integrityDigest: "",
  };
  state.integrityDigest = computeStateDigest(state);
  return state;
}

function computeStateDigest(state: DurableLifecycleState): string {
  const { integrityDigest: _digest, ...unsigned } = state;
  return createCanonicalPayloadHash(unsigned);
}

function validateStoredState(value: unknown): DurableLifecycleState {
  if (!isRecord(value)) throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Stored state must be an object.");
  if (value.storeVersion !== DURABLE_LIFECYCLE_STORE_VERSION) {
    throw new DurableStateError("DURABLE_STATE_VERSION_UNSUPPORTED", "Stored state version is unsupported.");
  }
  const state = value as unknown as DurableLifecycleState;
  if (!Number.isSafeInteger(state.storeRevision) || state.storeRevision < 0
    || !Array.isArray(state.lifecycles)
    || !Array.isArray(state.exposureEntries)
    || !Array.isArray(state.revocations)
    || !Array.isArray(state.reconciliations)
    || !isRecord(state.emergencyStop)
    || !Array.isArray(state.emergencyStop.records)
    || typeof state.emergencyStop.active !== "boolean"
    || state.localSingleProcessOnly !== true
    || state.productionGrade !== false
    || state.integrityDigest !== computeStateDigest(state)) {
    throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Stored state integrity validation failed.");
  }
  const ids = new Set<string>();
  const nonces = new Set<string>();
  for (const record of state.lifecycles) {
    if (record.recordVersion !== ACTION_LIFECYCLE_RECORD_VERSION
      || !Object.hasOwn(LIFECYCLE_TRANSITION_TABLE, record.status)
      || !Number.isSafeInteger(record.lifecycleRevision)
      || record.lifecycleRevision < 1
      || ids.has(record.lifecycleId)
      || nonces.has(record.nonce)
      || record.transitions.length === 0
      || record.transitions.at(-1)?.to !== record.status) {
      throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Lifecycle state is inconsistent.");
    }
    ids.add(record.lifecycleId);
    nonces.add(record.nonce);
  }
  for (const entry of state.exposureEntries) {
    if (entry.entryVersion !== AGGREGATE_EXPOSURE_ENTRY_VERSION
      || !ids.has(entry.lifecycleId)
      || !Number.isSafeInteger(entry.amountMinorUnits)
      || entry.amountMinorUnits < 0) {
      throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Exposure state is inconsistent.");
    }
  }
  const exposureIds = new Set(state.exposureEntries.map((entry) => entry.exposureEntryId));
  if (exposureIds.size !== state.exposureEntries.length) {
    throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Exposure identifiers are not unique.");
  }
  for (const lifecycle of state.lifecycles) {
    if (lifecycle.exposureEntryId === null) {
      if (lifecycle.gatePassId !== null || (lifecycle.status !== "REJECTED" && lifecycle.status !== "REFERRED")) {
        throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Non-authorising lifecycle binding is inconsistent.");
      }
      continue;
    }
    const entry = state.exposureEntries.find((candidate) => candidate.exposureEntryId === lifecycle.exposureEntryId);
    if (entry === undefined
      || lifecycle.gatePassId !== entry.gatePassId
      || lifecycle.actionDigest !== entry.actionDigest
      || lifecycle.policyDigest !== entry.policyDigest
      || lifecycle.passportDigest !== entry.passportDigest) {
      throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Lifecycle and exposure bindings are inconsistent.");
    }
    const expectedExposureStatuses: Readonly<Record<ActionLifecycleStatus, readonly ExposureEntryStatus[]>> = {
      ISSUED: ["OUTSTANDING"], RESERVED: ["RESERVED"], EXECUTED: ["COMMITTED"],
      REJECTED: [], REFERRED: [], REVOKED: ["RELEASED"], EXPIRED: ["RELEASED"],
      FAILED: ["UNKNOWN"], ABANDONED: ["RELEASED"], UNKNOWN: ["UNKNOWN"],
    };
    if (!expectedExposureStatuses[lifecycle.status].includes(entry.status)) {
      throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Lifecycle and exposure statuses are inconsistent.");
    }
  }
  for (const receipt of state.revocations) {
    const { receiptDigest, ...unsigned } = receipt;
    if (receipt.receiptVersion !== REVOCATION_RECEIPT_VERSION
      || receiptDigest !== createCanonicalPayloadHash(unsigned)
      || state.lifecycles.find((record) => record.lifecycleId === receipt.lifecycleId)?.status !== "REVOKED") {
      throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Revocation evidence is inconsistent.");
    }
  }
  let expectedEmergencyActive = false;
  state.emergencyStop.records.forEach((record, index) => {
    const { recordDigest, ...unsigned } = record;
    if (record.recordVersion !== EMERGENCY_STOP_RECORD_VERSION
      || record.sequence !== index + 1
      || record.active !== (record.operation === "activate")
      || recordDigest !== createCanonicalPayloadHash(unsigned)) {
      throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Emergency-stop evidence is inconsistent.");
    }
    expectedEmergencyActive = record.active;
  });
  if (state.emergencyStop.sequence !== state.emergencyStop.records.length
    || state.emergencyStop.active !== expectedEmergencyActive) {
    throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Emergency-stop state is inconsistent.");
  }
  for (const record of state.reconciliations) {
    const { recordDigest, ...unsigned } = record;
    if (record.recordVersion !== RECONCILIATION_RECORD_VERSION
      || recordDigest !== createCanonicalPayloadHash(unsigned)
      || !ids.has(record.lifecycleId)) {
      throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Reconciliation evidence is inconsistent.");
    }
  }
  return structuredClone(state);
}

function validateIssuanceInput(input: DurableIssuanceInput): void {
  if (!Number.isSafeInteger(input.amountMinorUnits) || input.amountMinorUnits < 0) {
    throw new DurableStateError("EXPOSURE_RULE_MISMATCH", "Exposure amount must be integer minor units.");
  }
  if (input.gatePass.action.currency !== input.rule.currency) {
    throw new DurableStateError("EXPOSURE_CURRENCY_MISMATCH", "Cross-currency aggregation is prohibited.");
  }
  if (input.rule.policyId !== input.policyId
    || input.rule.policyVersion !== input.policyVersion
    || input.rule.actionFamily !== input.actionFamily
    || input.rule.counterpartyClass !== input.counterpartyClass
    || !Number.isSafeInteger(input.rule.maximumAggregateMinorUnits)
    || input.rule.maximumAggregateMinorUnits < 0
    || !Number.isSafeInteger(input.rule.windowSeconds)
    || input.rule.windowSeconds <= 0
    || (input.rule.maximumActionCount !== null
      && (!Number.isSafeInteger(input.rule.maximumActionCount) || input.rule.maximumActionCount < 1))) {
    throw new DurableStateError("EXPOSURE_RULE_MISMATCH", "Aggregate exposure rule does not bind this action.");
  }
  timestamp(input.recordedAt, "recordedAt");
}

function exposurePreview(
  state: DurableLifecycleState,
  rule: AggregateExposureRule,
  input: {
    policyId: string;
    policyVersion: string;
    actionFamily: string;
    currency: string;
    counterpartyClass: string;
    amountMinorUnits: number;
    recordedAt: string;
  },
  simulatedOnly: boolean,
): ExposurePreview {
  if (input.currency !== rule.currency) {
    return previewResult(rule, input.amountMinorUnits, 0, 0, false, "EXPOSURE_CURRENCY_MISMATCH", simulatedOnly);
  }
  if (input.policyId !== rule.policyId || input.policyVersion !== rule.policyVersion
    || input.actionFamily !== rule.actionFamily || input.counterpartyClass !== rule.counterpartyClass) {
    return previewResult(rule, input.amountMinorUnits, 0, 0, false, "EXPOSURE_RULE_MISMATCH", simulatedOnly);
  }
  const now = Date.parse(timestamp(input.recordedAt, "recordedAt"));
  const windowStart = now - rule.windowSeconds * 1000;
  const counted = state.exposureEntries.filter((entry) =>
    entry.policyId === rule.policyId
    && entry.policyVersion === rule.policyVersion
    && entry.actionFamily === rule.actionFamily
    && entry.currency === rule.currency
    && entry.counterpartyClass === rule.counterpartyClass
    && Date.parse(entry.createdAt) >= windowStart
    && ["OUTSTANDING", "RESERVED", "COMMITTED", "UNKNOWN"].includes(entry.status));
  const currentAmount = counted.reduce((total, entry) => total + entry.amountMinorUnits, 0);
  if (!Number.isSafeInteger(currentAmount + input.amountMinorUnits)) {
    return previewResult(rule, input.amountMinorUnits, currentAmount, counted.length, false, "EXPOSURE_AMOUNT_LIMIT_EXCEEDED", simulatedOnly);
  }
  const amountExceeded = currentAmount + input.amountMinorUnits > rule.maximumAggregateMinorUnits;
  const countExceeded = rule.maximumActionCount !== null && counted.length + 1 > rule.maximumActionCount;
  return previewResult(
    rule, input.amountMinorUnits, currentAmount, counted.length,
    !amountExceeded && !countExceeded,
    amountExceeded ? "EXPOSURE_AMOUNT_LIMIT_EXCEEDED" : countExceeded ? "EXPOSURE_ACTION_COUNT_LIMIT_EXCEEDED" : "EXPOSURE_WITHIN_LIMIT",
    simulatedOnly,
  );
}

function previewResult(
  rule: AggregateExposureRule,
  proposed: number,
  current: number,
  count: number,
  withinLimit: boolean,
  reasonCode: DurableLifecycleReasonCode,
  simulatedOnly: boolean,
): ExposurePreview {
  return {
    ruleId: rule.ruleId,
    currency: rule.currency,
    currentAmountMinorUnits: current,
    proposedAmountMinorUnits: proposed,
    resultingAmountMinorUnits: current + proposed,
    currentActionCount: count,
    resultingActionCount: count + 1,
    maximumAggregateMinorUnits: rule.maximumAggregateMinorUnits,
    maximumActionCount: rule.maximumActionCount,
    withinLimit,
    reasonCode,
    simulatedOnly,
  };
}

function createNonAuthorisingLifecycle(input: {
  status: "REJECTED" | "REFERRED";
  actionDigest: string;
  policyDigest: string;
  passportDigest: string;
  subjectAgentIdentity: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  amountMinorUnits: number;
  currency: string;
  actionFamily: string;
  recordedAt: string;
  sequence: number;
}): ActionLifecycleRecord {
  const reasonCode = input.status === "REFERRED" ? "LIFECYCLE_REFERRED_RECORDED" : "LIFECYCLE_REJECTED_RECORDED";
  return {
    recordVersion: ACTION_LIFECYCLE_RECORD_VERSION,
    lifecycleId: `lifecycle_${shortHash(input.actionDigest, input.status, String(input.sequence))}`,
    lifecycleRevision: 1,
    status: input.status,
    gatePassId: null,
    actionDigest: input.actionDigest,
    policyDigest: input.policyDigest,
    passportDigest: input.passportDigest,
    subjectAgentIdentity: input.subjectAgentIdentity,
    nonce: input.nonce,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    amountMinorUnits: input.amountMinorUnits,
    currency: input.currency,
    actionFamily: input.actionFamily,
    exposureEntryId: null,
    createdAt: input.recordedAt,
    updatedAt: input.recordedAt,
    transitions: [{ from: null, to: input.status, at: input.recordedAt, reasonCode }],
    localOnly: true,
    syntheticOnly: true,
  };
}

function lifecycleById(state: DurableLifecycleState, lifecycleId: string): ActionLifecycleRecord {
  const record = state.lifecycles.find((candidate) => candidate.lifecycleId === lifecycleId);
  if (record === undefined) throw new DurableStateError("LIFECYCLE_RECORD_NOT_FOUND", "Lifecycle record was not found.");
  return record;
}

function applyTransition(
  record: ActionLifecycleRecord,
  to: ActionLifecycleStatus,
  at: string,
  reasonCode: DurableLifecycleReasonCode,
): void {
  const normalized = timestamp(at, "transitionAt");
  const from = record.status;
  if (!LIFECYCLE_TRANSITION_TABLE[from].includes(to)) {
    throw new DurableStateError("LIFECYCLE_INVALID_TRANSITION", `Transition ${from} -> ${to} is not allowed.`);
  }
  record.status = to;
  record.lifecycleRevision += 1;
  record.updatedAt = normalized;
  record.transitions.push({ from, to, at: normalized, reasonCode });
}

function setExposureStatus(
  state: DurableLifecycleState,
  lifecycle: ActionLifecycleRecord,
  status: ExposureEntryStatus,
  at: string,
): void {
  if (lifecycle.exposureEntryId === null) return;
  const entry = state.exposureEntries.find((candidate) => candidate.exposureEntryId === lifecycle.exposureEntryId);
  if (entry === undefined) throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Lifecycle exposure entry is missing.");
  entry.status = status;
  entry.updatedAt = timestamp(at, "exposureUpdatedAt");
}

function releaseExposure(
  state: DurableLifecycleState,
  lifecycle: ActionLifecycleRecord,
  at: string,
  reason: "revoked" | "expired" | "abandoned",
  allowReconciled = false,
): void {
  if (lifecycle.exposureEntryId === null) return;
  const entry = state.exposureEntries.find((candidate) => candidate.exposureEntryId === lifecycle.exposureEntryId);
  if (entry === undefined) throw new DurableStateError("DURABLE_STATE_CORRUPTED", "Lifecycle exposure entry is missing.");
  if (entry.status === "RELEASED") return;
  if (entry.status !== "OUTSTANDING"
    && !(allowReconciled && (entry.status === "UNKNOWN" || entry.status === "RESERVED"))) {
    throw new DurableStateError("LIFECYCLE_INVALID_TRANSITION", "Only eligible unused exposure may be released.");
  }
  entry.status = "RELEASED";
  entry.releaseReason = reason;
  entry.updatedAt = timestamp(at, "releaseAt");
}

function bindingsMatch(record: ActionLifecycleRecord, gatePass: ExactActionGatePass): boolean {
  return record.gatePassId === gatePass.gatePassId
    && record.actionDigest === gatePass.action.actionDigest
    && record.policyDigest === gatePass.action.policyDigest
    && record.subjectAgentIdentity === gatePass.action.subjectAgentIdentity
    && record.nonce === gatePass.action.nonce
    && record.expiresAt === gatePass.action.expiresAt;
}

function operatorEvidenceValid(evidence: OperatorAuthorityEvidence, at: string): boolean {
  const { evidenceDigest, ...unsigned } = evidence;
  const expected = REGISTERED_OPERATOR_AUTHORITY_EVIDENCE;
  const time = Date.parse(at);
  return evidence.evidenceVersion === OPERATOR_AUTHORITY_EVIDENCE_VERSION
    && evidence.actorReference === expected.actorReference
    && evidence.authorityReference === expected.authorityReference
    && evidence.role === expected.role
    && evidence.syntheticOnly === true
    && evidenceDigest === createCanonicalPayloadHash(unsigned)
    && Number.isFinite(time)
    && time >= Date.parse(evidence.effectiveAt)
    && time < Date.parse(evidence.expiresAt);
}

function unchanged(reasonCode: DurableLifecycleReasonCode, lifecycle: ActionLifecycleRecord | null): DurableTransitionResult {
  return { changed: false, reasonCode, lifecycle: lifecycle === null ? null : structuredClone(lifecycle) };
}

function timestamp(value: string, name: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new DurableStateError("DURABLE_STATE_CORRUPTED", `${name} must be a date-time.`);
  return new Date(parsed).toISOString();
}

function boundedText(value: string, name: string, max: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) {
    throw new DurableStateError("DURABLE_STATE_CORRUPTED", `${name} must be a bounded string.`);
  }
  return value;
}

function shortHash(...values: string[]): string {
  return createCanonicalPayloadHash(values).slice("sha256:".length, 33);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
