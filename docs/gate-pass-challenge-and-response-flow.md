# Gate Pass Challenge And Response Flow

P3-M130 adds a local challenge-and-response shape for agent proof packages. A
receiving system can state what proof it wants, an agent or owner can present a
local proof package, and the local verifier can return a deterministic result.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Local Flow

1. The system asks for proof using a local gate-pass challenge.
2. The agent or owner presents a local agent proof package.
3. The verifier checks the package against a local verification request.
4. Missing mandate, evidence, intent, freshness, nonce, or signed proof fails,
   blocks, escalates, or requires more proof.
5. Stale or replayed proof fails.
6. High-risk proof packages require human review.
7. Settlement-sensitive proof packages require signed proof.
8. A valid local control may allow locally.
9. No live action or settlement is executed.

## Challenge

A gate-pass challenge states:

- challenge id;
- verifier reference;
- requested action;
- required mandate;
- required evidence;
- required intent verification;
- required human approval;
- required freshness;
- required nonce;
- required signed proof;
- expiry;
- `localDemoOnly: true`.

Example:

- [Basic gate-pass challenge](../examples/gate-pass-challenge-basic.json)
- [Settlement-sensitive gate-pass challenge](../examples/gate-pass-challenge-settlement-sensitive.json)

## Response

The agent proof package responds with:

- claimed agent name and type;
- owner and issuer references;
- mandate and action scope;
- requested action;
- evidence reference;
- verified intent status;
- human approval status;
- risk tier;
- freshness and nonce status;
- signed proof reference and status;
- session context reference;
- settlement sensitivity;
- `localDemoOnly: true`.

Examples:

- [Valid local proof package](../examples/agent-proof-package-valid-local-control.json)
- [Identity-only invalid package](../examples/agent-proof-package-identity-only-invalid.json)

## Verification Result

The local verifier returns one of:

- `allow`
- `block`
- `escalate`
- `require_evidence`
- `require_human_review`
- `require_signed_proof`

Example results:

- [Allowed local result](../examples/agent-proof-verification-result-allowed-local.json)
- [Requires evidence result](../examples/agent-proof-verification-result-requires-evidence.json)
- [Requires human review result](../examples/agent-proof-verification-result-requires-human-review.json)

Each result records reasons, missing proof items, next required proof, gate-pass
meaning, public contact metadata, and disabled authority flags:

- `liveSystemsContact: false`
- `directBotMessaging: false`
- `autonomousOutreach: false`
- `liveAgentToAgentCommunication: false`
- `paymentAuthorisation: false`
- `settlementAuthorisation: false`
- `actionExecution: false`
- `productionCertification: false`

## What Fails

- Claimed identity with no proof blocks.
- Missing mandate blocks or escalates.
- Missing evidence requires evidence or blocks.
- Unverified intent escalates or blocks.
- Stale or replayed nonce/freshness blocks.
- High-risk sessions require human review.
- Settlement-sensitive requests require signed proof.

## What Does Not Happen

This flow does not contact live systems, send direct bot messages, negotiate with
external agents, process payments, execute settlement, run wallet/banking logic,
perform production signing, certify identity, certify security, or execute
actions.

Public contact for human-reviewed enquiries: `gpmiddleton71@gmail.com`.
