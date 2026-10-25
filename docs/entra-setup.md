# Microsoft Entra ID setup for ATG operational rc.2

This is an implemented integration, pending verification in your actual tenant.
No tenant, application, licence, user or signing credential is supplied by ATG.
You do not need a commercial partner: your organisation can run the record
service and configure its own Microsoft Entra tenant.

## 1. Register the ATG API

In your Microsoft Entra **workforce tenant**, register a single-tenant application
named, for example, **ATG Approval API**. Record the directory (tenant) UUID and
application (client) UUID. Use lower-case UUIDs in the ATG configuration.

- Set `api.requestedAccessTokenVersion` to `2` in the application manifest.
- Expose an API with Application ID URI `api://<API_APPLICATION_UUID>`.
- Add the delegated scope `atg.approve`, with administrator-only consent.
- Under Token configuration, add the access-token optional claims `auth_time`
  and `acrs`. ATG requires a recent authentication time; token issue time is not
  a substitute. Set the equivalent manifest entries if the portal UI differs.
- Restrict enterprise-application access to the intended approval users/groups
  using assignment as appropriate for your organisation. The ATG local human
  allowlist remains an additional, independent control.

ATG validates tokens for this custom API, never a Microsoft Graph token.
Application permissions/roles alone do not provide the delegated approval scope.

## 2. Register the human approval client

Register a second single-tenant application, for example **ATG Approver CLI**.
Its UUID must differ from the API UUID. Add a **Mobile and desktop applications**
redirect URI of `http://localhost`. MSAL starts a loopback listener on a random
local port, bound to 127.0.0.1, and uses PKCE to redeem the authorisation code.
This public desktop client does not need a client secret. Do not create one for
ATG or use a username/password grant.

Add the delegated permission for **ATG Approval API / atg.approve** and grant
administrator consent. Preauthorise this client for that scope if your consent
policy calls for it. The gateway additionally pins this exact client UUID via
`azp`; another application cannot use its tokens to approve through ATG.

## 3. Protect the authentication context

Create/publish an authentication context, such as `c1`, and attach an **enabled,
not report-only**, Conditional Access policy covering every intended approver.
Require your chosen MFA/authentication strength, preferably phishing-resistant
MFA. Configure reauthentication/sign-in frequency to meet ATG's maximum age
(default recommended profile: 300 seconds); validate the resulting access-token
`auth_time` in your tenant. ATG requests a fresh login and the context, but the
administrator controls the actual authentication policy.

Conditional Access has Microsoft licence and role requirements; check your
subscription. **A context with no protecting policy can still appear in `acrs`.**
ATG cannot discover whether the policy is enabled, has exclusions, or requires
MFA. Confirm these settings and test with an intended approver before claiming
that your deployed ATG enforces MFA. If the context or authentication time is
absent, ATG refuses the token rather than falling back to weaker claims.

## 4. Retrieve trusted public signing keys

Install the reviewed rc.2 archive with Node 24.19+ using the main deployment
guide. Create an absolute-path JSON file with your actual values:

```json
{
  "tenantId": "YOUR_DIRECTORY_TENANT_UUID",
  "audience": "YOUR_ATG_API_APPLICATION_UUID",
  "clientId": "YOUR_APPROVER_CLIENT_APPLICATION_UUID",
  "requiredAuthenticationContext": "c1",
  "maximumAuthenticationAgeSeconds": 300
}
```

Run from an authorised operator environment with HTTPS access to Microsoft:

```sh
npx --no-install atg-operational entra-discover /absolute/entra-profile.json /absolute/new-entra-trust.json
```

The command fetches only tenant-specific discovery and signing-key URLs on
`login.microsoftonline.com`. It checks the exact issuer, key issuer, public RSA
key strength and unique key IDs. It rejects redirects and substituted endpoints,
limits responses and refuses to overwrite an existing output file. No app secret,
admin token or user token is needed to fetch public metadata. This is explicit
operator discovery, not a JWT-header-driven key fetch.

Place the entire resulting JSON object into `identity` in your deployment
trust-policy JSON from the main guide. For each `humans[]` entry, use the person's
**Object ID in this directory** as `subject`, `active: true` and their permitted
record prefix. Use Entra Users to find the Object ID; do not use their email,
application ID, service principal ID or pairwise `sub` claim.

Initialise the services with the main guide. For an existing deployment, update
the gateway's private configuration deliberately and preserve role permissions,
keys and databases. See the candidate-upgrade guidance before changing versions.
Never copy the gateway's private configuration to an approver laptop.

## 5. Give the approver a public login configuration

Create a separate JSON file containing only:

```json
{
  "gatewayUrl": "https://YOUR_ATG_GATEWAY_HOST",
  "identity": "REPLACE_THIS_STRING_WITH_THE_ENTIRE_GENERATED_ENTRA_TRUST_OBJECT"
}
```

`identity` must be the actual JSON object, not a quoted filename or the string
above. No gateway/destination secret, agent token or service key belongs in this
file. Distribute it through your trusted configuration channel: it controls
which tenant and gateway the approval client uses.

On the approver's own computer and interactive terminal, run:

```sh
npx --no-install atg-operational entra review /absolute/approver-login.json REQUEST_ID
```

Open the printed Microsoft sign-in URL in a browser **on the same computer**.
Complete company sign-in/MFA. The tool reads the exact proposed action and the
before/after record from the gateway and displays the full proposal. Check it,
then type `approve ` followed by the full displayed digest. Any other answer
cancels without approval. No token is printed, written to disk or passed to the
agent. Terminating the CLI discards its process-local token/cache; it does not
sign you out of Microsoft in your browser.

For inspection without approval, use `entra inspect CONFIG REQUEST_ID`.
To revoke an unused request, use `entra revoke CONFIG REQUEST_ID REVIEWED_DIGEST`.
Each command initiates its own sign-in. Revocation cannot undo an action already
admitted for execution. Existing generic token-based commands remain available
for separately managed SDK integrations; the gateway applies the same Entra
validation to their tokens when its Entra profile is configured.

This first approver interface is a terminal application, not a hosted approval
portal. Keep the approver session and its tools separate from the agent.

## 6. Complete actual tenant acceptance

Before representing the deployment as verified:

1. Sign in as an explicitly authorised user with the configured context policy
   enabled; review and approve one operator-owned non-payment record update.
   Execute via the agent SDK and independently read the record and signed receipt.
2. Confirm a non-authorised user, wrong-client/API token, app-only token and a
   token lacking the protected context cannot approve. Check Entra sign-in logs
   for the intended authentication and Conditional Access policy result.
3. Confirm missing/old `auth_time` refuses approval; correct the API registration
   or reauthentication policy rather than replacing it with `iat`.
4. Record the tenant/application IDs, enabled context policy, deployment version,
   receipt and observed result without storing access/refresh tokens in reports.

The repository's integration suite exercises these token rules and actual record
writes with test-only signing keys. It does **not** establish that Microsoft has
issued a token for your apps or that your tenant policy is correctly configured.

## Signing-key rotation and limits

The gateway uses the operator-pinned public key set on every request. An unknown
key ID fails closed. Before Microsoft key rollover, run `entra-discover` into a
new file, review it, and atomically update only `identity.jwks` in the private
gateway configuration. Keep all currently published relevant keys; do not pin a
single key. There is no unattended JWKS refresh or stale-key grace period in
this candidate. Refresh promptly if login starts failing with an unknown key.

Supported scope is the Microsoft public commercial cloud, one configured tenant,
two app registrations and an operator-maintained human allowlist. Sovereign
clouds, B2C/External ID customer tenants, custom claims-mapping signing keys,
automatic directory revocation, Continuous Access Evaluation and a hosted browser
approval portal are not implemented/qualified. Disabling a user in Entra may not
immediately invalidate a previously issued bearer token here; set their local
ATG `active` flag to false or use emergency stop to prevent new admission.

## Microsoft references checked 18 October 2026

- [MSAL Node token acquisition](https://learn.microsoft.com/en-us/entra/msal/javascript/node/acquire-token-requests)
- [Interactive request API](https://learn.microsoft.com/en-us/javascript/api/@azure/msal-node/interactiverequest)
- [Access-token claims](https://learn.microsoft.com/en-us/entra/identity-platform/access-token-claims-reference)
- [Optional claims](https://learn.microsoft.com/en-us/entra/identity-platform/optional-claims-reference)
- [Authentication-context developer guidance](https://learn.microsoft.com/en-us/entra/identity-platform/developer-guide-conditional-access-authentication-context)
- [Signature validation and metadata endpoints](https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/app-integration/troubleshooting-signature-validation-errors)
