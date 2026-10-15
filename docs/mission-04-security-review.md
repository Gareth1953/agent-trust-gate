# Mission 04 — bounded security review

Status: local source/demo review; not independent assurance or production approval.
Baseline: live main `e8d398b7165c3bf8f6df23809fadb9b2b127b92d`.
Branch: `mission-04-security-review`. Previous release checkout and changes preserved.

## Scope and method

Manual review of signing/canonicalisation, approval-to-commit binding, shared
worker consumption/reconciliation, separate destination IPC/trust verification,
state persistence, MCP/loopback HTTP entry points, packaging and Pages workflow.
Local synthetic reproductions only. Read existing Mission 01–03 regression
cases; added executable Mission 04 integrity and permission regression cases.
Checked dependency advisories via npm audit and searched tracked runtime/build
surfaces for common credential/private-key patterns without recording values.
This is a bounded maintainer review, not a comprehensive penetration test.

## Findings and fixes

### M04-01 — P2, unsigned own JSON property in older serializers

`src/exact-action-gatepass.ts` and `src/local-signed-proof.ts` used ordinary
assignment while copying sorted keys. An own JSON `__proto__` key invoked the
prototype setter instead of becoming an enumerable own output property. The
baseline serialised `{amount:1,__proto__:...}` identically to `{amount:1}`;
its payload hashes collided because the field was omitted, not because SHA-256
was broken. A signed legacy receipt could therefore retain a valid signature
after addition of such an own payload property. This is an integrity failure
for these serializers. It does not demonstrate a live ERP exploit, global
prototype pollution, stolen keys or compromise of any third party.

Fix: define each output property as an own enumerable data property. Ordinary
JSON bytes remain unchanged; formerly omitted fields now participate in the
signature/hash and cause tampered receipts/actions to fail verification.
Mission 03's stricter JSON boundary continues to reject this property entirely.
Tests cover root/nested values, hash distinction, actual legacy receipt
verification and exact-action refusal. No public fixture/archive was regenerated.

### M04-02 — P3, permissive durable JSON state defaults on POSIX

`src/durable-action-lifecycle.ts` created directories/files using defaults. With
umask 022, a fresh standalone durable store produced directory mode 0755 and
state mode 0644. In a traversable parent, other local users could read state.
The connector's separate private directory reduced this risk for that path;
this finding concerns direct file-backed durable-store use.

Fix: request 0700 for newly created containing directories and 0600 for atomic
temporary state files. Replacement installs that restricted inode. Regression
under umask 000 checks initial creation and replacement of an older 0644 file.
Existing directories/ancestors are not chmodded. Windows NTFS ACLs were not
validated; POSIX mode bits are not a Windows isolation claim. Same-user and
administrator access remain outside this protection. No held state was opened,
migrated, reset or deleted as remediation.

### M04-03 — documentation boundary correction

SECURITY.md incorrectly said no action execution was active. Optional synthetic
connectors now commit local records. Updated scope distinguishes local writes,
evaluation-only MCP, static website and absent real integrations. Added an
unpublished Security & Trust page, responsible reporting guidance and explicit
client-data prerequisites. Updated privacy wording to describe the confirmed
ImprovMX-to-Gmail route without promising encrypted support transfer.

### Validation baseline correction

The full suite exposed an older positioning assertion that prohibited the now
approved Gmail contact on the pilot page. The same assertion fails against
`git show e8d398b:discovery-site/controlled-buyer-pilot.html`. Removed only the
outdated address prohibition and added an explicit correct mailto assertion;
obsolete score/test-count and authority-claim prohibitions remain. The first
run also lacked `ATG_NODE20_PATH`; final runs configure the preserved actual
Node 20 runtime. Both initial failures are recorded, not hidden.

## Threat model and remaining client-data gates

| Threat / asset | Existing evaluation control | Remaining requirement |
| --- | --- | --- |
| Changed action/state | Signed binding and destination recheck | Partner-native atomic conditional write; no alternate write routes |
| Reuse/concurrent workers | Local SQLite consumption, exposure and fencing | Authenticated workers, partner enforcement, deployment-specific protocol |
| Forged human/operator authority | Registered synthetic fixtures only | Real authority registry, authentication and least privilege |
| Stolen signing keys | Separate local destination key; fixture approval keys | Managed key custody, rotation/revocation, trusted time and recovery |
| Malicious input / agent instructions | Structured validation, strict Mission 03 evidence, bounded MCP line and HTTP body | Whole-path resource limits, hostile-input testing and authenticated caller boundary; no blanket prompt-injection protection |
| Client records / logs | Synthetic data requirement; no website upload | Data-flow inventory, minimisation, approved storage/processors, encryption, retention/deletion and support route |
| Host / state compromise | Checksums, key pins, local replay checks | OS isolation/ACLs, independent evidence, protected backups and anti-rollback; local hash is not a MAC |
| Crash / ambiguous write | UNKNOWN holds, explicit fenced reconciliation | Deployment and power-loss tests, trusted restore protocol, orphan procedures |
| Dependencies / release | Lockfile, no third-party runtime package dependency, archive checksums | Advisory monitoring, reviewed build environment, authenticated provenance; hashes alone do not authenticate publisher |
| Website / service | Static Pages; separate local prototypes | No hosted client service assessed; any new hosted API needs a separate security design |

The loopback prototype can run without API-key authentication by design. The
host OS and local caller remain trusted; do not expose it through a tunnel,
public interface or reverse proxy for client use. Local IPC has no independent
worker/operator identity boundary. Test fault seams remain synthetic host APIs.
Private filesystem permissions cannot prevent same-user code from reading keys.

No verified end-to-end client-data encryption, production key management,
independent penetration test, SOC 2/ISO certification, external destination
capture or production approval is claimed. These are gates for a new scope,
not features silently added by this mission.

## Operating and incident checklist for the first evaluation

- Gareth and the client technical owner agree one synthetic workflow, access
  boundary, allowed evidence outputs and named contacts before starting.
- Use an isolated evaluation workspace and OS account. Verify its permissions;
  do not copy live credentials, customer records or private keys into the repo.
- Before a run, record source/archive version, hashes, test clock and trust pins.
  Restrict access to retained state and logs. Agree their retention and deletion.
- If compromise or an unexpected write is suspected, stop new work using the
  relevant documented controls. Do not retry UNKNOWN actions, reset stores,
  clear holds or restore a backup merely to obtain a passing result.
- Restrict access to the affected environment and preserve a protected copy of
  relevant state/logs and timestamps. Do not email private keys or unredacted
  customer material. Agree an investigation channel and notify the named client
  contact promptly under the agreed incident process.
- Identify affected credentials/keys and revoke or rotate them through their
  actual owner. Fixture-key replacement alone is not an incident response.
- Resume only after the cause, destination outcomes and held exposure are
  understood and the client technical owner accepts the recovery evidence.
  Restore/reconciliation must prevent rollback from reviving consumed authority.

This checklist establishes evaluation handling, not a staffed monitoring
service or an assurance that every incident is detectable.

## Release handling

Published local.5 and old downloads remain byte-for-byte unchanged. The source
fixes are NOT in the downloaded local.5 archive. Do not replace that archive.
A future buyer package must have a new reviewed version and exact-byte checks;
`validate:plugin-release` is expected to reject comparing patched compiled source
to the unchanged local.5 archive. This mission does not relax that validator.
Do not publish the website draft as though the patched plugin were already
available. No push, Pages deployment, registry publication or live client test
is part of this mission. See `reports/mission-04/summary.json` for actual results.

## Reproduction

Run `npm ci --ignore-scripts`, then `npm run test:security-mission-04` and
`npm test` on Node 24+. Legacy signing/permission tests also run on actual
Node 20 after building. POSIX permission test skips on Windows and must be
replaced by explicit NTFS ACL verification before a Windows client deployment.

Guidance consulted: NCSC secure AI design/development/deployment guidance:
https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development
No certification or endorsement is implied by consulting guidance.

## Website verification limit

Static site/claim validators were run. Browser visual review was attempted but
Playwright's browser binary was absent and its download returned invalid ZIP
content. Desktop/mobile visual inspection remains required before publication;
no screenshot or browser pass is claimed. The site uses its existing stylesheet
and contains no new third-party scripts, forms or data upload path.

## Actual final validation

- `npm test` with configured actual Node 20 path: exit 0; 675 main and 953
  posttest tests, **1,628 passed**, no failures or skips. Eight Mission 04
  regressions are included in that total.
- Eight focused Mission 04 cases: passed on Node 24.19.0 and Node 20.19.0.
- Plugin: 42 unit checks plus fresh source-built installed SDK/CLI/MCP,
  five state-binding scenarios and seven packaged worker scenarios passed.
  This temporary test package is not a new distributable buyer release.
- Typecheck, reviewer, three-case Challenge, public-claims/discovery-site
  validators and whitespace checks: exit 0.
- npm audit: zero reported advisories in the lockfile at check time. This is
  not proof that the code or build chain is vulnerability-free.
- All five published archives, checksum manifest and retained Challenge,
  local.4 worker and local.5 destination recordings match baseline.
- Immutable local.5/source comparison: expected exit 1 after source patches;
  preserved release validator correctly detects compiled-byte differences.
- Browser visual review and Windows ACL verification remain outstanding.

No merge, push, publication, archive replacement, state migration or live
client-data handling occurred. Remaining production gates are not resolved
by these passing evaluation tests.
