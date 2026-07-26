# NIST Agent Security, Identity and Authorisation Reference Map

## Status and disclaimer

This document maps local Agent Trust Gate™ (ATG) evidence to current NIST
discussion areas for technical review. ATG is not NIST-certified,
NIST-approved or formally assessed against a NIST standard.

The sources checked on 26 July 2026 were:

1. [NIST AI Agent Standards Initiative](https://www.nist.gov/artificial-intelligence/ai-agent-standards-initiative) — an ongoing initiative, created 17 February 2026 and shown by NIST as updated 20 April 2026.
2. [Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization](https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd) — an Initial Public Draft concept paper published 5 February 2026. Its public comment period closed on 2 April 2026.
3. [Summary Analysis of Responses to the Request for Information Regarding Security Considerations for AI Agents](https://www.nist.gov/publications/summary-analysis-responses-request-information-regarding-security-considerations-ai) — NIST Trustworthy and Responsible AI 800-5, published 18 May 2026. It is a summary analysis of RFI responses, not an ATG certification mechanism.

The AI Agent Standards Initiative discusses voluntary guidelines,
interoperable protocols, agent authentication and identity infrastructure. The
Initial Public Draft requests discussion of identification, authorization,
auditing, non-repudiation and prompt-injection controls. The mappings below are
therefore reviewer references, not a conformance assessment.

Only these statuses are used:

- Demonstrated control contribution
- Partial or indirect contribution
- Future integration work
- Outside ATG core scope

## Discussion-area mapping

### Agent identification and binding

- **Mapping status:** Partial or indirect contribution
- **What ATG demonstrates locally:** The canonical envelope binds issuer,
  subject agent, operator, native session and native run identifiers to an
  exact action digest. Verification constraints refuse mismatched identities.
- **Evidence:** `CanonicalActionEnvelopeInput`, `createVerifierContext` and
  `collectActionBindingReasons` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  agent/session/run mismatch tests in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts);
  [`schemas/canonical-action-envelope.schema.json`](../schemas/canonical-action-envelope.schema.json).
- **Boundary:** These are synthetic identifiers, not authenticated enterprise
  identities.

### Action-level authorisation

- **Mapping status:** Demonstrated control contribution
- **What ATG demonstrates locally:** A one-use GatePass signs an exact canonical
  action. The verifier reconstructs the proposed action immediately before a
  local simulated side effect and refuses changed amount, target, tool schema
  and arguments.
- **Evidence:** `issueExactActionGatePass`,
  `verifyExactActionAtExecution` and `verifyAndExecuteSimulatedAction` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  [`docs/exact-action-gatepass-and-execution-receipts.md`](exact-action-gatepass-and-execution-receipts.md).
- **Boundary:** ATG is not connected to a real policy enforcement point or
  production endpoint.

### Mandate and scope

- **Mapping status:** Demonstrated control contribution
- **What ATG demonstrates locally:** Mandate identity, reference and digest,
  tool, operation, target, value and environment are bound into the action.
  Missing mandate and scope mismatches refuse the wrapper action.
- **Evidence:** `createCanonicalActionEnvelope` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  `missing_mandate_blocks` in
  [`src/gatepass-tool-wrapper.ts`](../src/gatepass-tool-wrapper.ts);
  [`test/reviewer-conversion-cli.test.ts`](../test/reviewer-conversion-cli.test.ts).
- **Boundary:** The demo does not issue, validate or govern real organizational
  mandates.

### Auditing

- **Mapping status:** Demonstrated control contribution
- **What ATG demonstrates locally:** Deterministic policy decision,
  verification, refusal and simulated execution receipts record GatePass ID,
  digest, nonce, verifier time, reasons and outcome.
- **Evidence:**
  [`schemas/policy-decision-receipt.schema.json`](../schemas/policy-decision-receipt.schema.json),
  [`schemas/exact-action-verification-result.schema.json`](../schemas/exact-action-verification-result.schema.json),
  [`schemas/execution-receipt.schema.json`](../schemas/execution-receipt.schema.json),
  and receipt tests in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts).
- **Boundary:** Receipts are not written to a durable, immutable or externally
  witnessed audit service by the reviewer command.

### Non-repudiation concepts

- **Mapping status:** Partial or indirect contribution
- **What ATG demonstrates locally:** A local Ed25519 fixture signature covers
  the exact GatePass, and separate receipts preserve decision and simulated
  execution facts.
- **Evidence:** `issueExactActionGatePass`, `verifyGatePassSignature` and
  `createExecutionReceipt` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  [`schemas/exact-action-gatepass.schema.json`](../schemas/exact-action-gatepass.schema.json).
- **Boundary:** Fixture signing, local timestamps and in-memory state do not
  provide legal non-repudiation, production key custody, trustworthy identity,
  external timestamping or durable evidence.

### Approval evidence

- **Mapping status:** Demonstrated control contribution
- **What ATG demonstrates locally:** Approval-required actions bind approval
  reference and digest. Missing approval prevents issuance or produces a
  high-risk refusal at the wrapper boundary.
- **Evidence:** `issueExactActionGatePass` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  `high_risk_requires_human_review` in
  [`src/gatepass-tool-wrapper.ts`](../src/gatepass-tool-wrapper.ts);
  approval tests in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts).
- **Boundary:** A local reference does not authenticate the approver or prove
  informed consent.

### Replay prevention

- **Mapping status:** Demonstrated control contribution
- **What ATG demonstrates locally:** `InMemoryNonceStore` atomically consumes a
  one-use nonce in the same JavaScript process. Replays and concurrently
  started attempts cannot both succeed in that process.
- **Evidence:** `InMemoryNonceStore` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  replay and concurrency tests in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts);
  `consumed_gatepass_replay_refused` in
  [`src/reviewer-conversion-cli.ts`](../src/reviewer-conversion-cli.ts).
- **Boundary:** State is not durable or distributed and is lost on process
  restart.

### Refusal evidence

- **Mapping status:** Demonstrated control contribution
- **What ATG demonstrates locally:** Stable reason codes and separate execution
  receipts distinguish expiry, replay, action mismatch, key status and
  verifier unavailability. Missing evidence, mandate and approval are visible
  wrapper outcomes.
- **Evidence:** `GatePassFailureReasonCode` and
  `statusForVerificationFailure` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  [`docs/refusal-condition-matrix.md`](refusal-condition-matrix.md);
  [`test/reviewer-conversion-cli.test.ts`](../test/reviewer-conversion-cli.test.ts).
- **Boundary:** Refusal records are local evidence and do not prove external
  enforcement.

### Interoperability and protocol-neutrality

- **Mapping status:** Partial or indirect contribution
- **What ATG demonstrates locally:** Versioned JSON schemas, canonical action
  encoding and explicit identity/action fields are transport-neutral local
  artifacts.
- **Evidence:**
  [`schemas/canonical-action-envelope.schema.json`](../schemas/canonical-action-envelope.schema.json),
  [`schemas/exact-action-gatepass.schema.json`](../schemas/exact-action-gatepass.schema.json),
  and [`docs/reference-integration-examples.md`](reference-integration-examples.md).
- **Boundary:** ATG has no live A2A, MCP, OAuth, SPIFFE or other protocol
  integration and claims no interoperability standard conformance.

### Prompt-injection consequences at the action boundary

- **Mapping status:** Partial or indirect contribution
- **What ATG demonstrates locally:** Planner or model output is not treated as
  authority. A prompt-influenced material change to the approved action is
  refused when the point-of-action verifier reconstructs the action.
- **Evidence:** changed-action scenarios in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  [`docs/gatepass-round-trip-threat-model.md`](gatepass-round-trip-threat-model.md).
- **Boundary:** ATG does not detect prompt injection, clean context, validate
  model reasoning or prevent an injected action that remains inside the
  approved envelope.

### Human oversight for consequential actions

- **Mapping status:** Demonstrated control contribution
- **What ATG demonstrates locally:** Approval-required fields are bound into
  exact-action authority; high-risk and settlement-sensitive wrapper paths
  require human review or signed proof and do not run their mock tool.
- **Evidence:** `approvalRequired` handling in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  high-risk and pre-settlement scenarios in
  [`src/gatepass-tool-wrapper.ts`](../src/gatepass-tool-wrapper.ts);
  [`docs/local-settlement-blocker-simulation.md`](local-settlement-blocker-simulation.md).
- **Boundary:** Production approval workflow, identity, separation of duties,
  revocation and user-interface design remain outside the demo.

## What ATG demonstrates locally

- Exact-action canonical binding and local fixture verification.
- Fixed verifier-controlled time and expiry refusal.
- Same-process one-use replay prevention.
- Explicit mandate, evidence, approval and signed-proof outcomes.
- Separate policy decision and simulated execution evidence.
- Deterministic refusal codes and no-external-action flags.

## What requires production identity infrastructure

- Authenticated agent, operator, issuer, verifier and approver identities.
- Enterprise directories, workload identity, federation and delegation.
- Protected key custody, rotation, revocation and recovery.
- Credential lifecycle, least privilege and entitlement administration.

## What requires external enforcement

- A real policy enforcement point at every consequential endpoint.
- Sandboxing, network isolation, secrets management and endpoint protection.
- Durable nonce/idempotency storage and transactional recovery.
- Tamper-resistant audit storage, runtime monitoring and incident response.
- Model, prompt, memory, tool and supply-chain security controls.

## What remains future work

- Production identity and authorization integration.
- Protocol adapters validated against real systems.
- Durable distributed replay state and crash reconciliation.
- Signed external execution acknowledgements and trustworthy timestamps.
- Security evaluation of an agreed deployment architecture.
