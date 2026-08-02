# Agent Discovery and Reviewer Invitation

## Purpose

P3-M155 gives software agents, agent developers and accountable operators a
static route into Agent Trust Gate (ATG). Agents can be useful technical
discoverers: they can compare an intended action flow with ATG's identity,
delegation, approval and exact-action checks, point an accountable human to the
evidence, and help prepare a synthetic or properly sanitised scenario.

Discovery is not authority. An agent is not the legal or commercial buyer. An
accountable individual or organisation must choose whether to share a scenario,
request a technical review, enter a paid pilot, or approve any later production
work.

## Central review question

Before requesting a consequential action, can the requester prove which
registered software-agent identity it controls, whom it represents, what active
authority was delegated, whether the exact request matches that authority,
which human approval applies where required, and whether the authorised action
was the action executed?

ATG demonstrates how those questions can be checked locally before a GatePass
evaluation begins. It does not verify a production identity or organisation.

## Static invitation design

The canonical
[`agent-trust-gate.agent-review-invitation.json`](../agent-trust-gate.agent-review-invitation.json)
is closed and versioned by
[`agent-review-invitation.schema.json`](../schemas/agent-review-invitation.schema.json).
It names the supported review capabilities, public and local routes, accepted
and prohibited information, accountable-human requirement, pilot boundary and
non-capabilities. Its only interaction modes are:

- `static_read`;
- `local_clone_and_run`;
- `manual_human_contact`.

The invitation is metadata, not a remote protocol endpoint. Validate it with:

```text
npm run validate:agent-invitation
npm run demo:agent-invitation -- --summary-only
npm run demo:agent-invitation -- --json
```

## Discovery-to-evaluation path

1. An agent or operator discovers the static ATG material.
2. They run the deterministic local Agent Standing, Human Authority and
   exact-action GatePass demonstrations.
3. They prepare a synthetic or properly sanitised scenario.
4. An accountable human decides whether to share it through a manual route.
5. A human-reviewed technical discussion may consider one scoped paid local
   pilot.
6. Production work requires a separate written agreement.

The paid route is human reviewed, subject to scope and written agreement, and
does not create automatic acceptance or access after payment. The initial
evaluation remains local and non-production unless separately agreed, excludes
production integration, and must not use live credentials or customer data.
The existing indicative position remains from GBP 1,500 where scope permits.

## What P3-M155 proves

P3-M155 proves that the checked-in static invitation, scenario schema, example,
Pages routes and local commands are mutually linked and deterministically
validated. It proves that the pack declares its human-review, local-only and
non-capability boundaries and that its public pages contain no submission form,
upload, tracking or runtime network code.

It does not prove that agents will recommend ATG, that every agent can discover
it, that any protocol or registry endorses it, that a supplied real-world claim
is true, or that ATG is production ready. It contacts no agent, sends no message,
accepts no remote request, enrols no agent, executes no action, processes no
payment and creates no contract.

## Related material

- [Verified Agent Standing](agent-standing.md)
- [Bring Your Agent Scenario](bring-your-agent-scenario.md)
- [Standards boundary](agent-discovery-standards-boundary.md)
- [Paid Evaluation Pilot](paid-pilot-commercial-entry.md)
