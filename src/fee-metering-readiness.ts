import { createHash } from "node:crypto";

export const FEE_METERING_READINESS_VERSION = "atg.fee-metering-readiness.v1" as const;

export type FeeMeteringSourceEventType =
  | "refusal_signal_created"
  | "refusal_lookup_requested"
  | "refusal_lookup_completed"
  | "clearing_decision_created"
  | "clearing_receipt_created"
  | "receipt_verification_requested"
  | "receipt_verification_completed"
  | "agent_treaty_created"
  | "agent_handshake_requested"
  | "advantage_review_completed"
  | "unknown";

export type FeeMeteringCategory =
  | "refusal_signal_event"
  | "refusal_lookup_event"
  | "clearing_decision_event"
  | "clearing_receipt_event"
  | "receipt_verification_event"
  | "agent_treaty_event"
  | "agent_handshake_event"
  | "strategic_review_event"
  | "unknown_or_unmetered";

export interface FeeMeteringInput {
  [key: string]: unknown;
  source_event_id: string;
  source_event_type: string;
  source_receipt_id: string | null;
  source_verification_id: string | null;
  source_clearing_decision_id: string | null;
  source_refusal_signal_id: string | null;
  source_lookup_id: string | null;
  actor_type: string;
  requested_metering_category: string;
  possible_fee_model: string;
  possible_fee_amount: number | string | null;
  possible_fee_currency: string | null;
  timestamp: string;
}

export interface FeeMeteringEvent {
  metering_event_id: string;
  source_event_id: string;
  source_event_type: FeeMeteringSourceEventType;
  metering_category: FeeMeteringCategory;
  fee_readiness_status: "placeholder_only" | "not_enabled";
  possible_fee_model: "per_receipt_verification" | "per_refusal_lookup" | "per_clearing_event" | "not_configured";
  possible_fee_amount: "placeholder_only" | "not_configured";
  possible_fee_currency: "GBP" | "USD" | "EUR" | "not_configured";
  billable_event_recorded: false;
  billing_triggered: false;
  payment_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  external_metering_triggered: false;
  tracking_triggered: false;
  analytics_triggered: false;
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  action_executed: false;
  status: "draft_only";
  created_at: string;
}

const EVENT_CATEGORY_MAP: Readonly<Record<Exclude<FeeMeteringSourceEventType, "unknown">, FeeMeteringCategory>> = {
  refusal_signal_created: "refusal_signal_event",
  refusal_lookup_requested: "refusal_lookup_event",
  refusal_lookup_completed: "refusal_lookup_event",
  clearing_decision_created: "clearing_decision_event",
  clearing_receipt_created: "clearing_receipt_event",
  receipt_verification_requested: "receipt_verification_event",
  receipt_verification_completed: "receipt_verification_event",
  agent_treaty_created: "agent_treaty_event",
  agent_handshake_requested: "agent_handshake_event",
  advantage_review_completed: "strategic_review_event",
};

const FEE_MODELS = new Set([
  "per_receipt_verification", "per_refusal_lookup", "per_clearing_event",
]);

export function createFeeMeteringEvent(input: FeeMeteringInput): FeeMeteringEvent {
  const sourceEventType = normalizeSourceEventType(input.source_event_type);
  const category = feeMeteringCategoryForEvent(sourceEventType);
  const knownEvent = sourceEventType !== "unknown";
  const feeModel = safeFeeModel(input.possible_fee_model, knownEvent);
  const currency = safeCurrency(input.possible_fee_currency, knownEvent);

  return {
    metering_event_id: createFeeMeteringEventId(sourceEventType, input.source_event_id),
    source_event_id: pseudonymiseSourceEventId(input.source_event_id),
    source_event_type: sourceEventType,
    metering_category: category,
    fee_readiness_status: knownEvent ? "placeholder_only" : "not_enabled",
    possible_fee_model: feeModel,
    possible_fee_amount: knownEvent && feeModel !== "not_configured"
      ? "placeholder_only"
      : "not_configured",
    possible_fee_currency: currency,
    billable_event_recorded: false,
    billing_triggered: false,
    payment_triggered: false,
    settlement_triggered: false,
    machine_to_machine_fee_triggered: false,
    external_metering_triggered: false,
    tracking_triggered: false,
    analytics_triggered: false,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    action_executed: false,
    status: "draft_only",
    created_at: safeTimestamp(input.timestamp),
  };
}

export function createFeeMeteringEventId(eventType: string, sourceEventId: string): string {
  const type = normalizeSourceEventType(eventType);
  const digest = createHash("sha256")
    .update(`${type}:${sourceEventId}`, "utf8")
    .digest("hex")
    .slice(0, 20);
  return `fem_local_${type}_${digest}`;
}

export function feeMeteringCategoryForEvent(eventType: string): FeeMeteringCategory {
  const type = normalizeSourceEventType(eventType);
  return type === "unknown" ? "unknown_or_unmetered" : EVENT_CATEGORY_MAP[type];
}

function normalizeSourceEventType(value: string): FeeMeteringSourceEventType {
  const token = safeToken(value);
  return Object.hasOwn(EVENT_CATEGORY_MAP, token)
    ? token as Exclude<FeeMeteringSourceEventType, "unknown">
    : "unknown";
}

function safeFeeModel(value: string, knownEvent: boolean): FeeMeteringEvent["possible_fee_model"] {
  if (!knownEvent) return "not_configured";
  const token = safeToken(value);
  return FEE_MODELS.has(token)
    ? token as Exclude<FeeMeteringEvent["possible_fee_model"], "not_configured">
    : "not_configured";
}

function safeCurrency(value: string | null, knownEvent: boolean): FeeMeteringEvent["possible_fee_currency"] {
  if (!knownEvent || value === null) return "not_configured";
  const token = value.trim().toUpperCase();
  return token === "GBP" || token === "USD" || token === "EUR" ? token : "not_configured";
}

function pseudonymiseSourceEventId(value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `source_event_${digest.slice(0, 24)}`;
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
