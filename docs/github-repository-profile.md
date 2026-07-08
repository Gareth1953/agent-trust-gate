# GitHub Repository Profile

These are human-copyable suggestions for a future approved repository setup. P3-M107 makes no API call, performs no GitHub automation, and does not add or push to a remote.

## Repository identity

- Suggested repository name: `agent-trust-gate`
- Suggested short description: Local-first pre-action / pre-settlement trust enforcement for agent-led actions and payments.
- Suggested pinned repository description: Code-readable local proof for mandate, evidence, verified intent, receipts, replay safety, and settlement blocking.

## Suggested long description

Agent Trust Gate™ is a local-first pre-action / pre-settlement trust enforcement layer for agent-led actions and payments. It demonstrates deterministic checks for mandate, evidence, verified intent, policy/risk tier, receipt validity, replay safety, and settlement-blocker eligibility before a simulated settlement decision. It is local demo code, not a hosted API, production payment system, or settlement service.

## Suggested GitHub topics

`ai-agents`, `agentic-ai`, `trust`, `governance`, `receipts`, `pre-settlement`, `mcp`, `a2a`, `safety`, `typescript`

The `mcp` and `a2a` topics describe architectural relevance only. No MCP/A2A adapter is active.

## Suggested About/sidebar settings

- Description: use the suggested short description.
- Website: leave blank until a separately approved static site exists.
- Topics: use only the reviewed topic list.
- Releases: enable only when Gareth approves a release.
- Packages: do not publish a package as part of this mission.

## Suggested first release

Title: `v0.1.0-rc.1 — Local Trust Gate Proof Release Candidate`

Summary:

> Local release candidate for code review and deterministic proof. Includes the local gate decision flow, receipt/audit artifacts, receipt verification, replay protection, settlement-blocker simulation, end-to-end money-gate proof, static manifest, schemas, examples, and developer landing page. No live payment, settlement, hosted API, external agent contact, production signing, or action execution is active.

AUC is not integrated. Agent Contact System is not integrated.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
