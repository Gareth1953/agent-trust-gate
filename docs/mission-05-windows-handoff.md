# Import Mission 05 on Gareth's Windows machine

This bundle contains a new local review branch, not permission to publish. Preserve the original checkout, divergent main, all mission branches/worktrees, archives and held state. No migration, reset, force, push or publication is part of this import.

Download `ATG-Mission05-PayeeShield.bundle` to Downloads. These are **PowerShell commands**; explanatory prose belongs in Codex, not PowerShell. Stop if a command fails or the branch/directory already exists. Do not overwrite anything to continue.

```powershell
Set-Location 'C:\Users\Gareth\agent-trust-gate'
git bundle verify 'C:\Users\Gareth\Downloads\ATG-Mission05-PayeeShield.bundle'
git fetch 'C:\Users\Gareth\Downloads\ATG-Mission05-PayeeShield.bundle' 'refs/heads/mission-05-payeeshield-demo:refs/heads/mission-05-payeeshield-demo'
git worktree add '.worktrees/mission-05-payeeshield-demo' mission-05-payeeshield-demo
Set-Location '.worktrees/mission-05-payeeshield-demo'
git status --short --branch
npm ci
npm run test:payeeshield
npm run demo:payeeshield
```

Open http://127.0.0.1:8795 . The server must remain running while using the page; Ctrl+C stops it. Do not open index.html directly. No GitHub sign-in is required to import this local bundle. Node 20+ supports this demo; the repository's full multi-worker suite requires Node 24 and its existing actual Node 20 helper configuration.

If handing this to Codex, ask:

> Review the local `mission-05-payeeshield-demo` branch in its separate worktree. Read `docs/mission-05-payeeshield.md`, `docs/mission-05-review-report.md` and `reports/mission-05/summary.json`. Verify the supplied commit and clean state; run `npm run test:payeeshield` on actual Windows Node 20/24 where available. Inspect the loopback demo at desktop, 390px and 320px using temporary browser profiles. Check exact binding, stale state, one-use execution, revocation, expiry and UNKNOWN reconciliation. Preserve all existing branches, worktrees, archives and held state. Report actual results and concrete findings. Do not merge, push, publish, rebuild existing downloads, change authentication or claim live bank verification.

The Linux implementation and browser evidence do not replace Windows runtime verification. Importing the branch does not add this demo to the published plugin or deployed Pages site.
