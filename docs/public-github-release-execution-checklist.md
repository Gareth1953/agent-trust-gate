# Public GitHub Release Execution Checklist

This checklist prepares Gareth for a future human-controlled public GitHub code launch. P3-M107 does not create a repository, add a remote, push, tag, publish, deploy, contact an external system, or activate a live capability.

Human approval is required before any remote command. Do not run remote push automatically.

## A. Pre-launch local checks

- [ ] `git status` is clean.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run typecheck` passes.
- [ ] All JSON examples parse.
- [ ] All local README links resolve.
- [ ] `agent-trust-gate.manifest.json` parses and reports `local_demo_only`.
- [ ] All schema JSON files parse.
- [ ] `public/index.html` exists.
- [ ] Approved public contact email appears in README, SECURITY, manifest, and public landing page.
- [ ] No real secrets, tokens, keys, or credentials are tracked.
- [ ] No `.env` file is tracked.
- [ ] No private logs or generated evidence records are tracked.
- [ ] No database or connection configuration is present.
- [ ] No live API is active.
- [ ] No live payments are active.
- [ ] No settlement execution is active.
- [ ] No external agent contact is active.

## B. GitHub repository setup — manual human steps only

- [ ] Create a public GitHub repository only after Gareth's approval.
- [ ] Suggested repository name: `agent-trust-gate`.
- [ ] Suggested description: Local-first pre-action / pre-settlement trust enforcement layer for agent-led actions and payments.
- [ ] Suggested public contact: `gpmiddleton71@gmail.com` for developer, agent-system, integration, security, and public project enquiries only.
- [ ] Review repository visibility, default branch, license display, security policy, and public issue settings before launch.

Suggested topics:

- `ai-agents`
- `agentic-ai`
- `trust`
- `governance`
- `receipts`
- `pre-settlement`
- `mcp`
- `a2a`
- `safety`
- `typescript`

Topics describe discoverability only. They do not claim active MCP/A2A integration or production readiness.

The public contact email is not a live API endpoint, automated agent contact route, autonomous outreach channel, live support SLA, payment channel, settlement channel, or hosted service availability claim.

## C. Remote setup commands — future human-approved examples only

Do not run these commands automatically. Replace the placeholder only after Gareth creates and approves the repository.

    git remote -v
    git remote add origin <GITHUB_REPO_URL>
    git branch -M master
    git push -u origin master

Stop before the push unless the local checks pass, the destination is verified, and Gareth gives explicit approval.

## D. Release-candidate tag commands — future human-approved examples only

Do not run these commands automatically. Do not create or push a tag during P3-M107.

    git tag v0.1.0-rc.1
    git push origin v0.1.0-rc.1

Tagging and remote tag push require separate explicit approval.

## E. GitHub page checks after a future launch

- [ ] README displays correctly.
- [ ] License is visible.
- [ ] Security policy is visible.
- [ ] Release notes are visible.
- [ ] `public/index.html` is visible as a repository file.
- [ ] The manifest is visible.
- [ ] Schemas are visible.
- [ ] Examples are visible.
- [ ] No secrets or credentials are visible.
- [ ] No live endpoints are presented as active.

## F. What this launch does not activate

- No live payments.
- No real settlement or settlement execution.
- No hosted API.
- No external agent contact.
- No AUC integration. AUC is not integrated.
- No Agent Contact System integration. Agent Contact System is not integrated.
- No x402 or AP2 activation.
- No production cryptographic signing.
- No action execution.

## G. First public message

> Agent Trust Gate™ is now available as a local-first developer proof for pre-action / pre-settlement trust enforcement in agent-led workflows.
>
> No mandate. No evidence. No verified intent. No signed gate pass. No settlement.
>
> Review the code, run the local proof, inspect the receipts, and verify how simulated settlement remains blocked unless the trust chain is valid.

This message is draft copy for future human use. P3-M107 does not publish or send it.
