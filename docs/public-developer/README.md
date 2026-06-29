# Agent Trust Gate Developer Documentation

Agent Trust Gate is a local pre-action trust gateway for AI agents and workflows.
It evaluates a structured action before the caller acts and returns ALLOW, BLOCK,
or REQUEST HUMAN plus local evidence and audit objects. It is for developers who
need an explicit trust boundary around high-impact agent operations.

Current status is local-only. Start with [Local Quickstart](local-quickstart.md),
then use the [Gateway API](gateway-api.md), [OpenAPI and SDK](openapi-and-sdk.md),
or [Agent Manifest and MCP](agent-manifest-and-mcp.md). The gateway never executes
the described action.

There is no hosted service, public API, signup, analytics, billing, payment
processing, or automatic purchase. See the hosted roadmap and safety limits before
evaluating future commercial use.

Future movement beyond local readiness is governed by the
[Commercial Launch Control Pack](../commercial-launch-control.md). Its default
decision is blocked and every launch, deployment, publishing, outreach, signup,
tracking, billing, payment, and automatic-purchase flag is false.

Public-facing trust explanations are drafted in the
[Public Trust Page](../public-trust-page.md) and
[Public Trust FAQ](../public-trust-faq.md). Both remain local, unpublished, and
subject to commercial launch control, legal review, and Gareth final approval.

Future integrations are governed by the
[Developer Integration Safety Guide](../developer-integration-safety.md) and its
[non-live API draft](../developer-integration-api-draft.md). External APIs,
agent-to-agent networking, third-party connections, webhooks, live customer data,
and action execution remain disabled.

The local [Agent-to-Agent Trust Handshake Pack](../agent-to-agent-trust-handshake.md)
and [schema draft](../agent-to-agent-handshake-schema-draft.md) define how an
acting agent could declare intent, evidence, impact, approval, and requested
permissions before acceptance. Networking, public protocol access, machine trust,
live RefusalGraph lookup, and action execution remain disabled.

The local [RefusalGraph Core Pack](../refusalgraph-core.md) and
[signal schema draft](../refusalgraph-signal-schema-draft.md) describe
privacy-minimised refusal intelligence for future trust checks. RefusalGraph,
network/external lookups, fees, payments, and action execution remain disabled.

The local [Agent Clearing House Foundation Pack](../agent-clearing-house-foundation.md),
[Agent Treaty draft](../agent-treaty-draft.md), and
[clearance decision types](../agent-clearing-decision-types.md) connect handshake,
RefusalGraph, treaty, and receipt concepts into a future clearing model. Clearing,
receipt exchange, fees, payment, settlement, networking, and execution remain disabled.

The pure local [RefusalGraph Signal Engine](../refusalgraph-signal-engine.md)
converts blocked or approval-required receipt-like outcomes into allowlisted,
pseudonymised, hash-only refusal signals. Persistence, network lookup, APIs, fees,
payment, private-data export, and action execution remain disabled.

The pure local [RefusalGraph Query Engine](../refusalgraph-local-query-engine.md)
compares a proposed action with caller-supplied draft signals and returns an
allowlisted caution result. It performs no persistence, network or external
lookup, API access, fees, payment, private-data export, or action execution.

The pure local [Agent Clearing Decision Engine](../agent-clearing-decision-engine.md)
combines declared request controls with a local RefusalGraph caution result. It
returns an allowlisted draft decision without persistence, networking, fees,
payment, settlement, private-data export, or action execution.
