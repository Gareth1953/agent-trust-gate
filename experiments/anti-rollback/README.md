# ATG — retained transaction checkpoint research

**13 November 2026. Synthetic test only. Production NO-GO.**

## What buyer problem this addresses

If an attacker or faulty administrator restores yesterday's transaction database, a
previously used GatePass can be made to look unused. Existing ATG tests correctly
show this successful attack when the entire writer and authority state are cloned.

This opt-in experiment asks a narrower question: **if a protected transaction
destination MUST consult a separate, retained one-use checkpoint that the writer
cannot restore, will a cloned writer be prevented from receiving a second
permission for that same signed action?**

## Reproduce the research

Node.js 24, repository dependencies and no real customer credentials:

```sh
npm ci --ignore-scripts
npm run test:antirollback-anchor
```

The test command compiles the existing ATG source and runs both the isolated
checkpoint protocol checks and an actual synthetic `CustodyWitness` clone
experiment. No cloud server, real purchase, payment, Windows account, passkey,
administrator configuration or network endpoint is created.

## Demonstrated conditions (subject to passing CI)

- A checkpoint stored outside the simulated destination copy may reserve one
  exact action ID and SHA-256 digest only once. A second call is refused.
- Two independent Node processes racing the SAME checkpoint cannot both reserve.
- Wrong domain, changed digest, missing checkpoint or outage does not grant new
  effect permission. A held reservation is never evidence of real execution and
  never authorises an automatic retry.
- When the protected test controller checks the checkpoint before invoking each
  writer, the retained checkpoint blocks the replay to a cloned synthetic ATG
  destination writer.
- **Deliberately retained successful attacks:** a direct unmediated writer
  invocation still executes in the restored clone; if an administrator also
  clones the checkpoint before the first action, two checkpoints each permit
  the same reservation. These failures must not be relabelled as protection.

## Crucial limitations

The code in `experiments/anti-rollback/` is *not* connected to the real OpenShell
broker, the released ATG plugin, an externally administered ledger or a bank.
An extra SQLite file on the same host is **not independent administrative
custody**. The caller-to-checkpoint route has no network security or production
authentication. The test controller voluntarily asks the checkpoint first,
but a real destination must remove every unprotected alternative route.

The reservation is not a two-phase financial transaction or proof of a
completed business effect. A crash after reserving but before the effect will
hold permission indefinitely pending externally authenticated recovery and
reconciliation. No refund, self-service reset, fallback, or retry API is added.
These are safety/availability tradeoffs, not production-ready recovery.

Neither signing a receipt nor storing a hash protects from whole-host
restoration, collusion, an administrator who controls both stores, or a false
business receipt.

## Next engineering gate (requires independent buyer/partner boundary)

1. Specify one independently operated monotonic checkpoint, its operator,
   trust roots, retention and cost — with NO credentials or spending yet.
2. Show authenticated client/writer/observer separation and prove an agent or
   writer administrator cannot reset the checkpoint.
3. Make checkpoint verification mandatory at a buyer-controlled, non-bypassable
   destination. Attempt direct calls, alternate credentials and database writes.
4. Race two cloned writers and restore **all attacker-accessible** files; the
   independent retained witness must reject duplicate effects.
5. Test witness outage, partition, delayed acknowledgements, revocation,
   immutable receipts, reconciled UNKNOWN and disaster recovery.
6. Commission independent security review before describing any commercial
   deployment as production-proven.

## Commercial wording that evidence could support

> ATG has a reproducible synthetic checkpoint experiment showing why one-use
> permission needs a trusted record outside a restorable agent environment.
> The experiment also demonstrates that bypass and whole-domain rollback still
> succeed without an independently administered destination and checkpoint.

**Approval boundary:** this is source research and tests only. Do not advertise
a resolved production rollback problem, or change the public homepage, payment
workflow or plugin release based solely on a passing unit test.
