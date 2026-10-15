# Mission 04 Windows follow-up

Local review of bundle commit `8ca808a05afd46f2c034f9ced613b9929d11710d` on Windows, 2026-10-15. This is a bounded maintainer review, not independent assurance or deployment approval.

## Verified source and preservation

Read the extracted pack's READ-ME-FIRST.txt before its other contents. Git bundle verification reported complete SHA-1 history and exactly one ref, `refs/heads/mission-04-security-review`, at the requested commit. Bundle SHA-256: `c19c77a39458d5a36f6d54a5461038479a9c5d038f2b58df4c9eeb5b24e4c3b0`. Git fsck on the imported commit completed without errors.

Imported only that ref, with no tags or FETCH_HEAD update, as new local branch `review/mission-04-windows`. Used the new `.worktrees/mission-04-windows-review` checkout. The bundled change is one commit after published baseline `e8d398b7165c3bf8f6df23809fadb9b2b127b92d`. Existing main and all other refs were left in place; there was no integration with their histories.

All original refs remained at their captured tips and all four original worktrees retained their initially clean status. SHA-256 comparisons of 33 pre-existing files under the original root's `.atg-evaluation` and `discovery-site/downloads` found no changes, including the preserved Node 20 executable. These fingerprints are a bounded verification, not a claim to have hashed every file on the machine. Tests used the new worktree or fresh temporary directories. No reset, force, merge, push, publication, archive replacement, state migration or authentication restart occurred.

## Security fix assessment

M04-01: both patched serializers define own enumerable data properties, so an own JSON `__proto__` value is included at root and nested positions. The Windows regressions verify canonical round-trips, distinct hashes, refusal of a tampered signed legacy receipt, and refusal of a changed approved action. The ordinary public signed fixture still verifies. No further concrete defect in these two changes was established in this bounded review; this does not audit every legacy serializer input type.

M04-02: directory mode 0700 and temporary-file mode 0600 are appropriate creation restrictions on POSIX, with replacement installing the restricted temporary inode. Windows does not implement those modes as a private DACL. The POSIX regression correctly skips on Windows; it was not relabelled as an NTFS pass.

## Actual NTFS observations

Get-Volume identified drive C as NTFS. The lower-level fsutil volume query returned Access is denied; it was not used as successful evidence. A new standalone durable store was created twice, once as the sandbox account and once as Gareth, using synthetic authority at the fixture's fixed valid time. The probe captured icacls output for its newly created parent, containing directory, both fsynced temporary files, initial state file and atomic replacement.

Every observed file inherited Modify access for `AX16PRO\CodexSandboxUsers` and five additional SID principals, and Full control for Gareth, SYSTEM and Administrators. The directory ACEs also propagate to children. This workspace is therefore **not owner-only**. Replacement retained this inherited access. No existing state file or directory ACL was modified, and no attempt was made to identify the unresolved SID principals or impersonate a second ordinary user. The probe is DACL evidence, not a comprehensive effective-access, group-membership, backup or administrator isolation test.

Concrete follow-up changes: added a repeatable observational probe, documented that a private Windows parent must be provisioned before creating state, and made the Security & Trust draft explicitly say published local.5 lacks both Mission 04 fixes. A source comment now points callers to this Windows boundary. These changes clarify an unsafe deployment assumption; they do not implement Windows ACL enforcement.

For any separately authorised Windows evaluation, provision a new directory under a dedicated evaluation account and review its owner and every explicit/inherited ACE. Remove unintended inheritable read/write grants from that new directory through the approved OS process before introducing information. Verify the resulting directory, temporary and replacement-file ACLs. Hardening an individual state file alone is insufficient to establish the permissions of a replacement created in its parent. Do not change held evaluation state to obtain a passing result.

The initial private-parent test was rejected by automatic approval review as an ACL change outside the original assessment authorisation. The user subsequently explicitly authorised this test only within a newly created disposable directory, with SYSTEM and Administrators access preserved. Automatic review allowed the authorised executions; no restriction was bypassed.

The authorised test passed on Node 24.21.0 in `C:\Users\Gareth\AppData\Local\Temp\atg-m04-private-parent-lR8sXT`. This directory was newly created directly under TEMP, outside all repositories and evaluation stores. The script accepts no target path, checks the new root is empty and is a direct, non-symlink child of TEMP, and performs no recursive ACL command. It first grants Gareth, SYSTEM (S-1-5-18), and Administrators (S-1-5-32-544) inheritable Full control, then removes inherited entries on that new root only. No existing folder ACL was changed.

Structured Get-Acl inspection verified the root is owned by Gareth, has a protected canonical DACL and exactly three explicit Allow FullControl entries for those principals, with file and directory inheritance. A new child directory, both fsynced temporary state files, the initial state file and the atomic replacement each had exactly the same three FullControl entries inherited from the private root. Both synthetic store updates succeeded. FullControl was checked numerically, rather than inferred from successful writes or POSIX mode bits. The TEMP parent's SDDL was unchanged. Before/after SDDL snapshots also match for the repository, .git, .worktrees, review worktree, existing root evaluation directory and Downloads.

This establishes that provisioning a private parent can constrain DACL inheritance throughout this fresh durable-store creation and atomic-replacement sequence on this NTFS volume. It does **not** retrofit or secure existing state, implement ATG Windows ACL enforcement, or establish general Windows deployment readiness. Cross-account access attempts, effective-token/group-membership analysis, actual execution as SYSTEM or an administrator, same-user isolation, backup/restore, network shares and other filesystems remain untested. SYSTEM and Administrators retain FullControl grants; they were not impersonated to perform access tests. Existing workspace directories continue to have their original broader ACLs. Desktop/mobile visual review remains outstanding.

The first authorised execution failed in its initial read-only TEMP ACL query because Windows PowerShell could not load Microsoft.PowerShell.Security; it stopped before directory creation or any ACL write. The corrected script uses the installed PowerShell 7 for read-only inspection. Its final execution passed. Both logs are retained. The disposable directory and synthetic final state are retained; no cleanup or deletion was performed.

The authorised probe is `scripts/check-mission-04-private-parent-acl.mjs`; it changes only a newly created disposable root's ACL and requires explicit authorisation for any future run. Full successful ACL evidence is committed as `reports/mission-04-windows/private-parent-acl.json`, alongside the existing-folder before/after snapshots. This evidence supersedes the earlier unexecuted-test limitation, while leaving the original read-only observation valid.

Reproduce the observational probe after building:

```powershell
node scripts/check-mission-04-windows-acl.mjs
```

It accepts no existing-state path, changes no ACLs and retains its synthetic files under the review worktree's ignored `.atg-evaluation/mission04-windows-acl` directory. Inspect the raw output rather than interpreting exit 0 as isolation approval.

## Windows validation

Node 24.21.0; preserved actual Node 20.19.0 at `C:/Users/Gareth/agent-trust-gate/.atg-evaluation/mission-02-node20/node.exe`, SHA-256 `6e3a39787e667d50487f7335c85636c2823a53e636d73c2c841d45da4e57906c`.

- Final `npm ci --ignore-scripts`: exit 0, three packages installed from the lockfile, zero reported advisories.
- Final `npm test` with ATG_NODE20_PATH set: exit 0. Main: 675 passed. Posttest: 952 passed, one POSIX permission case skipped. Total: **1,627 passed, zero failed, one skipped**.
- Focused cases on actual Node 24 and Node 20: each seven passed, one POSIX skip.
- Final typecheck, public-claims and discovery-site validators: exit 0. Twenty website positioning/publication-readiness static tests passed; these do not render a browser.
- Reviewer check: exit 0. Plugin: 42 unit checks and the fresh source-built installed SDK/CLI/MCP, five state-binding and seven worker scenarios passed. Its package and state were temporary; published downloads were not rebuilt.
- npm audit: zero reported advisories, not a guarantee of absence of vulnerabilities.
- Immutable local.5/source comparison: expected exit 1 for different compiled durable-action-lifecycle bytes. No validator was weakened or archive replaced.

Initial environment failures are retained: the default shell helper failed to start; sandboxed npm terminated without output and a retry left the review worktree's local dependencies incomplete. An initial direct typecheck could not locate local TypeScript. A final explicit npm CLI install restored complete worktree-local dependencies, then typecheck and the full suite passed. Early passing builds could resolve ancestor tools; the final full run followed the verified local install. A first ACL probe used an out-of-window synthetic authority timestamp and refused the write; it was corrected to the existing fixture's valid fixed time without changing authority logic.

Raw logs and their hashes, initial check results and the final machine-readable summary are retained under `reports/mission-04-windows`. They are Windows follow-up results, not replacements for the supplied Linux report.

## Desktop/mobile visual review remains blocked

The in-app browser was unavailable, browser inventory returned an empty list, and an explicit dedicated Chrome session was unavailable. No authentication was started or restarted. **No desktop or mobile rendering was inspected, and no screenshot, menu-interaction or visual pass is claimed.** The page was read as source and its static validators passed. Desktop/mobile visual inspection remains required before any publication, including the added release-status paragraph. The current page, source fixes and report remain local.
