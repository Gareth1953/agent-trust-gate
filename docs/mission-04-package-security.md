# Mission 04 security boundary — local.6 unpublished candidate

This candidate contains the reviewed Mission 04 fixes. Published local.5 and
all older versioned archives are unchanged and do not acquire these fixes.
This package is prepared locally for Gareth and Dave's review; no publication,
independent security assurance or production readiness is claimed.

## Fixes included

- Legacy exact-action and receipt serializers retain own enumerable JSON
  __proto__ fields in signed/hash bytes. Previously omitted fields now change
  the digest and cause a changed signed receipt or approved action to fail.
- Newly created durable JSON containing directories request POSIX mode 0700;
  atomic temporary files request mode 0600, which replacement retains.
  Existing directories and ancestors are not repaired or migrated.

## Windows and data handling

POSIX modes do not configure a private NTFS DACL. Provision and inspect a new
host-controlled evaluation parent before creating state. Restrict directory
inheritance through the separately authorised OS process; check temporary,
initial and replacement file DACLs. Restricting one existing state file does
not establish the permissions inherited by a replacement. ATG does not
implement Windows ACL enforcement, and existing held state must be preserved.

The Windows review observed broader inherited sandbox access in its workspace.
A separately authorised test on one new disposable parent verified inheritance
of only the evaluation user, SYSTEM and Administrators Full control through
fresh state creation and replacement. It did not secure existing stores or
test impersonation/effective access, administrator/SYSTEM token execution,
backup/restore or same-user isolation. Same-user code and administrators can
read local keys and records. No client-data deployment approval follows.

ATG does not encrypt local evaluation records. Use synthetic information only;
do not add client records, real credentials or production keys. Approval and
operator authority, approval signing keys and clocks remain fixtures. The
separate destination evaluation key remains on the same host. These are
one-machine, same-host synthetic controls, not independent external capture,
live ERP/payment integration, production key custody or multi-machine safety.
UNKNOWN outcomes retain holds and require explicit reconciliation; never reset,
migrate or discard held exposure merely to get a passing run.

Legacy SDK/CLI/MCP and public verification support Node 20+. SQLite shared
workers and the separate destination require Node 24+. Unsupported optional
use fails closed. No live execution or administrative tool is exposed by MCP.

## Reporting

Send only an initial minimal redacted report to gpmiddleton71@gmail.com.
Ordinary email is not a secure transfer channel for secrets or client material.
Agree a suitable private handling route before sharing sensitive evidence.
No fixed response/remediation time, certification or penetration-test assurance
is promised. Test only local synthetic systems you are authorised to assess.
