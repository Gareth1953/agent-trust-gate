# Combined transaction authority — source evaluation, 12 November 2026

**Synthetic evaluation only. Production NO-GO. Public local.7 archives unchanged.**

This opt-in mode joins the previously separate signed sub-agent delegation and
root-account allowance with the existing OpenShell HTTPS destination, passkey
assertion requirement and versioned synthetic record. The [exact combined real-runtime CI evidence](DELEGATED-BUDGET-VALIDATION.md)
is recorded as PASS_SCOPED, not production clearance.

## What runs together

One retained authoritative SQLite store pins the issuer, passkey principal,
delegation root, registered agent keys, outcome-observer key and account limit.
Execution requires all of the following under the same destination write lock:

1. The existing exact, signed GatePass and unchanged HTTP effect payload.
2. A verified root mandate and non-expanding signed agent/sub-agent chain.
3. The leaf identity from a host-enrolled, exact pinned mTLS certificate whose
   public key matches the registered Ed25519 agent key. Request JSON cannot
   supply transport identity. Certificate enrollment/organisation identity are
   trusted setup assumptions, not an identity-provider integration.
4. A valid software-fixture passkey assertion bound to the complete grant AND
   delegation request, with an advancing credential counter.
5. The current expected destination version and both the shared root-account
   and mandate-specific remaining allowance.

Passkey challenge/counter/audit, root and mandate spending, exact delegation
audit, GatePass one-use consumption and synthetic effect commit atomically in
that ONE database. A synthetic effect failure rolls back those updates together.
The actual HTTP payload, including version and value, is also digest-bound in
the leaf-signed delegated action. It is not an ALLOW followed by an unrelated
callback or a cross-database transaction.

One root principal, account, GBP currency and one synthetic resource are supported
per provisioned store. There is no global cross-host budget, fee/FX estimator,
multi-account service or payment adapter. New distinct mandates cannot reset the
account ceiling. Revocation and emergency stop remain trusted controller APIs;
none is exposed to the agent.

## Uncertain outcomes and observer evidence

A response lost after commit returns UNKNOWN to the caller. The authoritative
store still counts the entire committed spending; it is NOT refunded because a
caller lacks an acknowledgement. Explicit authenticated historical lookup checks
the original exact delegation digest and returns the recorded outcome without
another effect or new spending permission. Missing/unavailable lookup is not
permission to retry. The agent has no budget release/reset or reconciliation API.

The trusted controller may record separately signed, exact-action synthetic
outcome evidence using the pinned observer key. An asserted absence cannot refund
a known committed effect, forged/mismatched evidence cannot create an audit,
and duplicate evidence cannot add another audit row. This is same-host fixture
signing, NOT independently administered external observation or anti-rollback.
The standalone delegated-budget UNKNOWN-hold demonstration remains available
under its own documented synthetic assumptions; it is not a remote payment rail.

## Reproduce the local buyer walkthrough

Node 24+, OpenSSL, a clean source checkout and no production credentials:

```sh
npm ci --ignore-scripts
npm run demo:delegated-custody
npm run test:delegated-custody
```

The demo uses real loopback TLS, two disposable pinned client identities and a
software test authenticator. GBP3,000 and GBP2,000 consume one GBP5,000 allowance;
a different agent's attempted GBP2,500 overspend is refused. Replay is refused,
lookup adds no effect, and separately signed fixture evidence is checked. Its
temporary fixture is removed; only non-secret results are printed. It explicitly
reports `actualOpenShell: false` and `liveHumanCeremony: false`.

The existing real OpenShell workflow adds a third invocation with
`--require-delegation`. It uses the same root-protected host, distinct writer UID,
private-interface broker and unchanged end-to-end TLS/native TCP network policy.
The disposable workload holds two test client keys; this is NOT proof of two
independently isolated agent operating systems. Issuer, approver and observer
private keys remain outside the workload. The scoped runtime matrix must show
cross-leaf refusal, shared-account overspend refusal and exact remaining spend.

## Provisioning and compatibility

Configure `delegatedBudget` together with `passkeyApproval` when creating a NEW
CustodyWitness store; root principal must equal the enrolled passkey principal,
and the domain/tenant/currency must match. Trust digest pinning prevents removing
the budget requirement on reopen. There is no reset, implicit migration or
strengthening of existing stores. Old SDK/MCP, legacy broker modes and published
plugin archives retain their actual earlier boundaries.

The root-owned broker configuration's optional `delegatedClients` maps exact TLS
leaf fingerprints to registered agent IDs. The network handler derives the
credential fingerprint from the authenticated peer certificate, not from JSON,
headers or a self-declared agent identifier. Missing or mismatched identity fails
closed. Enrollment, challenge issuance, approval, revocation, signing, observer
reconciliation and administrative operations remain absent from the agent API.

The trusted approver helper displays root principal, account, mandate, mission,
agent chain and ceilings in addition to the exact action. It requires a separately
authenticated host session and genuine credential enrollment before a real
human/device trial. No such trial is claimed here.

## Still required before production

- Genuine authenticated organisation/workload enrollment and business authority.
- A real person's trusted browser/device approval, including cancellation,
  credential recovery/revocation and authenticator compatibility checks.
- A selected buyer-controlled operation with complete mediation and no alternate
  credentials, SQL or administrative bypass.
- An independently administered anti-rollback checkpoint and outcome witness;
  administrator compromise and complete writer/host cloning remain unprotected.
- Cross-host coordination, deployment-specific security review and buyer acceptance.

**The coherent-clone attack is retained and still succeeds.** A passing negative
test records that limitation; it does not make it a protection success. No NVIDIA
or Microsoft endorsement, independent security audit, production readiness,
customer-data assurance, certification, live payment or guaranteed benefit.

See [purchase approval boundaries](PURCHASE-APPROVAL.md), [original runtime
evidence](VALIDATION.md), and [the open enterprise gate](https://github.com/Gareth1953/agent-trust-gate/issues/37).
