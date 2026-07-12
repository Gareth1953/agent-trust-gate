# GatePass Round Trip Threat Model

This local threat model supports the P3-M134 GatePass create-verify-reject round trip.

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

## Local Threat Cases

| Threat case | Local response |
| --- | --- |
| Agent claims identity without proof | Reject as `identity_only_not_sufficient`. |
| Agent tries to reuse old GatePass | Reject stale expiry or replayed nonce. |
| Agent tampers with scope/action | Reject as `tampered_gatepass` or `scope_mismatch`. |
| Agent omits evidence | Require evidence or reject. |
| Agent claims broad mandate | Verify scope against the expected action and reject mismatch. |
| Agent uses stale approval | Require fresh GatePass and approval context. |
| Agent tries settlement-sensitive action without signed GatePass | Require signed GatePass or block. |
| High-risk action attempts to bypass human review | Require human review. |

## What Is Checked Locally

- issuer, subject, and intended verifier
- mandate and scope
- evidence references
- verified intent status
- risk and approval status
- expiry and nonce
- local signed GatePass proof reference
- local integrity hash against expected verification context

## Boundary

This is a local threat model only. It is not production security certification, not production-grade cryptography, not a legal/compliance/security guarantee, and not a live traffic, bot-detection, identity, authentication, payment, settlement, or tool-execution system.

Public contact: gpmiddleton71@gmail.com
