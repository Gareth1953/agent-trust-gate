# 0.1.0-local.7 — unpublished Mission 04 candidate

Prepared for Gareth and Dave's renewed review from durable-write repair commit
ce7259ad05d4f82cc0c865ea213ba90d9020d34a. This candidate is not a live release.
Published local.5 and retained unpublished local.6 remain unchanged. The sealed
local.6 archive is not replaced or relabelled.

Includes the reviewed legacy signed-JSON own-property fix and restrictive POSIX
durable JSON creation modes. Public fixture bytes remain compatible; tampered
own __proto__ payloads fail verification. Local.6 already contains these fixes.

New durable-write repair: exclusively open the temporary file at mode 0600,
write/fsync through that descriptor, close, then atomically replace and confirm.
Only a temporary file created by that attempt may be cleaned up. An EEXIST
collision remains intact. The original native error is retained as standard
non-enumerable Error.cause, including local filesystem diagnostic details.

The original Windows DURABLE_WRITE_FAILED incident remains unattributed. A
matching EPERM replacement failure was reproduced with a deliberately owned
open file handle, at the same test and markPossibleExternalEffect stack. This
does not establish the original OS error, failing operation or locking process.
The separate cleanup defect is fixed; Windows replacement denial is not
bypassed. Passing reruns do not clear the incident. Denied writes still fail
closed and preserve committed reservations. No automatic retry is added.

Existing v1/v2 and held state must be preserved. No automatic migration/reset,
permission relaxation, hold clearing or replacement of a versioned archive is
authorised. Synthetic fixture authority/approval keys/clocks, same-host
destination keys, no ATG record encryption and separate Windows ACL provisioning
still apply. Node 20 supports the legacy facade/public verifier; optional
SQLite/destination functionality requires Node 24. No independent security
assurance or supported production version is claimed. See SECURITY.md and the
bundled buyer guides.
