# Agent Trust Gate Discovery Site Source

This directory contains the static source prepared for the Agent Trust Gate passive discovery site.

Status: active and verified. The public GitHub Pages project URL is `https://gareth1953.github.io/agent-trust-gate/`, served as a passive discovery site with public machine-readable discovery files.

The deployment workflow publishes only:

- the contents of `discovery-site/`;
- `agent-trust-gate.discovery.json`;
- `agent-trust-gate.agent-card.json`;
- `agent-trust-gate.manifest.json`;
- `llms.txt`.

The static source also includes reviewer routes for the fixed synthetic
`human-authority-demo.html` and `agent-standing-demo.html` demonstrations. The
Agent Standing page is a browser presentation of fixed outcomes; cryptographic
fixture verification runs only in the repository's local Node.js demo.

The site uses no external JavaScript, analytics, tracking, cookies, forms, checkout, payment links, external fonts, third-party images, videos, iframes, live chat, or remote API calls.

It is passive discovery material only. It is not a live A2A endpoint, not an MCP server, not an npm publication, not a payment route, not a settlement route, and not an action-execution service.
