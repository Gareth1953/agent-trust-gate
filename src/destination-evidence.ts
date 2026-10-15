import { createPublicKey, verify } from "node:crypto";
import { createCanonicalPayloadHash as hash } from "./local-signed-proof.js";
import { signedStateAuthorityMatches } from "./purchase-order-connector.js";
import type { PurchaseOrderStateBinding } from "./purchase-order-state-binding.js";
import type { McpBusinessPolicyRequest } from "./mcp-exact-action-gateway.js";
import { canonicalizeJson, type ExactActionGatePass, type PolicyDecisionReceipt } from "./exact-action-gatepass.js";

export const DESTINATION_EVIDENCE_SCHEMA = "atg.destination-evidence.synthetic.v1" as const;
export const DESTINATION_CLOCK_ID = "mission-03-fixed-test-clock" as const;
export interface DestinationTrust {
  destinationIdentity: string;
  destinationKeyId: string;
  destinationPublicKeyPem: string;
  approvalIssuerIdentity: string;
  approvalKeyId: string;
  approvalPublicKeyPem: string;
  clockId: typeof DESTINATION_CLOCK_ID;
  maximumAgeMs: number;
}
/** Approval authority stays distinct from the destination's outcome signature. */
export interface DestinationApproval {
  approvalId: string;
  request: McpBusinessPolicyRequest;
  binding: PurchaseOrderStateBinding;
  gatePass: ExactActionGatePass;
  decisionReceipt: PolicyDecisionReceipt;
}
export interface DestinationLookup {
  requestId: string;
  challenge: string;
  requestedAt: string;
  clockId: typeof DESTINATION_CLOCK_ID;
  fenceId: string | null;
}
export interface DestinationEvidencePayload {
  schema: typeof DESTINATION_EVIDENCE_SCHEMA;
  destinationIdentity: string;
  approvalId: string;
  gatePassId: string;
  actionDigest: string;
  approvedRequestDigest: string;
  approvedBusinessStateDigest: string;
  approvedBusinessState: PurchaseOrderStateBinding["businessState"];
  idempotencyId: string;
  transactionId: string | null;
  outcome: "EXECUTED" | "ABSENT";
  resultingRecordVersion: number | null;
  recordDigest: string | null;
  lookup: DestinationLookup;
  observedAt: string;
  clockId: typeof DESTINATION_CLOCK_ID;
  authoritativeLookup: true;
  destinationSequence: number;
  fence: { fenceId: string; gatePassId: string; idempotencyId: string; completed: true; sequence: number } | null;
  syntheticOnly: true;
  sameHost: true;
}
export interface DestinationEvidence {
  schema: typeof DESTINATION_EVIDENCE_SCHEMA;
  algorithm: "Ed25519";
  keyId: string;
  payload: DestinationEvidencePayload;
  signature: string;
}
const uuid = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(v);
const timestamp = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const exactKeys = (v: object, keys: string[]) => {
  const actual=Object.keys(v).sort(),expected=[...keys].sort();
  return actual.length===expected.length && actual.every((key,index)=>key===expected[index]);
};
/** Strict JSON boundary before either signing or comparing inherited hashes.
 * The legacy serializer assigns keys into ordinary objects: an own __proto__
 * property would disappear from signed bytes. Refuse it, accessors, hidden
 * properties and non-JSON shapes without touching published legacy modules.
 */
export function canonicalDestinationEvidence(value: unknown): string {
  const active=new Set<object>();
  const inspect=(v:unknown):void=>{
    if(v===null || typeof v==='string' || typeof v==='boolean')return;
    if(typeof v==='number' && Number.isFinite(v))return;
    if(typeof v!=='object' || active.has(v))throw new Error('CANONICAL_EVIDENCE_JSON_INVALID');
    const array=Array.isArray(v),prototype=Object.getPrototypeOf(v);
    if(!array && prototype!==Object.prototype && prototype!==null)throw new Error('CANONICAL_EVIDENCE_JSON_INVALID');
    active.add(v);
    try {
      for(const key of Reflect.ownKeys(v)) {
        if(array && key==='length')continue;
        const descriptor=Object.getOwnPropertyDescriptor(v,key)!;
        if(typeof key!=='string' || key==='__proto__' || !descriptor.enumerable || descriptor.get || descriptor.set
          || (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key)>=(v as unknown[]).length)))throw new Error('CANONICAL_EVIDENCE_JSON_INVALID');
        inspect(descriptor.value);
      }
    } finally {active.delete(v);}
  };
  inspect(value);
  return canonicalizeJson(value); // rejects sparse arrays; same bytes for valid v1 JSON
}
export function validateDestinationTrust(t: DestinationTrust): void {
  canonicalDestinationEvidence(t);
  if (!t || !exactKeys(t, ["destinationIdentity", "destinationKeyId", "destinationPublicKeyPem", "approvalIssuerIdentity", "approvalKeyId", "approvalPublicKeyPem", "clockId", "maximumAgeMs"])
    || t.clockId !== DESTINATION_CLOCK_ID || !Number.isSafeInteger(t.maximumAgeMs) || t.maximumAgeMs < 0 || t.maximumAgeMs > 60_000
    || ![t.destinationIdentity, t.destinationKeyId, t.approvalIssuerIdentity, t.approvalKeyId].every(x => typeof x === "string" && x.length > 0 && x.length <= 240)) throw new Error("DESTINATION_TRUST_INVALID");
  for (const key of [t.destinationPublicKeyPem, t.approvalPublicKeyPem]) {
    if (typeof key !== "string" || !key.startsWith("-----BEGIN PUBLIC KEY-----") || createPublicKey(key).asymmetricKeyType !== "ed25519") throw new Error("TRUSTED_PUBLIC_KEY_REQUIRED");
  }
  if (createPublicKey(t.destinationPublicKeyPem).export({ type: "spki", format: "der" }).equals(createPublicKey(t.approvalPublicKeyPem).export({ type: "spki", format: "der" }))) throw new Error("DISTINCT_SIGNING_ROLES_REQUIRED");
}
export function verifyDestinationApproval(a: DestinationApproval, trust: DestinationTrust): boolean {
  try {
    validateDestinationTrust(trust);
    canonicalDestinationEvidence(a);
    if (a.approvalId !== a.gatePass.gatePassId || a.binding.destination !== trust.destinationIdentity || a.gatePass.action.issuerIdentity !== trust.approvalIssuerIdentity
      || a.gatePass.action.issuerKeyId !== trust.approvalKeyId || a.gatePass.signature.keyId !== trust.approvalKeyId
      || !signedStateAuthorityMatches(a.gatePass, a.decisionReceipt, a.request, a.binding)) return false;
    const { signature: _signature, ...unsigned } = a.gatePass;
    return verify(null, Buffer.from(canonicalizeJson(unsigned)), createPublicKey(trust.approvalPublicKeyPem), Buffer.from(a.gatePass.signature.signature, "base64"));
  } catch { return false; }
}
export function validateDestinationLookup(q: DestinationLookup): void {
  canonicalDestinationEvidence(q);
  if (!q || !exactKeys(q, ["requestId", "challenge", "requestedAt", "clockId", "fenceId"]) || !uuid(q.requestId) || !uuid(q.challenge)
    || !timestamp(q.requestedAt) || q.clockId !== DESTINATION_CLOCK_ID || (q.fenceId !== null && !uuid(q.fenceId))) throw new Error("LOOKUP_INVALID");
}
export function destinationRecordDigest(a: DestinationApproval, transactionId: string, resultingRecordVersion: number): string {
  return hash({ approvalId: a.approvalId, gatePassId: a.gatePass.gatePassId, actionDigest: a.gatePass.action.actionDigest,
    approvedRequestDigest: hash(a.request), binding: a.binding, idempotencyId: a.gatePass.action.nonce, transactionId, resultingRecordVersion });
}
/** Pure public-key verifier: no authority database, private key, network, or writable state. */
export function verifyDestinationEvidence(input: unknown, a: DestinationApproval, trust: DestinationTrust, expected: DestinationLookup, now: string): { verified: boolean; outcome: "EXECUTED" | "ABSENT" | "UNKNOWN"; reason: string } {
  try {
    validateDestinationTrust(trust); validateDestinationLookup(expected);
    canonicalDestinationEvidence(input);
    if (!verifyDestinationApproval(a, trust)) throw new Error("APPROVAL_INVALID");
    const e = input as DestinationEvidence;
    if (!e || !exactKeys(e, ["schema", "algorithm", "keyId", "payload", "signature"]) || e.schema !== DESTINATION_EVIDENCE_SCHEMA
      || e.algorithm !== "Ed25519" || e.keyId !== trust.destinationKeyId || typeof e.signature !== "string" || !/^[A-Za-z0-9+/]{86}==$/.test(e.signature)) throw new Error("ENVELOPE_INVALID");
    const { signature: _signature, ...unsigned } = e;
    if (!verify(null, Buffer.from(canonicalDestinationEvidence(unsigned)), createPublicKey(trust.destinationPublicKeyPem), Buffer.from(e.signature, "base64"))) throw new Error("DESTINATION_SIGNATURE_INVALID");
    const p = e.payload;
    if (!p || !exactKeys(p, ["schema", "destinationIdentity", "approvalId", "gatePassId", "actionDigest", "approvedRequestDigest", "approvedBusinessStateDigest", "approvedBusinessState", "idempotencyId", "transactionId", "outcome", "resultingRecordVersion", "recordDigest", "lookup", "observedAt", "clockId", "authoritativeLookup", "destinationSequence", "fence", "syntheticOnly", "sameHost"])) throw new Error("PAYLOAD_INVALID");
    validateDestinationLookup(p.lookup);
    if (p.schema !== DESTINATION_EVIDENCE_SCHEMA || p.destinationIdentity !== trust.destinationIdentity || p.approvalId !== a.approvalId
      || p.gatePassId !== a.gatePass.gatePassId || p.actionDigest !== a.gatePass.action.actionDigest || p.approvedRequestDigest !== hash(a.request)
      || p.approvedBusinessStateDigest !== a.binding.businessStateDigest || hash(p.approvedBusinessState) !== hash(a.binding.businessState)
      || p.idempotencyId !== a.gatePass.action.nonce || p.syntheticOnly !== true || p.sameHost !== true || p.authoritativeLookup !== true
      || p.clockId !== trust.clockId || hash(p.lookup) !== hash(expected) || !Number.isSafeInteger(p.destinationSequence) || p.destinationSequence < 0) throw new Error("EVIDENCE_BINDING_INVALID");
    if (!timestamp(now) || !timestamp(p.observedAt) || Date.parse(expected.requestedAt) > Date.parse(p.observedAt)
      || Date.parse(p.observedAt) > Date.parse(now) || Date.parse(now) - Date.parse(expected.requestedAt) > trust.maximumAgeMs) throw new Error("EVIDENCE_STALE");
    if(expected.fenceId!==null && p.fence===null)throw new Error('FENCE_REQUIRED');
    if (p.fence !== null && (!exactKeys(p.fence, ["fenceId", "gatePassId", "idempotencyId", "completed", "sequence"])
      || !uuid(p.fence.fenceId) || p.fence.fenceId !== expected.fenceId || p.fence.gatePassId !== a.gatePass.gatePassId
      || p.fence.idempotencyId !== a.gatePass.action.nonce || p.fence.completed !== true || !Number.isSafeInteger(p.fence.sequence)
      || p.fence.sequence < 1 || p.fence.sequence > p.destinationSequence)) throw new Error("FENCE_INVALID");
    if (p.outcome === "EXECUTED") {
      if (p.destinationSequence < 1 || !uuid(p.transactionId) || p.resultingRecordVersion !== a.binding.businessState.orderVersion + 1
        || p.recordDigest !== destinationRecordDigest(a, p.transactionId, p.resultingRecordVersion)) throw new Error("EXECUTION_RECORD_INVALID");
    } else if (p.outcome === "ABSENT") {
      if (p.transactionId !== null || p.resultingRecordVersion !== null || p.recordDigest !== null
        || expected.fenceId === null || p.fence === null) throw new Error("UNFENCED_ABSENCE");
    } else throw new Error("OUTCOME_INVALID");
    return { verified: true, outcome: p.outcome, reason: "SIGNED_DESTINATION_VERIFIED" };
  } catch (error) { return { verified: false, outcome: "UNKNOWN", reason: error instanceof Error ? error.message : "EVIDENCE_INVALID" }; }
}
