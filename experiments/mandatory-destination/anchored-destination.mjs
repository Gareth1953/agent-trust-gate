/**
 * Issue #46 — opt-in, synthetic ONLY checkpoint-enforced entrypoint.
 * This wrapper is NOT a security boundary against callers able to invoke
 * the original writer, mutate its database, or restore the checkpoint.
 * A production destination must make THIS checked path the only possible
 * way to create an effect, using independently administered trust roots.
 */
const DIGEST = /^(?:sha256:)?[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9:._-]{1,160}$/;
const refusal = (outcome, reason, checkpoint = null) => Object.freeze({
  outcome, reason, syntheticOnly: true, productionReady: false,
  automaticRetryPermitted: false, checkpoint,
});

export class SyntheticAnchoredDestination {
  #anchor;
  #writer;
  #domainId;

  constructor({anchor, writer, domainId}) {
    if (!anchor || typeof anchor.reserve !== 'function' ||
        !writer || typeof writer.execute !== 'function' || typeof writer.preflightForAnchor !== 'function' ||
        typeof domainId !== 'string' || !ID.test(domainId))
      throw Error('SYNTHETIC_DESTINATION_CONFIGURATION_INVALID');
    this.#anchor = anchor;
    this.#writer = writer;
    this.#domainId = domainId;
  }

  /**
   * Only the signed GatePass material supplies action identity/digest.
   * The caller does not supply a parallel digest or an override domain.
   * A first reservation is not proof of a completed effect; if the
   * writer fails/loses acknowledgement, report UNKNOWN without retry.
   */
  execute(grant, ctx) {
    const pass = grant?.issuance?.gatePass;
    const actionId = pass?.gatePassId;
    const actionDigest = pass?.action?.actionDigest;
    if (typeof actionId !== 'string' || !ID.test(actionId) ||
        typeof actionDigest !== 'string' || !DIGEST.test(actionDigest)) {
      return refusal('REJECTED','CHECKPOINT_SIGNED_ACTION_MISSING_OR_INVALID');
    }
    // The trusted writer must validate the actual signed grant and approval
    // before this non-refundable one-use reservation. A separate preflight is
    // not sufficient for production atomicity: writer.execute rechecks under
    // its own transaction lock; a destination must exclude alternate routes.
    let preflight;
    try { preflight = this.#writer.preflightForAnchor(grant, ctx); }
    catch { return refusal('UNKNOWN','WRITER_PREFLIGHT_UNAVAILABLE'); }
    if (!preflight || preflight.verified !== true ||
        preflight.actionId !== actionId || preflight.actionDigest !== actionDigest) {
      return refusal('REJECTED','WRITER_AUTHORITY_PREFLIGHT_REFUSED');
    }
    let reservation;
    try {
      reservation = this.#anchor.reserve({
        domainId: this.#domainId, actionId, actionDigest,
      });
    } catch {
      return refusal('UNKNOWN','CHECKPOINT_UNAVAILABLE_OR_UNCERTAIN');
    }
    // Do not trust a bare outcome string, or a possibly inconsistent
    // response claiming reservation but explicitly denying permission.
    if (!reservation || reservation.outcome !== 'RESERVED' ||
        reservation.effectPermittedByAnchor !== true ||
        reservation.actionId !== actionId) {
      const isRefusal = reservation?.outcome === 'REJECTED';
      return refusal(isRefusal ? 'REJECTED' : 'UNKNOWN',
        isRefusal ? 'CHECKPOINT_REFUSED' : 'CHECKPOINT_UNAVAILABLE_OR_UNCERTAIN',
        reservation?.reason ?? null);
    }
    try {
      const writerResult = this.#writer.execute(grant,ctx);
      // Do not invent a successful effect if the writer failed or went silent.
      if (!writerResult || writerResult.outcome !== 'EXECUTED') {
        return refusal('UNKNOWN','DESTINATION_EFFECT_UNCONFIRMED');
      }
      return Object.freeze({
        outcome: 'EXECUTED', syntheticOnly: true, productionReady: false,
        automaticRetryPermitted: false, checkpoint: reservation.reason,
        writerResult,
      });
    } catch {
      return refusal('UNKNOWN','DESTINATION_EFFECT_UNCONFIRMED');
    }
  }
}
