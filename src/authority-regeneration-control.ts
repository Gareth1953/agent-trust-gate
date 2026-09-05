import { createHash } from "node:crypto";

export const ARC_VERSION = "atg.authority-regeneration-control.local.v1" as const;
export const ARC_POLICY_VERSION = "atg-arc-pfe-policy-2026-09-05.v1" as const;
export const ARC_REFERENCE_TIME = "2026-09-05T13:30:00.000Z" as const;

export type RegenerationMode =
  | "NONE"
  | "LIVE_CEILING"
  | "SAME_PURPOSE"
  | "REVERSAL_BOUND"
  | "SETTLEMENT_BOUND"
  | "HUMAN_REISSUE";

export type EventType =
  | "HEDGE"
  | "UNWIND"
  | "TERMINATION"
  | "SETTLEMENT"
  | "EXPIRY"
  | "COLLATERAL_RELEASE"
  | "NETTING"
  | "POSITION_REDUCTION"
  | "MARKET_MOVEMENT"
  | "MODEL_CHANGE"
  | "LIMIT_CHANGE"
  | "ADMINISTRATIVE_REISSUE";

export type AttributionStatus = "DIRECT" | "ALLOCATED" | "PORTFOLIO_LEVEL" | "UNATTRIBUTABLE";
export type LifecycleStatus = "PROPOSED" | "EXECUTED_CONFIRMED" | "FAILED_CONFIRMED" | "INDETERMINATE";
export type Decision = "PASS" | "REFUSE";

export type ArcRefusalCode =
  | "ATG-ARC-001 NO_REGENERATION_RIGHT"
  | "ATG-ARC-002 REGENERATION_LINEAGE_MISSING"
  | "ATG-ARC-003 REGENERATION_PURPOSE_MISMATCH"
  | "ATG-ARC-004 REGENERATION_SCOPE_MISMATCH"
  | "ATG-ARC-005 REGENERATION_EVENT_NOT_ELIGIBLE"
  | "ATG-ARC-006 REVERSAL_NOT_PROVEN"
  | "ATG-ARC-007 REGENERATION_CAP_EXCEEDED"
  | "ATG-ARC-008 EXTERNAL_RESET_NOT_AUTHORISED"
  | "ATG-ARC-009 DOUBLE_REGENERATION_ATTEMPT"
  | "ATG-ARC-010 RISK_EVIDENCE_STALE"
  | "ATG-ARC-011 AUTHORITY_EXPIRED_OR_REVOKED"
  | "ATG-ARC-012 INSUFFICIENT_DELEGATED_AUTHORITY"
  | "ATG-ARC-013 CROSS_ENTITY_REUSE_DENIED"
  | "ATG-ARC-014 REGENERATION_MODEL_VERSION_UNACCEPTED"
  | "ATG-ARC-015 REGENERATION_EVENT_CREATES_UNAUTHORISED_CONSEQUENCE"
  | "ATG-ARC-016 REGENERATION_EVENT_INDETERMINATE"
  | "ATG-ARC-017 REGENERATION_CAUSALITY_INSUFFICIENT"
  | "ATG-ARC-018 INSUFFICIENT_FIRM_RISK_CAPACITY";

export interface Scope {
  purpose: string;
  legalEntity: string;
  portfolio: string;
  counterparty?: string;
  strategy?: string;
}

export interface ArcAuthority {
  authorityId: string;
  authorityVersion: number;
  issuerId: string;
  issuerRole: string;
  agentGroupId: string;
  consequenceClass: "COUNTERPARTY_PFE";
  initialAuthority: number;
  currency: "GBP";
  scope: Scope;
  regenerationMode: RegenerationMode;
  regenerationCap: number;
  maxRegenerationCycles: number;
  regenerationCyclePolicy: "NO_REGEN_FROM_REGENERATED_AUTHORITY" | "ALLOW_WITHIN_CAP";
  allowedEventTypes: EventType[];
  acceptedRiskModelVersions: string[];
  validFrom: string;
  validUntil: string;
  revoked: boolean;
  policyVersion: typeof ARC_POLICY_VERSION;
  synthetic: true;
}

export interface RiskSnapshot {
  evidenceId: string;
  consequenceClass: "COUNTERPARTY_PFE";
  firmRiskLimit: number;
  currentExposure: number;
  availableCapacity: number;
  sourceSystem: "PFE_ENGINE";
  modelVersion: string;
  observedAt: string;
  maxAgeMs: number;
  synthetic: true;
}

export interface ConsumedAction {
  actionId: string;
  agentId: string;
  amount: number;
  scope: Scope;
  consumedAt: string;
  authorityId: string;
  synthetic: true;
}

export interface ConsequenceVectorItem {
  consequenceClass: string;
  delta: number;
  material: boolean;
  authorityCovered: boolean;
}

export interface RegenerationEvent {
  eventId: string;
  authorityId: string;
  sourceActionId?: string | undefined;
  eventType: EventType;
  lifecycleStatus: LifecycleStatus;
  attributionStatus: AttributionStatus;
  attributionMethod: string;
  scope: Scope;
  previousExposure: number;
  currentExposure: number;
  rawCapacityRelease: number;
  attributedEligibleRelease: number;
  evidence: RiskSnapshot;
  consequenceVector: ConsequenceVectorItem[];
  occurredAt: string;
  synthetic: true;
}

export interface RegenerationCredit {
  creditId: string;
  eventId: string;
  sourceActionId: string | null;
  originAuthorityId: string;
  originAuthorityVersion: number;
  originIssuerId: string;
  mode: RegenerationMode;
  amountCreated: number;
  amountRemaining: number;
  scope: Scope;
  evidenceId: string;
  attributedEligibleRelease: number;
  createdAt: string;
  digest: string;
  valid: boolean;
}

export interface RegenerationDecisionReceipt {
  receiptVersion: "atg.arc.regeneration-receipt.local.v1";
  receiptId: string;
  decision: Decision;
  refusalCode: ArcRefusalCode | null;
  reason: string;
  eventId: string;
  authorityId: string;
  rawCapacityRelease: number;
  attributedEligibleRelease: number;
  permittedRegeneration: number;
  createdCredit: RegenerationCredit | null;
  authorityStateDigest: string;
  syntheticOnly: true;
}

export interface ProposedFinancialAction {
  actionId: string;
  agentId: string;
  agentGroupId: string;
  exactAction: string;
  pfeIncrease: number;
  scope: Scope;
  requestedAt: string;
  synthetic: true;
}

export interface AuthorityAllocation {
  originalAuthority: number;
  regenerationCredits: Array<{ creditId: string; amount: number }>;
  total: number;
}

export interface ArcGatePass {
  gatePassVersion: "atg.arc.gatepass.local.v1";
  gatePassId: string;
  actionId: string;
  exactActionDigest: string;
  authorityId: string;
  authorityVersion: number;
  authorityStateDigest: string;
  riskSnapshotDigest: string;
  allocation: AuthorityAllocation;
  regenerationLineage: string[];
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  consumed: boolean;
  revoked: boolean;
  syntheticOnly: true;
  digest: string;
}

export interface ActionDecisionReceipt {
  receiptVersion: "atg.arc.action-decision.local.v1";
  decision: Decision;
  refusalCode: ArcRefusalCode | null;
  reason: string;
  actionId: string;
  firmRiskCapacityBefore: number;
  delegatedAuthorityAvailableBefore: number;
  gatePass: ArcGatePass | null;
  syntheticOnly: true;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

export function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function sameScope(a: Scope, b: Scope): boolean {
  return (
    a.purpose === b.purpose &&
    a.legalEntity === b.legalEntity &&
    a.portfolio === b.portfolio &&
    (a.counterparty ?? null) === (b.counterparty ?? null) &&
    (a.strategy ?? null) === (b.strategy ?? null)
  );
}

function nowMs(now: string): number {
  return Date.parse(now);
}

function isFresh(snapshot: RiskSnapshot, at: string): boolean {
  const age = nowMs(at) - nowMs(snapshot.observedAt);
  return Number.isFinite(age) && age >= 0 && age <= snapshot.maxAgeMs;
}

export class AuthorityRegenerationControl {
  readonly authority: ArcAuthority;
  readonly referenceTime: string;
  private originalConsumed = 0;
  private originalReserved = 0;
  private regenerationTotalCreated = 0;
  private regenerationCycles = 0;
  private readonly consumedActions = new Map<string, ConsumedAction>();
  private readonly regeneratedAgainstAction = new Map<string, number>();
  private readonly processedEvents = new Set<string>();
  private readonly credits = new Map<string, RegenerationCredit>();
  private readonly gatePasses = new Map<string, ArcGatePass>();
  private readonly gatePassOriginalReservations = new Map<string, number>();
  private readonly gatePassCreditReservations = new Map<string, Array<{ creditId: string; amount: number }>>();

  constructor(authority: ArcAuthority, referenceTime: string = ARC_REFERENCE_TIME) {
    this.authority = structuredClone(authority);
    this.referenceTime = referenceTime;
  }

  getState() {
    const originalAvailable = Math.max(0, this.authority.initialAuthority - this.originalConsumed - this.originalReserved);
    const regeneratedAvailable = [...this.credits.values()]
      .filter((credit) => credit.valid)
      .reduce((sum, credit) => sum + credit.amountRemaining, 0);
    return {
      authorityId: this.authority.authorityId,
      authorityVersion: this.authority.authorityVersion,
      revoked: this.authority.revoked,
      initialAuthority: this.authority.initialAuthority,
      originalConsumed: this.originalConsumed,
      originalReserved: this.originalReserved,
      originalAvailable,
      regenerationTotalCreated: this.regenerationTotalCreated,
      regenerationCycles: this.regenerationCycles,
      regeneratedAvailable,
      totalAvailable: originalAvailable + regeneratedAvailable,
      credits: [...this.credits.values()].map((credit) => structuredClone(credit)),
    };
  }

  getStateDigest(): string {
    return digest(this.getState());
  }

  recordExecutedAction(action: ConsumedAction): void {
    if (this.authority.revoked) throw new Error("authority revoked");
    if (action.authorityId !== this.authority.authorityId) throw new Error("authority mismatch");
    if (!sameScope(action.scope, this.authority.scope)) throw new Error("scope mismatch");
    if (this.consumedActions.has(action.actionId)) throw new Error("duplicate action");
    const available = this.authority.initialAuthority - this.originalConsumed - this.originalReserved;
    if (action.amount > available) throw new Error("insufficient original authority");
    this.originalConsumed += action.amount;
    this.consumedActions.set(action.actionId, structuredClone(action));
  }

  evaluateRegeneration(event: RegenerationEvent): RegenerationDecisionReceipt {
    const refuse = (code: ArcRefusalCode, reason: string): RegenerationDecisionReceipt => ({
      receiptVersion: "atg.arc.regeneration-receipt.local.v1",
      receiptId: `REGEN-REF-${digest({ eventId: event.eventId, code }).slice(0, 16)}`,
      decision: "REFUSE",
      refusalCode: code,
      reason,
      eventId: event.eventId,
      authorityId: this.authority.authorityId,
      rawCapacityRelease: event.rawCapacityRelease,
      attributedEligibleRelease: event.attributedEligibleRelease,
      permittedRegeneration: 0,
      createdCredit: null,
      authorityStateDigest: this.getStateDigest(),
      syntheticOnly: true,
    });

    if (this.authority.revoked || nowMs(event.occurredAt) > nowMs(this.authority.validUntil)) {
      return refuse("ATG-ARC-011 AUTHORITY_EXPIRED_OR_REVOKED", "Originating authority is expired or revoked.");
    }
    if (event.authorityId !== this.authority.authorityId) {
      return refuse("ATG-ARC-002 REGENERATION_LINEAGE_MISSING", "Event does not reference the originating authority.");
    }
    if (this.processedEvents.has(event.eventId)) {
      return refuse("ATG-ARC-009 DOUBLE_REGENERATION_ATTEMPT", "The same economic release event has already been evaluated.");
    }
    if (event.lifecycleStatus === "INDETERMINATE" || event.lifecycleStatus === "PROPOSED") {
      return refuse("ATG-ARC-016 REGENERATION_EVENT_INDETERMINATE", "Only confirmed lifecycle events may regenerate authority.");
    }
    if (!isFresh(event.evidence, event.occurredAt)) {
      return refuse("ATG-ARC-010 RISK_EVIDENCE_STALE", "Economic evidence is outside the permitted freshness window.");
    }
    if (!this.authority.acceptedRiskModelVersions.includes(event.evidence.modelVersion)) {
      return refuse("ATG-ARC-014 REGENERATION_MODEL_VERSION_UNACCEPTED", "Risk evidence uses an unaccepted model version.");
    }
    if (!sameScope(event.scope, this.authority.scope)) {
      if (event.scope.legalEntity !== this.authority.scope.legalEntity) {
        return refuse("ATG-ARC-013 CROSS_ENTITY_REUSE_DENIED", "Regeneration event belongs to a different legal entity.");
      }
      return refuse("ATG-ARC-004 REGENERATION_SCOPE_MISMATCH", "Regeneration event is outside the delegated scope.");
    }
    if (event.consequenceVector.some((c) => c.material && c.delta > 0 && !c.authorityCovered)) {
      return refuse(
        "ATG-ARC-015 REGENERATION_EVENT_CREATES_UNAUTHORISED_CONSEQUENCE",
        "The risk-reducing event creates another material economic consequence without authority coverage.",
      );
    }
    if (this.authority.regenerationMode === "NONE" || this.authority.regenerationMode === "HUMAN_REISSUE") {
      return refuse("ATG-ARC-001 NO_REGENERATION_RIGHT", "The originating delegation does not permit automatic regeneration.");
    }
    if (!this.authority.allowedEventTypes.includes(event.eventType)) {
      return refuse("ATG-ARC-005 REGENERATION_EVENT_NOT_ELIGIBLE", "This event type is not eligible under the originating delegation.");
    }
    if (event.rawCapacityRelease <= 0 || event.attributedEligibleRelease <= 0) {
      return refuse("ATG-ARC-005 REGENERATION_EVENT_NOT_ELIGIBLE", "No positive eligible capacity release was established.");
    }
    if (event.attributedEligibleRelease > event.rawCapacityRelease) {
      return refuse(
        "ATG-ARC-017 REGENERATION_CAUSALITY_INSUFFICIENT",
        "Attributed eligible release exceeds the observed economic capacity release.",
      );
    }
    if (this.regenerationCycles >= this.authority.maxRegenerationCycles) {
      return refuse("ATG-ARC-007 REGENERATION_CAP_EXCEEDED", "Maximum permitted regeneration cycles have been reached.");
    }

    let sourceAction: ConsumedAction | null = null;
    if (event.sourceActionId) sourceAction = this.consumedActions.get(event.sourceActionId) ?? null;

    if (this.authority.regenerationMode === "REVERSAL_BOUND") {
      if (!sourceAction || event.attributionStatus !== "DIRECT" || !["UNWIND", "TERMINATION", "SETTLEMENT"].includes(event.eventType)) {
        return refuse(
          "ATG-ARC-006 REVERSAL_NOT_PROVEN",
          "Reversal-bound regeneration requires a confirmed direct reversal of a known consumed action.",
        );
      }
    }

    if (this.authority.regenerationMode === "SETTLEMENT_BOUND" && event.eventType !== "SETTLEMENT") {
      return refuse("ATG-ARC-005 REGENERATION_EVENT_NOT_ELIGIBLE", "Settlement-bound authority regenerates only after settlement.");
    }

    if (this.authority.regenerationMode === "SAME_PURPOSE") {
      if (!sourceAction || sourceAction.scope.purpose !== event.scope.purpose) {
        return refuse("ATG-ARC-003 REGENERATION_PURPOSE_MISMATCH", "Regenerated authority must remain bound to the original purpose.");
      }
    }

    let actionLineageRemaining = Number.POSITIVE_INFINITY;
    if (sourceAction) {
      const alreadyRegenerated = this.regeneratedAgainstAction.get(sourceAction.actionId) ?? 0;
      actionLineageRemaining = Math.max(0, sourceAction.amount - alreadyRegenerated);
      if (actionLineageRemaining === 0) {
        return refuse("ATG-ARC-009 DOUBLE_REGENERATION_ATTEMPT", "The referenced consumed action has no remaining regenerable lineage.");
      }
    }

    const globalCapRemaining = Math.max(0, this.authority.regenerationCap - this.regenerationTotalCreated);
    const permitted = Math.min(event.attributedEligibleRelease, globalCapRemaining, actionLineageRemaining);
    if (permitted <= 0) {
      return refuse("ATG-ARC-007 REGENERATION_CAP_EXCEEDED", "No regeneration capacity remains under the delegation.");
    }

    const creditBase = {
      eventId: event.eventId,
      sourceActionId: sourceAction?.actionId ?? null,
      originAuthorityId: this.authority.authorityId,
      originAuthorityVersion: this.authority.authorityVersion,
      originIssuerId: this.authority.issuerId,
      mode: this.authority.regenerationMode,
      amountCreated: permitted,
      amountRemaining: permitted,
      scope: structuredClone(event.scope),
      evidenceId: event.evidence.evidenceId,
      attributedEligibleRelease: event.attributedEligibleRelease,
      createdAt: event.occurredAt,
      valid: true,
    };
    const creditId = `ARC-CREDIT-${digest(creditBase).slice(0, 16)}`;
    const credit: RegenerationCredit = {
      ...creditBase,
      creditId,
      digest: digest({ ...creditBase, creditId }),
    };

    this.processedEvents.add(event.eventId);
    this.credits.set(creditId, credit);
    this.regenerationTotalCreated += permitted;
    this.regenerationCycles += 1;
    if (sourceAction) {
      this.regeneratedAgainstAction.set(
        sourceAction.actionId,
        (this.regeneratedAgainstAction.get(sourceAction.actionId) ?? 0) + permitted,
      );
    }

    return {
      receiptVersion: "atg.arc.regeneration-receipt.local.v1",
      receiptId: `REGEN-PASS-${digest({ eventId: event.eventId, creditId }).slice(0, 16)}`,
      decision: "PASS",
      refusalCode: null,
      reason: "Eligible regeneration was derived from the originating delegation and verified economic evidence.",
      eventId: event.eventId,
      authorityId: this.authority.authorityId,
      rawCapacityRelease: event.rawCapacityRelease,
      attributedEligibleRelease: event.attributedEligibleRelease,
      permittedRegeneration: permitted,
      createdCredit: structuredClone(credit),
      authorityStateDigest: this.getStateDigest(),
      syntheticOnly: true,
    };
  }

  evaluateAction(action: ProposedFinancialAction, risk: RiskSnapshot): ActionDecisionReceipt {
    const state = this.getState();
    const refuse = (code: ArcRefusalCode, reason: string): ActionDecisionReceipt => ({
      receiptVersion: "atg.arc.action-decision.local.v1",
      decision: "REFUSE",
      refusalCode: code,
      reason,
      actionId: action.actionId,
      firmRiskCapacityBefore: risk.availableCapacity,
      delegatedAuthorityAvailableBefore: state.totalAvailable,
      gatePass: null,
      syntheticOnly: true,
    });

    if (this.authority.revoked || nowMs(action.requestedAt) > nowMs(this.authority.validUntil)) {
      return refuse("ATG-ARC-011 AUTHORITY_EXPIRED_OR_REVOKED", "Originating authority is expired or revoked.");
    }
    if (action.agentGroupId !== this.authority.agentGroupId) {
      return refuse("ATG-ARC-004 REGENERATION_SCOPE_MISMATCH", "Agent group is outside delegated authority.");
    }
    if (!isFresh(risk, action.requestedAt)) {
      return refuse("ATG-ARC-010 RISK_EVIDENCE_STALE", "Risk evidence is stale.");
    }
    if (!this.authority.acceptedRiskModelVersions.includes(risk.modelVersion)) {
      return refuse("ATG-ARC-014 REGENERATION_MODEL_VERSION_UNACCEPTED", "Risk model version is not approved.");
    }
    if (risk.currentExposure + action.pfeIncrease > risk.firmRiskLimit || action.pfeIncrease > risk.availableCapacity) {
      return refuse("ATG-ARC-018 INSUFFICIENT_FIRM_RISK_CAPACITY", "The firm does not have sufficient current PFE capacity.");
    }

    const originalScopeMatches = sameScope(action.scope, this.authority.scope);
    const originalAvailable = originalScopeMatches
      ? Math.max(0, this.authority.initialAuthority - this.originalConsumed - this.originalReserved)
      : 0;

    const matchingCredits = [...this.credits.values()].filter(
      (credit) => credit.valid && credit.amountRemaining > 0 && sameScope(credit.scope, action.scope),
    );
    const mismatchingRegenerated = [...this.credits.values()].some(
      (credit) => credit.valid && credit.amountRemaining > 0 && credit.scope.purpose !== action.scope.purpose,
    );
    const creditAvailable = matchingCredits.reduce((sum, credit) => sum + credit.amountRemaining, 0);
    const totalAvailable = originalAvailable + creditAvailable;

    if (action.pfeIncrease > totalAvailable) {
      if (mismatchingRegenerated && action.pfeIncrease <= risk.availableCapacity) {
        return refuse(
          "ATG-ARC-003 REGENERATION_PURPOSE_MISMATCH",
          "Firm risk capacity exists, but regenerated delegated authority is not valid for the proposed purpose.",
        );
      }
      return refuse(
        "ATG-ARC-012 INSUFFICIENT_DELEGATED_AUTHORITY",
        "Firm risk capacity exists, but remaining delegated AI authority is insufficient.",
      );
    }

    let remaining = action.pfeIncrease;
    const originalAllocation = Math.min(remaining, originalAvailable);
    remaining -= originalAllocation;
    const regenerationAllocations: Array<{ creditId: string; amount: number }> = [];
    for (const credit of matchingCredits) {
      if (remaining <= 0) break;
      const amount = Math.min(remaining, credit.amountRemaining);
      regenerationAllocations.push({ creditId: credit.creditId, amount });
      remaining -= amount;
    }

    this.originalReserved += originalAllocation;
    for (const allocation of regenerationAllocations) {
      const credit = this.credits.get(allocation.creditId);
      if (!credit) throw new Error("credit disappeared during atomic reservation");
      credit.amountRemaining -= allocation.amount;
    }

    const allocation: AuthorityAllocation = {
      originalAuthority: originalAllocation,
      regenerationCredits: regenerationAllocations,
      total: action.pfeIncrease,
    };
    const base = {
      actionId: action.actionId,
      exactActionDigest: digest(action),
      authorityId: this.authority.authorityId,
      authorityVersion: this.authority.authorityVersion,
      authorityStateDigest: this.getStateDigest(),
      riskSnapshotDigest: digest(risk),
      allocation,
      regenerationLineage: regenerationAllocations.map((a) => a.creditId),
      issuedAt: action.requestedAt,
      expiresAt: new Date(nowMs(action.requestedAt) + 60_000).toISOString(),
      nonce: `ARC-NONCE-${digest({ actionId: action.actionId, at: action.requestedAt }).slice(0, 16)}`,
      consumed: false,
      revoked: false,
      syntheticOnly: true as const,
    };
    const gatePassId = `ARC-GP-${digest(base).slice(0, 16)}`;
    const gatePass: ArcGatePass = {
      gatePassVersion: "atg.arc.gatepass.local.v1",
      gatePassId,
      ...base,
      digest: digest({ gatePassId, ...base }),
    };
    this.gatePasses.set(gatePassId, gatePass);
    this.gatePassOriginalReservations.set(gatePassId, originalAllocation);
    this.gatePassCreditReservations.set(gatePassId, regenerationAllocations);

    return {
      receiptVersion: "atg.arc.action-decision.local.v1",
      decision: "PASS",
      refusalCode: null,
      reason:
        regenerationAllocations.length > 0
          ? "Exact action is covered by current firm capacity and valid delegated authority with regeneration lineage."
          : "Exact action is covered by current firm capacity and original delegated authority.",
      actionId: action.actionId,
      firmRiskCapacityBefore: risk.availableCapacity,
      delegatedAuthorityAvailableBefore: totalAvailable,
      gatePass: structuredClone(gatePass),
      syntheticOnly: true,
    };
  }

  releaseGatePass(gatePassId: string): ArcGatePass {
    const gatePass = this.gatePasses.get(gatePassId);
    if (!gatePass) throw new Error("unknown gatepass");
    if (gatePass.consumed) throw new Error("cannot release consumed gatepass");
    if (gatePass.revoked) return structuredClone(gatePass);

    const original = this.gatePassOriginalReservations.get(gatePassId) ?? 0;
    this.originalReserved = Math.max(0, this.originalReserved - original);
    for (const allocation of this.gatePassCreditReservations.get(gatePassId) ?? []) {
      const credit = this.credits.get(allocation.creditId);
      if (credit?.valid) credit.amountRemaining += allocation.amount;
    }
    this.gatePassOriginalReservations.delete(gatePassId);
    this.gatePassCreditReservations.delete(gatePassId);
    gatePass.revoked = true;
    gatePass.digest = digest({ ...gatePass, digest: undefined });
    return structuredClone(gatePass);
  }

  consumeGatePass(gatePassId: string, at: string = this.referenceTime): ArcGatePass {
    const gatePass = this.gatePasses.get(gatePassId);
    if (!gatePass) throw new Error("unknown gatepass");
    if (gatePass.revoked || this.authority.revoked) throw new Error("gatepass revoked");
    if (gatePass.consumed) throw new Error("gatepass replay");
    if (nowMs(at) > nowMs(gatePass.expiresAt)) throw new Error("gatepass expired");

    const original = this.gatePassOriginalReservations.get(gatePassId) ?? 0;
    this.originalReserved -= original;
    this.originalConsumed += original;
    this.gatePassOriginalReservations.delete(gatePassId);
    this.gatePassCreditReservations.delete(gatePassId);
    gatePass.consumed = true;
    gatePass.digest = digest({ ...gatePass, digest: undefined });
    return structuredClone(gatePass);
  }

  revokeAuthority(): void {
    this.authority.revoked = true;
    for (const credit of this.credits.values()) credit.valid = false;
    for (const gatePass of this.gatePasses.values()) gatePass.revoked = true;
  }
}

export function createSyntheticAuthority(
  mode: RegenerationMode,
  overrides: Partial<ArcAuthority> = {},
): ArcAuthority {
  return {
    authorityId: "AUTH-PFE-001",
    authorityVersion: 1,
    issuerId: "CREDIT_COMMITTEE",
    issuerRole: "Credit Committee",
    agentGroupId: "CLIENT_HEDGE_AGENTS",
    consequenceClass: "COUNTERPARTY_PFE",
    initialAuthority: 10_000_000,
    currency: "GBP",
    scope: {
      purpose: "CLIENT_HEDGE",
      legalEntity: "BANK_UK_01",
      portfolio: "PORTFOLIO_A",
      counterparty: "CP_173",
      strategy: "CLIENT_HEDGE_STRATEGY_A",
    },
    regenerationMode: mode,
    regenerationCap: 10_000_000,
    maxRegenerationCycles: 10,
    regenerationCyclePolicy: "NO_REGEN_FROM_REGENERATED_AUTHORITY",
    allowedEventTypes: ["HEDGE", "UNWIND", "TERMINATION", "SETTLEMENT", "POSITION_REDUCTION"],
    acceptedRiskModelVersions: ["PFE-7.4"],
    validFrom: "2026-09-05T08:00:00.000Z",
    validUntil: "2026-09-05T16:30:00.000Z",
    revoked: false,
    policyVersion: ARC_POLICY_VERSION,
    synthetic: true,
    ...overrides,
  };
}

export function createRiskSnapshot(
  currentExposure: number,
  observedAt: string = ARC_REFERENCE_TIME,
  overrides: Partial<RiskSnapshot> = {},
): RiskSnapshot {
  const firmRiskLimit = overrides.firmRiskLimit ?? 100_000_000;
  return {
    evidenceId: `PFE-EVID-${currentExposure}`,
    consequenceClass: "COUNTERPARTY_PFE",
    firmRiskLimit,
    currentExposure,
    availableCapacity: firmRiskLimit - currentExposure,
    sourceSystem: "PFE_ENGINE",
    modelVersion: "PFE-7.4",
    observedAt,
    maxAgeMs: 120_000,
    synthetic: true,
    ...overrides,
  };
}
