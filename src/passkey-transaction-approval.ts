import { createHash, createPublicKey, verify } from "node:crypto";

/** Narrow evaluation profile: one administrator-enrolled ES256 credential,
 * mandatory UP+UV, no extensions/backup, and a strictly advancing counter.
 * Enrollment/real-person identity and authenticator attestation are external. */
export interface PasskeyApprovalTrust {
  principalId: string; rpId: string; origin: string; credentialId: string;
  userHandle: string; publicKeyPem: string; initialSignCount: number;
  /** Explicit opt-in for a fresh registration-backed store. Legacy stores
   * retain their no-backup, strictly advancing counter profile. */
  credentialProfile?: "registered-webauthn-v1";
  backupEligible?: boolean;
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
  const registered=t?.credentialProfile==="registered-webauthn-v1";
  const fields=registered?"backupEligible,credentialId,credentialProfile,initialSignCount,origin,principalId,publicKeyPem,rpId,userHandle":"credentialId,initialSignCount,origin,principalId,publicKeyPem,rpId,userHandle";
  if(!t || Object.keys(t).sort().join(",")!==fields || (registered && typeof t.backupEligible!=="boolean")
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

/** Parse a complete JSON object while rejecting duplicate TOP-LEVEL names,
 * including Unicode-escaped aliases. WebAuthn client data may contain reordered
 * keys and browser-added fields: the signature covers its original raw bytes.
 * JSON.parse alone silently overwrites duplicate names, so we scan keys too.
 * The input is already bounded to 4096 decoded bytes.
 */
function uniqueClientDataObject(text: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("PASSKEY_CLIENT_BINDING_INVALID");
  let i = 0;
  const whitespace = () => { while (i < text.length && /[\t\n\r ]/.test(text[i]!)) i++; };
  const seen = new Set<string>();
  whitespace();
  if (text[i++] !== "{") throw Error("PASSKEY_CLIENT_BINDING_INVALID");
  while (i < text.length) {
    whitespace();
    if (text[i] === "}") { i++; break; }
    if (text[i] !== '"') throw Error("PASSKEY_CLIENT_BINDING_INVALID");
    const start = i++;
    let escaped = false, terminated = false;
    for (; i < text.length;) {
      const ch = text[i++]!;
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { terminated = true; break; }
    }
    if (!terminated) throw Error("PASSKEY_CLIENT_BINDING_INVALID");
    const key: unknown = JSON.parse(text.slice(start, i));
    if (typeof key !== "string" || seen.has(key)) throw Error("PASSKEY_CLIENT_BINDING_INVALID");
    // Maintain the historic fail-closed rule for escaped spellings of
    // authority-bearing names, even when they decode to the right string.
    if (["type","challenge","origin","crossOrigin","topOrigin"].includes(key)
      && text.slice(start, i) !== JSON.stringify(key)) throw Error("PASSKEY_CLIENT_BINDING_INVALID");
    seen.add(key);
    whitespace();
    if (text[i++] !== ":") throw Error("PASSKEY_CLIENT_BINDING_INVALID");
    let depth = 0, quoted = false, backslash = false;
    // Move past this value; commas/braces inside strings or nested extras
    // must not be mistaken for top-level member separators.
    for (; i < text.length;) {
      const ch = text[i]!;
      if (quoted) {
        if (backslash) backslash = false;
        else if (ch === "\\") backslash = true;
        else if (ch === '"') quoted = false;
        i++; continue;
      }
      if (ch === '"') { quoted = true; i++; continue; }
      if (ch === "{" || ch === "[") { depth++; i++; continue; }
      if (ch === "}" || ch === "]") {
        if (depth === 0) break;
        depth--; i++; continue;
      }
      if (ch === "," && depth === 0) break;
      i++;
    }
    if (depth !== 0 || quoted) throw Error("PASSKEY_CLIENT_BINDING_INVALID");
    whitespace();
    if (text[i] === "}") { i++; break; }
    if (text[i++] !== ",") throw Error("PASSKEY_CLIENT_BINDING_INVALID");
  }
  whitespace();
  if (i !== text.length) throw Error("PASSKEY_CLIENT_BINDING_INVALID");
  return parsed as Record<string, unknown>;
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
  // Browsers, including Chromium, may add signed client-data members or
  // change member order/spacing. Keep strict equality on authority-bearing
  // values and reject duplicate names, but tolerate unrelated signed fields.
  const c=uniqueClientDataObject(text);
  if(c.type!=="webauthn.get" || c.challenge!==challenge || c.origin!==t.origin
    || (c.crossOrigin!==undefined && c.crossOrigin!==false)
    || c.topOrigin!==undefined)throw Error("PASSKEY_CLIENT_BINDING_INVALID");
  // Always require UP+UV and refuse extensions/reserved bits. A registered
  // credential may use BE/BS only with its enrollment-pinned BE value.
  const flags=auth[32]??0,registered=t.credentialProfile==="registered-webauthn-v1";
  const validFlags=registered ? (flags & ~0x1d)===0 && (flags & 5)===5
    && Boolean(flags & 8)===t.backupEligible && (!(flags & 16) || Boolean(flags & 8)) : flags===5;
  if(auth.length!==37 || !auth.subarray(0,32).equals(hash(t.rpId)) || !validFlags)throw Error("PASSKEY_USER_VERIFICATION_REQUIRED");
  const counter=auth.readUInt32BE(33);
  // Some real credentials do not implement counters. Only this explicitly
  // enrolled profile permits 0 -> 0; one-use persisted challenges still bind
  // every ceremony. No counter-based clone detection is claimed for zero.
  const validCounter=counter>previousCounter || (registered && counter===0 && previousCounter===0);
  if(!validCounter || !verify("sha256",Buffer.concat([auth,hash(client)]),t.publicKeyPem,signature))throw Error("PASSKEY_SIGNATURE_OR_COUNTER_INVALID");
  return counter;
}
