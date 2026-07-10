import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
} from "node:crypto";

import type { LocalEndToEndMoneyGateProofResult } from "./local-end-to-end-money-gate-proof.js";
import type { LocalGatePassAuditReceipt } from "./local-gate-pass-receipt.js";

export const LOCAL_SIGNED_PROOF_SCHEMA_VERSION = "atg.local-signed-proof.v1" as const;
export const LOCAL_SIGNED_PROOF_ALGORITHM = "ed25519-local-demo" as const;
export const LOCAL_DEMO_SIGNING_KEY_ID = "local-demo-ed25519-p3-m117" as const;

const LOCAL_DEMO_PRIVATE_KEY_PEM = [
  "-----BEGIN PRIVATE KEY-----",
  "MC4CAQAwBQYDK2VwBCIEIAMeqRF20csSxPNEKTha2yHAmX+N+Ceb16ry2BkwL/op",
  "-----END PRIVATE KEY-----",
  "",
].join("\n");

const LOCAL_DEMO_PUBLIC_KEY_PEM = [
  "-----BEGIN PUBLIC KEY-----",
  "MCowBQYDK2VwAyEAtPo88xjbno/utAGGwrL4AXvDeK7IjBwwV4ztiuahGnE=",
  "-----END PUBLIC KEY-----",
  "",
].join("\n");

export type LocalSignedPayloadType = "local_trust_receipt" | "local_money_gate_proof";

export interface LocalDemoSigningKeyPair {
  keyId: typeof LOCAL_DEMO_SIGNING_KEY_ID;
  algorithm: typeof LOCAL_SIGNED_PROOF_ALGORITHM;
  publicKeyPem: string;
  privateKeyPem: string;
  localDemoOnly: true;
  productionSigning: false;
  note: "Local demo key material only; non-secret, not for production signing or payment/settlement authorisation.";
}

export interface LocalSignedProofMetadata {
  signatureSchemaVersion: typeof LOCAL_SIGNED_PROOF_SCHEMA_VERSION;
  algorithm: typeof LOCAL_SIGNED_PROOF_ALGORITHM;
  keyId: string;
  issuerReference: string;
  verifierReference: string;
  signedAt: string;
  payloadHash: string;
  signature: string;
  localDemoOnly: true;
  productionSigning: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
}

export interface LocalSignedProofEnvelope<TPayload> {
  signedPayloadType: LocalSignedPayloadType;
  payload: TPayload;
  signatureMetadata: LocalSignedProofMetadata;
}

export type LocalSignedTrustReceipt = LocalSignedProofEnvelope<LocalGatePassAuditReceipt>;
export type LocalSignedMoneyGateProof = LocalSignedProofEnvelope<LocalEndToEndMoneyGateProofResult>;

export type LocalSignedProofVerificationReason =
  | "signature_valid"
  | "missing_signed_proof"
  | "malformed_signed_proof"
  | "payload_type_mismatch"
  | "missing_signature_metadata"
  | "malformed_signature_metadata"
  | "unsupported_signature_schema"
  | "unsupported_algorithm"
  | "unsupported_key"
  | "payload_hash_mismatch"
  | "signature_invalid"
  | "local_demo_only_required"
  | "production_signing_not_allowed"
  | "payment_authorisation_not_allowed"
  | "settlement_authorisation_not_allowed";

export interface LocalSignedProofVerificationDecision {
  verified: boolean;
  structurallyValid: boolean;
  payloadHashMatches: boolean;
  signatureValid: boolean;
  signedPayloadType: string;
  algorithm: string;
  keyId: string;
  payloadHash: string;
  recomputedPayloadHash: string;
  localDemoOnly: boolean;
  productionSigning: boolean;
  paymentAuthorisation: boolean;
  settlementAuthorisation: boolean;
  reasonCodes: LocalSignedProofVerificationReason[];
  checkedAt: string;
  note: "Local demo signature verification only; not production signing, payment authorisation, settlement authorisation, legal proof, or action execution.";
}

export interface LocalSignProofOptions {
  keyPair?: LocalDemoSigningKeyPair;
  issuerReference?: string;
  verifierReference?: string;
  signedAt?: string;
}

export interface LocalVerifySignedProofOptions {
  keyPair?: LocalDemoSigningKeyPair;
  expectedPayloadType?: LocalSignedPayloadType;
  checkedAt?: string;
}

const NOTE = "Local demo signature verification only; not production signing, payment authorisation, settlement authorisation, legal proof, or action execution." as const;
const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const SIGNATURE_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function createCanonicalPayload(input: unknown): string {
  return JSON.stringify(toCanonicalValue(input));
}

export function createLocalDemoKeyPair(): LocalDemoSigningKeyPair {
  return {
    keyId: LOCAL_DEMO_SIGNING_KEY_ID,
    algorithm: LOCAL_SIGNED_PROOF_ALGORITHM,
    publicKeyPem: LOCAL_DEMO_PUBLIC_KEY_PEM,
    privateKeyPem: LOCAL_DEMO_PRIVATE_KEY_PEM,
    localDemoOnly: true,
    productionSigning: false,
    note: "Local demo key material only; non-secret, not for production signing or payment/settlement authorisation.",
  };
}

export function signLocalTrustReceipt(
  receipt: LocalGatePassAuditReceipt,
  options: LocalSignProofOptions = {},
): LocalSignedTrustReceipt {
  return signLocalPayload("local_trust_receipt", receipt, options);
}

export function verifyLocalTrustReceiptSignature(
  signedReceipt: unknown,
  options: LocalVerifySignedProofOptions = {},
): LocalSignedProofVerificationDecision {
  return verifyLocalSignedProof(signedReceipt, {
    ...options,
    expectedPayloadType: "local_trust_receipt",
  });
}

export function signLocalMoneyGateProof(
  proof: LocalEndToEndMoneyGateProofResult,
  options: LocalSignProofOptions = {},
): LocalSignedMoneyGateProof {
  return signLocalPayload("local_money_gate_proof", proof, options);
}

export function verifyLocalMoneyGateProofSignature(
  signedProof: unknown,
  options: LocalVerifySignedProofOptions = {},
): LocalSignedProofVerificationDecision {
  return verifyLocalSignedProof(signedProof, {
    ...options,
    expectedPayloadType: "local_money_gate_proof",
  });
}

export function verifyLocalSignedProof(
  signedProof: unknown,
  options: LocalVerifySignedProofOptions = {},
): LocalSignedProofVerificationDecision {
  if (signedProof === null || signedProof === undefined) {
    return failedDecision(["missing_signed_proof"], options);
  }
  if (!isRecord(signedProof) || !Object.hasOwn(signedProof, "payload")) {
    return failedDecision(["malformed_signed_proof"], options);
  }

  const metadata = signedProof.signatureMetadata;
  if (!isRecord(metadata)) {
    return failedDecision(["missing_signature_metadata"], options, signedProof);
  }

  const payloadType = typeof signedProof.signedPayloadType === "string"
    ? signedProof.signedPayloadType
    : "unknown";
  const canonicalPayload = createCanonicalPayload(signedProof.payload);
  const recomputedPayloadHash = createPayloadHash(canonicalPayload);
  const metadataHash = typeof metadata.payloadHash === "string" ? metadata.payloadHash : "";
  const payloadHashMatches = metadataHash === recomputedPayloadHash;

  const reasons: LocalSignedProofVerificationReason[] = [];
  if (metadata.signatureSchemaVersion !== LOCAL_SIGNED_PROOF_SCHEMA_VERSION) {
    reasons.push("unsupported_signature_schema");
  }
  if (metadata.algorithm !== LOCAL_SIGNED_PROOF_ALGORITHM) {
    reasons.push("unsupported_algorithm");
  }
  const keyPair = options.keyPair ?? createLocalDemoKeyPair();
  if (metadata.keyId !== keyPair.keyId) reasons.push("unsupported_key");
  if (options.expectedPayloadType !== undefined && payloadType !== options.expectedPayloadType) {
    reasons.push("payload_type_mismatch");
  }
  if (metadata.localDemoOnly !== true) reasons.push("local_demo_only_required");
  if (metadata.productionSigning !== false) reasons.push("production_signing_not_allowed");
  if (metadata.paymentAuthorisation !== false) reasons.push("payment_authorisation_not_allowed");
  if (metadata.settlementAuthorisation !== false) reasons.push("settlement_authorisation_not_allowed");
  if (!hasRequiredMetadata(metadata)) reasons.push("malformed_signature_metadata");
  if (!payloadHashMatches) reasons.push("payload_hash_mismatch");

  const signatureValid = verifySignature(
    canonicalPayload,
    typeof metadata.signature === "string" ? metadata.signature : "",
    keyPair.publicKeyPem,
  );
  if (!signatureValid) reasons.push("signature_invalid");

  const structurallyValid = reasons.every((reason) =>
    reason !== "malformed_signature_metadata"
      && reason !== "missing_signature_metadata"
      && reason !== "malformed_signed_proof"
      && reason !== "missing_signed_proof"
  );
  const verified = reasons.length === 0 && payloadHashMatches && signatureValid;

  return {
    verified,
    structurallyValid,
    payloadHashMatches,
    signatureValid,
    signedPayloadType: payloadType,
    algorithm: text(metadata.algorithm),
    keyId: text(metadata.keyId),
    payloadHash: metadataHash,
    recomputedPayloadHash,
    localDemoOnly: metadata.localDemoOnly === true,
    productionSigning: metadata.productionSigning === true,
    paymentAuthorisation: metadata.paymentAuthorisation === true,
    settlementAuthorisation: metadata.settlementAuthorisation === true,
    reasonCodes: verified ? ["signature_valid"] : unique(reasons),
    checkedAt: safeTimestamp(options.checkedAt ?? metadata.signedAt),
    note: NOTE,
  };
}

function signLocalPayload<TPayload>(
  signedPayloadType: LocalSignedPayloadType,
  payload: TPayload,
  options: LocalSignProofOptions,
): LocalSignedProofEnvelope<TPayload> {
  const keyPair = options.keyPair ?? createLocalDemoKeyPair();
  const canonicalPayload = createCanonicalPayload(payload);
  const signedAt = safeTimestamp(options.signedAt ?? inferSignedAt(payload));
  const issuerReference = safeReference(
    options.issuerReference ?? readReference(payload, "issuer_ref") ?? "local_demo_issuer",
    "local_demo_issuer",
  );
  const verifierReference = safeReference(
    options.verifierReference ?? readReference(payload, "verifier_ref") ?? "local_demo_verifier",
    "local_demo_verifier",
  );
  const privateKey = createPrivateKey(keyPair.privateKeyPem);
  const signature = cryptoSign(null, Buffer.from(canonicalPayload, "utf8"), privateKey).toString("base64");
  return {
    signedPayloadType,
    payload: structuredClone(payload) as TPayload,
    signatureMetadata: {
      signatureSchemaVersion: LOCAL_SIGNED_PROOF_SCHEMA_VERSION,
      algorithm: LOCAL_SIGNED_PROOF_ALGORITHM,
      keyId: keyPair.keyId,
      issuerReference,
      verifierReference,
      signedAt,
      payloadHash: createPayloadHash(canonicalPayload),
      signature,
      localDemoOnly: true,
      productionSigning: false,
      paymentAuthorisation: false,
      settlementAuthorisation: false,
    },
  };
}

function createPayloadHash(canonicalPayload: string): string {
  return `sha256:${createHash("sha256").update(canonicalPayload, "utf8").digest("hex")}`;
}

function verifySignature(canonicalPayload: string, signature: string, publicKeyPem: string): boolean {
  if (!SIGNATURE_BASE64.test(signature)) return false;
  try {
    const publicKey = createPublicKey(publicKeyPem);
    return cryptoVerify(
      null,
      Buffer.from(canonicalPayload, "utf8"),
      publicKey,
      Buffer.from(signature, "base64"),
    );
  } catch {
    return false;
  }
}

function hasRequiredMetadata(value: Record<string, unknown>): boolean {
  return value.signatureSchemaVersion === LOCAL_SIGNED_PROOF_SCHEMA_VERSION
    && value.algorithm === LOCAL_SIGNED_PROOF_ALGORITHM
    && typeof value.keyId === "string"
    && value.keyId.trim() !== ""
    && typeof value.issuerReference === "string"
    && value.issuerReference.trim() !== ""
    && typeof value.verifierReference === "string"
    && value.verifierReference.trim() !== ""
    && typeof value.signedAt === "string"
    && !Number.isNaN(Date.parse(value.signedAt))
    && typeof value.payloadHash === "string"
    && /^sha256:[a-f0-9]{64}$/.test(value.payloadHash)
    && typeof value.signature === "string"
    && SIGNATURE_BASE64.test(value.signature)
    && value.localDemoOnly === true
    && value.productionSigning === false
    && value.paymentAuthorisation === false
    && value.settlementAuthorisation === false;
}

function failedDecision(
  reasons: LocalSignedProofVerificationReason[],
  options: LocalVerifySignedProofOptions,
  signedProof?: unknown,
): LocalSignedProofVerificationDecision {
  const metadata = isRecord(signedProof) && isRecord(signedProof.signatureMetadata)
    ? signedProof.signatureMetadata
    : {};
  return {
    verified: false,
    structurallyValid: false,
    payloadHashMatches: false,
    signatureValid: false,
    signedPayloadType: isRecord(signedProof) ? text(signedProof.signedPayloadType) : "unknown",
    algorithm: text(metadata.algorithm),
    keyId: text(metadata.keyId),
    payloadHash: text(metadata.payloadHash),
    recomputedPayloadHash: "",
    localDemoOnly: metadata.localDemoOnly === true,
    productionSigning: metadata.productionSigning === true,
    paymentAuthorisation: metadata.paymentAuthorisation === true,
    settlementAuthorisation: metadata.settlementAuthorisation === true,
    reasonCodes: unique(reasons),
    checkedAt: safeTimestamp(options.checkedAt ?? metadata.signedAt),
    note: NOTE,
  };
}

function toCanonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toCanonicalValue);
  if (!isRecord(value)) return value;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const item = value[key];
    if (item !== undefined) output[key] = toCanonicalValue(item);
  }
  return output;
}

function inferSignedAt(value: unknown): string {
  if (!isRecord(value)) return FALLBACK_TIMESTAMP;
  if (typeof value.checked_at === "string") return value.checked_at;
  const proof = value.proof_metadata;
  if (isRecord(proof) && typeof proof.created_at === "string") return proof.created_at;
  return FALLBACK_TIMESTAMP;
}

function readReference(value: unknown, field: "issuer_ref" | "verifier_ref"): string | undefined {
  if (!isRecord(value)) return undefined;
  const direct = value[field];
  if (typeof direct === "string" && direct.trim() !== "") return direct;
  const proof = value.proof_metadata;
  if (!isRecord(proof)) return undefined;
  const proofField = field === "issuer_ref" ? "issuer_ref" : "verifier_ref";
  const nested = proof[proofField];
  return typeof nested === "string" && nested.trim() !== "" ? nested : undefined;
}

function safeReference(value: string, fallback: string): string {
  const output = value.trim().replace(/[^A-Za-z0-9_.:-]+/g, "_").slice(0, 96);
  return output || fallback;
}

function safeTimestamp(value: unknown): string {
  if (typeof value !== "string") return FALLBACK_TIMESTAMP;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? FALLBACK_TIMESTAMP : parsed.toISOString();
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
