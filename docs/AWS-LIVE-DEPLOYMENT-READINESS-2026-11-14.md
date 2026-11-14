# Live AWS deployment readiness — 14 November 2026

Gareth Price authorised proceeding towards a live AWS deployment. This is the concrete trial scope and prerequisite record, not a deployment receipt or deployable infrastructure package.

## Current verified position

- ACS/AP2/Cedar research was merged in PR #48 at `112d2cf5f332c224a832946873d4028e2bea46fc`.
- Post-merge regression run 43531510638 succeeded.
- The AWS experiment runs the actual Cedar WASM engine against a local MCP REQUEST-interceptor contract subset. It is not deployed to Lambda or managed AgentCore.
- No AWS deployment-capable connection is available in this session. Plugin discovery found an AWS analytics integration, whose advertised scope does not provide the required AgentCore/Lambda provisioning capability. Neither an AWS CLI nor Boto3 is installed in the task runtime. This does not establish whether Gareth owns an AWS account.
- No AWS account identity, permissions, available region, billing arrangement or spending ceiling has been verified. No AWS resource has been created or cloud bill incurred by this work.

## Proposed first live trial

One private, authenticated AgentCore route guarding a fictional order change; no real payment, purchase, customer data, inference model or automatic outreach. Use an isolated trial stack with an explicit teardown procedure. Select an available region only after inspecting the authorised account and service availability.

Target architecture for engineering review:

1. Authenticated gateway caller with an explicit server-owned mapping to the permitted agent/mandate. Do not treat forwarded headers or an agent's identity claim as authenticated authority.
2. Request-interceptor Lambda using a supported, tested runtime and a reviewed raw/parsed JSON boundary. Preserve the existing exact-action signature and native Cedar policy checks.
3. A separately controlled approval/issuance boundary. No signing key in an agent-accessible endpoint; no automatic issuer creation/reset on each invocation.
4. A protected synthetic destination with retained one-use/idempotency records and an atomic update of the fictional order. A DynamoDB transaction is a candidate implementation requiring specific design/tests; it is not implemented by this document. Lambda `/tmp`, process memory and disposable SQLite fixtures cannot supply this cross-invocation guarantee.
5. IAM permissions restrict the gateway to the selected interceptor/target and restrict the caller from bypassing the protected destination. Evidence records contain no credentials, forwarded tokens or private keys.

These cloud components and their trust relationships require implementation and review. Uploading the local fixture unchanged would not complete the live guarded route. Deployment in one commonly administered AWS account would not establish independent administration or administrator-resistant rollback protection.

## Acceptance evidence to collect

- Record actual account/region/resource identities privately, deployed source digest and runtime versions.
- One exact authorised fictional change succeeds once; lookup identifies its retained outcome.
- Altered amount/payee/resource, wrong caller, expired authority, invalid signature and replay are refused without an extra effect.
- Repeat requests across separate Lambda invocations cannot reset authority or cause another effect.
- Target-side checks refuse direct or alternative submission paths within the scoped trial; enumerate unsupported paths.
- Interceptor/target outage and lost response yield no automatic retry or fallback. Reconcile uncertain outcomes using retained destination truth.
- Verify that no signing/enrollment/administration endpoint is exposed to the agent.
- Retain failed attempts and limitations as well as successful checks; report native AWS controls fairly.
- Remove trial resources after the agreed test and verify teardown. Do not describe a billing alert as a hard spending cap.

## Account and cost prerequisites

Required before provisioning: secure authorised account access, confirmed deployer identity/permissions, region selection, and Gareth's trial spending ceiling. Do not request or paste root credentials, access keys or session secrets into chat. Use an approved secure sign-in/federated access route.

Current AWS pricing is consumption based for AgentCore Gateway/Policy; Lambda, storage, logging and data transfer may add separate charges. Free-tier eligibility and the complete trial cost have not been established. No numerical total is promised. A proposed small trial ceiling needs explicit agreement and a resource/request limit plus teardown plan; a cloud billing alert alone does not enforce it.

## Primary references checked

- https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-create.html
- https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-create-api.html
- https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-interceptors.html
- https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-interceptors-types.html
- https://aws.amazon.com/bedrock/agentcore/pricing/

The immediate next step is establishing whether Gareth has an AWS account and a secure deployment-access route. Account access is necessary input, not renewed permission to perform the engineering already authorised. Production NO-GO remains.
