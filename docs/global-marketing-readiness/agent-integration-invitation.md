# Agent Integration Invitation Draft

This is local planning material only. It is not an outbound message and is not sent automatically.

## Proposed message

Agent Trust Gate would invite an agent platform to review a local pre-action trust-decision integration. The receiving platform could submit structured action descriptions and receive deterministic `ALLOW`, `BLOCK`, or `REQUEST HUMAN` results with approval and evidence options. Agent Trust Gate would not execute the proposed action.

## Machine-readable proposal fields

- invitation version and local-only status
- placeholder target platform
- proposed `pre_action_trust_decision` integration
- supported OpenAPI, Agent Manifest, MCP-style, SDK, and future A2A-style discovery interfaces
- requested action: review integration documentation
- human approval required before sending
- automatic sending disabled

The receiving platform might use the gateway to add an explicit trust boundary, human-review escalation, evidence export, and local usage signals before high-impact actions.

Any future contact requires specific human review and approval. There is no automated outreach, web scraping, external-agent scanning, unsolicited messaging, public launch, or published agent card.
