# OpenShell transaction-authority integration — source candidate

12 November 2026. **Synthetic evaluation only. Production NO-GO.**

This adds an optional ATG HTTPS broker for one synthetic record operation. It
is designed for OpenShell **0.1.8** network mediation. It is not a payment
adapter, general agent sandbox, principal identity service or customer release.
The existing SDK/MCP modes and downloadable plugin archives are unchanged.

## The enforced path

An agent connects through OpenShell to a private, pinned-mTLS ATG endpoint.
The broker reconstructs the proposed action from the actual HTTP payload, then
uses the existing custody writer to verify the signed exact action and atomically
commit its synthetic effect and one-use consumption. There is no preflight ALLOW
followed by an unbound external callback. No signing or administrator operations
are exposed on this interface.

Only these exact HTTP POST paths are accepted:

- `/v1/synthetic-record/commit`
- `/v1/synthetic-record/lookup`

The body is **canonical UTF-8 JSON** with exactly `grant` and `payload` fields.
`grant` is a signed `WitnessGrant`; `payload` is the actual synthetic action.
The supplied client sorts JSON keys. Whitespace variants, duplicate keys,
invalid UTF-8, unknown top-level fields and bodies over 64 KiB are rejected.
Payload changes cannot be hidden beside an unchanged signed grant. All paths
return explicit synthetic/non-production markers and never grant automatic retry.

The HTTPS layer requires TLS 1.3, a trusted client CA and the exact permitted
client leaf. The supplied client verifies the server CA, hostname and exact leaf.
Startup under the executable checks root-owned code/runtime/configuration and
non-root, capability-free writer identity. It refuses unprotected deployment.
32-connection and three-second bounds reduce resource exposure; they are not
a denial-of-service or latency guarantee.

## Reproduce local protocol checks

Node 24 and OpenSSL are required:

```sh
npm ci --ignore-scripts
npm run test:openshell-broker
```

These tests use real loopback TLS and SQLite. They cover exact-action field
substitution, signature/expiry/revocation/stop refusal, concurrent duplicate
requests, historical lookup, unavailable writer, endpoint identity and bounded
parsing. They do **not** run OpenShell or prove OS custody in this workspace.

## Actual OpenShell check

The separate GitHub Actions workflow `openshell-integration.yml` downloads exact
official CLI/gateway 0.1.8 binaries and verifies their recorded SHA-256 digests.
On its disposable Linux/Docker host it provisions a separate writer UID, pinned
TLS identities and protected code, then creates a real OpenShell workload with
no model providers, arbitrary host mounts or real credentials.

The broker binds only the exact private Docker bridge interface. The workload
receives only a disposable TLS client key, public trust and signed synthetic
grants. Issuer keys, writer database, gateway operator credentials and Docker
socket are not uploaded to the workload. Docker/root administrators remain
trusted. The Docker build context contains only a Dockerfile, not fixture keys.

The OpenShell endpoint uses `protocol: tcp` and `tls: skip` because mTLS must be
end-to-end between workload and broker. This is a documented native-TCP mode:
OpenShell enforces destination/port/binary access; **it does not inspect this
HTTP body**. ATG enforces exact routes and transaction content. No existing
deployment policy is weakened or changed. No provider credential is attached.

The check exercises changed payee, amount, currency, tenant, resource, version
and value; forged/expired authority; wrong TLS identity/pin; one-use racing calls;
replay and reconciliation. A second listening, authenticated decoy endpoint is
reachable in a host control test but must receive no workload request, so a
closed port cannot masquerade as a network-policy refusal. Finally, the broker
is stopped and the workload must return UNKNOWN without fallback.

Only the sanitized evidence receipt is printed. **Do not upload the private
fixture directory** or invoke the root harness on a working/shared host. The
initial runs and any faults must remain visible. A green job proves only the
exact tested deployment/commit; it is not independent assurance or superiority
over a destination's native checks or custom OpenShell middleware.

## Combined delegated-budget evaluation

A third opt-in mode now joins passkey-format approval, the authenticated leaf's
signed non-expanding delegation and a shared root-account allowance inside the
versioned destination transaction. It passed in the real OpenShell 0.1.8 workload
with two fixture client identities and a software authenticator. See the
[combined guide](DELEGATED-BUDGET.md) and [exact evidence](DELEGATED-BUDGET-VALIDATION.md).
It does not upgrade old stores or plugin archives and does not establish genuine
human enrollment, independent outcome truth or administrator rollback resistance.

## Optional checkpoint-enforced real OpenShell workload — 13 November 2026

The source-only experimental broker configuration now supports a **separately authenticated checkpoint**, enforced for the exact synthetic commit route. The real OpenShell **0.1.8** sandbox evaluation passed the modified-action, replay, race, network, historical lookup and checkpoint-outage scenarios. The separate checkpoint stays on a loopback address and requires pinned mutual TLS; the OpenShell workload connects to the broker through its restricted network policy.

See [the exact checkpoint validation and deliberate limits](CHECKPOINT-VALIDATION-2026-11-13.md), with the pinned workflow/commit evidence and source-only experiment under `experiments/mandatory-destination/`. The route remains **opt-in**, is not the released plugin, and has not been combined end-to-end with genuine device approval or independent checkpoint administration. Production NO-GO. Existing tests intentionally retain successful common-owner direct-writer and whole-domain rollback attacks.

## Remaining boundaries

The optional [purchase approval connector and buyer walkthrough](PURCHASE-APPROVAL.md)
adds a separately enrolled passkey assertion requirement to newly provisioned
evaluation stores. Automated evidence uses a software authenticator fixture;
live-person enrollment and a device/browser ceremony remain outstanding. It
does not change the original mode or upgrade old stores in place.

- Principal approval and issuer authority are synthetic. The combined optional mode tests
  signed non-expanding delegation and a shared fixture-principal budget; real
  authenticated organisational identity remains future work.
- One-use is confined to one retained authoritative SQLite store. Administrator
  compromise, complete-writer restore and whole-host rollback remain unprotected.
- The atomic effect is a local synthetic record. Remote payment idempotency,
  uncertainty and reconciliation are not implemented by this endpoint.
- The server's resource limits and local test timings are not production HA,
  throughput, availability, SLA or resilience evidence.
- The integration is a protected-destination route, **not an implementation of
  OpenShell's gRPC supervisor-middleware protocol**. Middleware remains an
  alternative to assess for another buyer-defined operation.

## Primary references

- [OpenShell 0.1.8 network rules](https://docs.nvidia.com/openshell/v0.1.8/how-it-works/policies/network-rules)
- [OpenShell 0.1.8 runtime boundary](https://docs.nvidia.com/openshell/v0.1.8/how-it-works/sandboxes/runtimes)
- [OpenShell 0.1.8 gateway authentication](https://docs.nvidia.com/openshell/v0.1.8/how-it-works/gateways/authentication)
- [ATG split-custody scope](../buyer-upgrades/CUSTODY-SERVICE.md)
- [ATG payment acceptance matrix](../buyer-upgrades/PAYMENT-EVALUATION.md)

The [12 November validation record](VALIDATION.md) contains a real OpenShell
0.1.8 scoped pass, exact source identity and the retained initial failures.
Missing runtime/privileges are BLOCKED, never an inferred pass. A different
deployment needs its own checks.
