import { createHash, createPublicKey, verify } from "node:crypto";

/** Narrow evaluation profile: one administrator-enrolled ES256 credential,
 * mandatory UP+UV, no extensions/backup, and a strictly advancing counter.
 * Enrollment/real-person identity and authenticator attestation are external. */
export interface PasskeyApprovalTrust {
  principalId: string; rpId: string; origin: string; credentialId: string;
  userHandle: string; publicKeyPem: string; initialSignCount: number;
}
export interface PasskeyAssertion {
  credentialId: string; clientDataJSON: string; authenticatorData: string;
  signature: string; userHandle: string | null;
}
export interface PreparedPurchaseApproval {
  schema: "atg.purchase-passkey-request.synthetic.v1";
  challenge: string; expiresAt: string; principalId: string;
  gatePassId: string; actionDigest: string;
  summary: { tenantId: string; resourceId: string; expectedVersion: number;
    payeeReference: string; amountMinorUnits: number; currency: string; value: string };
  delegatedAuthority?: import("./custody-delegated-budget.js").DelegatedApprovalSummary;
  publicKey: { challenge: string; rpId: string; timeout: number;
    userVerification: "required"; allowCredentials: { type: "public-key"; id: string }[] };
}
const hash = (b: string | Buffer) => createHash("sha256").update(b).digest();
function decode(s: unknown, max: number): Buffer {
  if(typeof s!=="string" || !/^[A-Za-z0-9_-]+$/.test(s) || s.length>max*2)throw Error("PASSKEY_ENCODING_INVALID");
  const b=Buffer.from(s,"base64url");
  if(!b.length || b.length>max || b.toString("base64url")!==s)throw Error("PASSKEY_ENCODING_INVALID");
  return b;
}
export function validatePasskeyTrust(t: PasskeyApprovalTrust): void {
  if(!t || Object.keys(t).sort().join(",")!=="credentialId,initialSignCount,origin,principalId,publicKeyPem,rpId,userHandle"
    || typeof t.principalId!=="string" || !/^[A-Za-z0-9:._-]{1,160}$/.test(t.principalId)
    || typeof t.rpId!=="string" || !/^[a-z0-9.-]{1,253}$/.test(t.rpId)
    || typeof t.origin!=="string" || typeof t.publicKeyPem!=="string" || t.publicKeyPem.length>4096 || !t.publicKeyPem.startsWith('-----BEGIN PUBLIC KEY-----\n')
    || !Number.isInteger(t.initialSignCount) || t.initialSignCount<0 || t.initialSignCount>0xffffffff)throw Error("PASSKEY_TRUST_INVALID");
  const u=new URL(t.origin);
  if(u.origin!==t.origin || u.hostname!==t.rpId || !(u.protocol==="https:" || (u.protocol==="http:" && u.hostname==="localhost")))throw Error("PASSKEY_ORIGIN_INVALID");
  decode(t.credentialId,1024);decode(t.userHandle,64);
  const key=createPublicKey(t.publicKeyPem);
  if(key.asymmetricKeyType!=="ec" || key.asymmetricKeyDetails?.namedCurve!=="prime256v1")throw Error("PASSKEY_ES256_REQUIRED");
}
export function verifyPasskeyAssertion(t: PasskeyApprovalTrust, input: unknown, challenge: string, previousCounter: number): number {
  validatePasskeyTrust(t);decode(challenge,32);
  if(!Number.isInteger(previousCounter)||previousCounter<0||previousCounter>0xffffffff)throw Error('PASSKEY_COUNTER_STATE_INVALID');
  if(!input || typeof input!=="object" || Array.isArray(input))throw Error("PASSKEY_ASSERTION_REQUIRED");
  const a=input as PasskeyAssertion;
  if(Object.keys(a).sort().join(",")!=="authenticatorData,clientDataJSON,credentialId,signature,userHandle"
    || a.credentialId!==t.credentialId || (a.userHandle!==null && a.userHandle!==t.userHandle))throw Error("PASSKEY_CREDENTIAL_MISMATCH");
  const client=decode(a.clientDataJSON,4096),auth=decode(a.authenticatorData,37),signature=decode(a.signature,80);
  const text=new TextDecoder("utf-8",{fatal:true}).decode(client);
  if(!Buffer.from(text).equals(client))throw Error("PASSKEY_CLIENT_DATA_INVALID");
  const c=JSON.parse(text) as Record<string,unknown>;
  // Strictly accept the fields emitted by the supplied same-origin browser
  // helper. Reject duplicates in the security-sensitive names as well.
  if(JSON.stringify(c)!==text || Object.keys(c).some(k=>!["type","challenge","origin","crossOrigin"].includes(k))
    || c.type!=="webauthn.get" || c.challenge!==challenge || c.origin!==t.origin
    || (c.crossOrigin!==undefined && c.crossOrigin!==false))throw Error("PASSKEY_CLIENT_BINDING_INVALID");
  // 0x01 UP + 0x04 UV; reject AT, ED, backup and reserved bits in this profile.
  if(auth.length!==37 || !auth.subarray(0,32).equals(hash(t.rpId)) || auth[32]!==5)throw Error("PASSKEY_USER_VERIFICATION_REQUIRED");
  const counter=auth.readUInt32BE(33);
  if(counter<=previousCounter || !verify("sha256",Buffer.concat([auth,hash(client)]),t.publicKeyPem,signature))throw Error("PASSKEY_SIGNATURE_OR_COUNTER_INVALID");
  return counter;
}
