import type { DatabaseSync as SqliteDatabase } from "node:sqlite";
import { createPublicKey } from "node:crypto";
import { closeSync, lstatSync, openSync } from "node:fs";
import { isAbsolute } from "node:path";
import { canonicalDestinationEvidence } from "./destination-evidence.js";
import { createCanonicalPayloadHash as digest } from "./local-signed-proof.js";
import { createLocalVerificationProfile, createVerifierContext, InMemoryNonceStore, verifyExactActionAtExecution,
  type CanonicalActionEnvelopeInput, type ExactActionIssuance } from "./exact-action-gatepass.js";

export const CUSTODY_WITNESS_SCHEMA = "atg.custody-witness.synthetic.v1";
export const CUSTODY_WITNESS_MAX_BYTES = 64 * 1024;
export interface WitnessTrust { domainId: string; issuerIdentity: string; issuerKeyId: string; issuerPublicKeyPem: string }
export interface WitnessGrant { issuance: ExactActionIssuance; proposedAction: CanonicalActionEnvelopeInput }
export interface WitnessResult { outcome: "EXECUTED" | "REJECTED" | "UNKNOWN" | "NOT_RECORDED"; reason: string;
  domainId: string; automaticRetryPermitted: false; receipt: null | { gatePassId: string; actionDigest: string; resourceVersion: number } }
interface Payload { tenantId: "synthetic-tenant-A"; resourceId: "synthetic-order-001"; expectedVersion: number;
  value: string; payeeReference: string; amountMinorUnits: number; currency: "GBP" }

function database() { if(Number(process.versions.node.split('.')[0])<24) throw Error("WITNESS_REQUIRES_NODE_24");
  return (require("node:sqlite") as typeof import("node:sqlite")).DatabaseSync; }
function validateTrust(value: WitnessTrust): WitnessTrust {
  const trust=snapshot(value) as unknown as WitnessTrust;
  if(Object.keys(trust).sort().join(',')!=="domainId,issuerIdentity,issuerKeyId,issuerPublicKeyPem"
    || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(trust.domainId)
    || ![trust.issuerIdentity,trust.issuerKeyId].every(v=>typeof v==='string' && /^[a-zA-Z0-9:._-]{1,160}$/.test(v))
    || typeof trust.issuerPublicKeyPem!=='string' || createPublicKey(trust.issuerPublicKeyPem).asymmetricKeyType!=='ed25519') throw Error("WITNESS_TRUST_INVALID");
  return trust;
}
function snapshot(value: unknown): Record<string, unknown> {
  const text=canonicalDestinationEvidence(value);
  if(Buffer.byteLength(text)>CUSTODY_WITNESS_MAX_BYTES)throw Error('WITNESS_INPUT_TOO_LARGE');
  const copy:unknown=JSON.parse(text);
  if(!copy || typeof copy!=='object' || Array.isArray(copy))throw Error('WITNESS_INPUT_INVALID');
  return copy as Record<string,unknown>;
}
function payload(value: unknown): Payload {
  const p=snapshot(value) as unknown as Payload;
  if(Object.keys(p).sort().join(',')!=='amountMinorUnits,currency,expectedVersion,payeeReference,resourceId,tenantId,value'
    || p.tenantId!=='synthetic-tenant-A' || p.resourceId!=='synthetic-order-001' || p.currency!=='GBP'
    || !Number.isSafeInteger(p.expectedVersion) || p.expectedVersion<1 || p.expectedVersion>=Number.MAX_SAFE_INTEGER
    || !Number.isSafeInteger(p.amountMinorUnits) || p.amountMinorUnits<0 || p.amountMinorUnits>1000000
    || typeof p.value!=='string' || !/^[a-zA-Z0-9 _.-]{1,120}$/.test(p.value)
    || typeof p.payeeReference!=='string' || !/^fixture-bank-[A-Z]$/.test(p.payeeReference))throw Error('WITNESS_PAYLOAD_INVALID');
  return p;
}

/** An authoritative *synthetic record writer*, not a remote-payment executor.
 * Safety against agent-cache restore assumes this database/trust are not in the
 * agent's writable or restorable domain. Same-owner isolation is NOT supplied. */
export class CustodyWitness {
  readonly #db: SqliteDatabase;
  readonly #trust: WitnessTrust;
  readonly #now: ()=>Date;
  #closed=false;
  static create(path: string, input: WitnessTrust): void {
    const Database=database();
    const trust=validateTrust(input);
    if(!isAbsolute(path))throw Error('ABSOLUTE_WITNESS_PATH_REQUIRED');
    // Exclusive empty-file creation: explicit setup only, never reset or migrate.
    const fd=openSync(path,'wx',0o600);closeSync(fd);
    const db=new Database(path);
    try { db.exec(`PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA;
      CREATE TABLE meta(id INTEGER PRIMARY KEY CHECK(id=1),schema TEXT NOT NULL,trust_digest TEXT NOT NULL,stopped INTEGER NOT NULL CHECK(stopped IN(0,1))) STRICT;
      CREATE TABLE resource(id TEXT PRIMARY KEY,version INTEGER NOT NULL,value TEXT NOT NULL) STRICT;
      CREATE TABLE decisions(gate_id TEXT PRIMARY KEY,nonce TEXT NOT NULL UNIQUE,idempotency TEXT NOT NULL UNIQUE,action_digest TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('EXECUTED','REVOKED')),resource_version INTEGER) STRICT;`);
      db.prepare('INSERT INTO meta VALUES(1,?,?,0)').run(CUSTODY_WITNESS_SCHEMA,digest(trust));
      db.prepare('INSERT INTO resource VALUES(?,1,?)').run('synthetic-order-001','pending');
    } finally { db.close(); }
  }
  constructor(options:{path:string;trust:WitnessTrust;now?:()=>Date}) {
    this.#trust=validateTrust(options.trust);this.#now=options.now??(()=>new Date());
    if(!isAbsolute(options.path) || !lstatSync(options.path).isFile() || lstatSync(options.path).isSymbolicLink()) throw Error('WITNESS_NOT_PROVISIONED');
    this.#db=new (database())(options.path);
    try { this.#db.exec('PRAGMA busy_timeout=3000; PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA');this.#checkStore(); }
    catch(error){this.#db.close();throw error;}
  }
  #result(outcome: WitnessResult['outcome'],reason:string,receipt:WitnessResult['receipt']=null):WitnessResult {
    return {outcome,reason,domainId:this.#trust.domainId,automaticRetryPermitted:false,receipt};
  }
  #checkStore(): {stopped:number} {
    if(this.#closed || this.#db.prepare('PRAGMA quick_check').get()?.quick_check!=='ok')throw Error('WITNESS_UNAVAILABLE');
    const m=this.#db.prepare('SELECT * FROM meta WHERE id=1').get();
    if(!m || m.schema!==CUSTODY_WITNESS_SCHEMA || m.trust_digest!==digest(this.#trust) || ![0,1].includes(m.stopped as number))throw Error('WITNESS_TRUST_OR_STATE_CHANGED');
    return {stopped:m.stopped as number};
  }
  #tx<T>(fn:()=>T):T {
    if(this.#closed)throw Error('WITNESS_CLOSED');
    this.#db.exec('BEGIN IMMEDIATE');
    try {this.#checkStore();const v=fn();this.#db.exec('COMMIT');return v;}
    catch(error){this.#db.exec('ROLLBACK');throw error;}
  }
  #grant(input:unknown,historical=false): {grant:WitnessGrant;p:Payload} {
    const grant=snapshot(input) as unknown as WitnessGrant;
    if(Object.keys(grant).sort().join(',')!=='issuance,proposedAction'
      || !grant.issuance || Object.keys(grant.issuance).sort().join(',')!=='decisionReceipt,gatePass')throw Error('WITNESS_GRANT_INVALID');
    const pass=grant.issuance.gatePass,a=pass.action,p=payload(a.canonicalArguments);
    if(a.operatingEnvironment!==`custody-witness:${this.#trust.domainId}` || a.verificationProfile!==`custody-profile:${this.#trust.domainId}`
      || a.toolIdentity!=='atg.custody.synthetic-record' || a.toolSchemaVersion!=='1.0.0' || a.operationName!=='record_synthetic_order'
      || a.targetIdentity!==p.resourceId || a.amount!==p.amountMinorUnits/100 || a.currency!==p.currency
      || pass.productionEnforcement!==false || pass.simulatedActionsOnly!==true || pass.localOnly!==true
      || pass.signature.productionKeyCustody!==false || !a.approvalRequired
      || a.issuerIdentity!==this.#trust.issuerIdentity || a.issuerKeyId!==this.#trust.issuerKeyId)throw Error('WITNESS_DOMAIN_OR_ACTION_INVALID');
    const profile=createLocalVerificationProfile('active',{profileId:a.verificationProfile,verifierIdentity:'synthetic-custody-writer',issuerIdentity:this.#trust.issuerIdentity,
      keyId:this.#trust.issuerKeyId,keyPair:{keyId:this.#trust.issuerKeyId,publicKeyPem:this.#trust.issuerPublicKeyPem}});
    profile.clockSkewSeconds=0;
    const nonces=new InMemoryNonceStore();nonces.registerUnused(pass);
    const check=verifyExactActionAtExecution(pass,grant.proposedAction,createVerifierContext(grant.issuance,nonces,{verificationProfile:profile,verifierIdentity:profile.verifierIdentity,
      trustedClock:{clockId:'custody-evaluation-host-clock',now:this.#now}}));
    if(!check.verified && !(historical && check.signatureValid && check.reasonCodes.every(r=>r==='GATEPASS_EXPIRED'||r==='GATEPASS_NOT_YET_VALID')))throw Error('WITNESS_AUTHORITY_INVALID');
    return {grant,p};
  }
  execute(input:unknown):WitnessResult {
    let checked:{grant:WitnessGrant;p:Payload}; // assigned after strict snapshot; no awaits or caller callbacks
    try {checked=this.#grant(input);}catch{return this.#result('REJECTED','INVALID_EXPIRED_OR_CHANGED_AUTHORITY');}
    try {return this.#tx(()=>{
      // Lock acquisition can wait: revalidate with the trusted clock after it.
      try {this.#grant(checked.grant);}catch{return this.#result('REJECTED','AUTHORITY_INVALID_AFTER_LOCK');}
      const {grant,p}=checked,a=grant.issuance.gatePass.action,pass=grant.issuance.gatePass;
      if(this.#checkStore().stopped)return this.#result('REJECTED','WITNESS_STOPPED');
      if(this.#db.prepare('SELECT gate_id FROM decisions WHERE gate_id=? OR nonce=? OR idempotency=?').get(pass.gatePassId,a.nonce,a.idempotencyKey))return this.#result('REJECTED','AUTHORITY_ALREADY_USED_OR_REVOKED');
      const r=this.#db.prepare('SELECT version FROM resource WHERE id=?').get(p.resourceId);
      if(!r || r.version!==p.expectedVersion)return this.#result('REJECTED','RESOURCE_VERSION_CHANGED');
      this.#db.prepare('INSERT INTO decisions VALUES(?,?,?,?,?,?)').run(pass.gatePassId,a.nonce,a.idempotencyKey,a.actionDigest,'EXECUTED',p.expectedVersion+1);
      const changed=this.#db.prepare('UPDATE resource SET version=version+1,value=? WHERE id=? AND version=?').run(p.value,p.resourceId,p.expectedVersion);
      if(changed.changes!==1)throw Error('RESOURCE_RACE');
      return this.#result('EXECUTED','SYNTHETIC_RECORD_AND_CONSUMPTION_COMMITTED',{gatePassId:pass.gatePassId,actionDigest:a.actionDigest,resourceVersion:p.expectedVersion+1});
    });}catch{return this.#result('UNKNOWN','WITNESS_UNAVAILABLE_OR_OUTCOME_UNKNOWN');}
  }
  lookup(input:unknown):WitnessResult {
    try {const {grant}=this.#grant(input,true),pass=grant.issuance.gatePass;
      return this.#tx(()=>{const row=this.#db.prepare('SELECT * FROM decisions WHERE gate_id=?').get(pass.gatePassId);
        if(!row)return this.#result('NOT_RECORDED','NO_RECORD_NOT_PERMISSION_TO_RETRY');
        if(row.action_digest!==pass.action.actionDigest)throw Error('RECORD_CHANGED');
        return row.status==='EXECUTED'?this.#result('EXECUTED','AUTHORITATIVE_SYNTHETIC_RECORD',{gatePassId:pass.gatePassId,actionDigest:pass.action.actionDigest,resourceVersion:row.resource_version as number})
          :this.#result('REJECTED','AUTHORITY_REVOKED');});
    }catch{return this.#result('UNKNOWN','LOOKUP_UNAVAILABLE_OR_AUTHORITY_INVALID');}
  }
  /** Trusted controller API only; deliberately absent from the agent wire protocol. */
  revoke(input:unknown):WitnessResult {
    try {const {grant}=this.#grant(input,true),pass=grant.issuance.gatePass,a=pass.action;
      return this.#tx(()=>{const old=this.#db.prepare('SELECT status FROM decisions WHERE gate_id=? OR nonce=? OR idempotency=?').get(pass.gatePassId,a.nonce,a.idempotencyKey);
        if(old)return this.#result('REJECTED','ALREADY_RECORDED_REVOCATION_NOT_REVERSAL');
        this.#db.prepare('INSERT INTO decisions VALUES(?,?,?,?,?,NULL)').run(pass.gatePassId,a.nonce,a.idempotencyKey,a.actionDigest,'REVOKED');return this.#result('REJECTED','AUTHORITY_REVOKED');});
    }catch{return this.#result('UNKNOWN','REVOCATION_UNAVAILABLE');}
  }
  stop():void {this.#tx(()=>{this.#db.prepare('UPDATE meta SET stopped=1 WHERE id=1').run();});}
  close():void {if(!this.#closed){this.#db.close();this.#closed=true;}}
}

/** Agent channel accepts only execution and outcome lookup. No caller-selected path, key or clock. */
export function dispatchWitnessCommand(writer:CustodyWitness,input:unknown):WitnessResult {
  try {const m=snapshot(input);if(Object.keys(m).sort().join(',')!=='grant,op' || !['execute','lookup'].includes(m.op as string))throw Error('COMMAND_INVALID');
    return m.op==='execute'?writer.execute(m.grant):writer.lookup(m.grant);
  }catch{return {outcome:'REJECTED',reason:'WITNESS_COMMAND_INVALID',domainId:'unresolved',automaticRetryPermitted:false,receipt:null};}
}
