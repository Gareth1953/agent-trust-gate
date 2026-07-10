# Example Agent Discovery Prompts

P3-M122 adds safe prompts for AI agents, developer assistants, and integration
reviewers inspecting Agent Trust Gate locally.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

Strategic boundary:

Readable now. Callable later. Autonomous execution never without gate control.

## Purpose

These prompts help agents understand the public repository without asking them
to contact anyone, execute payments, call APIs, scrape, deploy, publish, start
hosted services, negotiate with agents, or execute actions.

## Safe Discovery Prompts

Use prompts like:

- "Summarise what Agent Trust Gate does from this repo."
- "Identify the local-only safety boundaries."
- "Explain the line: No mandate. No evidence. No verified intent. No signed gate pass. No settlement."
- "Review the schemas and explain what a request, receipt, and proof contain."
- "Inspect the local signed receipt/proof prototype and explain what is local-demo-only."
- "Run or inspect the local adversarial examples and summarise which cases are blocked."
- "Explain whether this repo exposes a live API or autonomous action interface."
- "Explain the readable-now/callable-later boundary."
- "Inspect the reference integration examples and summarise where the trust gate is called before sensitive actions."
- "Review the paid pilot readiness document and explain what is safe to say and what must not be claimed."
- "Check whether claimed agent identity is treated as trust, or whether behaviour, mandate, evidence, verified intent, and session context decide access."

## Safe Local Command Prompts

Use prompts like:

- "Run `npm test` and summarise whether local tests pass."
- "Run `npm run build` and report build status."
- "Run `npm run typecheck` and report typecheck status."
- "Run `npm run cli -- help` and summarise the local commands."
- "Run `npm run demo:adversarial` and summarise the local blocked scenarios."
- "Run `npm run demo:integrations` and summarise the local reference patterns."

Only use these commands in a local clone when the human operator asks for local
inspection. Do not add network access, credentials, cloud calls, hosted calls,
payment calls, settlement calls, or action execution.

## Prompts To Avoid

Do not ask agents to:

- contact the public email automatically;
- negotiate with other agents;
- call OpenAI, Anthropic, xAI, GitHub, LangGraph, CrewAI, AutoGen, MCP,
  payment, wallet, or cloud APIs;
- create payment requests;
- process payments;
- execute settlement;
- deploy or publish anything;
- start a hosted service;
- scrape or crawl external targets;
- send outreach;
- create credentials or secrets;
- execute actions.

## Safety Boundary

This repository is readable by agents and systems, but it exposes no live
agent endpoint and grants no autonomous authority.

Public project contact: `gpmiddleton71@gmail.com`
