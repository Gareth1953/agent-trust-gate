# Agent Trust Gate Technical Control Map to the OWASP Top 10 for Agentic Applications 2026

> “This document is a technical control mapping for reviewer discussion. It is not an OWASP certification, compliance assessment, security certification or claim that Agent Trust Gate fully mitigates any listed risk.”

## Scope and source

This map compares the local Agent Trust Gate™ (ATG) reviewer demonstrator with
the [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/).
The OWASP resource page is dated 9 December 2025 and its versioned document is
dated December 2025. Source status was checked on 26 July 2026.

The mapping describes possible control contributions at an action-authorisation
boundary. It does not extend ATG beyond its tested local behavior.

Only these mapping statuses are used:

- Demonstrated control contribution
- Partial or indirect contribution
- Future integration work
- Outside ATG core scope

## ASI01 — Agent Goal Hijack

- **Relevance to ATG:** A hijacked goal may cause an agent to propose an action
  outside the operator's mandate, approved scope or intended target.
- **Mapping status:** Demonstrated control contribution
- **Current demonstrator evidence:** The verifier reconstructs the proposed
  action at the point of simulated execution and refuses changed amounts,
  targets, tools, sessions, runs, mandates and environments. High-impact
  actions without approval do not proceed.
- **Precise local references:** `verifyExactActionAtExecution` and
  `collectActionBindingReasons` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  `changed_amount_refused` and `changed_target_refused` in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts);
  [`docs/gatepass-round-trip-threat-model.md`](gatepass-round-trip-threat-model.md).
- **Limitations and residual risks:** ATG does not detect or remove malicious
  prompts, repair an agent's goal, validate model reasoning or prove that the
  original mandate itself was safe. A hijacked agent could still choose an
  in-scope but harmful action.
- **Infrastructure controls still required outside ATG:** Prompt-injection
  defenses, content provenance, model and orchestration controls, least
  privilege, sandboxing, monitoring, human review and incident response.

## ASI02 — Tool Misuse

- **Relevance to ATG:** A legitimate tool may be invoked with the wrong
  operation, arguments, target, schema version or authority.
- **Mapping status:** Demonstrated control contribution
- **Current demonstrator evidence:** The exact-action digest binds tool
  identity, schema version, operation, canonical arguments, target and
  environment. The wrapper refuses missing proof and calls only a deterministic
  local mock after an allow.
- **Precise local references:** `createCanonicalActionEnvelope` and
  `verifyAndExecuteSimulatedAction` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  `wrapGatePassTool` in
  [`src/gatepass-tool-wrapper.ts`](../src/gatepass-tool-wrapper.ts);
  `changed_tool_schema_refused` in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts);
  [`docs/gatepass-wrapper-limitations-and-safety-boundary.md`](gatepass-wrapper-limitations-and-safety-boundary.md).
- **Limitations and residual risks:** The wrapper is not a live interception
  layer, and exact argument equality does not establish that tool behavior or
  output is safe.
- **Infrastructure controls still required outside ATG:** Real policy
  enforcement, tool allowlists, sandboxing, egress control, rate and cost
  limits, endpoint protection, runtime monitoring and secure tool
  implementation.

## ASI03 — Identity & Privilege Abuse

- **Relevance to ATG:** Agent, operator, issuer, session or delegated identity
  confusion can turn narrow authority into excessive privilege.
- **Mapping status:** Partial or indirect contribution
- **Current demonstrator evidence:** The canonical envelope binds issuer,
  subject agent, operator, native session, native run, mandate and verifier
  profile. Local verification profiles distinguish active, rotated, revoked and
  unknown fixture keys.
- **Precise local references:** `CanonicalActionEnvelopeInput`,
  `createLocalVerificationProfile` and `createVerifierContext` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  agent/session/run/mandate mismatch cases in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts);
  [`schemas/canonical-action-envelope.schema.json`](../schemas/canonical-action-envelope.schema.json).
- **Limitations and residual risks:** Identities and key status are local
  fixtures. ATG provides no authentication, federation, credential issuance,
  directory, entitlement service or production revocation feed.
- **Infrastructure controls still required outside ATG:** Enterprise IAM,
  workload identity, protected credentials, least-privilege authorization,
  authenticated delegation, key management, revocation and access monitoring.

## ASI04 — Agentic Supply Chain Vulnerabilities

- **Relevance to ATG:** A compromised model, tool, dependency, schema provider
  or build path can make an apparently authorised action unsafe.
- **Mapping status:** Outside ATG core scope
- **Current demonstrator evidence:** ATG binds an expected tool identity and
  schema version and fails on a changed schema. This can expose drift at the
  action boundary but does not establish component integrity.
- **Precise local references:** `changed_tool_schema_refused` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts) and
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts);
  [`package-lock.json`](../package-lock.json).
- **Limitations and residual risks:** ATG does not inspect packages, models,
  containers, MCP servers, build provenance, signatures, vulnerabilities or
  deployment artifacts.
- **Infrastructure controls still required outside ATG:** Supply-chain
  security, dependency review, SBOM/AIBOM processes, artifact signing,
  provenance verification, vulnerability management and secure build/deploy
  controls.

## ASI05 — Unexpected Code Execution

- **Relevance to ATG:** Agent-controlled content or tool arguments could reach
  a shell, interpreter, template engine or unsafe executable path.
- **Mapping status:** Partial or indirect contribution
- **Current demonstrator evidence:** The local wrapper treats planner output as
  untrusted proof input and refuses mismatched actions before its local mock.
  The exact-action verifier binds canonical arguments and tool schema.
- **Precise local references:** `evaluateGatePassToolCall` in
  [`src/gatepass-tool-wrapper.ts`](../src/gatepass-tool-wrapper.ts);
  `verifyAndExecuteSimulatedAction` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  [`docs/enforceable-local-tool-calling-gate-demo.md`](enforceable-local-tool-calling-gate-demo.md).
- **Limitations and residual risks:** ATG performs no code scanning, command
  sanitization, runtime confinement or exploit prevention. The reviewer command
  deliberately executes no real tool or code supplied by an agent.
- **Infrastructure controls still required outside ATG:** Sandboxing, process
  isolation, safe interpreters, input validation, endpoint protection, egress
  controls, patching and exploit monitoring.

## ASI06 — Memory & Context Poisoning

- **Relevance to ATG:** Poisoned memory or retrieved context may influence an
  agent to propose an action inconsistent with current authority.
- **Mapping status:** Partial or indirect contribution
- **Current demonstrator evidence:** The verifier does not trust the agent's
  claimed current time or claimed action. It rebinds the proposed action to
  mandate, evidence, approval, session, run and exact arguments immediately
  before simulated execution.
- **Precise local references:** `TrustedClock`,
  `verifyExactActionAtExecution` and `createFixedTrustedClock` in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  verifier-clock and action-mismatch tests in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts).
- **Limitations and residual risks:** ATG does not inspect, clean, partition or
  attest memory, retrieval stores, prompts or context. Poisoned context may
  still produce an action that remains within the issued scope.
- **Infrastructure controls still required outside ATG:** Memory isolation,
  provenance and integrity controls, retrieval filtering, prompt security,
  data governance, monitoring and recovery.

## ASI07 — Insecure Inter-Agent Communication

- **Relevance to ATG:** Forged or over-trusted inter-agent messages may create
  confused-deputy actions or obscure the original authority chain.
- **Mapping status:** Partial or indirect contribution
- **Current demonstrator evidence:** ATG's envelope can bind subject agent,
  issuer, operator, session, run, mandate and exact action independently of a
  particular transport protocol.
- **Precise local references:**
  [`schemas/canonical-action-envelope.schema.json`](../schemas/canonical-action-envelope.schema.json);
  [`docs/agent-to-agent-trust-handshake.md`](agent-to-agent-trust-handshake.md);
  [`docs/a2a-discovery-readiness-boundary.md`](a2a-discovery-readiness-boundary.md);
  identity-binding tests in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts).
- **Limitations and residual risks:** There is no live A2A server, peer
  authentication, secure channel, message broker or delegation-chain
  verification.
- **Infrastructure controls still required outside ATG:** Mutual
  authentication, message integrity and confidentiality, replay-safe
  transports, trust registries, delegation policy, network isolation and
  inter-agent monitoring.

## ASI08 — Cascading Failures

- **Relevance to ATG:** One incorrect allow, repeated action or uncertain
  execution result can propagate through connected tools and agents.
- **Mapping status:** Partial or indirect contribution
- **Current demonstrator evidence:** ATG fails closed when the verifier, clock,
  profile or nonce store is unavailable. One-use state is not reopened after
  an execution failure or missing acknowledgement, and decision evidence stays
  separate from execution evidence.
- **Precise local references:** `InMemoryNonceStore`,
  `verifyAndExecuteSimulatedAction` and execution statuses in
  [`src/exact-action-gatepass.ts`](../src/exact-action-gatepass.ts);
  failure/acknowledgement tests in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts);
  crash boundary in
  [`docs/exact-action-gatepass-and-execution-receipts.md`](exact-action-gatepass-and-execution-receipts.md).
- **Limitations and residual risks:** Same-process state cannot coordinate
  distributed retries or contain failures across services. The crash window
  between side effect and acknowledgement remains unresolved.
- **Infrastructure controls still required outside ATG:** Durable idempotency,
  distributed state, circuit breakers, rate limits, transactional recovery,
  reconciliation, runtime monitoring, capacity controls and incident response.

## ASI09 — Human-Agent Trust Exploitation

- **Relevance to ATG:** Humans may over-trust agent confidence, unsafe claims or
  an allow decision that has not resulted in execution.
- **Mapping status:** Demonstrated control contribution
- **Current demonstrator evidence:** ATG requires human approval for configured
  high-impact paths, refuses unsafe “proven safe” and “guaranteed trust” claims,
  and states that allowed does not mean executed.
- **Precise local references:** `high_risk_requires_human_review` and unsafe
  claim scenarios in
  [`src/gatepass-tool-wrapper.ts`](../src/gatepass-tool-wrapper.ts);
  separate receipt tests in
  [`test/exact-action-gatepass.test.ts`](../test/exact-action-gatepass.test.ts);
  [`docs/gatepass-trust-language-safety-boundary.md`](gatepass-trust-language-safety-boundary.md).
- **Limitations and residual risks:** A reference string does not prove an
  approver's identity, informed understanding or freedom from manipulation.
  Interface quality and organizational approval practice are outside the demo.
- **Infrastructure controls still required outside ATG:** Strong approver
  authentication, usable confirmation interfaces, separation of duties,
  training, anti-phishing controls, audit review and escalation procedures.

## ASI10 — Rogue Agents

- **Relevance to ATG:** A compromised or misaligned agent may attempt actions
  beyond its mandate or repeatedly seek consequential access.
- **Mapping status:** Partial or indirect contribution
- **Current demonstrator evidence:** Exact-action scope, expiry, approval,
  verifier-controlled time and one-use nonces limit what one local GatePass can
  authorise. Refusals occur before the local mock or simulated side effect.
- **Precise local references:** exact-action scenarios in
  [`src/reviewer-conversion-cli.ts`](../src/reviewer-conversion-cli.ts);
  [`test/reviewer-conversion-cli.test.ts`](../test/reviewer-conversion-cli.test.ts);
  [`docs/refusal-condition-matrix.md`](refusal-condition-matrix.md).
- **Limitations and residual risks:** ATG does not identify rogue behavior,
  disable an agent, revoke production credentials, inspect planning or contain
  processes. A rogue agent may act through any path that does not enforce the
  gate.
- **Infrastructure controls still required outside ATG:** Agent lifecycle
  management, behavioral monitoring, kill switches, credential revocation,
  sandboxing, network isolation, endpoint protection and incident response.

## Controls ATG does not replace

ATG does not replace:

- sandboxing;
- network isolation;
- secrets management;
- endpoint protection;
- runtime monitoring;
- supply-chain security;
- model security;
- incident response infrastructure.

Those controls remain necessary even if an external system later integrates an
action-level GatePass verifier.
