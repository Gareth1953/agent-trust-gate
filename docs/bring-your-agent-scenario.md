# Bring Your Agent Scenario

## Safe purpose

The scenario pack lets an agent developer or operator describe an identity,
delegation, approval, autonomy or exact-action gap without supplying live
systems data. An agent may prepare the scenario. An accountable human must
decide whether it is shared.

The closed
[`bring-your-agent-scenario.schema.json`](../schemas/bring-your-agent-scenario.schema.json)
sets bounded strings and arrays, uses integer minor units for money, and
requires a positive sanitisation confirmation. The checked-in
[`bring-your-agent-scenario.example.json`](../examples/bring-your-agent-scenario.example.json)
is fictional and explicitly labelled synthetic. A downloadable
[`template`](../discovery-site/bring-your-agent-scenario.template.json) is also
published with the static discovery site.

## What to include

Use synthetic or properly sanitised descriptions of the declared agent
category, claimed principal type, current identity and delegation evidence,
autonomy boundary, proposed exact action, applicable amount in integer minor
units, resource or scope limit, present human approval method, execution and
instrument controls, suspected trust gap, expected Agent Standing and GatePass
outcomes, evidence labels, known limitations, and sanitisation confirmation.

Evidence labels describe evidence; they are not evidence themselves. A
signature can authenticate an assertion but cannot make an inaccurate
assertion true. Account ownership does not establish delegation.

## Never include

Do not include passwords, API keys, wallet seed phrases, card details,
production credentials or tokens, private keys, customer personal data,
medical information, confidential commercial data, unrestricted logs, live
payment or settlement instructions, or production endpoints. Do not disguise
those values inside an apparently safe field.

## Local review and outcomes

Run the relevant local demonstrations before any manual discussion:

```text
npm run demo:agent-standing -- --summary-only
npm run demo:human-authority -- --summary-only
npm run demo:gatepass-round-trip
npm run validate:agent-invitation
```

The standing demonstration may return `STANDING_VERIFIED`,
`STANDING_REFUSED`, or `STANDING_UNVERIFIABLE`. These are deterministic local
results for supplied synthetic evidence. They do not certify an agent,
authenticate a real organisation, create authority, approve a real action, or
issue a production GatePass.

An accountable human may manually share a sanitised scenario using the public
human-reviewed contact or technical-review Discussion route. No upload,
automatic email, GitHub posting, callback, webhook, remote processor or
real-time API exists.

## Commercial boundary

A technical evaluation may lead to consideration of one scoped paid controlled
pilot. Every enquiry is human reviewed; scope is subject to written agreement;
there is no automatic acceptance or access after payment; the pilot is local
and non-production unless separately agreed; production work is excluded; and
no live credentials or customer data may be used in an initial synthetic
evaluation.
