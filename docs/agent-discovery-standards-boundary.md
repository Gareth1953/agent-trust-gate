# Agent Discovery Standards Boundary

## Material review record

P3-M155 reviewed the authoritative Agentic Resource Discovery (ARD)
[specification repository](https://github.com/ards-project/ard-spec), its
[`spec/ard.md`](https://github.com/ards-project/ard-spec/blob/main/spec/ard.md)
document and its
[`ai-catalog` JSON Schema](https://github.com/ards-project/ard-spec/blob/main/spec/schemas/ai-catalog.schema.json)
on 2026-08-02. The specification identified itself as v0.9, Draft / Proposal,
dated 2026-05-28. Its catalogue schema identifies catalogue `specVersion`
`1.0`. The exact source commit reviewed was
`5fa2f5aef790b478319f6a3b43adf4661b0ed0e0`.

The exact schema reviewed at that time is preserved as
[`ard-ai-catalog-v1.0.schema.json`](../schemas/ard-ai-catalog-v1.0.schema.json).
The static [`ai-catalog.json`](../discovery-site/ai-catalog.json) is validated
against that snapshot. It advertises one JSON review invitation as a static
resource. It does not advertise an executable agent, remote action, live A2A
service, MCP server or hosted GatePass API.

The official manifest tool at the recorded source commit returned `PASS` with
zero critical specification errors and one warning: `application/json` is not
one of the tool's standard discovery media types. That media type is retained
because it accurately describes the static invitation; substituting an A2A,
MCP, skills or registry type would be a false capability claim. Accordingly,
the catalogue is recorded as schema-validated readiness with a non-standard
media-type warning, not as a standard callable resource or a conformance claim.

Because ARD was a draft proposal and discovery depends on client behaviour,
P3-M155 records **ARD readiness**, not endorsement, registry publication,
universal discoverability or broad protocol conformance. A later conformance
claim would require rechecking the then-current authoritative specification and
schema, the deployed discovery methods and paths, media delivery, and the
current official conformance tooling.

## Discovery metadata is not a live endpoint

Static metadata tells a reader where documentation, schemas, examples and local
commands exist. A live protocol endpoint accepts or responds to runtime
protocol traffic. P3-M155 supplies the former only.

The repository's `agent-trust-gate.agent-card.json` is explicitly static ATG
discovery/readiness metadata. It is not represented as a functioning A2A Agent
Card and ATG does not implement an A2A service interface. There is no A2A
server, service endpoint, remote invocation or agent callback.

Likewise, static descriptions of possible future tool integration do not make
ATG an MCP server. P3-M155 creates no MCP endpoint, tool server, installation
package or registry publication.

## Verified capability versus declared capability

A capability name in a discovery file is a declared route to a local
demonstration. It is not proof that an agent or deployed service possesses that
capability. ATG's deterministic tests can verify the behaviour of checked-in
synthetic fixtures; production capability would require separate evidence,
identity, operational, security and integration review.

This boundary also applies to Agent Standing: self-declared identity,
principal, authority or approval is an input claim. Standing is verified only
when the required evidence and verifier-controlled checks succeed for the
specific local evaluation.
