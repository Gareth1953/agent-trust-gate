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
