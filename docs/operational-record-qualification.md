# Operational record plugin: implementation and qualification

Date: 18 October 2026. Version: `@agent-trust-gate/operational@0.2.0-rc.2`.
Base: `15c8275f85d70eabbb89f9fd59c5d30e85654e1d`.

## Result

An opt-in installable SDK now controls real persistent versioned JSON record
updates across separate gateway and destination services. This is a bounded
operational implementation, not a fixed-response or synthetic execution
demonstrator. Test identities and injected faults live only in the automated
tests, not in the shipped package. Actual IdP login and customer deployment
qualification have not occurred.

The current source and operational package use shared canonical ordering with
the existing ATG core. The operational authority path does not import the
fixture-only gateway or any public evaluation signing key. Existing exact-action
binding, one-use authority and explicit uncertainty principles are retained in
a new versioned record-operation contract. The historical sealed local.7 archive
and all other published evaluation archives are unchanged.

## Checks

- Repository TypeScript build and typecheck.
- Existing main test phase: 675 passed.
- Final posttest phase including the operational suite: 1,013 passed.
- Final `npm test` total: 1,688 passed, zero failures and zero skipped cases.
- Operational suite: 26 passed, no skipped cases. Now included in posttest.
- Fresh installation: import the public SDK and rerun the operational suite
  against the exact packaged runtime and separate child services.
- Published-evaluation public-claims validator: passed. Its website-script
  network check is explicitly scoped; it is not a security scan of the new services.
- `git diff --check`.

The legacy test suite requires an actual Node 20 executable through
`ATG_NODE20_PATH`. The first attempt lacked it and failed one environment check.
A temporary Node 20 runtime was supplied and that suite then passed; the system
Node 24 runtime was not replaced. No test was disabled to obtain a pass.

The Entra update also passed a live **public metadata** discovery check against
Microsoft's documented tenant (four public signing keys). This used no user
authentication, registered ATG application or customer system. It does not
establish an actual ATG login. Runtime dependency audit reported zero known
vulnerabilities at the time of the check; this is not a security certification.
The installed rc.2 archive carries an explicit dependency shrinkwrap.

## What the operational suite establishes

1. Two actual service child processes commit an authorised record and preserve
   separately signed outcomes across process restart.
2. No write without approval; approval of a different digest fails.
3. Changed destination version/data refuses stale execution.
4. Concurrent execute calls produce one physical version increment.
5. Lost response after commit returns UNKNOWN, then reconciles to persisted success.
6. Failure before commit and signed absence stay UNKNOWN; no blind retry.
7. Tampered outcome evidence cannot establish success.
8. Revocation, emergency stop and human-authority removal block new dispatch.
9. Real-time expiry blocks an expired approval.
10. Agent credentials cannot approve, obtain a claim permit or bypass the destination.
11. JWT signature, issuer, audience, time, authentication age/method, purpose,
    scope and human subject policy are checked independently.
12. Public cleartext endpoints, malformed actions and non-JSON SDK values fail closed.
13. Changed policy version invalidates outstanding authority.
14. Agent resource scope and human approval scope are checked independently.
15. Different approvals for the same record version cannot both update it.
16. Approval replacement and post-admission revocation are refused.
17. Explicit provisioning generates private, distinct role keys/credentials
    without creating a human identity or printing credentials.
18. Durable lifecycle audit records the authenticated approver and transitions
    without storing their access token.
19. The approver can inspect before/after documents near the supported size
    limit, approve them and obtain the correct persisted result.

20. The Entra profile authenticates a delegated access token using tenant object
    ID, approves an actual record write and persists the identity evidence.
21. Wrong tenant, API audience, client, token version/class, user, scope, context,
    signature and authentication time are refused independently.
22. Changing identity policy invalidates unused approvals before admission.
23. Interactive MSAL requests carry the exact API scope, context, fresh-login
    request and unique nonce; malformed/consumer profiles are refused.
24. Discovery accepts tenant-pinned metadata and issuer-matched RSA public keys.
25. Substituted metadata URLs, wrong key issuer, duplicate keys and disabled TLS
    verification are refused.
26. The interactive approval CLI refuses unattended input before sign-in.

These are functional integration checks with test-only identity keys, temporary
databases and local transport. They are not statistical failure rates, payment
tests, a real IdP authentication ceremony or independent security assurance.

## Reproduction

```sh
npm ci --ignore-scripts
npm run build
npm run typecheck
ATG_NODE20_PATH=/absolute/path/to/node20 npm test
npm run test:operational
node scripts/build-operational-plugin.mjs /absolute/new/package-staging
npm pack /absolute/new/package-staging --pack-destination /absolute/output
node scripts/test-operational-package.mjs /absolute/output/agent-trust-gate-operational-0.2.0-rc.2.tgz
```

No script silently resets existing operator state. Operational tests use their
own temporary state and delete only those owned test directories on completion.

## Release disposition

Draft operational candidate for engineering review. No website deployment,
production enablement, payment integration, registry publication, customer-data
access, IdP registration or live customer trial is performed by this change.
See [installation, security, assumptions and remaining gates](operational-record-plugin.md).

## Entra acceptance still required

No operator-owned Entra tenant/app registration was available in this session.
The Microsoft MSAL browser sign-in command is implemented but a real interactive
sign-in has not been exercised. The tests validate claims and service effects
using ephemeral test-only signing keys, and test the login-request contract;
they do not simulate a successful production sign-in in the shipped package.
Follow [the Entra setup and tenant acceptance guide](entra-setup.md) before
claiming actual Microsoft authentication or MFA enforcement. Conditional Access
licensing/policies, live public-key refresh operations, desktop/browser behaviour
and deployment-specific TLS/process isolation remain operator acceptance work.
