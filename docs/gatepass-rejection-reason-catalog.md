# GatePass Rejection Reason Catalog

P3-M134 defines deterministic local rejection and escalation reasons for the GatePass create-verify-reject round trip.

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

| Reason | Meaning | Expected decision | Proof needed next |
| --- | --- | --- | --- |
| `identity_only_not_sufficient` | The GatePass only claims who the agent is. | `block` | Scoped GatePass with mandate, evidence, intent, nonce, and signature reference. |
| `missing_mandate` | No authority is shown for the requested action. | `block` | Mandate bound to action and issuer. |
| `missing_evidence` | No supporting evidence is referenced. | `require_evidence` | Evidence refs bound to scope and nonce. |
| `unverified_intent` | Intent is missing, conflicting, or not verified. | `escalate` or `block` | Verified intent context or local review. |
| `stale_expiry` | The GatePass is expired or stale. | `block` | Fresh GatePass with updated expiry and approval where needed. |
| `missing_nonce` | Replay protection value is missing. | `block` | Nonce bound to the GatePass and requested scope. |
| `replayed_nonce` | Nonce has already been consumed in local context. | `block` | New GatePass with fresh nonce. |
| `missing_signature` | Signed GatePass proof reference is missing. | `require_signed_proof` | Local signed GatePass proof reference. |
| `tampered_gatepass` | The GatePass no longer matches expected local integrity context. | `block` | Untampered GatePass recreated from authorised inputs. |
| `scope_mismatch` | Scope or mandate does not match the requested action. | `block` | Narrow GatePass matching the exact action. |
| `high_risk_requires_human_review` | High-risk action lacks required human approval. | `require_human_review` | Human approval bound to scope, nonce, and expiry. |
| `settlement_requires_signed_gatepass` | Settlement-sensitive flow lacks a signed GatePass. | `require_signed_proof` | Signed GatePass before any settlement-sensitive workflow proceeds locally. |

## Boundary

These reasons are local modelling reasons only. They do not provide production security certification, identity/authentication certification, legal/compliance status, payment authority, settlement authority, or action authority.

Public contact: gpmiddleton71@gmail.com
