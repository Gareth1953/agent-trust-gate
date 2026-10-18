# ATG operational record plugin — 0.2.0-rc.2

## What is implemented

An installable, self-hosted SDK and two HTTP/TLS services for one tenant and
one operation: replacing a JSON business record at its approved version.
The destination commits real SQLite writes and separately signs its persisted
outcomes. The gateway authenticates an agent, obtains explicit approval from
an authorised JWT access-token holder, dispatches once and reconciles the
destination's evidence. There are no built-in identities, tokens, signing
keys, business records, fixed clocks or simulated success responses.

This is an **operational release candidate for this record service**, not a
production-certified identity/payment platform or a finished ERP connector.
It cannot write to arbitrary third-party systems. No payment, settlement,
refund, bank-account verification, automatic remediation or self-learning is
implemented. The existing local.7 evaluation archive remains unchanged.

Tested runtime: Linux, Node 24.19.0. The package requires Node 24.19+ and uses
Node's native SQLite API. Windows NTFS permissions, other operating systems,
power-loss behaviour, HA, multi-host coordination and enterprise deployment
are not qualified. Use a controlled Linux deployment until those are tested.

## Trust and deployment requirements

- Run the gateway, destination and agent under distinct OS accounts or
  containers. Each service must have access only to its own private key and
  database. The agent gets only its own bearer credential. Keep the human
  approval session separate from the agent and its tools.
- Use HTTPS for every non-loopback service URL. Plain HTTP is accepted only
  for literal loopback IPs. Public HTTP listeners are refused. TLS validation
  and redirects cannot be disabled by the SDK. For private CAs use Node's
  supported process-level trust configuration, never disabled verification.
- Protect and back up keys, configurations and databases. POSIX startup checks
  require private files/directories owned by the service user, without group
  or other access. Use encrypted storage if the record data requires it.
  This package does not isolate data from administrators or same-user code.
- Synchronise host clocks and monitor them. Expiry uses real host time, not
  an externally attested clock. There is no clock rollback protection.
- Put a reverse proxy with rate limits, request limits and access logging in
  front of public deployments. Request bodies are limited to 64 KiB; SDK response
  bodies to 128 KiB (an approval includes before and after); actions to
  32 KiB; each agent has a 1,000-open-request cap. Storage still grows with
  completed work; retention and capacity monitoring are operator duties.
- Do not represent a signed statement as independent truth merely because it
  is signed. This destination owns the actual record database. A provider
  connector needs an authoritative read-back and its own transaction boundary.

## Microsoft Entra ID (recommended enterprise profile)

Use `provider: "microsoft-entra"` for single-tenant Microsoft commercial-cloud
v2 access tokens. See **ENTRA-SETUP.md** in the installed package, or
[the Entra setup guide](entra-setup.md) in this repository. The profile validates
RS256 signature, exact tenant/issuer/API audience, allowed public-client ID,
delegated `atg.approve` scope, tenant user object ID, recent `auth_time` and the
required `acrs` authentication context. It does not require generic-provider
`scope`, `token_use` or v1 `amr` claims. Personal-account tenants, app-only
permissions, Graph tokens and ID tokens cannot authorise this approval API.

The `humans[].subject` value is the user's **object ID in the configured tenant**,
not email, display name or the pairwise `sub` claim. A guest is eligible only if
the operator explicitly authorises their object ID in that tenant. There is no
automatic cross-tenant onboarding or directory synchronisation.

The new `entra review` command signs in with Microsoft's MSAL Node library,
using browser authorisation code flow with PKCE and an explicit nonce. It
requests the configured authentication context and shows the authoritative
before/after proposal before requiring the entire approval digest to be typed.
The person opens the sign-in URL on the same computer as the CLI. Access tokens
are neither printed nor persisted; the process-local MSAL cache is cleared.
The approval CLI requires an interactive terminal. This remains bearer-based
authenticated approval, not proof that a natural person read every field.

**The tenant administrator must enforce MFA/authentication strength on the
configured context.** An `acrs` value alone does not prove MFA: Microsoft may
issue it when no Conditional Access policy protects that context. The gateway
cannot inspect your tenant's policy configuration. Actual tenant sign-in,
policy enforcement and deployment remain required acceptance checks.

## Generic human identity contract (no demo fallback)

Configure an actual trusted identity provider to issue **RS256 JWT access
tokens** for this approval API, with a distinct audience and `atg:approve`
scope. Tokens must contain `iss`, `aud`, `sub`, `iat`, `exp`, `auth_time`,
`amr`, `scope`, and `token_use: "access"`. Require recent MFA at your issuer.
An ID token, agent token, unsigned token or token for another audience is
refused. Pin the issuer's public JWKS keys in the service configuration;
operator-managed rotation is explicit. No network-supplied key URL is trusted.

The operator's `humans` list is the authoritative approval policy for this
release: exact issuer subject, active flag and permitted record-ID prefix.
It is not HR/directory integration. Update it when authority changes; claim
admission checks it again. An authenticated account is not automatically
authorised. Configure only human subjects whose provider authentication
policy you control. Require a nonempty prefix rather than tenant-wide access.

The person inspects the proposal from the gateway and explicitly submits its
digest. The gateway binds that authenticated approval to the immutable exact
action and signs the grant. This is authenticated approval, **not** a passkey
transaction signature or proof that a natural person reviewed every field.
Anyone holding the human bearer token can use its authority until it expires
or the local policy disables it. Per-action WebAuthn binding and directory
revocation integration remain future work. Never supply this token to an agent.

## Configure and initialise

Install the reviewed archive into a clean Node 24.19+ project:

```sh
npm install /absolute/path/agent-trust-gate-operational-0.2.0-rc.2.tgz
npx --no-install atg-operational --help
```

Create a public trust-policy JSON file from **your actual provider and users**:

```json
{
  "tenantId": "your-company",
  "policyVersion": "policy-1",
  "gatewayUrl": "https://approval.your-company.example",
  "destinationUrl": "https://records.your-company.example",
  "agents": [{"id": "operations-agent", "recordPrefix": "purchase-order-"}],
  "identity": {
    "issuer": "https://YOUR-IDENTITY-PROVIDER/",
    "audience": "YOUR-APPROVAL-API-AUDIENCE",
    "jwks": [{"kty": "RSA", "kid": "YOUR-KEY-ID", "n": "YOUR-PUBLIC-MODULUS", "e": "AQAB", "alg": "RS256", "use": "sig"}],
    "requiredAmr": ["mfa"],
    "maximumAuthenticationAgeSeconds": 300
  },
  "humans": [{"subject": "YOUR-AUTHORISED-HUMAN-SUBJECT", "active": true, "recordPrefix": "purchase-order-"}]
}
```

These placeholders cannot authenticate anyone. The issuer must be configured
and its claim contract verified before deployment. Not every identity provider
emits these claims by default. The generic profile does not implement a login flow. The Entra profile provides
an MSAL-based sign-in command, but does not register applications or configure
your tenant on your behalf.

```sh
npx --no-install atg-operational init /private/new-atg /private/public-trust.json
```

This explicit command generates fresh Ed25519 signing keys and random service
credentials and writes private configurations. It prints paths, never secrets.
It refuses an existing directory. An invalid configuration leaves the newly
created private files for inspection; fix it deliberately rather than reinitialise
over active state. No human token or identity signing key is generated.

Provision separate gateway/destination accounts from their respective subfolders;
adjust absolute paths when moving them. Transfer only each role's required
files. Destination receives the claim secret; gateway receives only its hash.
The agent receives only its own file from `agent/`. Never commit these files.

As the destination operator, create an initial business record from your own
JSON file (exclusive insert, not an update or reset):

```sh
npx --no-install atg-operational record-create /private/new-atg/destination/config.json purchase-order-42 /private/order.json
```

Start each service in its own environment. For non-loopback listeners set
`ATG_TLS_KEY_FILE`, `ATG_TLS_CERT_FILE` and `ATG_BIND_HOST`; configure trusted
certificates. A private reverse proxy may instead terminate HTTPS and forward
to the loopback listener in an appropriately isolated deployment.

```sh
npx --no-install atg-operational serve destination /private/new-atg/destination/config.json 9444
npx --no-install atg-operational serve gateway /private/new-atg/gateway/config.json 9443
```

## Agent SDK and human approval

```js
import { AtgOperationalPlugin } from '@agent-trust-gate/operational';
const atg = new AtgOperationalPlugin({
  gatewayUrl: process.env.ATG_GATEWAY_URL,
  agentToken: process.env.ATG_AGENT_TOKEN,
});
const proposal = await atg.propose({
  recordId: 'purchase-order-42', expectedVersion: 1,
  document: { status: 'approved-for-processing', reference: 'PO-42' },
});
// Present proposal.requestId to the separate authorised approver.
// No approve method is available on this agent SDK.
const status = await atg.status(proposal.requestId);
if (status.status === 'APPROVED') {
  const result = await atg.execute(proposal.requestId);
  // UNKNOWN requires atg.reconcile(id), never another execute call.
  console.log(result.status);
}
```

In the human's separate trusted terminal, set `ATG_GATEWAY_URL` and obtain a
fresh audience-specific access token through the organisation's approved login.
Supply it through `ATG_HUMAN_ACCESS_TOKEN`, not a command-line argument or log.

```sh
npx --no-install atg-operational inspect REQUEST_ID
# Read before, proposed document, version, requester and digest.
npx --no-install atg-operational approve REQUEST_ID EXACT_REVIEWED_DIGEST
# To withdraw an unused approval:
npx --no-install atg-operational revoke REQUEST_ID EXACT_REVIEWED_DIGEST
```

`AtgHumanApprovals` exposes the same inspect/approve/revoke methods for a trusted
application. There is no browser UI in this release candidate. The caller must
not use an agent-supplied summary or automatically approve a digest.

## Execution, revocation and recovery semantics

The gateway persists APPROVED → DISPATCHED before the network call. Destination
authentication, the signed action's audience/tenant, agent and current expiry
are checked. The destination asks the gateway to atomically claim the exact
stored grant. The gateway rechecks policy version, emergency stop, agent scope,
human authority and expiry before moving DISPATCHED → CLAIMED. One short-lived
permit is issued, never a repeat permit. This is the **authority admission
boundary**; revocation cannot undo admission or completed work. A revocation
after admission may not stop the operation already in progress.

Within a destination SQLite transaction, the service checks the approved record
version and prior document hash and conditionally writes the new version. Its
one-use outcome and signed receipt are committed in the same transaction.
Concurrent attempts cannot obtain another permit or duplicate this write.
The guarantee is bounded to this destination and this request ID, not global
exactly-once behaviour. A separately approved new request is a new operation.

The gateway checks the outcome signature, tenant, request, agent, action digest,
grant digest, record, resulting version and resulting document hash. Failure
or missing acknowledgement stays UNKNOWN. Reconciliation reads signed persisted
destination evidence; it never re-executes the action. Signed absence alone is
not sufficient to clear UNKNOWN: no expiry-based reset or blind retry exists.
Database and key files must survive restart. Existing outcomes remain queryable.
Policy changes are loaded on each request; deployment/key/endpoint changes need
a controlled restart and must preserve the original evidence trust anchors.
The database deployment identity deliberately refuses a changed signing-key or
endpoint configuration on an existing store. In-place service-key rotation and
database migration are not implemented; do not replace the keys or reinitialise
the store to bypass that refusal. IdP public-key rotation can be performed by
updating the pinned JWKS configuration. Approval is single-human in this release;
independent co-approval is not implemented. Gateway lifecycle events record
authenticated actors and transitions in SQLite; they are not administrator-proof
or an external append-only audit service.

## Qualification and remaining gates

The automated suite runs separate real gateway/destination child processes,
uses ephemeral **test-only** identity keys and credentials and real host time,
and inspects actual persisted destination records. A network proxy injects
transport failures outside the package. This is executable integration testing,
not a fixed synthetic product demonstration. Test JWTs establish verifier
behaviour, not a successful login with a real identity provider or real human.

Before admitting customer data or deploying beyond a controlled environment:

1. Verify actual IdP login, MFA claims, human authority removal and key rotation.
2. Deploy under separate service accounts with reviewed TLS, storage, backups,
   capacity/rate controls, permissions and incident ownership.
3. Complete independent security review and deployment-specific acceptance.
4. Qualify the selected real ERP/CRM connector before claiming it is supported.

No tests establish global superiority, certification, fraud prevention, financial
benefit, arbitrary external enforcement or production readiness for every buyer.
This implementation is an operational integration release candidate awaiting
those external qualification gates, not the old fixture-only plugin relabelled.

## Candidate upgrade and identity-policy changes

This candidate adds an identity-policy digest to every new approval. Changing
issuer, audience, client, context, authentication-age policy or other identity
profile fields invalidates unused approvals before admission. Changing only
public JWKS keys does not. Older rc.1 approvals lack this digest and are refused
after upgrading; cancel or expire pending work first, and obtain new approvals.
Do not upgrade while actions are in flight. Preserve the same deployment keys,
URLs and databases and reconcile unresolved outcomes before resuming. There is
no automated rolling-upgrade or schema-migration qualification.

The rc.2 package includes Microsoft MSAL Node 7.1.0 and its reviewed runtime
dependency graph in `npm-shrinkwrap.json`; it is no longer dependency-free.
Install with `--ignore-scripts` where your operating policy requires it.
