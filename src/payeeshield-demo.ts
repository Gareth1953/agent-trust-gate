import { randomUUID } from "node:crypto";
import { loadSupplierBankChangeScenario } from "./supplier-bank-change-cli.js";
import { evaluateSupplierBankChange, SUPPLIER_BANK_CHANGE_SCENARIO_IDS, type SupplierBankChangeScenarioId } from "./supplier-bank-change-model.js";
import { InMemoryNonceStore, createBaseExactActionInput, createFixedTrustedClock, createVerifierContext, issueExactActionGatePass, verifyAndExecuteSimulatedAction, type ExactActionIssuance, type CanonicalActionEnvelopeInput } from "./exact-action-gatepass.js";
import { createCanonicalPayloadHash as hash } from "./local-signed-proof.js";

export interface PayeeShieldRequest {
  scenarioId: SupplierBankChangeScenarioId;
  supplierReference: "SUP-10482" | "SUP-10483";
  proposedAccountEnding: "7319" | "7320";
  amountMinorUnits: number;
}
const AT = "2026-08-04T10:00:00.000Z";
export const PAYEESHIELD_DEFAULT_REQUEST: PayeeShieldRequest = Object.freeze({ scenarioId: "valid_exact_change", supplierReference: "SUP-10482", proposedAccountEnding: "7319", amountMinorUnits: 850_000 });
export function validatePayeeShieldRequest(value: unknown): PayeeShieldRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("FIXTURE_REQUEST_REQUIRED");
  const v = value as Record<string, unknown>;
  if (Object.keys(v).sort().join(",") !== "amountMinorUnits,proposedAccountEnding,scenarioId,supplierReference"
    || !SUPPLIER_BANK_CHANGE_SCENARIO_IDS.includes(v.scenarioId as SupplierBankChangeScenarioId)
    || !["SUP-10482", "SUP-10483"].includes(v.supplierReference as string)
    || !["7319", "7320"].includes(v.proposedAccountEnding as string)
    || !Number.isSafeInteger(v.amountMinorUnits) || (v.amountMinorUnits as number) <= 0 || (v.amountMinorUnits as number) > 10_000_000) throw new Error("FIXTURE_REQUEST_INVALID");
  return structuredClone(v) as unknown as PayeeShieldRequest;
}
interface Approval { request: PayeeShieldRequest; input: CanonicalActionEnvelopeInput; issuance: ExactActionIssuance; stateVersion: number; status: "ISSUED" | "ATTEMPTED" | "UNKNOWN" | "EXECUTED" | "REVOKED" }
/** Optional, process-local synthetic adapter. No bank API, ERP connector or durable recovery. */
export class PayeeShieldDemo {
  readonly #nonces = new InMemoryNonceStore();
  readonly #approvals = new Map<string, Approval>();
  #state = { supplierReference: "SUP-10482", accountEnding: "1846", version: 1 };
  #record: { approvalId: string; approvedRequestDigest: string; beforeVersion: number; afterVersion: number; accountEnding: string } | null = null;
  snapshot() { return structuredClone({ state: this.#state, record: this.#record, syntheticOnly: true, localOnly: true, durable: false, independentDestinationEvidence: false }); }
  approve(value: unknown) {
    const request = validatePayeeShieldRequest(value);
    const scenario = loadSupplierBankChangeScenario(request.scenarioId);
    if (request.supplierReference !== PAYEESHIELD_DEFAULT_REQUEST.supplierReference) scenario.action.supplierReference = request.supplierReference;
    if (request.proposedAccountEnding !== PAYEESHIELD_DEFAULT_REQUEST.proposedAccountEnding) scenario.action.proposedAccountEnding = request.proposedAccountEnding;
    // Old fixture metadata must never be presented as a receipt for this run.
    scenario.executionClaim = { claimsExternalExecution: scenario.executionClaim.claimsExternalExecution, receiptPresent: false, receiptSimulated: true, receiptReference: null };
    const decision = evaluateSupplierBankChange(scenario);
    const refusal = (outcome: "BLOCK" | "REVIEW", reason: string) => ({ outcome, reason, approvalId: null, decision, gatePass: null, executionAvailable: false });
    if (this.#record || this.#state.accountEnding !== "1846") return refusal("BLOCK", "SYNTHETIC_DESTINATION_ALREADY_CHANGED");
    if ([...this.#approvals.values()].some(a => a.status === "UNKNOWN")) return refusal("BLOCK", "UNKNOWN_RECONCILIATION_REQUIRED");
    if (request.amountMinorUnits > 4_000_000) return refusal("BLOCK", "AMOUNT_ABOVE_DEMO_LIMIT");
    if (request.amountMinorUnits > 1_000_000) return refusal("REVIEW", "MANUAL_REVIEW_NO_EXECUTION_AUTHORITY");
    if (decision.decision !== "GATEPASS_ISSUED") return refusal("BLOCK", decision.reasonCode);
    if (this.#approvals.size >= 100) return refusal("BLOCK", "DEMO_APPROVAL_CAPACITY");
    const id = randomUUID();
    const input = createBaseExactActionInput({
      toolIdentity: "local.payeeshield.synthetic-master-data", operationName: "simulate_supplier_bank_change",
      targetIdentity: request.supplierReference, amount: null, currency: null,
      subjectAgentIdentity: scenario.agent.identity, operatorIdentity: "fixture-dual-approval-only",
      humanApprovalReference: "fixture://supplier-change/dual-approval", humanApprovalDigest: hash(scenario.humanApprovals),
      policyReference: "fixture://payeeshield/demo-policy-v1", policyDigest: hash({ reviewAbove: 1_000_000, blockAbove: 4_000_000 }),
      evidenceReference: "fixture://supplier-change/verification", evidenceDigest: hash(scenario.independentVerification),
      canonicalArguments: { syntheticOnly: true, supplierAction: scenario.action, request, businessState: this.#state },
      nativeSessionId: "payeeshield-process-local", nativeRunId: id, nonce: id, idempotencyKey: id,
      issuedAt: AT, notBefore: AT, expiresAt: "2026-08-04T10:10:00.000Z",
    });
    const issuance = issueExactActionGatePass(input); this.#nonces.registerUnused(issuance.gatePass);
    this.#approvals.set(id, { request, input, issuance, stateVersion: this.#state.version, status: "ISSUED" });
    return structuredClone({ outcome: "GATEPASS_ISSUED", reason: "ATG_FIXTURE_CONTROLS_PASSED", approvalId: id, decision, gatePass: issuance.gatePass, executionAvailable: true });
  }
  async execute(id: string, value: unknown, fault: "none" | "expired" | "lost_ack" = "none") {
    const request = validatePayeeShieldRequest(value), a = this.#approvals.get(id);
    const refused = (reason: string) => ({ outcome: "REJECTED", reason, automaticRetryPermitted: false, snapshot: this.snapshot() });
    if (!a) return refused("APPROVAL_UNKNOWN");
    if (a.status !== "ISSUED") return refused("AUTHORITY_USED_OR_REVOKED_NO_RETRY");
    if (hash(request) !== hash(a.request)) return refused("EXACT_REQUEST_CHANGED");
    if (a.stateVersion !== this.#state.version || this.#record) return refused("BUSINESS_STATE_CHANGED");
    if (!["none", "expired", "lost_ack"].includes(fault)) return refused("FAULT_INVALID");
    // Local one-shot intent precedes execution; the core also consumes its nonce.
    a.status = "ATTEMPTED";
    const receipt = await verifyAndExecuteSimulatedAction(a.issuance.gatePass, a.input,
      createVerifierContext(a.issuance, this.#nonces, { trustedClock: createFixedTrustedClock(fault === "expired" ? "2026-08-04T10:11:00.000Z" : AT) }), () => {
        // Synchronous destination recheck at commit, not only the earlier UI check.
        if (this.#state.version !== a.stateVersion || this.#record) throw new Error("COMMIT_CONFLICT");
        this.#record = { approvalId: id, approvedRequestDigest: hash(request), beforeVersion: a.stateVersion, afterVersion: a.stateVersion + 1, accountEnding: request.proposedAccountEnding };
        this.#state.accountEnding = request.proposedAccountEnding; this.#state.version++;
        if (fault === "lost_ack") throw new Error("SYNTHETIC_ACK_LOST");
        return { acknowledged: true, simulatedSideEffectReference: "fixture://payeeshield/" + id };
      });
    if (receipt.resultStatus === "executed") a.status = "EXECUTED";
    else if (receipt.resultStatus === "execution_failed" || receipt.resultStatus === "abandoned_not_acknowledged") a.status = "UNKNOWN";
    return { outcome: a.status === "EXECUTED" ? "EXECUTED" : a.status === "UNKNOWN" ? "UNKNOWN" : "REJECTED", reason: receipt.resultStatus, automaticRetryPermitted: false, receipt, snapshot: this.snapshot() };
  }
  revoke(id: string) { const a = this.#approvals.get(id); if (!a || a.status !== "ISSUED") return { revoked: false }; a.status = "REVOKED"; return { revoked: true }; }
  simulateStateEdit() { this.#state.version++; return this.snapshot(); }
  reconcile(id: string) {
    const a = this.#approvals.get(id);
    if (!a || a.status !== "UNKNOWN") return { outcome: "UNKNOWN", reason: "NO_ELIGIBLE_UNCERTAIN_ATTEMPT", automaticRetryPermitted: false };
    if (!this.#record || this.#record.approvalId !== id || this.#record.approvedRequestDigest !== hash(a.request)) return { outcome: "UNKNOWN", reason: "LOCAL_RECORD_NOT_CONFIRMED", automaticRetryPermitted: false };
    a.status = "EXECUTED";
    return { outcome: "EXECUTED", reason: "SAME_PROCESS_SYNTHETIC_RECORD_CONFIRMED", automaticRetryPermitted: false, snapshot: this.snapshot(), independentDestinationEvidence: false };
  }
}
