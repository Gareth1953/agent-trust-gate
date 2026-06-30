import { createHash } from "node:crypto";

export const REFUSALGRAPH_LOCAL_SIGNAL_STORE_VERSION = "atg.refusalgraph-local-signal-store.v1" as const;

export type RefusalGraphLocalSignalType =
  | "refused_action"
  | "approval_required"
  | "high_caution"
  | "blocked_request"
  | "limited_request"
  | "receipt_verification_failed"
  | "fee_readiness_blocked"
  | "unknown_local_signal";

export type RefusalGraphLocalCautionLevel = "low" | "medium" | "high" | "critical" | "unknown";

export interface RefusalGraphLocalSignalInput {
  [key: string]: unknown;
  signal_type: string;
  source_id: string;
  related_request_id?: string | null;
  related_agent_id?: string | null;
  intent_category?: string | null;
  action_category?: string | null;
  refusal_reason?: string | null;
  caution_level?: string | null;
  approval_required?: boolean;
  action_allowed?: boolean;
  action_blocked?: boolean;
  evidence_level?: string | null;
  signal_status?: string | null;
  created_at: string;
}

export interface RefusalGraphLocalStoredSignal {
  signal_id: string;
  signal_type: RefusalGraphLocalSignalType;
  source_id: string;
  related_request_id: string | null;
  related_agent_id: string | null;
  intent_category: string;
  action_category: string;
  refusal_reason: string;
  caution_level: RefusalGraphLocalCautionLevel;
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  evidence_level: string;
  signal_status: "draft_only" | "active_local" | "superseded_local" | "unknown";
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  action_executed: false;
  status: "draft_only";
  created_at: string;
}

export interface RefusalGraphLocalSignalStore {
  store_version: typeof REFUSALGRAPH_LOCAL_SIGNAL_STORE_VERSION;
  local_only: true;
  signals: readonly RefusalGraphLocalStoredSignal[];
  status: "draft_only";
}

export interface RefusalGraphLocalSignalStoreQuery {
  [key: string]: unknown;
  query_id?: string;
  intent_category?: string;
  action_category?: string;
  signal_type?: string;
  caution_level?: string;
  approval_required?: boolean;
  action_blocked?: boolean;
  evidence_level?: string;
  created_at?: string;
}

export interface RefusalGraphLocalSignalStoreQueryResult {
  query_id: string;
  total_signals_checked: number;
  matched_signal_count: number;
  matched_signals: RefusalGraphLocalStoredSignal[];
  highest_caution_level: RefusalGraphLocalCautionLevel;
  approval_required: boolean;
  action_blocked: boolean;
  refusal_reasons: string[];
  query_status: "local_query_completed";
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  status: "draft_only";
  created_at: string;
}

export interface RefusalGraphLocalSignalStoreSummary {
  total_signals: number;
  signal_type_counts: Record<RefusalGraphLocalSignalType, number>;
  caution_level_counts: Record<RefusalGraphLocalCautionLevel, number>;
  approval_required_count: number;
  action_blocked_count: number;
  high_caution_count: number;
  critical_caution_count: number;
  evidence_level_counts: Record<string, number>;
  private_data_included: false;
  network_lookup_count: number;
  external_lookup_count: number;
  tracking_triggered_count: number;
  analytics_triggered_count: number;
  action_executed_count: number;
  status: "draft_only";
}

const SIGNAL_TYPES = new Set<RefusalGraphLocalSignalType>([
  "refused_action", "approval_required", "high_caution", "blocked_request",
  "limited_request", "receipt_verification_failed", "fee_readiness_blocked",
  "unknown_local_signal",
]);

const INTENT_CATEGORIES = new Set([
  "payment", "purchase", "publishing", "deployment", "data_access",
  "customer_communication", "external_connection", "billing", "settlement",
  "signup", "internal_action", "other",
]);

const ACTION_CATEGORIES = new Set([
  "initiate_payment", "buy_service", "publish_content", "deploy_code",
  "access_data", "email_customer", "connect_external_system", "enable_billing",
  "settle_transaction", "enable_signup", "internal_review", "other",
]);

const REFUSAL_REASONS = new Set([
  "missing_human_approval", "missing_evidence", "weak_or_missing_identity",
  "payment_intent_unclear", "high_risk_action", "policy_blocked",
  "customer_facing_action", "money_movement_requested", "publishing_requested",
  "deployment_requested", "billing_requested", "signup_requested",
  "data_access_requested", "external_connection_requested",
  "automatic_purchase_requested", "private_data_risk",
  "receipt_verification_failed", "fee_readiness_blocked",
  "unknown_or_unclear_intent",
]);

const EVIDENCE_LEVELS = new Set([
  "none", "missing", "incomplete", "hash_only", "sufficient", "verified", "unknown",
]);

export function createRefusalGraphLocalSignalStore(): RefusalGraphLocalSignalStore {
  return {
    store_version: REFUSALGRAPH_LOCAL_SIGNAL_STORE_VERSION,
    local_only: true,
    signals: [],
    status: "draft_only",
  };
}

export function addRefusalGraphLocalSignal(
  store: RefusalGraphLocalSignalStore,
  input: RefusalGraphLocalSignalInput,
): RefusalGraphLocalSignalStore {
  const signal = createStoredSignal(input);
  if (store.signals.some((existing) => existing.signal_id === signal.signal_id)) return store;
  return {
    store_version: REFUSALGRAPH_LOCAL_SIGNAL_STORE_VERSION,
    local_only: true,
    signals: [...store.signals, signal],
    status: "draft_only",
  };
}

export function addRefusalGraphLocalSignals(
  store: RefusalGraphLocalSignalStore,
  inputs: readonly RefusalGraphLocalSignalInput[],
): RefusalGraphLocalSignalStore {
  return inputs.reduce(addRefusalGraphLocalSignal, store);
}

export function listRefusalGraphLocalSignals(
  store: RefusalGraphLocalSignalStore,
): RefusalGraphLocalStoredSignal[] {
  return store.signals.map((signal) => ({ ...signal }));
}

export function findRefusalGraphLocalSignalById(
  store: RefusalGraphLocalSignalStore,
  signalId: string,
): RefusalGraphLocalStoredSignal | undefined {
  const signal = store.signals.find((entry) => entry.signal_id === signalId);
  return signal === undefined ? undefined : { ...signal };
}

export function queryRefusalGraphLocalSignalStore(
  store: RefusalGraphLocalSignalStore,
  query: RefusalGraphLocalSignalStoreQuery,
): RefusalGraphLocalSignalStoreQueryResult {
  const normalized = normalizeQuery(query);
  const matches = store.signals.filter((signal) => matchesQuery(signal, normalized));
  return {
    query_id: createQueryId(query.query_id, normalized),
    total_signals_checked: store.signals.length,
    matched_signal_count: matches.length,
    matched_signals: matches.map((signal) => ({ ...signal })),
    highest_caution_level: highestCaution(matches),
    approval_required: matches.some((signal) => signal.approval_required),
    action_blocked: matches.some((signal) => signal.action_blocked),
    refusal_reasons: [...new Set(matches.map((signal) => signal.refusal_reason))].sort(),
    query_status: "local_query_completed",
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    status: "draft_only",
    created_at: safeTimestamp(query.created_at),
  };
}

export function summariseRefusalGraphLocalSignalStore(
  store: RefusalGraphLocalSignalStore,
): RefusalGraphLocalSignalStoreSummary {
  const signalTypeCounts = emptySignalTypeCounts();
  const cautionLevelCounts = emptyCautionCounts();
  const evidenceLevelCounts: Record<string, number> = {};
  for (const signal of store.signals) {
    signalTypeCounts[signal.signal_type] += 1;
    cautionLevelCounts[signal.caution_level] += 1;
    evidenceLevelCounts[signal.evidence_level] = (evidenceLevelCounts[signal.evidence_level] ?? 0) + 1;
  }
  return {
    total_signals: store.signals.length,
    signal_type_counts: signalTypeCounts,
    caution_level_counts: cautionLevelCounts,
    approval_required_count: store.signals.filter((signal) => signal.approval_required).length,
    action_blocked_count: store.signals.filter((signal) => signal.action_blocked).length,
    high_caution_count: cautionLevelCounts.high,
    critical_caution_count: cautionLevelCounts.critical,
    evidence_level_counts: sortCountRecord(evidenceLevelCounts),
    private_data_included: false,
    network_lookup_count: store.signals.filter((signal) => signal.network_lookup_performed).length,
    external_lookup_count: store.signals.filter((signal) => signal.external_lookup_performed).length,
    tracking_triggered_count: store.signals.filter((signal) => signal.tracking_triggered).length,
    analytics_triggered_count: store.signals.filter((signal) => signal.analytics_triggered).length,
    action_executed_count: store.signals.filter((signal) => signal.action_executed).length,
    status: "draft_only",
  };
}

export function createRefusalGraphLocalSignalId(signalType: string, sourceId: string): string {
  const type = safeSignalType(signalType);
  const digest = createHash("sha256").update(`${type}:${sourceId}`, "utf8").digest("hex");
  return `rg_local_signal_${type}_${digest.slice(0, 20)}`;
}

function createStoredSignal(input: RefusalGraphLocalSignalInput): RefusalGraphLocalStoredSignal {
  const type = safeSignalType(input.signal_type);
  return {
    signal_id: createRefusalGraphLocalSignalId(type, input.source_id),
    signal_type: type,
    source_id: safeReference("source", input.source_id),
    related_request_id: optionalReference("request", input.related_request_id),
    related_agent_id: optionalReference("agent", input.related_agent_id),
    intent_category: safeEnum(input.intent_category, INTENT_CATEGORIES, "other"),
    action_category: safeEnum(input.action_category, ACTION_CATEGORIES, "other"),
    refusal_reason: safeEnum(input.refusal_reason, REFUSAL_REASONS, "unknown_or_unclear_intent"),
    caution_level: safeCaution(input.caution_level),
    approval_required: input.approval_required === true,
    action_allowed: input.action_allowed === true,
    action_blocked: input.action_blocked === true,
    evidence_level: safeEnum(input.evidence_level, EVIDENCE_LEVELS, "unknown"),
    signal_status: safeSignalStatus(input.signal_status),
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
    status: "draft_only",
    created_at: safeTimestamp(input.created_at),
  };
}

type NormalizedQuery = {
  intent_category?: string;
  action_category?: string;
  signal_type?: RefusalGraphLocalSignalType;
  caution_level?: RefusalGraphLocalCautionLevel;
  approval_required?: boolean;
  action_blocked?: boolean;
  evidence_level?: string;
};

function normalizeQuery(query: RefusalGraphLocalSignalStoreQuery): NormalizedQuery {
  const result: NormalizedQuery = {};
  if (query.intent_category !== undefined) result.intent_category = safeEnum(query.intent_category, INTENT_CATEGORIES, "other");
  if (query.action_category !== undefined) result.action_category = safeEnum(query.action_category, ACTION_CATEGORIES, "other");
  if (query.signal_type !== undefined) result.signal_type = safeSignalType(query.signal_type);
  if (query.caution_level !== undefined) result.caution_level = safeCaution(query.caution_level);
  if (query.approval_required !== undefined) result.approval_required = query.approval_required === true;
  if (query.action_blocked !== undefined) result.action_blocked = query.action_blocked === true;
  if (query.evidence_level !== undefined) result.evidence_level = safeEnum(query.evidence_level, EVIDENCE_LEVELS, "unknown");
  return result;
}

function matchesQuery(signal: RefusalGraphLocalStoredSignal, query: NormalizedQuery): boolean {
  return (query.intent_category === undefined || signal.intent_category === query.intent_category)
    && (query.action_category === undefined || signal.action_category === query.action_category)
    && (query.signal_type === undefined || signal.signal_type === query.signal_type)
    && (query.caution_level === undefined || signal.caution_level === query.caution_level)
    && (query.approval_required === undefined || signal.approval_required === query.approval_required)
    && (query.action_blocked === undefined || signal.action_blocked === query.action_blocked)
    && (query.evidence_level === undefined || signal.evidence_level === query.evidence_level);
}

function createQueryId(sourceId: string | undefined, query: NormalizedQuery): string {
  const source = sourceId ?? JSON.stringify(query);
  const digest = createHash("sha256").update(source, "utf8").digest("hex");
  return `rg_local_query_${digest.slice(0, 24)}`;
}

function highestCaution(signals: readonly RefusalGraphLocalStoredSignal[]): RefusalGraphLocalCautionLevel {
  const priority: Record<RefusalGraphLocalCautionLevel, number> = {
    unknown: 0, low: 1, medium: 2, high: 3, critical: 4,
  };
  return signals.reduce<RefusalGraphLocalCautionLevel>((highest, signal) =>
    priority[signal.caution_level] > priority[highest] ? signal.caution_level : highest, "unknown");
}

function safeSignalType(value: string): RefusalGraphLocalSignalType {
  const token = safeToken(value) as RefusalGraphLocalSignalType;
  return SIGNAL_TYPES.has(token) ? token : "unknown_local_signal";
}

function safeCaution(value: string | null | undefined): RefusalGraphLocalCautionLevel {
  const token = value === null || value === undefined ? "" : safeToken(value);
  return token === "low" || token === "medium" || token === "high" || token === "critical"
    ? token : "unknown";
}

function safeSignalStatus(value: string | null | undefined): RefusalGraphLocalStoredSignal["signal_status"] {
  const token = value === null || value === undefined ? "" : safeToken(value);
  return token === "draft_only" || token === "active_local" || token === "superseded_local"
    ? token : "unknown";
}

function safeEnum(value: string | null | undefined, allowed: ReadonlySet<string>, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  const token = safeToken(value);
  return allowed.has(token) ? token : fallback;
}

function optionalReference(kind: string, value: string | null | undefined): string | null {
  return value === null || value === undefined || value.trim() === ""
    ? null : safeReference(kind, value);
}

function safeReference(kind: string, value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `${kind}_reference_${digest.slice(0, 20)}`;
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}

function safeTimestamp(value: string | undefined): string {
  if (value === undefined) return "unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}

function emptySignalTypeCounts(): Record<RefusalGraphLocalSignalType, number> {
  return {
    refused_action: 0, approval_required: 0, high_caution: 0, blocked_request: 0,
    limited_request: 0, receipt_verification_failed: 0, fee_readiness_blocked: 0,
    unknown_local_signal: 0,
  };
}

function emptyCautionCounts(): Record<RefusalGraphLocalCautionLevel, number> {
  return { low: 0, medium: 0, high: 0, critical: 0, unknown: 0 };
}

function sortCountRecord(value: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}
