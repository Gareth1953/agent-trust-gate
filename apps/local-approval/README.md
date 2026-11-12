# Local approval application — synthetic evaluation

This **source-only Node 24+ application** adds actual WebAuthn registration and sign-in endpoints, an exact-action review screen, and a separate passkey assertion before the existing custody witness can change one fictional £4,000 order. It does not generate an approver private key. Your browser/authenticator creates and keeps that key. The automated tests use software credentials and do **not** establish a real human/device result.

**Production NO-GO.** Local code enrollment proves possession of the local setup secret, not Gareth's identity, employment or business authority. Attestation is `none`; hardware provenance is not established. No Internet-facing deployment, real customer data, payments, bank verification or ERP access is supported. This app's direct same-host synthetic writer path is **not** evidence of a real human ceremony inside OpenShell or the delegated multi-agent/budget path. Those earlier engineering results remain under their actual fixture boundaries.

## Gareth's Windows 11 walkthrough

1. Install or use **Node.js 24 LTS** from <https://nodejs.org/>. Node 20 is sufficient for older ATG paths, but not this app. No paid account or new subscription is needed.
2. Download the current repository source from <https://github.com/Gareth1953/agent-trust-gate/archive/refs/heads/main.zip>, extract it, and open the extracted `agent-trust-gate-main` folder. Do not use the unchanged local.7 plugin archive: this optional app is not in that package.
3. In `apps\local-approval`, double-click **start-windows.cmd**. It installs the lockfile-pinned dependencies without install scripts, builds ATG, creates a **fresh private evaluation folder under your local app-data directory**, and runs the loopback server. On Windows, inherited NTFS permissions must be checked separately; the script does not certify or provision owner-only ACLs. Use your own trusted Windows user account, not a shared/public folder or privileged administrator session.
4. The terminal shows an enrollment code and the private state-folder path. Keep the window open. Once the server prints `ATG synthetic approval: http://localhost:8796`, open that **exact** address in current Edge or Chrome. Do not use a LAN address, `127.0.0.1` in the address bar, a proxy, a public domain or an embedded frame.
5. Enter the one-time code locally; select **Unlock registration**, then **Create my local passkey**. Follow your device's Windows Hello / passkey / security-key prompt. A compatible ES256 credential with user verification is required. Enrollment does not establish your real-world identity. Do not paste the code, private files, passkey data or screenshots of the code into chat.
6. Select **Sign in with passkey**. This does not approve the order.
7. Select **Show exact approval request**. Check `GBP 4000.00`, fictional payee `fixture-bank-A`, order `synthetic-order-001`, expected version `1`, `pending → approved`, and the authority/digest/expiry details. Select **Approve this fictional change with passkey** only if those values match. The device dialog itself does not independently display or attest these values.
8. Confirm the page says `EXECUTED`, with receipt `resourceVersion: 2`. Select **Check recorded outcome — do not resubmit**, sign out, sign back in, and confirm that the same outcome is retained. No money moves. Do not try to approve again or clear state to defeat a refusal.
9. Close with **Ctrl+C** in the server window. Keep the evaluation folder for retained history. A genuine device result is recorded only after you actually complete the steps and report the observed outcome; a virtual-authenticator test is insufficient.

If a prompt is cancelled, the app does not automatically submit anything. An unsubmitted request may be cancelled through **Cancel this request**, which revokes its authority before a new request can be prepared. If submission loses its response, use **Check recorded outcome**; do not re-run the approval. `UNKNOWN` or `NOT_RECORDED` is never permission to retry. A completed or uncertain action blocks a new action in this evaluation.

The enrollment code expires 30 minutes after setup and becomes permanently spent after enrollment. Sign-in sessions expire after 10 minutes and are invalidated whenever the server restarts. After sign-out or restart, a prepared request from an earlier session cannot be committed by the new session; cancel the unused authority first. Completed/uncertain records remain available for authenticated inspection.

## Manual commands / restart

From the repository root in PowerShell (choose a genuinely new state-folder name for initial setup):

```powershell
node --version
npm ci --ignore-scripts
npm run build --silent
npm ci --ignore-scripts --prefix apps/local-approval
$AtgApprovalState = Join-Path $env:LOCALAPPDATA 'AgentTrustGate\approval-evaluation-01'
New-Item -ItemType Directory -Force (Split-Path $AtgApprovalState) | Out-Null
node apps/local-approval/server.mjs setup "$AtgApprovalState"
Get-Content (Join-Path $AtgApprovalState 'enrollment-code.txt')
node apps/local-approval/server.mjs serve "$AtgApprovalState"
```

After initial enrollment, restart with **only** the last `serve` command and the **same** state directory. Do not run setup over an existing directory. The launcher deliberately creates a separate fresh evaluation each launch; use the recorded `serve` command when preserving an existing credential/history. Each fresh setup is a new local evaluation identity, not recovery of an older one. Existing state is never migrated, erased or silently re-enrolled.

To permanently stop an existing local evaluation, in another terminal run:

```powershell
node apps/local-approval/server.mjs stop "$AtgApprovalState"
```

This invalidates application sessions and stops its synthetic witness. It does not reverse a committed record. Retain the folder. There is no remote revocation, multi-device enrollment management, credential replacement or real identity recovery service. If setup was interrupted at `REGISTERING`, it stays held. Do not edit its database to bypass that hold.

An exclusive `server.lock` refuses two app processes. A hard crash may leave the lock file. First verify the old Node process is gone, retain the state, and remove **only** that stale `server.lock` locally before `serve`. Never remove an active lock, database, trust, counters or audit to recover. A process launch failure before normal cleanup can also retain the lock.

## Implementation / boundaries

- HTTP binds only `127.0.0.1`; exact Host and Origin checks pin `http://localhost:8796` (or the setup-pinned optional port). WebAuthn treats localhost as a potentially trustworthy local context; this is not TLS or protection against another process on the same computer. A different localhost service may interfere with cookies/availability. Do not run untrusted local software, browser extensions or other localhost web services alongside the evaluation.
- Same-origin static JS/CSS, restrictive CSP, frame refusal, no CORS, HttpOnly SameSite Strict session cookie, CSRF nonce, bounded bodies and connections. The HTTP-only loopback cookie has no `Secure` attribute; this is not an Internet session design. App state and the witness are owned by the same local user, not independent principals.
- Enrollment uses pinned `@simplewebauthn/server` 14.1.0 with exact origin/RP, ES256 only, UP+UV required and a one-use persisted registration challenge. The fresh registered profile pins backup eligibility; UP+UV remain mandatory. Backup state may change only within that pinned eligibility. No extensions are requested for sign-in/approval; assertions outside the narrow supported profile fail closed. Unsupported authenticators may be refused.
- Some real passkeys use counter zero. Only the new explicitly registered profile permits 0→0. Positive counters must advance; positive→zero is refused. There is no counter-based clone detection for zero counters. Sign-in and transaction checks use the maximum stored application/witness counter. Legacy strict-profile trust and existing stores are not weakened or migrated.
- The authoritative witness still atomically checks the signed GatePass, exact action, business-state version, expiry, replay, revocation/stop and enrolled passkey, and commits one-use consumption, approval audit and synthetic effect. The returned linked receipt records the actual local synthetic outcome. Login challenges cannot approve actions. No approver private key or automatic software approval exists in the application.
- Issuer authority and order are fixtures generated by the same host. This local app intentionally runs its synthetic witness directly; it does not demonstrate real agent identity, delegation, shared-budget enforcement, independent outcome signing, real ERP writes, external evidence, admin-resistant custody or a protected transaction display on the authenticator.
- SQLite is local and unencrypted. POSIX modes are requested and checked for the app's files; Windows NTFS isolation remains separately provisioned/verified. Data include public credentials, counters, session hashes/CSRF values, fixture issuer private key, signed authority, exact fictional payload, outcomes and audit; no passkey private key is stored. Filesystem/DB denial fails closed. A local administrator or same-user process can tamper with/clone/roll back the whole environment. No encryption, managed custody, business identity registry, independent security assessment or production approval is established.
- App and witness use separate SQLite files. Commit intent is durably marked before effect. Interruptions are held as UNKNOWN and resolved only by read-only execution lookup; this is not a cross-database atomic transaction. Registration interruption remains held; no automatic repair, resubmission or retry is provided.

## Verification

```sh
npm run build --silent
npm test --prefix apps/local-approval
cd apps/local-approval
npx playwright install chromium
npx playwright test
```

The HTTP/crypto tests generate **software** WebAuthn credentials. Chromium's end-to-end test uses its **virtual authenticator**. Neither is a real person, hardware attestation, Windows Hello validation or an independent security audit. The CI job uploads only synthetic review-screen PNGs, never private state, enrollment codes, credentials, signed assertion bodies or keys. No automatic approval of real workflows or production deployment follows from passing tests.

Primary references: [SimpleWebAuthn server](https://simplewebauthn.dev/docs/packages/server), [passkey UV guidance](https://simplewebauthn.dev/docs/advanced/passkeys/), [MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts). Existing boundaries: [Security & Trust](https://agenttrustgate.com/security.html), [combined OpenShell evidence](../../docs/openshell/DELEGATED-BUDGET-VALIDATION.md).
