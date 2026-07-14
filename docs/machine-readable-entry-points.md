# Machine-Readable Entry Points

## Purpose

This document lists the canonical repository entry points that humans, AI assistants, search systems, and technical reviewers can read before running local demos.

## Entry Points

| Resource | Role | Authority |
| --- | --- | --- |
| `README.md` | Human start page and reviewer-first run path | Primary human entry point |
| `agent-trust-gate.discovery.json` | Canonical machine-discovery summary | Primary machine-discovery record |
| `llms.txt` | Agent-readable repository summary | Supporting agent-readable guide |
| `agent-trust-gate.agent-card.json` | Project metadata and safety boundary | Informational project metadata, not a live A2A endpoint |
| `agent-trust-gate.manifest.json` | Code-readable integration and discovery metadata | Supporting integration metadata |
| `schemas/` | Local schemas for proof and GatePass structures | Schema reference |
| `examples/` | Deterministic local examples and reports | Example reference |
| `docs/one-command-reviewer-demo-kit.md` | Reviewer kit explanation | Reviewer entry point |
| `docs/embedded-commerce-gatepass.md` | Local synthetic commerce GatePass use case | Optional specialist scenario, not a live checkout or payment integration |
| `docs/paid-pilot-commercial-entry.md` | Paid Evaluation Pilot entry | Commercial entry point |
| `docs/public-positioning-claims-boundary.md` | Public claims boundary | Claims boundary |
| `discovery-site/index.html` | Static Pages source | Active public passive discovery homepage |
| `.github/workflows/deploy-discovery-pages.yml` | Selected-file Pages workflow | Active GitHub Actions Pages deployment workflow |

## Conflict Resolution

Use this order when fields differ:

1. `agent-trust-gate.discovery.json` for current machine-discovery status and inactive integration status.
2. `README.md` for reviewer-first human navigation.
3. `agent-trust-gate.manifest.json` for code-readable integration metadata.
4. `agent-trust-gate.agent-card.json` for project metadata, not operational A2A service claims.
5. `llms.txt` for agent-readable summary guidance.

No file should be interpreted as a live API endpoint, A2A service, MCP server, npm package publication, payment route, settlement route, or action-execution authority. The GitHub Pages route is static passive discovery only.

Verified public Pages URL: `https://gareth1953.github.io/agent-trust-gate/`. Activation evidence is recorded in `docs/passive-discovery-activation-record.md`.

## Reviewer Route

Start with:

```powershell
npm run demo:reviewer-kit
```

Then inspect:

- `agent-trust-gate.discovery.json`
- `examples/machine-discovery-report.json`
- `docs/registry-readiness-scorecard.md`
- `docs/embedded-commerce-gatepass.md`
- `examples/embedded-commerce-gatepass-report.json`
- `docs/github-pages-passive-discovery-activation.md`
- `docs/passive-discovery-live-verification-checklist.md`
- `docs/a2a-discovery-readiness-boundary.md`
- `docs/mcp-registry-readiness-boundary.md`
- `docs/npm-publication-readiness.md`

## Safety Boundary

The machine-readable entry points are static or local-only. P3-M143A verifies a selected-file GitHub Pages static discovery deployment. P3-M144 adds local synthetic commerce basket verification only. These entry points do not add live APIs, product network calls, live retailer integration, shopping-agent integration, checkout, account login, card handling, payment-token handling, autonomous contact, direct bot messaging, live agent-to-agent communication, real tool execution, payment processing, settlement execution, production signing, package publication, registry registration, or operational A2A/MCP endpoints.
