# Public Launch Checklist

This checklist covers global publication of the repository as code and documentation only.

## Repository

- [ ] README positioning and links are accurate.
- [ ] License, security policy, contribution guide, changelog, and release notes are present.
- [ ] Public launch record is present: [Public launch record](docs/public-launch-record.md).
- [ ] Manifest reports `local_demo_only`.
- [ ] Schemas and JSON examples parse.
- [ ] Tests, build, and typecheck pass.
- [ ] `.env`, generated logs, and private artifacts remain ignored.

## Public contact identity

- [ ] Approved public contact email is `gpmiddleton71@gmail.com`.
- [ ] README, SECURITY, manifest, and static landing page use the approved public contact email.
- [ ] Public contact wording is limited to developer, agent-system, integration, security, and public project enquiries.
- [ ] Public contact wording does not imply a live API endpoint, automated agent contact, autonomous outreach, live support SLA, payment channel, settlement channel, or hosted service availability.
- [ ] Git commit identity remains `Agent Trust Gate <291836990+Gareth1953@users.noreply.github.com>`.

## Release-candidate checklist

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run typecheck`.
- [ ] Confirm JSON examples, schemas, and manifest validation.
- [ ] Confirm local README links resolve.
- [ ] Confirm no live integrations.
- [ ] Confirm no real secrets or credentials.
- [ ] Confirm no external agent contact.
- [ ] Confirm no AUC merge; AUC is not integrated.
- [ ] Confirm no Agent Contact System integration; Agent Contact System is not integrated.
- [ ] No package publish or remote tag push.

## Omnichannel Code Launch

- [ ] GitHub/repo assets ready.
- [ ] README/docs ready.
- [ ] Manifest/schemas ready.
- [ ] Examples parse.
- [ ] CLI proof works.
- [ ] Static developer page not yet created.
- [ ] npm/package readiness not yet approved.
- [ ] MCP/A2A not yet active.
- [ ] AUC bridge not yet integrated; AUC is not integrated.
- [ ] Agent Contact System not integrated.
- [ ] Hosted sandbox not active.
- [ ] Live payments/settlement not active.

## Static landing page

- [ ] `public/index.html` exists.
- [ ] No external scripts.
- [ ] No analytics.
- [ ] No tracking.
- [ ] No forms.
- [ ] No external network dependencies.
- [ ] No live API references.
- [ ] No payment or settlement activation.
- [ ] No external agent contact.
- [ ] AUC is not integrated.
- [ ] Agent Contact System is not integrated.

## Public GitHub Release Execution

Use the human-controlled launch documents only after explicit Gareth approval:

- [Public GitHub release execution checklist](docs/public-github-release-execution-checklist.md)
- [GitHub repository profile](docs/github-repository-profile.md)
- [Public launch post-checks](docs/public-launch-post-checks.md)

P3-M108 public GitHub launch is complete. P3-M109 records the public launch and
post-launch safety state. Tag/package publish/deployment remain future
human-approved steps.

## Post-launch safety checklist

- [ ] Confirm the public launch record matches the public repository state.
- [ ] Confirm the public branch is `main`.
- [ ] Confirm the approved contact email remains `gpmiddleton71@gmail.com`.
- [ ] Confirm no old or unapproved public contact email is present.
- [ ] Confirm no tag, package publish, or deployment has been performed unless separately approved.
- [ ] Confirm no live API, payment, settlement, cloud/network call, external-agent contact, AUC merge, Agent Contact System integration, production signing, or action execution has been added.

## Required safety boundary

- [ ] No live APIs.
- [ ] No live or real payments.
- [ ] No real settlement or settlement execution.
- [ ] No external agent contact.
- [ ] No live endpoint, cloud call, or network call.
- [ ] No secret, token, or credential.
- [ ] No banking or wallet logic.
- [ ] No x402 or AP2 activation.
- [ ] No public outreach automation.
- [ ] No autonomous action execution.
- [ ] No production cryptographic signing.
- [ ] AUC is not integrated.
- [ ] Agent Contact System is not integrated.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

Passing this checklist is not production payment readiness, legal or compliance certification, a security audit, or live deployment approval.
