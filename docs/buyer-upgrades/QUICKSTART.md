# Reproduce one bounded buyer workflow

Use an isolated machine/workspace with synthetic data only. This source candidate
needs Node 24+ for SQLite and child processes, npm and Git. The older published
legacy SDK remains separately scoped to Node 20+. No account, API key, partner
credential, payment or cloud plan is needed for this demonstration.

From the exact reviewed branch/commit:

```sh
npm ci --ignore-scripts
npm run build
npm run test:buyer-transport
node scripts/buyer-evaluation.mjs --state /ABSOLUTE/EXISTING/PARENT/new-atg-run
```

On Windows use a fresh absolute path under an existing, appropriately provisioned
evaluation parent, for example `C:\ATG-Evaluation\new-atg-run`. This Linux run is
not evidence that Windows permissions or native IPC isolation have been verified.
State paths must not exist; do not reuse old run directories. No automatic reset,
migration or retry is performed. Installation may fetch locked development tools
from npm; the evaluation itself makes no network requests.

## Workflow and observations

The existing ATG SDK evaluates a fictional £4,000 supplier purchase, binds its
request and business-state version, reserves authority, and submits through a
separate synthetic destination process. It is not an invoice payment or a real
bank integration. The runner demonstrates:

| Scenario | Required observation |
| --- | --- |
| Exact request and reuse | First local record committed; repeated submit rejected |
| Changed supplier request | Claim refused; no destination order-version change |
| Direct unapproved command | Registration rejected; no destination order-version change |
| Revocation | Later submit rejected; no local execution |
| Emergency stop | Later submit rejected; no local execution |
| Expired authority | Synthetic adapter not reached |
| Same-user database edit | **Security FAIL:** rewritten state accepted after checksum recomputation |
| Coherent clone replay | **Security FAIL:** the same authority executes in both copied trust domains |

The last two are deliberately executed attacks on disposable test state. They
are successful attacks, not successful security controls. Exit 0 means the runner
reproduced its expected observations, including those failures. It never means
production approval. An unexpected observation exits non-zero and retains an
`incomplete.json` receipt. Investigate before another run; never overwrite it.

## Evidence and private fixture state

`results.json` records observed outcomes, runtime, platform, completion time,
source hashes and unresolved gates. `report.md` is its short human-readable
summary. Review those two before sharing. The entire run directory contains
synthetic private keys, databases and cloned private state: **do not distribute
the directory**. The runner prints no private key, token or database content.
Everything is retained locally for inspection; choose a separate approved
retention/deletion process. No customer data belongs in these fixtures.

The harness is ATG-owned. Separate processes and a public-key verifier are not
an independent audit or a partner-owned integration. Existing SDK/MCP guides and
protocol limitations remain applicable; this runner does not claim a new
third-party agent runtime or change the MCP evaluation-only interface.

The source candidate can be staged with the existing plugin packager into a new
absolute output directory for private testing. It is not a new released local.7
archive; old versioned archives/checksums must remain unchanged. A release needs
a new version, archive provenance, installed-package checks and release review.
