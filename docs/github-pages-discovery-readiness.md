# GitHub Pages Discovery Readiness

## Purpose

P3-M142 prepared static discovery-site source. P3-M143 added a controlled GitHub Pages deployment workflow and local validation command. P3-M143A records that Gareth manually activated the Pages source through GitHub Actions and verified the public route.

Current status: active and verified.

Live public URL:

`https://gareth1953.github.io/agent-trust-gate/`

This URL is a passive static discovery site only. It is not a live API, A2A endpoint, MCP server, payment route, settlement route, or action-execution service.

## Prepared Static Source

The local static-site source is in:

- `discovery-site/index.html`
- `discovery-site/404.html`
- `discovery-site/robots.txt`
- `discovery-site/sitemap.xml`
- `discovery-site/.nojekyll`
- `discovery-site/README.md`

The page is intentionally lightweight:

- no external JavaScript;
- no analytics;
- no tracking;
- no cookies;
- no external fonts;
- no third-party images;
- no embedded videos;
- no iframes;
- no live chat;
- no forms;
- no checkout;
- no payment links.

## Workflow Boundary

The deployment workflow is:

`/.github/workflows/deploy-discovery-pages.yml`

It uses only GitHub-owned Pages actions, copies a clean `_site` artifact, and publishes only:

- `discovery-site/` contents;
- `agent-trust-gate.discovery.json`;
- `agent-trust-gate.agent-card.json`;
- `agent-trust-gate.manifest.json`;
- `llms.txt`.

It does not publish the full repository, source tree, tests, `.git`, `.github` source files, package-lock files, receipts, credentials, environment files, or internal build artifacts.

## Verified Activation Route

The activation evidence recorded for P3-M143A is:

1. Source commit `4c68e1b9eef33505da3444f64d170eda1f32a046` on `main`.
2. Pages source manually set to GitHub Actions.
3. Workflow `deploy-discovery-pages.yml` ran as `Deploy discovery Pages #1`.
4. Homepage and machine-readable files were reachable over HTTPS.
5. Activation record completed at `docs/passive-discovery-activation-record.md`.

## Safety Boundary

The static site is discovery material only. It is not a hosted API, not a live AI agent, not an A2A endpoint, not an MCP server, not an npm publication, not a payment or settlement route, not an analytics system, not a tracking system, and not production middleware.
