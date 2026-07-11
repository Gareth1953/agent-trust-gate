# Integration Readiness Checklist

Use this checklist before treating an agent proof contract as ready for local
workflow review.

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

## Proof Contract Inputs

- [ ] Proof package is available.
- [ ] Mandate reference is available.
- [ ] Evidence reference is available.
- [ ] Verified intent status is available.
- [ ] Human approval route is available where required.
- [ ] Signed proof route is available where required.
- [ ] Freshness/expiry rules are defined.
- [ ] Nonce/replay protection is defined.
- [ ] Risk tiering is defined.
- [ ] Escalation route is defined.
- [ ] Local logging/audit route is defined.

## Local Workflow Placement

- [ ] Gate-pass challenge is created before sensitive action.
- [ ] Verification request states required proof items.
- [ ] Proof contract evaluation happens before tool calls.
- [ ] Proof contract evaluation happens before pre-settlement steps.
- [ ] Governance review can inspect the local result.
- [ ] Session/access escalation can be blocked or escalated locally.

## Safety Checks

- [ ] No live execution happens without separate safe system design.
- [ ] No production readiness claim is made.
- [ ] No legal/compliance/security certification is claimed.
- [ ] No identity/authentication certification is claimed.
- [ ] No payment or settlement authority is claimed.
- [ ] No automatic access after payment is claimed.
- [ ] No live API or MCP server functionality is implied.
- [ ] No external-agent contact or direct bot messaging is implied.
- [ ] No action execution is implied.

## Local Demo Checks

- [ ] `npm run demo:agent-proof-integration` runs locally.
- [ ] Valid proof allows locally only.
- [ ] Missing proof requires evidence.
- [ ] Sensitive tool call escalates without verified intent.
- [ ] Settlement-sensitive step requires signed proof.
- [ ] High-risk action requires human review.
- [ ] Stale/replayed proof blocks.

## Public Contact

Human-reviewed developer and integration review enquiries: `gpmiddleton71@gmail.com`.

This checklist is local review guidance only. It does not add live APIs, MCP
server functionality, live systems contact, direct bot messaging, live
agent-to-agent communication, hosted services, payment processing, settlement
execution, production signing, production key management, or action execution.
