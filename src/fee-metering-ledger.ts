import { createHash } from "node:crypto";

export const FEE_METERING_LEDGER_VERSION = "atg.fee-metering-ledger.v1" as const;

export type FeeMeteringLedgerEventType =
  | "clearing_check_placeholder"
  | "refusalgraph_lookup_placeholder"
  | "receipt_creation_placeholder"
  | "receipt_verification_placeholder"
  | "batch_clearing_placeholder"
  | "approval_gate_placeholder"
  | "blocked_action_placeholder"
  | "unknown_fee_placeholder";

export type PlaceholderFeeStatus =
  | "placeholder_only"
  | "not_billable"
  | "billable_if_live"
  | "blocked"
  | "unknown";

export interface FeeMeteringLedgerEventInput {
  [key: string]: unknown;
  event_type: string;
  source_id: string;
  source_type?: string | null;
  pipeline_id?: string | null;
  clearing_request_id?: string | null;
  clearing_decision_id?: string | null;
  clearing_receipt_id?: string | null;
  verification_id?: string | null;
  batch_id?: string | null;
  refusalgraph_query_id?: string | null;
  placeholder_fee_category?: string | null;
  placeholder_fee_status?: string | null;
  billable_if_live?: boolean;
  currency?: string | null;
  amount?: number | null;
  amount_minor_units?: number | null;
  fee_reason?: string | null;
  approval_required?: boolean;
  action_allowed?: boolean;
  action_blocked?: boolean;
  created_at: string;
}

export interface FeeMeteringLedgerEvent {
  [key: string]: unknown;
  event_id: string;
  event_type: FeeMeteringLedgerEventType;
  source_id: string;
  source_type: string;
  pipeline_id: string | null;
  clearing_request_id: string | null;
  clearing_decision_id: string | null;
  clearing_receipt_id: string | null;
  verification_id: string | null;
  batch_id: string | null;
  refusalgraph_query_id: string | null;
  placeholder_fee_category: string;
  placeholder_fee_status: PlaceholderFeeStatus;
  billable_if_live: boolean;
  billing_enabled: false;
  payment_enabled: false;
  settlement_enabled: false;
  machine_to_machine_fee_enabled: false;
  currency: "GBP" | "USD" | "EUR" | "not_configured";
  amount: number | null;
  amount_minor_units: number | null;
  fee_reason: string;
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  tracking_triggered: false;
  analytics_triggered: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  action_executed: false;
  private_data_included: false;
  status: "placeholder_only";
  created_at: string;
}

export interface FeeMeteringLedger {
  ledger_version: typeof FEE_METERING_LEDGER_VERSION;
  local_only: true;
  events: readonly FeeMeteringLedgerEvent[];
  status: "placeholder_only";
}

export interface FeeMeteringLedgerSummary {
  total_events: number;
  event_type_counts: Record<FeeMeteringLedgerEventType, number>;
  placeholder_fee_status_counts: Record<PlaceholderFeeStatus, number>;
  billable_if_live_count: number;
  not_billable_count: number;
  blocked_count: number;
  approval_required_count: number;
  action_blocked_count: number;
  placeholder_amount_total: number;
  placeholder_amount_minor_units_total: number;
  billing_enabled_count: number;
  payment_enabled_count: number;
  settlement_enabled_count: number;
  machine_to_machine_fee_enabled_count: number;
  payment_triggered_count: number;
  billing_triggered_count: number;
  settlement_triggered_count: number;
  network_lookup_count: number;
  external_lookup_count: number;
  tracking_triggered_count: number;
  analytics_triggered_count: number;
  action_executed_count: number;
  private_data_included: false;
  status: "placeholder_only";
}

const EVENT_TYPES = new Set<FeeMeteringLedgerEventType>([
  "clearing_check_placeholder", "refusalgraph_lookup_placeholder",
  "receipt_creation_placeholder", "receipt_verification_placeholder",
  "batch_clearing_placeholder", "approval_gate_placeholder",
  "blocked_action_placeholder", "unknown_fee_placeholder",
]);

const FEE_STATUSES = new Set<PlaceholderFeeStatus>([
  "placeholder_only", "not_billable", "billable_if_live", "blocked", "unknown",
]);

const SOURCE_TYPES = new Set([
  "clearing_check", "refusalgraph_lookup", "clearing_receipt",
  "receipt_verification", "batch_clearing", "approval_gate", "blocked_action",
  "unknown",
]);

const FEE_CATEGORIES = new Set([
  "clearing_check", "refusalgraph_lookup", "receipt_creation",
  "receipt_verification", "batch_clearing", "approval_gate", "blocked_action",
  "unknown",
]);

const FEE_REASONS = new Set([
  "future_clearing_value", "future_refusal_intelligence_value",
  "future_receipt_value", "future_verification_value", "future_batch_value",
  "future_approval_value", "future_blocking_value", "unknown",
]);

export function createFeeMeteringLedger(): FeeMeteringLedger {
  return {
    ledger_version: FEE_METERING_LEDGER_VERSION,
    local_only: true,
    events: [],
    status: "placeholder_only",
  };
}

export function createFeeMeteringLedgerEvent(
  input: FeeMeteringLedgerEventInput,
): FeeMeteringLedgerEvent {
  const eventType = safeEventType(input.event_type);
  const feeStatus = safeFeeStatus(input.placeholder_fee_status);
  return {
    event_id: safeExistingEventId(input.event_id, eventType)
      ?? createFeeMeteringLedgerEventId(eventType, input.source_id),
    event_type: eventType,
    source_id: safeReference("source", input.source_id),
    source_type: safeEnum(input.source_type, SOURCE_TYPES, "unknown"),
    pipeline_id: optionalReference("pipeline", input.pipeline_id),
    clearing_request_id: optionalReference("clearing_request", input.clearing_request_id),
    clearing_decision_id: optionalReference("clearing_decision", input.clearing_decision_id),
    clearing_receipt_id: optionalReference("clearing_receipt", input.clearing_receipt_id),
    verification_id: optionalReference("verification", input.verification_id),
    batch_id: optionalReference("batch", input.batch_id),
    refusalgraph_query_id: optionalReference("refusalgraph_query", input.refusalgraph_query_id),
    placeholder_fee_category: safeEnum(input.placeholder_fee_category, FEE_CATEGORIES, "unknown"),
    placeholder_fee_status: feeStatus,
    billable_if_live: feeStatus === "billable_if_live" && input.billable_if_live === true,
    billing_enabled: false,
    payment_enabled: false,
    settlement_enabled: false,
    machine_to_machine_fee_enabled: false,
    currency: safeCurrency(input.currency),
    amount: safeAmount(input.amount),
    amount_minor_units: safeMinorUnits(input.amount_minor_units),
    fee_reason: safeEnum(input.fee_reason, FEE_REASONS, "unknown"),
    approval_required: input.approval_required === true,
    action_allowed: input.action_allowed === true,
    action_blocked: input.action_blocked === true,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    tracking_triggered: false,
    analytics_triggered: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    action_executed: false,
    private_data_included: false,
    status: "placeholder_only",
    created_at: safeTimestamp(input.created_at),
  };
}

export function addFeeMeteringLedgerEvent(
  ledger: FeeMeteringLedger,
  event: FeeMeteringLedgerEventInput | FeeMeteringLedgerEvent,
): FeeMeteringLedger {
  const safeEvent = createFeeMeteringLedgerEvent(event);
  if (ledger.events.some((existing) => existing.event_id === safeEvent.event_id)) return ledger;
  return {
    ledger_version: FEE_METERING_LEDGER_VERSION,
    local_only: true,
    events: [...ledger.events, safeEvent],
    status: "placeholder_only",
  };
}

export function addFeeMeteringLedgerEvents(
  ledger: FeeMeteringLedger,
  events: readonly (FeeMeteringLedgerEventInput | FeeMeteringLedgerEvent)[],
): FeeMeteringLedger {
  return events.reduce(addFeeMeteringLedgerEvent, ledger);
}

export function listFeeMeteringLedgerEvents(
  ledger: FeeMeteringLedger,
): FeeMeteringLedgerEvent[] {
  return ledger.events.map((event) => ({ ...event }));
}

export function findFeeMeteringLedgerEventById(
  ledger: FeeMeteringLedger,
  eventId: string,
): FeeMeteringLedgerEvent | undefined {
  const event = ledger.events.find((entry) => entry.event_id === eventId);
  return event === undefined ? undefined : { ...event };
}

export function summariseFeeMeteringLedger(
  ledger: FeeMeteringLedger,
): FeeMeteringLedgerSummary {
  const eventTypeCounts = emptyEventTypeCounts();
  const feeStatusCounts = emptyFeeStatusCounts();
  for (const event of ledger.events) {
    eventTypeCounts[event.event_type] += 1;
    feeStatusCounts[event.placeholder_fee_status] += 1;
  }
  return {
    total_events: ledger.events.length,
    event_type_counts: eventTypeCounts,
    placeholder_fee_status_counts: feeStatusCounts,
    billable_if_live_count: ledger.events.filter((event) => event.billable_if_live).length,
    not_billable_count: feeStatusCounts.not_billable,
    blocked_count: feeStatusCounts.blocked,
    approval_required_count: ledger.events.filter((event) => event.approval_required).length,
    action_blocked_count: ledger.events.filter((event) => event.action_blocked).length,
    placeholder_amount_total: roundAmount(ledger.events.reduce(
      (total, event) => total + (event.amount ?? 0), 0,
    )),
    placeholder_amount_minor_units_total: ledger.events.reduce(
      (total, event) => total + (event.amount_minor_units ?? 0), 0,
    ),
    billing_enabled_count: ledger.events.filter((event) => event.billing_enabled).length,
    payment_enabled_count: ledger.events.filter((event) => event.payment_enabled).length,
    settlement_enabled_count: ledger.events.filter((event) => event.settlement_enabled).length,
    machine_to_machine_fee_enabled_count: ledger.events.filter(
      (event) => event.machine_to_machine_fee_enabled,
    ).length,
    payment_triggered_count: ledger.events.filter((event) => event.payment_or_fee_triggered).length,
    billing_triggered_count: ledger.events.filter((event) => event.billing_triggered).length,
    settlement_triggered_count: ledger.events.filter((event) => event.settlement_triggered).length,
    network_lookup_count: ledger.events.filter((event) => event.network_lookup_performed).length,
    external_lookup_count: ledger.events.filter((event) => event.external_lookup_performed).length,
    tracking_triggered_count: ledger.events.filter((event) => event.tracking_triggered).length,
    analytics_triggered_count: ledger.events.filter((event) => event.analytics_triggered).length,
    action_executed_count: ledger.events.filter((event) => event.action_executed).length,
    private_data_included: false,
    status: "placeholder_only",
  };
}

export function createFeeMeteringLedgerEventId(eventType: string, sourceId: string): string {
  const type = safeEventType(eventType);
  const digest = createHash("sha256").update(`${type}:${sourceId}`, "utf8").digest("hex");
  return `fee_metering_placeholder_${type}_${digest.slice(0, 20)}`;
}

function safeEventType(value: string): FeeMeteringLedgerEventType {
  const token = safeToken(value) as FeeMeteringLedgerEventType;
  return EVENT_TYPES.has(token) ? token : "unknown_fee_placeholder";
}

function safeFeeStatus(value: string | null | undefined): PlaceholderFeeStatus {
  const token = safeToken(value ?? "") as PlaceholderFeeStatus;
  return FEE_STATUSES.has(token) ? token : "unknown";
}

function safeCurrency(value: string | null | undefined): FeeMeteringLedgerEvent["currency"] {
  const token = (value ?? "").trim().toUpperCase();
  return token === "GBP" || token === "USD" || token === "EUR" ? token : "not_configured";
}

function safeAmount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return roundAmount(Math.min(value, 1_000_000));
}

function safeMinorUnits(value: number | null | undefined): number | null {
  if (!Number.isSafeInteger(value) || (value as number) < 0) return null;
  return Math.min(value as number, 100_000_000);
}

function optionalReference(kind: string, value: string | null | undefined): string | null {
  return typeof value !== "string" || value.trim() === ""
    ? null : safeReference(kind, value);
}

function safeReference(kind: string, value: string): string {
  if (new RegExp(`^${kind}_reference_[a-f0-9]{20}$`).test(value)) return value;
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `${kind}_reference_${digest.slice(0, 20)}`;
}

function safeExistingEventId(
  value: unknown,
  eventType: FeeMeteringLedgerEventType,
): string | null {
  if (typeof value !== "string") return null;
  const expected = `fee_metering_placeholder_${eventType}_`;
  return value.startsWith(expected)
    && new RegExp(`^${expected}[a-f0-9]{20}$`).test(value) ? value : null;
}

function safeEnum(
  value: string | null | undefined,
  allowed: ReadonlySet<string>,
  fallback: string,
): string {
  const token = safeToken(value ?? "");
  return allowed.has(token) ? token : fallback;
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}

function roundAmount(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function emptyEventTypeCounts(): Record<FeeMeteringLedgerEventType, number> {
  return {
    clearing_check_placeholder: 0,
    refusalgraph_lookup_placeholder: 0,
    receipt_creation_placeholder: 0,
    receipt_verification_placeholder: 0,
    batch_clearing_placeholder: 0,
    approval_gate_placeholder: 0,
    blocked_action_placeholder: 0,
    unknown_fee_placeholder: 0,
  };
}

function emptyFeeStatusCounts(): Record<PlaceholderFeeStatus, number> {
  return {
    placeholder_only: 0,
    not_billable: 0,
    billable_if_live: 0,
    blocked: 0,
    unknown: 0,
  };
}
