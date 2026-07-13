# GitHub Pages Passive Discovery Activation

## Purpose

P3-M143 prepares Agent Trust Gate for controlled passive discovery through GitHub Pages. It adds a workflow and static site source, but it does not enable Pages, change repository settings, verify a live URL, create a custom domain, or deploy anything from this local Codex mission.

Expected URL after manual activation and verification:

`https://gareth1953.github.io/agent-trust-gate/`

Current status: activation prepared, live verification pending.

## Manual Activation Sequence

1. Push the P3-M143 commit to `main`.
2. Open the GitHub repository settings.
3. Open **Pages**.
4. Under **Build and deployment**, select **GitHub Actions**.
5. Open the **Actions** tab if required.
6. Run or observe the `Deploy discovery Pages` workflow.
7. Verify the published URL.
8. Verify HTTPS.
9. Verify the stable machine-readable URLs:
   - `https://gareth1953.github.io/agent-trust-gate/agent-trust-gate.discovery.json`
   - `https://gareth1953.github.io/agent-trust-gate/agent-trust-gate.agent-card.json`
   - `https://gareth1953.github.io/agent-trust-gate/agent-trust-gate.manifest.json`
   - `https://gareth1953.github.io/agent-trust-gate/llms.txt`
10. Record activation evidence using `docs/passive-discovery-activation-record-template.md`.
11. Update inactive or pending metadata only after verified activation evidence exists.

## What The Workflow Publishes

The workflow publishes only:

- `discovery-site/` contents;
- `agent-trust-gate.discovery.json`;
- `agent-trust-gate.agent-card.json`;
- `agent-trust-gate.manifest.json`;
- `llms.txt`.

It does not publish the full repository, source code, tests, package files, `.git`, `.github` source files, receipts, credentials, environment files, or internal build artifacts.

## Rollback

If activation produces an incorrect or unsafe public result:

1. Disable GitHub Pages in repository settings.
2. Disable or remove `.github/workflows/deploy-discovery-pages.yml`.
3. Revert the activation commit if necessary.
4. Re-run local checks before any later activation attempt.
5. Do not update metadata to live-active status unless the corrected site is verified.

## Safety Boundary

This route is passive discovery only. It is not a live AI agent, A2A server, MCP server, npm publication, payment integration, settlement system, outreach system, analytics system, tracking system, or autonomous marketing system. GatePass remains the headline proof primitive and the reviewer kit remains the recommended first experience.

Public contact: gpmiddleton71@gmail.com.
