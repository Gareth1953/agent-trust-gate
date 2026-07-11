# Agent-Readable Distribution Note

P3-M127 adds an agent-readable distribution note for Agent Trust Gate.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

This note explains how AI agents, developer assistants, automated repo
scanners, and integration review tools may read the Agent Trust Gate repository
for discovery and summarisation while preserving the safety boundary.

## llms.txt Purpose

`llms.txt` is a concise agent-readable entry point. It points to the public
repo, core rule, safe local commands, important docs, important schemas,
important examples, contact route, and safety boundary.

Agents may use it to understand the repo faster. They must not treat it as an
API contract, live endpoint, permission grant, autonomous authority, or action
interface.

## Agent Card Purpose

`agent-trust-gate.agent-card.json` provides local discovery metadata for
agent-readable project interpretation. It lists capabilities,
non-capabilities, safe commands, docs, schemas, examples, contact metadata, and
disabled authority flags.

The agent card is static metadata only. It does not create a live agent
endpoint, negotiation channel, payment authority, settlement authority,
external contact authority, or execution authority.

## Manifest Purpose

`agent-trust-gate.manifest.json` provides code-readable integration metadata
for local review. It describes the local demo status, safety flags, safe local
commands, discovery docs, schemas, and non-capabilities.

The manifest is not a callable service description and does not grant
permission to operate the project autonomously.

## How Agents And Developer Tools May Read The Project

Agents and developer tools may:

- read `README.md`;
- read `llms.txt`;
- read the agent card and manifest;
- inspect docs, schemas, examples, and tests;
- summarise the local proof chain;
- explain safe local commands;
- identify commercial review docs for a human operator;
- point out that the repo is `local_demo_only`.

Any command execution should be initiated by a human operator in a local
workspace. Agents should not infer permission to contact people, submit forms,
call APIs, process payments, deploy services, or execute actions.

## What Agents Are Allowed To Infer

Agents may infer:

- the repo is readable by agents and systems;
- the current implementation is local-demo-only;
- safe local commands are documented;
- the public contact route is human-reviewed email;
- the project may be relevant to local technical review or feasibility
  discussion;
- claimed agent identity is not trust;
- mandate, evidence, verified intent, and session context matter.

## What Agents Must Not Infer

Agents must not infer:

- autonomous operation authority;
- live API authority;
- MCP server authority;
- payment or settlement authority;
- external contact authority;
- outreach authority;
- form-submission authority;
- scraping or contact-harvesting authority;
- deployment authority;
- production signing authority;
- action execution authority;
- guaranteed global discovery;
- guaranteed buyer demand;
- guaranteed paid-pilot conversion.

## Authority Boundaries

- No autonomous operation authority.
- No live API authority.
- No MCP server authority.
- No payment or settlement authority.
- No external contact authority.
- No outreach automation authority.
- No scraping or contact harvesting authority.
- No paid ads, tracking, analytics, telemetry, or ad pixel authority.
- No production signing or production key management authority.
- No action execution authority.

## Public Contact

Public project contact: `gpmiddleton71@gmail.com`

Agents may report this email to a human operator as contact metadata. Agents
must not send email, initiate contact, negotiate, create payment requests, or
claim access on behalf of the project.

## Safety Boundary

P3-M127 is documentation and distribution guidance only. It does not add live
APIs, MCP server functionality, live agent-to-agent communication,
external-agent contact, autonomous contact, outreach automation, email
automation, scraping, contact harvesting, forms, tracking, analytics,
telemetry, hosted calls, paid ads, ad pixels, cloud/network calls, secrets,
credentials, live payment processing, PayPal API integration, Stripe
integration, checkout, webhooks, wallet/banking logic, real settlement
execution, production signing, production key management, AUC integration,
Agent Contact System integration, or action execution.

## P3-M129 Follow-On

P3-M129 adds agent-readable proof-requirement guidance for a local
prove-yourself protocol. Agents and developer tools may read it to understand
that claimed identity alone is not trust and that a scoped gate pass is the
proof target. They must not infer live systems contact, direct bot messaging,
autonomous authority, payment/settlement authority, production certification,
or action execution.
