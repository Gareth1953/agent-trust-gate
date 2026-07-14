# Registry Readiness Scorecard

## Purpose

This scorecard gives reviewers a concise view of passive discovery and registry readiness. It uses status language, not inflated percentages.

| Area | Status | Notes |
| --- | --- | --- |
| GitHub repository discovery | Active | GitHub remains the principal public technical destination. |
| GitHub topics | Active | Topics were added manually through GitHub; this repo does not alter settings automatically. |
| `llms.txt` | Active | Agent-readable summary exists. |
| Canonical discovery JSON | Active | `agent-trust-gate.discovery.json` is the primary machine-discovery record. |
| Static-site source | Active | `discovery-site/` supplies the public passive discovery homepage. |
| GitHub Pages deployment workflow | Active | `.github/workflows/deploy-discovery-pages.yml` deploys the selected static artifact through GitHub Actions. |
| GitHub Pages activation | Active and verified | Public HTTPS route verified at `https://gareth1953.github.io/agent-trust-gate/`; no custom domain is configured. |
| A2A metadata readiness | Prepared but inactive | Project metadata exists, but not as a live A2A endpoint. |
| A2A server readiness | Not implemented | No A2A server, task handling, live skills, or messaging. |
| MCP design readiness | Prepared but inactive | Boundary docs describe future review gates. |
| MCP server readiness | Not implemented | No MCP server, tools, resources, prompts, or client config. |
| MCP Registry readiness | Not implemented | No registry publication until a reviewed real MCP server exists. |
| npm packaging readiness | Ready for review | Package remains private; dry-run audit may be used locally. |
| npm publication readiness | Requires explicit approval | No npm login, tag, release, version bump, or publication. |
| Provenance readiness | Prepared but inactive | Future trusted-publishing review required before publication. |
| Paid-pilot commercial route | Active | Human-reviewed Paid Evaluation Pilot starts from £1,500 subject to scope and written agreement. |
| Embedded Commerce GatePass | Ready for local synthetic evaluation | Deterministic pre-checkout basket verification demo only; no live retailer, checkout, payment, settlement, API, A2A, MCP, or production integration. |
| PayPal implementation boundary | Prohibited in current mission | Private manual payment workflow remains outside this repository; no API integration, checkout, payment link, or live payment execution. |

## Safety Boundary

This scorecard is static documentation. P3-M143A records GitHub Pages passive discovery as active and verified. P3-M144 adds local synthetic embedded-commerce basket verification only. Neither mission adds a custom domain, activates registries, publishes a package, creates A2A/MCP services, adds live API endpoints, integrates retailers, creates checkout, processes payments, executes settlement, performs outreach, adds tracking or analytics, or executes actions.
