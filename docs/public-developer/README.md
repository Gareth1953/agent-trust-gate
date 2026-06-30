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

The pure local [Agent Clearing Receipt Engine](../agent-clearing-receipt-engine.md)
projects a clearing decision into an allowlisted, pseudonymised draft receipt.
Receipt persistence and external verification, networking, fees, payment,
settlement, private-data export, and action execution remain disabled.

The local [Unique Advantage Radar](../unique-advantage-radar.md) and
[scoring model](../advantage-scoring-model.md) apply a consistent strategic test
to future missions. They use human-supplied local scores only; scanning,
scraping, tracking, publishing, fees, and external activity remain disabled.

The local [Receipt Verification Readiness Pack](../receipt-verification-readiness.md)
checks draft receipt structure, decision links, vocabularies, and safety flags.
It does not verify externally, access a network, charge fees, persist receipts,
or execute actions.

The local [Fee Metering Readiness Pack](../fee-metering-readiness.md) classifies
future fee-relevant events into closed placeholder categories. It records no
billable event and triggers no tracking, billing, payment, settlement, external
metering, or action execution.

The local [Agent Clearing Pipeline Demo Pack](../agent-clearing-pipeline-demo.md)
composes RefusalGraph querying, clearing decisions, receipts, local verification
checks, and fee placeholders in memory. It uses no network, records no billable
event, moves no money, and executes no proposed action.

The local [Agent Clearing Demo CLI Pack](../agent-clearing-demo-cli.md) runs that
pipeline from one local JSON file and prints safe JSON to stdout. It starts no
listener, writes no output, accesses no network, moves no money, and executes no
proposed action.

The local [Agent Clearing Demo Report Pack](../agent-clearing-demo-report.md)
turns a draft pipeline result into an allowlisted report object or in-memory
Markdown. It writes, exports, publishes, tracks, analyses, bills, and executes
nothing.

The [Agent Clearing Public Demo Narrative Pack](../agent-clearing-public-demo-narrative.md)
provides draft-only public wording, a one-page summary, FAQ, and deterministic
local narrative object. Nothing is published, deployed, tracked, analysed,
billed, networked, or executed.

The [Agent Clearing Investor / Partner Brief Pack](../agent-clearing-investor-partner-brief.md)
provides an internal draft brief, partner summary, founder memo, and deterministic
local brief object. Nothing is externally shared, published, emailed, tracked,
analysed, billed, networked, or executed.

The [Local Clearing Ledger Pack](../local-clearing-ledger.md) provides immutable
in-memory record collection, lookup, deduplication, and summary counts. It uses
no file persistence, database, cloud sync, tracking, network, or execution.
