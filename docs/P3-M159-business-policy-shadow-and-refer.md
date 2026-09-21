# P3-M159 Business Policy, Shadow Mode and REFER

## Status and boundary

P3-M159 is a local, deterministic, synthetic extension to the P3-M158 MCP
stdio gateway. `atg.evaluate_action` remains the only tool and performs
evaluation only. There is no HTTP transport, remote service, OAuth, adapter
forwarding, simulated execution or live execution. MCP compatibility does not
imply production readiness.

ATG verifies declared authority and policy boundaries for an exact action. It
does not decide whether an action is commercially wise. Agent descriptions,
MCP annotations, model confidence and agent claims create no authority.

## Business Policy Contract

`atg.business-policy-contract.local.v1` is repository registered and digest
bound. It records the synthetic buyer and owner references, effective and
expiry times, permitted action/tool/operation, supplier and recipient classes,
destination and supplier-account classes, environment and currency, integer
minor-unit financial limits, review bands, prohibited classes, contact and
pricing restrictions, required evidence, freshness rules, authority tier,
separation of duties, risk rules, status and revocation evidence.

Unknown, malformed, inactive, expired, revoked, altered or digest-mismatched
policies fail closed. A policy creates neither human authority nor agent
standing, cannot restore invalid authority, and cannot broaden the Action
Capability Passport or existing exact-action envelope.

## Deterministic decisions

| Tier | Controlled result |
| --- | --- |
| `ROUTINE` | May `ACCEPT`; all existing authority checks still must pass. |
| `ELEVATED` | Declared customer-impact facts require `REFER`. |
| `HIGH` | The declared human-review amount band requires `REFER`. |
| `PROHIBITED` | Out-of-scope or prohibited facts require `REJECT`. |

`ACCEPT` in enforced mode may issue the existing one-use, expiring GatePass
only after every passport, exact-action, authority, standing, mandate, policy,
risk and evidence check passes. `REFER` is not authorisation: it issues no
GatePass, permits no execution, and requires a new complete submission after
review or new evidence. `REJECT` covers prohibited, invalid, altered,
unauthorised or unverifiable actions. `REVOKE` lifecycle behaviour is deferred.

## Evidence Decay Clock

Freshness is evaluated against an injected trusted clock and a policy rule for
each evidence type. Missing or stale refreshable evidence may `REFER` only when
the policy says so. Invalid authority or standing, future-dated evidence,
malformed timestamps, clock failure and clock rollback fail closed. Receipts
record states and rule identifiers without credentials or private data.

## Shadow Mode

`mode: shadow` traverses the same passport, canonicalisation, exact-action,
authority, standing, mandate, policy, risk and freshness checks as enforced
mode. It returns `outcome: SHADOW` and `wouldOutcome: ACCEPT | REFER | REJECT`.

Its distinct Shadow Decision Receipt is observational and lacks GatePass
version, signature and issuance-reference fields. Shadow evaluation never
issues a GatePass, reserves or executes an action, consumes a nonce, mutates
enforcement state, calls an adapter, transitions automatically to enforcement,
or proves buyer approval. Enforcement requires a new explicit request and a
complete fresh evaluation. A referred proposal must not be mutated in place.

## MCP contract

The protocol remains MCP `2025-06-18` over local stdio:

```powershell
npm run build
npm run --silent mcp:stdio
```

The v1 P3-M158 contract remains supported unchanged. The additive v2 request
is `atg.mcp-exact-action-request.local.v2` and adds `mode`, registered policy
and evidence-set references, `amountMinorUnits`, and a closed business context.
The v2 result is `atg.mcp-exact-action-result.local.v2`; it carries risk,
freshness, rule IDs and either an enforcement decision receipt or a distinct
Shadow Decision Receipt.

An abbreviated Shadow request and result are:

```json
{
  "requestVersion": "atg.mcp-exact-action-request.local.v2",
  "mode": "shadow",
  "businessPolicyReference": { "policyId": "policy.synthetic-buyer.procurement.v1", "policyVersion": "1.0.0", "policyDigest": "sha256:<registered>" },
  "evidenceSetReference": "evidence-set.fresh.v1",
  "amountMinorUnits": 400000,
  "businessContext": { "destinationClass": "approved_warehouse", "supplierAccountReferenceClass": "approved_supplier_account", "environment": "local_synthetic_procurement_simulation" },
  "proposedAction": { "quantity": 100, "totalAmount": 4000, "currency": "GBP" }
}
```

```json
{
  "mode": "shadow",
  "outcome": "SHADOW",
  "wouldOutcome": "ACCEPT",
  "gatePass": null,
  "gatePassIssued": false,
  "executionReceipt": null,
  "executionAvailable": false,
  "actionExecuted": false,
  "observational": true,
  "authorising": false
}
```

The machine request additionally requires the complete registered passport,
tool/schema and authority evidence bindings and full exact-action shape.

## Synthetic purchasing fixture

The registered policy proposes 100 units from synthetic Supplier A
(`SUP-HARBOUR-001`) to an approved warehouse and approved supplier-account
class in GBP before expiry. £4,000 is routine. £5,000.01–£10,000 refers. More
than £10,000, more than 100 units, or a changed supplier, account class,
destination, currency or environment rejects. Stale refreshable procurement
evidence refers; invalid authority or standing rejects. All data are synthetic.

Schemas are `business-policy-contract.schema.json`,
`shadow-decision-receipt.schema.json`, `mcp-exact-action-request-v2.schema.json`
and `mcp-exact-action-result-v2.schema.json`. Run:

```powershell
npm run test:business-policy-shadow
```

Deferred work includes durable lifecycle and nonce storage, aggregate exposure,
post-issuance GatePass revocation, emergency stop, crash recovery and UNKNOWN
reconciliation, Customer Trust Receipts, execution tools, remote transports and
real-system integrations.
