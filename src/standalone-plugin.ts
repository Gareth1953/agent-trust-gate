import { randomUUID } from "node:crypto";
import { isAbsolute } from "node:path";
import { LocalDurableLifecycleStore } from "./durable-action-lifecycle.js";
import {
  McpExactActionGateway,
  createDefaultMcpBusinessPolicyRequest,
  validateMcpBusinessPolicyRequest,
  type McpBusinessPolicyRequest,
  type McpBusinessPolicyResult,
} from "./mcp-exact-action-gateway.js";
import {
  executeThroughRegisteredSyntheticPurchasingAdapter,
  REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS,
  type SyntheticExecutionAttempt,
} from "./local-purchasing-lifecycle-demo.js";
import { createCanonicalPayloadHash } from "./local-signed-proof.js";

export const STANDALONE_PLUGIN_VERSION = "0.1.0-local.1" as const;
export const STANDALONE_PLUGIN_BOUNDARY = Object.freeze({
  localOnly: true, syntheticOnly: true, productionReady: false,
  liveExecutionAvailable: false, learningEnabled: false,
  authoritySource: "repository_synthetic_fixtures",
  clock: "fixed_synthetic_reference_time",
} as const);

export interface PluginEvaluation {
  evaluationId: string;
  decision: McpBusinessPolicyResult;
}

/** An installable local evaluation facade; never accepts executable callbacks. */
export class AtgStandalonePlugin {
  readonly #store: LocalDurableLifecycleStore;
  readonly #gateway: McpExactActionGateway;
  readonly #evaluations = new Map<string, { requestDigest: string; decision: McpBusinessPolicyResult }>();
  readonly #maximumEvaluations: number;
  #evaluationsInFlight = 0;
  readonly capabilities = STANDALONE_PLUGIN_BOUNDARY;

  constructor(options: { statePath: string; maximumEvaluations?: number }) {
    if (!isAbsolute(options.statePath)) throw new TypeError("An absolute, host-owned statePath is required.");
    this.#maximumEvaluations = options.maximumEvaluations ?? 100;
    if (!Number.isSafeInteger(this.#maximumEvaluations) || this.#maximumEvaluations < 1
      || this.#maximumEvaluations > 10_000) throw new TypeError("maximumEvaluations must be 1–10000.");
    this.#store = new LocalDurableLifecycleStore({ statePath: options.statePath });
    this.#gateway = new McpExactActionGateway({ durableStore: this.#store });
  }

  async evaluate(value: unknown): Promise<PluginEvaluation> {
    // Validate and snapshot before awaiting: later caller mutation cannot change approval.
    const request = structuredClone(validateMcpBusinessPolicyRequest(value));
    if (this.#evaluations.size + this.#evaluationsInFlight >= this.#maximumEvaluations) {
      throw new Error("PLUGIN_SESSION_CAPACITY_REACHED: discard an old evaluation before continuing.");
    }
    const requestDigest = createCanonicalPayloadHash(request);
    this.#evaluationsInFlight += 1;
    try {
      const decision = await this.#gateway.evaluateAction(request) as McpBusinessPolicyResult;
      const evaluationId = randomUUID();
      this.#evaluations.set(evaluationId, { requestDigest, decision: structuredClone(decision) });
      return { evaluationId, decision: structuredClone(decision) };
    } finally {
      this.#evaluationsInFlight -= 1;
    }
  }

  async executeSynthetic(
    evaluationId: string,
    proposedRequest: unknown,
    options: { executedAt?: string } = {},
  ): Promise<SyntheticExecutionAttempt> {
    if (options === null || typeof options !== "object" || Array.isArray(options)
      || Object.keys(options).some(key => key !== "executedAt")
      || (options.executedAt !== undefined && typeof options.executedAt !== "string")) {
      return blocked("PLUGIN_EXECUTION_OPTIONS_INVALID");
    }
    const evaluation = this.#evaluations.get(evaluationId);
    if (evaluation === undefined) return blocked("PLUGIN_EVALUATION_UNKNOWN");
    let request: McpBusinessPolicyRequest;
    try {
      request = structuredClone(validateMcpBusinessPolicyRequest(proposedRequest));
    } catch {
      return blocked("PLUGIN_REQUEST_INVALID");
    }
    if (createCanonicalPayloadHash(request) !== evaluation.requestDigest) {
      return blocked("PLUGIN_APPROVED_REQUEST_CHANGED");
    }
    const decision = evaluation.decision;
    if (decision.mode !== "enforced" || decision.outcome !== "ACCEPT"
      || !decision.authorising || decision.gatePass === null || decision.policyDecisionReceipt === null) {
      return blocked("PLUGIN_EXECUTION_AUTHORITY_MISSING");
    }
    const { actionEnvelopeVersion: _version, canonicalizationVersion: _canonical,
      digestAlgorithm: _algorithm, actionDigest: _digest, ...action } = decision.gatePass.action;
    const adapter = REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0];
    try {
      return await executeThroughRegisteredSyntheticPurchasingAdapter({
        store: this.#store, gatePass: decision.gatePass,
        decisionReceipt: decision.policyDecisionReceipt, proposedAction: structuredClone(action),
        adapterId: adapter.adapterId, resourceId: adapter.resourceId,
        ...(options.executedAt === undefined ? {} : { executedAt: options.executedAt }),
      });
    } catch {
      // Reservation may be uncertain: never invoke again automatically.
      return blocked("PLUGIN_EXECUTION_FAILED_CLOSED");
    }
  }

  discardEvaluation(evaluationId: string): boolean {
    // Forgetting a session handle does not release exposure or revoke durable authority.
    return this.#evaluations.delete(evaluationId);
  }
}

export function createSyntheticPluginRequest(mode: "enforced" | "shadow" = "shadow"): McpBusinessPolicyRequest {
  return createDefaultMcpBusinessPolicyRequest(mode, { nonce: `nonce_plugin_${randomUUID()}` });
}

function blocked(reason: string): SyntheticExecutionAttempt {
  return { outcome: "REJECTED", reasonCodes: [reason], adapterReached: false,
    executionReceipt: null, evidenceLink: null, lifecycleStatus: null };
}
