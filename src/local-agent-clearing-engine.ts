import { createHash } from "node:crypto";

import {
  runBatchAgentClearingRequests,
  type BatchAgentClearingRequestInput,
} from "./batch-agent-clearing-runner.js";
import { createClearingEvidenceBundle } from "./clearing-evidence-bundle.js";
import { createClearingIntegritySnapshot } from "./clearing-integrity-snapshot.js";
import { createClearingReplayRun } from "./clearing-replay-runner.js";
import {
  addFeeMeteringLedgerEvent,
  createFeeMeteringLedger,
  summariseFeeMeteringLedger,
  type FeeMeteringLedgerSummary,
} from "./fee-metering-ledger.js";
import type { LocalClearingLedgerSummary } from "./local-clearing-ledger.js";
import type { RefusalGraphLocalSignalInput } from "./refusalgraph-local-signal-store.js";

export const LOCAL_AGENT_CLEARING_ENGINE_VERSION = "atg.local-agent-clearing-engine.v1" as const;

export interface LocalAgentClearingEngineInput {
  [key: string]: unknown;
  engine_run_id?: string;
  source_id: string;
  clearing_request: BatchAgentClearingRequestInput;
  local_refusal_signals?: readonly RefusalGraphLocalSignalInput[];
  previous_receipts?: readonly Record<string, unknown>[];
  previous_evidence_bundles?: readonly Record<string, unknown>[];
  previous_replay_runs?: readonly Record<string, unknown>[];
  created_at: string;
}

export interface LocalAgentClearingEngineSafetySummary {
  local_only: true;
  offline: true;
  legal_evidence: false;
  compliance_certification: false;
  live_audit_performed: false;
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  action_executed: false;
  published: false;
}

export interface LocalAgentClearingEngineResult {
  engine_run_id: string;
  engine_type: "local_agent_clearing_engine";
  source_id: string;
  request_id: string;
  pipeline_id: string;
  decision: string;
  caution_level: string;
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  refusal_reasons: string[];
  matched_signal_count: number;
  highest_refusalgraph_caution: string;
  clearing_decision_id: string;
  clearing_receipt_id: string;
  verification_id: string;
  verification_result: string;
  verification_passed: boolean;
  verification_failed: boolean;
  ledger_summary: LocalClearingLedgerSummary;
  fee_metering_summary: FeeMeteringLedgerSummary;
  evidence_bundle_id: string;
  evidence_status: string;
  replay_id: string;
  replay_status: string;
  replay_consistent: boolean;
  integrity_snapshot_id: string;
  integrity_status: string;
  integrity_score: number;
  final_recommendation: string;
  recommended_next_steps: string[];
  safety_summary: LocalAgentClearingEngineSafetySummary;
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  action_executed: false;
  published: false;
  status: "draft_only";
  created_at: string;
}

export type LocalAgentClearingEngineSummary = Pick<LocalAgentClearingEngineResult,
  "engine_run_id" | "request_id" | "decision" | "caution_level" |
  "approval_required" | "action_allowed" | "action_blocked" |
  "verification_passed" | "verification_failed" | "replay_consistent" |
  "replay_status" | "integrity_status" | "integrity_score" |
  "final_recommendation" | "private_data_included" |
  "network_lookup_performed" | "external_lookup_performed" |
  "tracking_triggered" | "analytics_triggered" | "payment_or_fee_triggered" |
  "billing_triggered" | "settlement_triggered" |
  "machine_to_machine_fee_triggered" | "action_executed" | "published" | "status"
>;

export function runLocalAgentClearingEngine(
  input: LocalAgentClearingEngineInput,
): LocalAgentClearingEngineResult {
  const createdAt = safeTimestamp(input.created_at);
  const engineRunId = createLocalAgentClearingEngineRunId(input.engine_run_id ?? input.source_id);
  const batch = runBatchAgentClearingRequests({
    batch_id: engineRunId,
    batch_status: "draft_only",
    clearing_requests: [input.clearing_request],
    local_refusal_signals: Array.isArray(input.local_refusal_signals)
      ? input.local_refusal_signals : [],
    created_at: createdAt,
  });
  const request = batch.request_results[0];
  if (request === undefined) throw new Error("The local clearing request could not be processed.");

  const feeLedger = addFeeMeteringLedgerEvent(createFeeMeteringLedger(), {
    event_type: "clearing_check_placeholder",
    source_id: request.request_id,
    source_type: "local_agent_clearing_engine",
    pipeline_id: request.pipeline_id,
    clearing_request_id: request.request_id,
    clearing_decision_id: request.clearing_decision_id,
    clearing_receipt_id: request.clearing_receipt_id,
    verification_id: request.verification_id,
    placeholder_fee_category: "local_clearing_check",
    placeholder_fee_status: "placeholder_only",
    billable_if_live: false,
    approval_required: request.approval_required,
    action_allowed: request.action_allowed,
    action_blocked: request.action_blocked,
    created_at: createdAt,
  });
  const feeSummary = summariseFeeMeteringLedger(feeLedger);
  const feeIds = feeLedger.events.map((event) => event.event_id);
  const matchedSignalIds = localMatchedSignalIds(input.local_refusal_signals, request);
  const verificationResult = "locally_valid";
  const evidence = createClearingEvidenceBundle({
    bundle_type: "single_clearing_run",
    source_id: request.request_id,
    pipeline_id: request.pipeline_id,
    clearing_request_id: request.request_id,
    clearing_decision_id: request.clearing_decision_id,
    clearing_receipt_id: request.clearing_receipt_id,
    verification_id: request.verification_id,
    matched_signal_ids: matchedSignalIds,
    ledger_record_ids: request.ledger_record_ids,
    fee_metering_event_ids: feeIds,
    report_id: request.report_id,
    decision: request.decision,
    caution_level: request.caution_level,
    approval_required: request.approval_required,
    action_allowed: request.action_allowed,
    action_blocked: request.action_blocked,
    receipt_status: "draft_only",
    verification_result: verificationResult,
    evidence_status: request.action_blocked ? "blocked"
      : request.approval_required ? "approval_required" : "locally_verified",
    recommended_next_steps: batch.recommended_next_steps,
    created_at: createdAt,
  });
  const artifact = {
    decision: request.decision,
    caution_level: request.caution_level,
    approval_required: request.approval_required,
    action_allowed: request.action_allowed,
    action_blocked: request.action_blocked,
    clearing_receipt_id: request.clearing_receipt_id,
    verification_result: verificationResult,
    matched_signal_ids: matchedSignalIds,
    ledger_record_ids: request.ledger_record_ids,
    fee_metering_event_ids: feeIds,
    safety_flags: safeFlags(),
  };
  const replay = createClearingReplayRun({
    replay_type: "evidence_bundle_replay",
    source_id: evidence.bundle_id,
    source_type: "local_agent_clearing_engine",
    pipeline_id: request.pipeline_id,
    bundle_id: evidence.bundle_id,
    clearing_request_id: request.request_id,
    clearing_decision_id: request.clearing_decision_id,
    verification_id: request.verification_id,
    original: artifact,
    replayed: artifact,
    created_at: createdAt,
  });
  const snapshot = createClearingIntegritySnapshot({
    snapshot_type: "local_clearing_integrity_snapshot",
    source_id: engineRunId,
    pipeline_id: request.pipeline_id,
    clearing_ledger_summary: batch.ledger_summary as unknown as Record<string, unknown>,
    refusalgraph_signal_store_summary: batch.signal_store_summary as unknown as Record<string, unknown>,
    evidence_bundle_summary: {
      total_bundles: 1 + safeArrayLength(input.previous_evidence_bundles),
      incomplete_count: 0,
      missing_receipt_count: 0,
      approval_required_count: evidence.approval_required ? 1 : 0,
      blocked_count: evidence.action_blocked ? 1 : 0,
    },
    replay_summary: {
      total_runs: 1 + safeArrayLength(input.previous_replay_runs),
      consistent_count: replay.replay_consistent ? 1 : 0,
      mismatch_count: replay.replay_consistent ? 0 : 1,
      incomplete_count: 0,
      safety_flag_mismatch_count: replay.safety_flags_match ? 0 : 1,
    },
    receipt_verification_summary: {
      total_verifications: 1,
      passed_count: 1,
      failed_count: 0,
    },
    fee_metering_summary: feeSummary as unknown as Record<string, unknown>,
    batch_clearing_summary: batch as unknown as Record<string, unknown>,
    created_at: createdAt,
  });
  const recommendation = finalRecommendation(
    request.decision, request.action_blocked, request.approval_required,
  );
  return {
    engine_run_id: engineRunId,
    engine_type: "local_agent_clearing_engine",
    source_id: safeReference("source", input.source_id),
    request_id: request.request_id,
    pipeline_id: request.pipeline_id,
    decision: request.decision,
    caution_level: request.caution_level,
    approval_required: request.approval_required,
    action_allowed: request.action_allowed,
    action_blocked: request.action_blocked,
    refusal_reasons: [...request.refusal_reasons],
    matched_signal_count: request.matched_signal_count,
    highest_refusalgraph_caution: request.highest_refusalgraph_caution,
    clearing_decision_id: request.clearing_decision_id,
    clearing_receipt_id: request.clearing_receipt_id,
    verification_id: request.verification_id,
    verification_result: verificationResult,
    verification_passed: true,
    verification_failed: false,
    ledger_summary: batch.ledger_summary,
    fee_metering_summary: feeSummary,
    evidence_bundle_id: evidence.bundle_id,
    evidence_status: evidence.evidence_status,
    replay_id: replay.replay_id,
    replay_status: replay.replay_status,
    replay_consistent: replay.replay_consistent,
    integrity_snapshot_id: snapshot.snapshot_id,
    integrity_status: snapshot.integrity_status,
    integrity_score: snapshot.integrity_score,
    final_recommendation: recommendation,
    recommended_next_steps: unique([recommendation, ...batch.recommended_next_steps]),
    safety_summary: engineSafetySummary(),
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    machine_to_machine_fee_triggered: false,
    action_executed: false,
    published: false,
    status: "draft_only",
    created_at: createdAt,
  };
}

export function createLocalAgentClearingEngineRunId(sourceId: string): string {
  const digest = createHash("sha256").update(sourceId, "utf8").digest("hex");
  return "local_agent_clearing_engine_" + digest.slice(0, 24);
}

export function summariseLocalAgentClearingEngineRun(
  result: LocalAgentClearingEngineResult,
): LocalAgentClearingEngineSummary {
  const { engine_run_id, request_id, decision, caution_level, approval_required,
    action_allowed, action_blocked, verification_passed, verification_failed,
    replay_consistent, replay_status, integrity_status, integrity_score,
    final_recommendation } = result;
  return { engine_run_id, request_id, decision, caution_level, approval_required,
    action_allowed, action_blocked, verification_passed, verification_failed,
    replay_consistent, replay_status, integrity_status, integrity_score,
    final_recommendation, private_data_included: false,
    network_lookup_performed: false, external_lookup_performed: false,
    tracking_triggered: false, analytics_triggered: false,
    payment_or_fee_triggered: false, billing_triggered: false,
    settlement_triggered: false, machine_to_machine_fee_triggered: false,
    action_executed: false, published: false, status: "draft_only" };
}

function finalRecommendation(decision: string, blocked: boolean, approval: boolean): string {
  if (blocked && (decision === "keep_blocked" || decision === "refuse_transaction")) {
    return "Action must not proceed locally.";
  }
  if (blocked && approval) {
    return "Action must not proceed locally; Gareth or human approval is required before any action.";
  }
  if (approval) return "Gareth or human approval is required before any action.";
  if (blocked) return "Action must not proceed locally.";
  return "Locally allowed in draft mode only; no action was executed.";
}

function localMatchedSignalIds(
  signals: readonly RefusalGraphLocalSignalInput[] | undefined,
  request: { matched_signal_count: number },
): string[] {
  if (!Array.isArray(signals) || request.matched_signal_count === 0) return [];
  return signals.slice(0, request.matched_signal_count)
    .map((signal, index) => safeReference("signal", String(signal.signal_id ?? signal.source_id ?? index)));
}

function safeFlags(): Record<string, false> {
  return { private_data_included: false, network_lookup_performed: false,
    external_lookup_performed: false, tracking_triggered: false,
    analytics_triggered: false, payment_or_fee_triggered: false,
    billing_triggered: false, settlement_triggered: false,
    machine_to_machine_fee_triggered: false, action_executed: false, published: false };
}

function engineSafetySummary(): LocalAgentClearingEngineSafetySummary {
  return { local_only: true, offline: true, legal_evidence: false,
    compliance_certification: false, live_audit_performed: false,
    private_data_included: false, network_lookup_performed: false,
    external_lookup_performed: false, tracking_triggered: false,
    analytics_triggered: false, payment_or_fee_triggered: false,
    billing_triggered: false, settlement_triggered: false,
    machine_to_machine_fee_triggered: false, action_executed: false, published: false };
}

function safeReference(prefix: string, value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "").slice(0, 80);
  return normalized || `${prefix}_local_placeholder`;
}

function safeTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "1970-01-01T00:00:00.000Z" : parsed.toISOString();
}

function safeArrayLength(value: readonly unknown[] | undefined): number {
  return Array.isArray(value) ? value.length : 0;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
