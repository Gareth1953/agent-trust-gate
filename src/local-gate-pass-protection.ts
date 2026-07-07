import { createHash } from "node:crypto";

export const LOCAL_GATE_PASS_PROTECTION_VERSION = "local-gate-pass-protection-v1" as const;
export const LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS = 300 as const;

export interface LocalGatePassValidityMetadata {
  issued_at: string;
  valid_from: string;
  expires_at: string;
  ttl_seconds: number;
  maximum_ttl_seconds: typeof LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS;
}

export interface LocalGatePassReplayMetadata {
  replay_key: string;
  single_use: true;
  protection_mode: "local_in_memory_single_use";
}

export type LocalGatePassValidityStatus =
  | "valid"
  | "not_yet_valid"
  | "expired"
  | "invalid_metadata"
  | "not_applicable";

export type LocalGatePassReplayStatus =
  | "ready"
  | "consumed"
  | "replay_detected"
  | "invalid_metadata"
  | "not_checked";

export type LocalGatePassProtectionReason =
  | "gate_pass_valid"
  | "gate_pass_not_yet_valid"
  | "gate_pass_expired"
  | "gate_pass_validity_metadata_invalid"
  | "gate_pass_replay_metadata_invalid"
  | "gate_pass_replay_detected"
  | "evaluation_time_invalid";

export interface LocalGatePassProtectionReceipt {
  receipt_id: string;
  request_id: string;
  checked_at: string;
  receipt_type: string;
  verdict: string;
  gate_pass_validity: LocalGatePassValidityMetadata | null;
  replay_protection: LocalGatePassReplayMetadata | null;
}

export interface LocalGatePassProtectionDecision {
  protected: boolean;
  validity_status: LocalGatePassValidityStatus;
  replay_status: LocalGatePassReplayStatus;
  reason_codes: LocalGatePassProtectionReason[];
  evaluated_at: string;
  expires_at: string | null;
  replay_key: string | null;
  replay_store_size: number;
  mode: "local_in_memory_only";
  persistent_state_written: false;
  network_call_performed: false;
  action_executed: false;
  settlement_executed: false;
}

const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

/**
 * Process-local, non-persistent replay state. Create one store per simulated
 * settlement session and retain it for every attempt in that session.
 */
export class LocalGatePassReplayStore {
  readonly #consumed = new Set<string>();

  has(replayKey: string): boolean {
    return this.#consumed.has(replayKey);
  }

  consume(replayKey: string): boolean {
    if (this.#consumed.has(replayKey)) return false;
    this.#consumed.add(replayKey);
    return true;
  }

  get size(): number {
    return this.#consumed.size;
  }

  snapshot(): readonly string[] {
    return [...this.#consumed].sort();
  }
}

export function createLocalGatePassProtectionMetadata(
  receiptId: string,
  requestId: string,
  checkedAt: string,
  mandateExpiresAt?: string,
): {
  validity: LocalGatePassValidityMetadata;
  replay: LocalGatePassReplayMetadata;
} {
  const issued = parseTimestamp(checkedAt) ?? new Date(FALLBACK_TIMESTAMP);
  const maximumExpiry = issued.valueOf() + LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS * 1_000;
  const mandateExpiry = parseTimestamp(mandateExpiresAt)?.valueOf();
  const expiryMilliseconds = mandateExpiry === undefined
    ? maximumExpiry
    : Math.min(maximumExpiry, mandateExpiry);
  const safeExpiry = expiryMilliseconds > issued.valueOf()
    ? expiryMilliseconds
    : issued.valueOf() + 1;
  const ttlSeconds = (safeExpiry - issued.valueOf()) / 1_000;
  const issuedAt = issued.toISOString();

  return {
    validity: {
      issued_at: issuedAt,
      valid_from: issuedAt,
      expires_at: new Date(safeExpiry).toISOString(),
      ttl_seconds: ttlSeconds,
      maximum_ttl_seconds: LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS,
    },
    replay: {
      replay_key: createLocalGatePassReplayKey(receiptId, requestId, issuedAt),
      single_use: true,
      protection_mode: "local_in_memory_single_use",
    },
  };
}

export function createLocalGatePassReplayKey(
  receiptId: string,
  requestId: string,
  issuedAt: string,
): string {
  const digest = createHash("sha256")
    .update(`${receiptId}|${requestId}|${issuedAt}`, "utf8")
    .digest("hex");
  return `replay_demo_${digest.slice(0, 32)}`;
}

export function evaluateLocalGatePassProtection(
  receipt: unknown,
  evaluatedAt: string,
  replayStore?: LocalGatePassReplayStore,
  consume = true,
): LocalGatePassProtectionDecision {
  const evaluated = parseTimestamp(evaluatedAt);
  if (evaluated === undefined) {
    return blockedProtection("invalid_metadata", "not_checked", ["evaluation_time_invalid"], evaluatedAt, null, null, replayStore);
  }
  if (!isProtectionReceipt(receipt) || !validityMetadataIsValid(receipt)) {
    return blockedProtection("invalid_metadata", "not_checked", ["gate_pass_validity_metadata_invalid"], evaluated.toISOString(), null, null, replayStore);
  }

  const validity = receipt.gate_pass_validity;
  const replay = receipt.replay_protection;
  if (validity === null) {
    return blockedProtection("invalid_metadata", "not_checked", ["gate_pass_validity_metadata_invalid"], evaluated.toISOString(), null, null, replayStore);
  }
  if (!replayMetadataIsValid(receipt, replay)) {
    return blockedProtection("valid", "invalid_metadata", ["gate_pass_replay_metadata_invalid"], evaluated.toISOString(), validity.expires_at, null, replayStore);
  }

  if (evaluated.valueOf() < Date.parse(validity.valid_from)) {
    return blockedProtection("not_yet_valid", "not_checked", ["gate_pass_not_yet_valid"], evaluated.toISOString(), validity.expires_at, replay.replay_key, replayStore);
  }
  if (evaluated.valueOf() >= Date.parse(validity.expires_at)) {
    return blockedProtection("expired", "not_checked", ["gate_pass_expired"], evaluated.toISOString(), validity.expires_at, replay.replay_key, replayStore);
  }

  if (replayStore?.has(replay.replay_key) === true) {
    return blockedProtection("valid", "replay_detected", ["gate_pass_replay_detected"], evaluated.toISOString(), validity.expires_at, replay.replay_key, replayStore);
  }

  const consumed = consume && replayStore !== undefined
    ? replayStore.consume(replay.replay_key)
    : false;
  return {
    protected: true,
    validity_status: "valid",
    replay_status: consumed ? "consumed" : "ready",
    reason_codes: ["gate_pass_valid"],
    evaluated_at: evaluated.toISOString(),
    expires_at: validity.expires_at,
    replay_key: replay.replay_key,
    replay_store_size: replayStore?.size ?? 0,
    mode: "local_in_memory_only",
    persistent_state_written: false,
    network_call_performed: false,
    action_executed: false,
    settlement_executed: false,
  };
}

function validityMetadataIsValid(receipt: LocalGatePassProtectionReceipt): boolean {
  const value = receipt.gate_pass_validity;
  if (receipt.receipt_type !== "signed_gate_pass" || receipt.verdict !== "allow_signed_gate_pass" || value === null) return false;
  const checked = parseTimestamp(receipt.checked_at);
  const issued = parseTimestamp(value.issued_at);
  const validFrom = parseTimestamp(value.valid_from);
  const expires = parseTimestamp(value.expires_at);
  if (checked === undefined || issued === undefined || validFrom === undefined || expires === undefined) return false;
  const duration = expires.valueOf() - issued.valueOf();
  return checked.valueOf() === issued.valueOf()
    && validFrom.valueOf() === issued.valueOf()
    && expires.valueOf() > issued.valueOf()
    && duration <= LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS * 1_000
    && Number.isFinite(value.ttl_seconds)
    && value.ttl_seconds === duration / 1_000
    && value.ttl_seconds > 0
    && value.maximum_ttl_seconds === LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS;
}

function replayMetadataIsValid(
  receipt: LocalGatePassProtectionReceipt,
  value: LocalGatePassReplayMetadata | null,
): value is LocalGatePassReplayMetadata {
  if (value === null || receipt.gate_pass_validity === null) return false;
  return value.single_use === true
    && value.protection_mode === "local_in_memory_single_use"
    && value.replay_key === createLocalGatePassReplayKey(
      receipt.receipt_id,
      receipt.request_id,
      receipt.gate_pass_validity.issued_at,
    );
}

function isProtectionReceipt(value: unknown): value is LocalGatePassProtectionReceipt {
  if (!isRecord(value)) return false;
  return typeof value.receipt_id === "string"
    && typeof value.request_id === "string"
    && typeof value.checked_at === "string"
    && typeof value.receipt_type === "string"
    && typeof value.verdict === "string"
    && (value.gate_pass_validity === null || isValidityMetadata(value.gate_pass_validity))
    && (value.replay_protection === null || isReplayMetadata(value.replay_protection));
}

function isValidityMetadata(value: unknown): value is LocalGatePassValidityMetadata {
  return isRecord(value)
    && typeof value.issued_at === "string"
    && typeof value.valid_from === "string"
    && typeof value.expires_at === "string"
    && typeof value.ttl_seconds === "number"
    && typeof value.maximum_ttl_seconds === "number";
}

function isReplayMetadata(value: unknown): value is LocalGatePassReplayMetadata {
  return isRecord(value)
    && typeof value.replay_key === "string"
    && value.single_use === true
    && value.protection_mode === "local_in_memory_single_use";
}

function blockedProtection(
  validityStatus: LocalGatePassValidityStatus,
  replayStatus: LocalGatePassReplayStatus,
  reasons: LocalGatePassProtectionReason[],
  evaluatedAt: string,
  expiresAt: string | null,
  replayKey: string | null,
  replayStore?: LocalGatePassReplayStore,
): LocalGatePassProtectionDecision {
  return {
    protected: false,
    validity_status: validityStatus,
    replay_status: replayStatus,
    reason_codes: reasons,
    evaluated_at: parseTimestamp(evaluatedAt)?.toISOString() ?? FALLBACK_TIMESTAMP,
    expires_at: expiresAt,
    replay_key: replayKey,
    replay_store_size: replayStore?.size ?? 0,
    mode: "local_in_memory_only",
    persistent_state_written: false,
    network_call_performed: false,
    action_executed: false,
    settlement_executed: false,
  };
}

function parseTimestamp(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
