# Buyer evaluation upgrade — 10 November 2026

**Source candidate; local synthetic evaluation only. Production NO-GO.**

This work improves transport refusal/resource handling and gives a buyer a
repeatable demonstration which retains successful attacks as security failures.
It does not import the unpushed Windows PI3 research or certify its results.
The unchanged downloadable local.7 archive does not contain this candidate.

## Start here

1. Read [trust boundary and repair plan](TRUST-BOUNDARY.md).
2. Follow [the reproducible evaluation](QUICKSTART.md).
3. Inspect the run's `results.json` and `report.md` and this branch's validation
   receipt. A successful command is not production clearance.
4. Give [the external assessment brief](EXTERNAL-REVIEW.md) to a prospective
   assessor only after agreeing scope, access and cost separately.
5. Use [the buyer diligence and evaluation pack](BUYER-PACK.md) for discussion.

## What changed

- Commands are snapshotted through the strict JSON boundary, limited to 256 KiB,
  checked against an operation/field allowlist and correlated with UUIDs.
- The client permits at most 64 outstanding commands, rejects malformed replies
  and fails the session closed when reply framing cannot be trusted.
- The destination no longer crashes by dereferencing a null request again in
  its error handler. Invalid commands are rejected before a transaction.
- A six-control synthetic evaluation retains explicit database-edit and coherent
  clone/replay counterexamples. No real supplier, bank, payment or customer is used.
- Existing website/README validators recognise the current wording, exact local
  script cache version and two already-present research references. No new
  website asset, external script, live integration or production claim is added.

## Outstanding priority work

The shared local owner can still rewrite the database and checksum. An actor
holding both roles' databases, trust configuration and keys can clone the
pre-consumption state and execute the same authority in both copies. Application
signatures, extra checksums and separate processes on that same trust domain do
not remove this threat. The next security milestone needs protected custody and
an independently held anti-rollback/idempotency anchor, or a partner destination
that supplies an equivalent authoritative boundary. Its guarantee must be tested
under genuinely denied access, backup/restore, outage and recovery conditions.

No independent assessor, partner sandbox, real authority provider, Windows
restricted-account validation, live clocks, 24/7 operations, certification or
customer validation was completed by this source change.
