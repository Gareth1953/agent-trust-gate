# Purchase approval integration — source evaluation

12 November 2026. **Synthetic destination only. Production NO-GO.**

ATG now has an opt-in passkey assertion check at its protected transaction
destination. It is an integration point for a trusted approver application.
It is not an enrolled identity service, turnkey login/enrollment website,
Microsoft Entra integration or a verified live-human demonstration.

## Five-minute buyer walkthrough

Use Node 24 and OpenSSL. No account, API key, model, payment or purchase is needed.

```sh
npm ci --ignore-scripts
npm run demo:purchase-approval
```

The walkthrough uses an obviously synthetic £4,000 order. Read the payee,
amount, tenant, resource and current resource version together. It then shows:

1. A valid issuer grant alone is refused when passkey approval is configured.
2. A signed assertion without user verification is refused.
3. Changing either payee or amount after approval is refused.
4. The exact approved synthetic change executes once.
5. Reusing the authority/approval is refused; historical lookup finds the result.

This command exercises the broker protocol locally with a **software test
authenticator**, not OpenShell or a human-operated device. The separate real
OpenShell workflow exercises both the original and approval-required paths.
Its approval-required receipt explicitly reports `liveHumanCeremony: false`.
The software signing key remains in trusted test setup; only its assertion is
uploaded to the agent workload.

## What the new path enforces

The administrator supplies `passkeyApproval` in `WitnessTrust` at creation of a
**new** destination store. It pins one principal ID, RP ID, exact origin,
credential ID, user handle, ES256 public key and initial signature counter.
The complete trust object is pinned by the existing store trust digest. Omitting
or changing the configured approval trust cannot reopen that store. Existing
stores and old plugin modes are not silently migrated or strengthened.

The signed GatePass's `operatorIdentity` must match the enrolled principal.
The GatePass is a conditional issuer authorisation: its existing fixture human
approval fields are not counted as a passkey proof. In the new mode execution
also requires the independent assertion at the destination.

Only a trusted controller may call `preparePurchaseApproval(unapprovedGrant)`.
It verifies issuer authority, creates a random 32-byte challenge, and stores
its binding to the exact GatePass ID, action digest and complete signed grant.
The returned summary comes from the verified action. Challenges expire after
at most two minutes and never later than the GatePass; at most 64 may be pending.
Preparation creates no permission or synthetic effect.

At execution the writer rechecks current authority after taking its SQLite lock,
then requires the stored challenge, exact principal/credential, RP hash, origin,
same-origin ceremony, valid ES256 signature, user-presence and user-verification
flags and an advancing credential counter. The approval challenge, counter,
approval audit, GatePass consumption and synthetic effect commit in **one
transaction**. An injected effect failure rolls all of them back and returns
UNKNOWN; no automatic retry is permitted. Historical lookup needs no new
passkey touch and creates no new execution permission.

Neither challenge issuance, enrollment, credential changes nor approval is
exposed through the agent's commit/lookup API. Request-supplied public keys,
identity claims or boolean approval flags cannot replace registered trust.

## Host-application connector

`scripts/purchase-approval-browser.mjs` exports:

- `displayPurchaseApproval(element, preparedRequest)`: renders the trusted
  summary with `textContent`, including payee, amount, identity, digest and expiry.
- `requestPurchaseApproval(preparedRequest)`: calls `navigator.credentials.get`
  with mandatory user verification and the pinned credential, then returns the
  assertion fields to send through the authenticated approver session.

The host must authenticate the approver session, serve the page at the exact
configured secure origin, obtain the prepared request from its trusted
controller and call the helper from an explicit approval click. Attach the
returned assertion as `grant.humanApproval`; the broker still accepts only
`{grant,payload}`. The server checks the stored binding, never a client-supplied
summary. Cancellation or missing device must leave the transaction unexecuted.

This deliberately narrow evaluation profile accepts ES256/P-256 only, exact
same-origin RP hosting, 37-byte authenticator data, UP+UV flags, no backup or
authenticator extensions, and strictly advancing non-zero counters. Many synced
passkeys use zero counters or backup flags and will be **refused**. This is not a
general WebAuthn conformance or authenticator compatibility claim. A deployment
needs a maintained, independently reviewed WebAuthn stack and its own enrollment
policy before widening this profile.

## Remaining live-human gate

An administrator must enroll a genuine credential through an authenticated,
reviewed registration process and bind it to the intended principal. Then an
actual person must review the exact order and complete the browser/device
ceremony. Cancellation, altered order, wrong account/origin, revoked credential,
replay, concurrent calls and recovery must be checked in that deployment.
**That live enrollment and ceremony have not happened in this upgrade.** No
owner approval, real identity verification or customer authorisation is recorded.

WebAuthn proves use of the registered credential and reported UP/UV properties.
A signature alone does not prove a real-world name, business authority,
independent hardware custody or that a person understood the displayed purchase.
This code does not validate authenticator attestation. Trusted enrollment,
approver UI/session, device integrity and administrator integrity remain
assumptions. A compromised trusted UI can misdescribe a transaction; no trusted
authenticator transaction display is implemented.

Credential revocation/rotation requires trusted control and a newly provisioned
evaluation store under this version; it is not a live revocation service. Shared
principal budgets, mandate chains, real payment adapters, HSMs, external
anti-rollback and independent assessment remain outside this implementation.
The unchanged legacy modes do not acquire this approval requirement.

## Evidence and primary reference

Run `npm run test:purchase-approval` for the focused adversarial checks.
The existing general and OpenShell CI jobs must pass before merging this source
candidate. Read the [exact run IDs and evidence](PURCHASE-APPROVAL-VALIDATION.md).

The verifier follows a deliberately restricted subset of
[W3C WebAuthn Level 3, section 7.2](https://www.w3.org/TR/2026/REC-webauthn-3-20260825/#sctn-verifying-assertion).
No third-party assessment, FIDO certification or NVIDIA endorsement is claimed.
