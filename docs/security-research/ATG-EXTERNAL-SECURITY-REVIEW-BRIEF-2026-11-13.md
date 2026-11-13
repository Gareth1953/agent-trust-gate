# ATG external red-team review brief
**13 November 2026 — draft scope, no assessor engaged.**

## What the assessor should receive
A reproducible pinned source commit and deployment manifest; full API and service-identity inventory; agent, broker, writer, signer, observer and checkpoint access matrix; scoped synthetic demonstration; retained successful attack reproductions; and explicit limitations.

## Attack work packages
1. **Complete mediation:** attempt to create any synthetic effect without visiting the checkpoint, via direct writer, SQL, service configuration, host secrets, alternate URL, IPC, network policy or cloned operator credentials.
2. **Trust and authorisation:** forge WebAuthn/device approval, root principal, delegated sub-agent chain, signatures, body, payee, amount, expiry and destination; confirm invalid requests cannot burn a valid approval.
3. **State and rollback:** replay after simultaneous requests, process restart, cache clone, destination restore, checkpoint clone and common-admin restore. Check atomic root-account budget under concurrent distinct grants.
4. **Uncertainty and recovery:** cut transport before/after checkpoint reservation and effect, drop acknowledgements, simulate malicious outcome testimony and denied checkpoint recovery. No blind retries, resets or false receipts.
5. **Operator separation:** attempt buyer-admin checkpoint reset/backup restore; attempt checkpoint-admin effect creation; verify change controls, audit immutability and keys in intended environment.
6. **Real deployment checks:** production-equivalent identity enrollment, key rotation/revocation, patch and incident workflow, throughput/availability limits; explicitly exclude any live money unless buyer authorises it.

## Required result format
For every attack: tested commit, environment, actor/permissions, exact request/procedure, evidence hash, result (BLOCKED / SUCCESSFUL ATTACK / INCONCLUSIVE), severity, fix owner and retest. Do not omit failed tests. A pass in a synthetic harness is not evidence of the customer's production controls.

## Release decision
A security review alone does not confer certification. No production GO if any critical/high route allows unauthorised effects, rollback replays, oversized spending, forged approval, blind retries or trusted-data loss. An independent assessor and buyer security owner must sign scoped acceptance; the founder must separately approve expenditure and public release.

**Current status:** not commissioned. Known successful same-owner direct-writer and whole-domain rollback attacks are retained; production NO-GO.
