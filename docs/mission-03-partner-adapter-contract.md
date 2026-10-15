# Partner adapter contract: future external destination evidence

Mission 03 implements a synthetic local boundary. This contract specifies what
an external partner must supply; it does not claim that a partner has done so.
Do not turn the synthetic IPC protocol into arbitrary live callbacks.

## Trust provisioning

The host must provision destination identity, schema/algorithm, key ID and
trusted public key through an authenticated, out-of-band configuration process.
Never trust a receipt-supplied key, URL, identity document or discovery redirect.
Approval issuer trust is configured separately. The partner owns and controls
the destination signing key; ATG must never receive it. Document partner key
custody, rotation, revocation, compromise handling, audit access and service
ownership. The public ATG fixture signing key and local bootstrap used here
are not suitable production credentials or proof of custody.

## Approval versus execution

Validate signed approval authority at the actual write boundary. Verify exact
action, signed nonce/idempotency key, target, approved business-state digest and
order/supplier/bank versions, expiry, applicable policy and authorisation. Keep
ATG approval evidence distinct from partner execution evidence. Neither an
approval nor ATG's send intent establishes that the destination wrote.

The partner must produce a versioned canonical signed response binding the
same approval/GatePass IDs, canonical action digest, request/business-state
digest and versions, destination transaction and idempotency identifiers,
outcome, resulting record version/digest, destination identity, and a fresh
host-generated lookup challenge/request. Include observation time, clock
provenance, freshness validity and authoritative ledger/lookup semantics. All
fields used for a finding must be under signature. Domain separation and
unambiguous canonicalization must be specified and interoperably tested.

## Idempotency and fenced absence

The partner must enforce at-most-one destination commit per approval and
idempotency key, including competing workers, restarts, reconnects, duplicate
delivery and ambiguous timeouts. A duplicate is not a new execution attempt.
After losing an acknowledgement, retrieve signed authoritative evidence for
the exact previously approved action. No blind retry or automatic
reauthorisation is permitted.

An absence response is useful only if the partner can atomically establish
authoritative non-execution **and** a durable permanent fence that prevents
all prior workers, queued requests, cached capabilities and registration
attempts from later writing under that approval/idempotency key. The response
must bind the completed fence identity/generation to the lookup request and
approval. If the partner cannot guarantee this atomic lookup/fence ordering,
return UNKNOWN and retain exposure. A signed “not found” or eventually
consistent replica lookup is insufficient.

Document linearization points and failure windows independently of ATG's local
SQLite locks. A stop/fence that has not completed destination-side cannot be
described as having prevented an already in-flight write. A write that won the
race must remain COMMITTED exposure and cannot be reversed by reconciliation.

## Availability, freshness and recovery

Use authenticated, restricted transport and bounded requests with explicit
timeouts, replay protection and durable pending challenge tracking. Fail
closed on missing, invalid, unavailable, stale, mismatched, non-authoritative,
incomplete or contradictory evidence. Keep UNKNOWN exposure across process,
service and machine restarts. Do not erase databases, reuse old approvals or
silently regenerate signing keys after uncertain failures.

Provide real clock trust, allowable skew, expiry behavior, monotonicity/replay
rules, window rollover and key-revocation semantics. Mission 03's fixed clock
tests do not demonstrate these live properties. Assess durability under real
crash, power-loss and storage-failure conditions; local SQLite synchronous
settings and SIGKILL tests alone do not establish partner durability.

## Evidence required for external claims

Before describing evidence as independently captured or externally attested,
obtain partner-owned implementation and key custody, authenticated key pins,
partner-run captured signed records, an agreed state/idempotency/fence mapping,
independent verification and audit provenance. Run tamper, wrong-key/identity,
action/state substitution, replay/freshness, lost acknowledgement, unavailable
lookup, incomplete absence, delayed worker, control-ordering and concurrent
budget scenarios against the actual integration. Separately assess multi-host
failure models. Host administrators, compromised signers, dishonest ledgers
and external side effects need explicit threat models and operational controls.

No hardware isolation, partner attestation, production signing, distributed
safety or host-administrator protection is established by this local mission.
