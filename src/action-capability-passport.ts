import { createCanonicalPayloadHash } from "./local-signed-proof.js";

export const ACTION_CAPABILITY_PASSPORT_SCHEMA_VERSION =
  "atg.action-capability-passport.local.v1" as const;
export const ACTION_CAPABILITY_PASSPORT_REFERENCE_TIME =
  "2026-09-02T09:00:00.000Z" as const;
export const MCP_EXACT_ACTION_SERVER_IDENTITY =
  "io.github.gareth1953.agent-trust-gate.local-stdio" as const;
export const MCP_EXACT_ACTION_TOOL_NAME = "atg.evaluate_action" as const;
export const MCP_EXACT_ACTION_OPERATION = "evaluate_exact_action" as const;
export const MCP_EXACT_ACTION_INPUT_SCHEMA_IDENTITY =
  "atg.mcp-exact-action-request.local" as const;
export const MCP_EXACT_ACTION_INPUT_SCHEMA_VERSION = "1.0.0" as const;

export type ActionCapabilityPassportStatus = "active" | "revoked";
export type ActionCapabilityPassportRisk = "low" | "medium" | "high";
export type ActionCapabilityPassportReversibility =
  "not_applicable_evaluation_only" | "reversible" | "irreversible";

export interface ActionCapabilityPassport {
  passportSchemaVersion: typeof ACTION_CAPABILITY_PASSPORT_SCHEMA_VERSION;
  passportId: string;
  passportVersion: string;
  mcpServerIdentity: string;
  toolIdentity: string;
  operation: string;
  inputSchema: {
    identity: string;
    version: string;
    digest: string;
  };
  permittedActionType: string;
  permittedEnvironment: string;
  permittedAdapterClass: "evaluation_only_non_executable";
  riskClassification: ActionCapabilityPassportRisk;
  reversibilityClassification: ActionCapabilityPassportReversibility;
  evidenceRequirements: readonly string[];
  effectiveAt: string;
  expiresAt: string | null;
  status: ActionCapabilityPassportStatus;
  revocationReference: string | null;
  localOnly: true;
  executionAvailable: false;
  passportDigest: string;
}

export interface ActionCapabilityPassportReference {
  passportId: string;
  passportVersion: string;
  passportDigest: string;
}

export type PassportResolutionReasonCode =
  | "PASSPORT_VERIFIED"
  | "PASSPORT_UNKNOWN"
  | "PASSPORT_VERSION_MISMATCH"
  | "PASSPORT_DIGEST_MISMATCH"
  | "PASSPORT_INTEGRITY_INVALID"
  | "PASSPORT_NOT_YET_EFFECTIVE"
  | "PASSPORT_EXPIRED"
  | "PASSPORT_REVOKED";

export interface ActionCapabilityPassportResolution {
  verified: boolean;
  reasonCode: PassportResolutionReasonCode;
  passport: ActionCapabilityPassport | null;
}

export function computeActionCapabilityPassportDigest(
  passport: Omit<ActionCapabilityPassport, "passportDigest">,
): string {
  return createCanonicalPayloadHash(passport);
}

export function createActionCapabilityPassport(
  input: Omit<ActionCapabilityPassport, "passportDigest">,
): ActionCapabilityPassport {
  return {
    ...structuredClone(input),
    passportDigest: computeActionCapabilityPassportDigest(input),
  };
}

export function verifyActionCapabilityPassportIntegrity(
  passport: ActionCapabilityPassport,
): boolean {
  const { passportDigest, ...unsigned } = passport;
  return passportDigest === computeActionCapabilityPassportDigest(unsigned);
}

export class ActionCapabilityPassportRegistry {
  readonly #passports = new Map<string, ActionCapabilityPassport>();

  constructor(passports: readonly ActionCapabilityPassport[]) {
    for (const passport of passports) {
      this.#passports.set(passport.passportId, structuredClone(passport));
    }
  }

  list(): ActionCapabilityPassport[] {
    return [...this.#passports.values()].map((passport) => structuredClone(passport));
  }

  resolve(
    reference: ActionCapabilityPassportReference,
    evaluatedAt: string = ACTION_CAPABILITY_PASSPORT_REFERENCE_TIME,
  ): ActionCapabilityPassportResolution {
    const passport = this.#passports.get(reference.passportId);
    if (passport === undefined) {
      return { verified: false, reasonCode: "PASSPORT_UNKNOWN", passport: null };
    }
    if (reference.passportVersion !== passport.passportVersion) {
      return { verified: false, reasonCode: "PASSPORT_VERSION_MISMATCH", passport: null };
    }
    if (reference.passportDigest !== passport.passportDigest) {
      return { verified: false, reasonCode: "PASSPORT_DIGEST_MISMATCH", passport: null };
    }
    if (!verifyActionCapabilityPassportIntegrity(passport)) {
      return { verified: false, reasonCode: "PASSPORT_INTEGRITY_INVALID", passport: null };
    }
    const effectiveAt = Date.parse(passport.effectiveAt);
    const expiresAt = passport.expiresAt === null ? null : Date.parse(passport.expiresAt);
    if (!Number.isFinite(effectiveAt)
      || (expiresAt !== null && !Number.isFinite(expiresAt))
      || (passport.status === "active" && passport.revocationReference !== null)
      || (passport.status === "revoked"
        && (passport.revocationReference === null || passport.revocationReference.trim() === ""))) {
      return { verified: false, reasonCode: "PASSPORT_INTEGRITY_INVALID", passport: null };
    }
    const at = Date.parse(evaluatedAt);
    if (!Number.isFinite(at) || at < effectiveAt) {
      return { verified: false, reasonCode: "PASSPORT_NOT_YET_EFFECTIVE", passport: null };
    }
    if (expiresAt !== null && at >= expiresAt) {
      return { verified: false, reasonCode: "PASSPORT_EXPIRED", passport: null };
    }
    if (passport.status === "revoked") {
      return { verified: false, reasonCode: "PASSPORT_REVOKED", passport: null };
    }
    return {
      verified: true,
      reasonCode: "PASSPORT_VERIFIED",
      passport: structuredClone(passport),
    };
  }
}
