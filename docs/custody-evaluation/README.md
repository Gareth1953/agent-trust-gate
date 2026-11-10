# Custody boundary and LangGraph evaluation — 10 November 2026

**Source research candidate. Production NO-GO.** This extends the source tree
reviewed in draft PR #28; it does not merge that PR or replace any plugin archive.

## Concrete changes

- The existing exact-action signer now accepts private signing material without
  requiring fixture metadata; the verification-profile constructor accepts a
  public key without a private key. Existing defaults and synthetic flags remain.
- A new optional `CustodyWitness` verifies a GatePass against a freshly generated
  evaluation authority's pinned public key. The repository's public fixture key
  cannot sign for that fresh authority.
- The witness binds one synthetic tenant, resource, operation and witness domain.
  It checks the exact action and expected resource version. GatePass ID, nonce and
  idempotency key are unique in a durable SQLite consumption table.
- Consumption and the synthetic destination-record update commit in the **same
  SQLite transaction**. This is not a claim of atomicity with an external payment.
- Agent messages expose only execute/lookup; setup, stop, revocation, trust,
  storage paths and clock selection remain host/controller operations. The raw
  stdio frame is limited before JSON parsing. No executable callback is accepted.
- The actual LangGraph 1.2.20 integration demonstrates approval, one execution,
  copied-grant refusal, changed-payee refusal, administrative-message refusal and
  outcome lookup. It is deterministic and uses no LLM or payment provider.

## What this proves, and what it does not

With one retained witness, copying/restoring the **agent cache** cannot reset
consumption. Two actual writer processes using that same store commit one effect.
A writer killed after commit can be reconciled without creating another effect.

The host still runs every role under the same user. The operating-system sandbox
capability probe returned **BLOCKED**; no permissive fallback was used. Therefore
the agent's effective inability to read keys or rewrite the witness is **not
demonstrated**. A read/write stdio API does not itself stop a same-user process
from accessing the database, process or signing material through another path.

**Both common-owner attacks remain security FAIL:** direct SQL changes the
synthetic business state without authority; copying the witness and trust state
allows duplicate execution across both copies. These attacks are retained in the
tests. Their expected reproduction must not be counted as defeated attacks.

This is a proposed place to enforce one-use authority *when independently held
custody exists*. It is not an independently administered anti-rollback service,
an HSM, authenticated human authority, complete mediation, a live partner adapter,
distributed exactly-once execution, financial exposure accounting or an audit.

## Quickstart

Use Node 24+ and Python 3.12+ in a disposable synthetic workspace. No production
credential/customer data. Create each run under a new, non-existing absolute root.
Do not reset or migrate existing state. On Linux:

```sh
npm ci --ignore-scripts
npm run build
npm run test:custody-witness
node scripts/custody-setup-demo.mjs --state /ABSOLUTE/EXISTING/PARENT/new-custody-run
python3 -m venv /ABSOLUTE/EXISTING/PARENT/new-langgraph-venv
/ABSOLUTE/EXISTING/PARENT/new-langgraph-venv/bin/python -m pip install -r requirements-langgraph-evaluation.txt
/ABSOLUTE/EXISTING/PARENT/new-langgraph-venv/bin/python scripts/langgraph-custody-demo.py --state /ABSOLUTE/EXISTING/PARENT/new-custody-run --node /ABSOLUTE/PATH/TO/node --output /ABSOLUTE/EXISTING/PARENT/new-result.json
```

The optional Python installation fetches third-party packages from the registry.
The evaluated workflow disables tracing, blocks Python socket/DNS calls, uses
stdin/stdout and makes no model-provider request. It is not proof of a hostile
Python sandbox or a blocked lower-level/native networking path. The writer's
environment is reduced to runtime path/platform/temp settings. No key is sent to
LangGraph; only a signed synthetic grant crosses its workflow.

Fresh private evaluation keys and databases remain under `controller-owned/`;
the directory name and POSIX modes are not evidence of an independently owned
security principal. Never share the whole run directory. Public result summaries
and exact environment versions are retained in `evidence/`. The source candidate
is not exported by the unchanged downloadable standalone plugin.

## Next acceptance gate

Read [DEPLOYMENT-GATES.md](DEPLOYMENT-GATES.md). The next useful proof requires a
real separately administered custody boundary, denied-access tests and a restore
domain that excludes the authoritative consumption store. It remains possible
to hold buyer discussions with these limits disclosed; production use is refused.
