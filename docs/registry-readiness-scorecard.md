# Registry Readiness Scorecard

## Purpose

This scorecard gives reviewers a concise view of passive discovery and registry readiness. It uses status language, not inflated percentages.

| Area | Status | Notes |
| --- | --- | --- |
| GitHub repository discovery | Active | GitHub remains the principal public technical destination. |
| GitHub topics | Active | Topics were added manually through GitHub; this repo does not alter settings automatically. |
| `llms.txt` | Active | Agent-readable summary exists. |
| Canonical discovery JSON | Active | `agent-trust-gate.discovery.json` is the primary machine-discovery record. |
| Static-site source | Prepared but inactive | `discovery-site/` now includes `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `.nojekyll`, and README source. |
| GitHub Pages deployment workflow | Prepared but inactive | `.github/workflows/deploy-discovery-pages.yml` prepares a selected static artifact only. |
| GitHub Pages activation | Requires explicit approval | Manual repository Pages enablement and live verification are still required; no custom domain or settings change is included. |
| A2A metadata readiness | Prepared but inactive | Project metadata exists, but not as a live A2A endpoint. |
| A2A server readiness | Not implemented | No A2A server, task handling, live skills, or messaging. |
| MCP design readiness | Prepared but inactive | Boundary docs describe future review gates. |
| MCP server readiness | Not implemented | No MCP server, tools, resources, prompts, or client config. |
| MCP Registry readiness | Not implemented | No registry publication until a reviewed real MCP server exists. |
| npm packaging readiness | Ready for review | Package remains private; dry-run audit may be used locally. |
| npm publication readiness | Requires explicit approval | No npm login, tag, release, version bump, or publication. |
| Provenance readiness | Prepared but inactive | Future trusted-publishing review required before publication. |
| Paid-pilot commercial route | Active | Human-reviewed Paid Evaluation Pilot starts from £1,500 subject to scope and written agreement. |
| PayPal implementation boundary | Prohibited in current mission | Private manual payment workflow remains outside this repository; no API integration, checkout, payment link, or live payment execution. |

## Safety Boundary

This scorecard is static documentation. P3-M143 prepares a GitHub Pages workflow, but it does not enable Pages, verify a live URL, add a custom domain, activate registries, publish a package, create A2A/MCP services, add live endpoints, process payments, execute settlement, perform outreach, add tracking or analytics, or execute actions.
