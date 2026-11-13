# Experimental ACS tool-call adapter

Independent ATG research, 13 November 2026. Local synthetic interoperability
subset only; **not ACS-Core conformant, certified, endorsed or production ready**.

## What runs

`adapter.mjs` accepts a deliberately narrow `steps/toolCallRequest` envelope
using ACS specification 0.1.0, pinned to upstream release v0.1.4, commit
`834f3f0d51e7bbbd9a68ff682bec89f97ddd72d8`.

The trusted host supplies the existing signed ATG grant and a verifier context
with an explicitly pinned public key, host clock, constraints and retained
preflight nonce store. Neither authority nor identity is inferred from an
agent's claims. The adapter unwraps ACS argument values and requires exact
tool/version/operation/argument/agent/session binding before invoking ATG's
existing exact-action verifier. Unknown methods, versions and extended profiles
are denied. Malformed envelopes return a JSON-RPC error; a host MUST treat
errors, missing replies and transport failures as no admission.

The response preserves both transport `id` and ACS `request_id`. A successful
preflight emits `allow` and `executed:false`. It makes no external call and
performs no record change. The separate host walkthrough then calls the
existing `CustodyWitness`, which rechecks and consumes authority atomically
with one fictional record update. Replay is refused there even if preflight
memory is reset. Do not execute a second generic tool after the witness has
already committed the synthetic operation.

## Reproduce

From the repository root, use Node 24 and Python with `jsonschema==4.26.0`:

```sh
npm ci --ignore-scripts
npm run build --silent
node --test experiments/acs-adapter/adapter.test.mjs
node experiments/acs-adapter/demo.mjs > /tmp/atg-acs-walkthrough.json
python experiments/acs-adapter/validate_schemas.py /tmp/atg-acs-walkthrough.json
```

The retained `walkthrough.json` is one actual run, with fresh public identifiers
and a fixed fixture clock; reruns generate different identifiers. It contains
no private key. Tests create fresh disposable keys and databases outside the
repository and delete them on completion. `validate_schemas.py` loads the
vendored upstream JSON schemas offline, including format checking, and checks
the request envelope, hook payload and responses. No remote schema fetch occurs.

## Explicit unsupported boundaries

- No ACS handshake, signed ACS envelopes, ContextEntry audit chain,
  provenance profile, Trace, Inspect, AgBOM, modify/ask/defer flow, or full
  ACS-Core implementation. Base-schema validity is not profile conformance.
- Metadata is compared with signed ATG bindings; ACS transport authentication
  and real-world identity are not implemented here.
- This narrow experiment rejects passkey/delegated grant shapes. Those ATG
  capabilities remain separately tested; this adapter does not integrate them.
- Preflight nonce state is in memory and resets with the host. It is not
  durable consumption or a substitute for enforcement at the destination.
- No external OWASP Guardian, coding-agent host, live cloud, purchase, payment,
  organisation account or buyer system was exercised.
- The existing common-owner direct SQL and whole-store restore attacks remain
  outside this adapter. Production NO-GO remains.

## Upstream provenance and licensing

Schemas in `vendor/acs-v0.1.4/v0.1.0` are unchanged files from the pinned
[OWASP ACS repository](https://github.com/GenAI-Security-Project/agent-control-standard/tree/834f3f0d51e7bbbd9a68ff682bec89f97ddd72d8/specification/v0.1.0).
Their SHA-256 values are retained in `vendor-manifest.json`.
Upstream copyright: The OWASP GenAI Security Project and the ACS contributors.
The upstream Apache-2.0 code/specification license and CC-BY-SA-4.0
documentation license are preserved in the vendor directory. No upstream
implementation code was copied into the ATG adapter.

Upstream contributions follow the project's accepted-issue process. This is
ATG-owned research and has not been submitted as an OWASP contribution.
