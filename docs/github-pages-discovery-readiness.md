# GitHub Pages Discovery Readiness

## Purpose

P3-M142 prepared static discovery-site source. P3-M143 adds a controlled GitHub Pages deployment workflow and local validation command so the source can be manually activated after review.

Current status: activation prepared, live verification pending.

Expected URL after manual enablement and verification:

`https://gareth1953.github.io/agent-trust-gate/`

Do not treat this URL as verified live until GitHub Pages is manually enabled, the workflow has run, and the published site has been checked.

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

## Manual Activation Route

Activation still requires manual GitHub settings work:

1. Push the P3-M143 commit to `main`.
2. Open GitHub repository Settings.
3. Open Pages.
4. Select GitHub Actions under Build and deployment.
5. Run or observe the deployment workflow.
6. Verify the live site and machine-readable URLs.
7. Record evidence before updating metadata from pending to active.

## Safety Boundary

The static site is discovery material only. It is not a hosted API, not a live AI agent, not an A2A endpoint, not an MCP server, not an npm publication, not a payment or settlement route, not an analytics system, not a tracking system, and not production middleware.
