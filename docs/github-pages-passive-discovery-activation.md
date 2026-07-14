# GitHub Pages Passive Discovery Activation

## Purpose

P3-M143 prepared Agent Trust Gate for controlled passive discovery through GitHub Pages. P3-M143A records that Gareth manually enabled Pages through GitHub Actions and verified the public static discovery route.

Live public URL:

`https://gareth1953.github.io/agent-trust-gate/`

Current status: active and verified.

## Activation Evidence

1. Source commit: `4c68e1b9eef33505da3444f64d170eda1f32a046`.
2. Branch: `main`.
3. Deployment method: GitHub Actions.
4. Workflow: `deploy-discovery-pages.yml`.
5. Workflow run: `Deploy discovery Pages #1`.
6. Live URL: `https://gareth1953.github.io/agent-trust-gate/`.
7. HTTPS: verified.
8. Homepage: publicly reachable.
9. Stable machine-readable URLs:
   - `https://gareth1953.github.io/agent-trust-gate/agent-trust-gate.discovery.json`
   - `https://gareth1953.github.io/agent-trust-gate/agent-trust-gate.agent-card.json`
   - `https://gareth1953.github.io/agent-trust-gate/agent-trust-gate.manifest.json`
   - `https://gareth1953.github.io/agent-trust-gate/llms.txt`
10. Activation record: `docs/passive-discovery-activation-record.md`.

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
5. Do not restore active metadata after rollback unless the corrected site is verified again.

## Safety Boundary

This route is passive discovery only. It is not a live AI agent, A2A server, MCP server, npm publication, payment integration, settlement system, outreach system, analytics system, tracking system, or autonomous marketing system. GatePass remains the headline proof primitive and the reviewer kit remains the recommended first experience.

Public contact: gpmiddleton71@gmail.com.
