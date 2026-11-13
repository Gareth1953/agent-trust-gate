# Issue #46: synthetic checkpoint-enforced destination entry point

**Research only — production NO-GO.** Run with Node 24:

```sh
node --test experiments/mandatory-destination/anchored-destination.test.mjs
npm run test:antirollback-anchor
```

The opt-in `SyntheticAnchoredDestination` wrapper reserves a signed-action-shaped GatePass ID and exact digest in a retained `SyntheticConsumptionAnchor` before invoking an injected **fictional** effect writer. Invalid material, repeat attempts and checkpoint outages cause no writer call. Uncertain outcomes hold authority and are not automatically retried.

**Limitations:** This wrapper does not verify cryptographic signatures. It is not connected to the actual OpenShell broker, released plugin, payment rail or an independently administered checkpoint. The original writer remains directly callable: tests intentionally demonstrate that direct unmediated invocation STILL succeeds. A SQLite checkpoint held by the same administrator is not an independent trust boundary; cloning both databases likewise still breaks global one-use. A passing test here is NOT production-grade mandatory enforcement.

Before release, a buyer-controlled destination must make checking unavoidable, deny agent access to every alternative writer/SQL/HTTP/IPC route, verify signed human and workload authority, bind root-account budgets and exact actions, protect its checkpoint from restoration by destination administrators, and independently test outages, concurrent clones and reconciled UNKNOWN states. External security assessment is required. Do not modify Windows authentication or publish buyer-facing claims on the strength of these fixtures.
