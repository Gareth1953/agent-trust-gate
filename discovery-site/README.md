# Agent Trust Gate Discovery Site Source

This directory contains the static source prepared for the Agent Trust Gate passive discovery site.

Status: active and verified. The public GitHub Pages project URL is `https://gareth1953.github.io/agent-trust-gate/`, served as a passive discovery site with public machine-readable discovery files.

The deployment workflow publishes only:

- the contents of `discovery-site/`;
- `agent-trust-gate.discovery.json`;
- `agent-trust-gate.agent-card.json`;
- `agent-trust-gate.manifest.json`;
- `agent-trust-gate.agent-review-invitation.json`;
- the selected P3-M155 schemas and fictional synthetic scenario example under
  their `schemas/` and `examples/` paths;
- `llms.txt`.

The static source also includes reviewer routes for the fixed synthetic
`human-authority-demo.html` and `agent-standing-demo.html` demonstrations. The
Agent Standing page is a browser presentation of fixed outcomes; cryptographic
fixture verification runs only in the repository's local Node.js demo.

P3-M155 adds `for-agents.html`, the static Bring Your Agent Scenario
instructions and template, and a schema-validated `ai-catalog.json` entry for
the static review invitation. The catalogue is draft-ARD-compatible static
metadata only. It does not advertise an executable remote agent, A2A service,
MCP server, registry or hosted GatePass API.

The site uses no external JavaScript, analytics, tracking, cookies, forms, checkout, payment links, external fonts, third-party images, videos, iframes, live chat, or remote API calls.

It is passive discovery material only. It is not a live A2A endpoint, not an MCP server, not an npm publication, not a payment route, not a settlement route, and not an action-execution service.
