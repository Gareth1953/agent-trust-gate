/**
 * Isolated, opt-in synthetic anti-rollback research. NOT a remote service,
 * production authority, payment rail or integrated ATG execution path.
 * A buyer-controlled writer MUST authenticate the request and enforce use of
 * this separately retained anchor before any consequential effect. Those
 * prerequisites are NOT provided by this prototype.
 */
import { DatabaseSync } from 'node:sqlite';
import { openSync, closeSync, lstatSync } from 'node:fs';
import { isAbsolute } from 'node:path';

const ID = /^[A-Za-z0-9:._-]{1,160}$/;
const DIGEST = /^(?:sha256:)?[a-f0-9]{64}$/; // ATG's signed action digests use sha256:<hex>.
export const ANCHOR_SCHEMA = 'atg.consumption-anchor.synthetic.v1';
const answer = (outcome, reason, actionId = null) => ({
  schema: ANCHOR_SCHEMA, syntheticOnly: true, productionReady: false,
  outcome, reason, actionId, automaticRetryPermitted: false,
  effectPermittedByAnchor: outcome === 'RESERVED',
});
const valid = x => x && typeof x === 'object' && !Array.isArray(x)
  && Object.keys(x).sort().join(',') === 'actionDigest,actionId,domainId'
  && ID.test(x.actionId) && ID.test(x.domainId) && DIGEST.test(x.actionDigest);

/** A *different SQLite file* is not an independently administered trust domain. */
export class SyntheticConsumptionAnchor {
  #db;
  #domain;
  #closed = false;
  static create(path, domainId) {
    if (!isAbsolute(path) || !ID.test(domainId)) throw Error('ANCHOR_NEW_ABSOLUTE_PATH_REQUIRED');
    // Explicit exclusive create: never silently reset consumed authority.
    const fd = openSync(path, 'wx', 0o600); closeSync(fd);
    const db = new DatabaseSync(path);
    try {
      db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA;" +
        "CREATE TABLE anchor_meta(id INTEGER PRIMARY KEY CHECK(id=1), schema TEXT NOT NULL, domain_id TEXT NOT NULL) STRICT;" +
        "CREATE TABLE reservations(action_id TEXT PRIMARY KEY, action_digest TEXT NOT NULL) STRICT;");
      db.prepare('INSERT INTO anchor_meta VALUES(1,?,?)').run(ANCHOR_SCHEMA, domainId);
    } finally { db.close(); }
  }
  constructor(path, domainId) {
    if (!isAbsolute(path) || !ID.test(domainId) ||
        !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw Error('ANCHOR_PATH_OR_DOMAIN_INVALID');
    this.#db = new DatabaseSync(path);
    this.#domain = domainId;
    this.#db.exec('PRAGMA busy_timeout=5000;');
    const row = this.#db.prepare('SELECT schema,domain_id FROM anchor_meta WHERE id=1').get();
    if (!row || row.schema !== ANCHOR_SCHEMA || row.domain_id !== domainId) {
      this.#db.close(); this.#closed = true; throw Error('ANCHOR_TRUST_MISMATCH');
    }
  }
  reserve(proposal) {
    if (!valid(proposal)) return answer('REJECTED','ANCHOR_REQUEST_INVALID');
    if (proposal.domainId !== this.#domain) return answer('REJECTED','ANCHOR_DOMAIN_MISMATCH',proposal.actionId);
    if (this.#closed) return answer('UNKNOWN','ANCHOR_UNAVAILABLE',proposal.actionId);
    let started = false;
    try {
      this.#db.exec('BEGIN IMMEDIATE'); started = true;
      const old = this.#db.prepare('SELECT action_digest FROM reservations WHERE action_id=?').get(proposal.actionId);
      let result;
      if (old) {
        result = answer('REJECTED', old.action_digest === proposal.actionDigest
          ? 'ANCHOR_AUTHORITY_ALREADY_RESERVED' : 'ANCHOR_CONFLICTING_ACTION', proposal.actionId);
      } else {
        this.#db.prepare('INSERT INTO reservations VALUES(?,?)').run(proposal.actionId,proposal.actionDigest);
        result = answer('RESERVED','ANCHOR_FIRST_RESERVATION_ONLY',proposal.actionId);
      }
      this.#db.exec('COMMIT'); started = false;
      return result;
    } catch {
      if (started) try { this.#db.exec('ROLLBACK'); } catch { /* unknown */ }
      return answer('UNKNOWN','ANCHOR_UNAVAILABLE_OR_UNCERTAIN',proposal.actionId);
    }
  }
  /** Read only. A reservation is NOT proof that a real effect occurred. */
  lookup(actionId) {
    if (typeof actionId !== 'string' || !ID.test(actionId)) return answer('REJECTED','ANCHOR_ACTION_ID_INVALID');
    try {
      if (this.#closed) throw Error();
      const row=this.#db.prepare('SELECT action_digest FROM reservations WHERE action_id=?').get(actionId);
      return row ? answer('HELD','ANCHOR_RESERVATION_RETAINED_NOT_EFFECT_PROOF',actionId)
        : answer('NOT_RECORDED','ANCHOR_ABSENCE_NOT_RETRY_PERMISSION',actionId);
    } catch { return answer('UNKNOWN','ANCHOR_LOOKUP_UNAVAILABLE',actionId); }
  }
  close() { if (!this.#closed) { this.#closed=true; this.#db.close(); } }
}
