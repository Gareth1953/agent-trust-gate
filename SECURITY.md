# Security Policy

Agent Trust Gate™ is a public, local-first synthetic demonstrator. It is not a
hosted or production service, payment processor, settlement engine, production
identity service, or production security control. No production release or
version is currently supported.

## Reporting a potential security issue

Potential security issues in this repository may be reported responsibly to
`gpmiddleton71@gmail.com`. This mailbox accepts initial redacted reports;
ordinary email is not a secure channel for transferring secrets or client
datasets. If GitHub private security reporting or a
private security advisory is enabled and appropriate for the issue, that route
may also be used.

No private security-reporting channel is configured for sensitive evidence
transfer; agree a suitable handling route before sharing such material.

Send only a minimal, redacted description and safe reproduction steps. Do not
include customer data, personal data, credentials, secrets, tokens, production
keys, banking or payment details, or confidential third-party material. Retain
any sensitive supporting material securely unless and until a suitable private
handling route is agreed.

Do not report real secrets, credentials, tokens, private keys, personal data,
payment details or banking details in public issues.

Do not test against unrelated third-party systems or any production system.
Testing should remain within this repository's local synthetic fixtures and
systems you own or are explicitly authorised to test.

Please do not disclose a security-sensitive issue publicly before there has
been a reasonable opportunity to review it. This policy does not promise a
fixed response or remediation time.

## Ordinary bugs and feature requests

Use normal GitHub Issues for non-sensitive bugs, documentation problems and
feature requests. Remove private or operational data and provide the smallest
safe local reproduction.

## Current boundary

The review surface includes the repository, packaged evaluation plugin,
local CLI/MCP and optional loopback HTTP prototype, synthetic purchasing
execution, one-machine shared-worker SQLite stores and separate synthetic
destination process. These can write local evaluation state. MCP is evaluation
only; the optional destination runs local synthetic commits, not real orders
or payments. The static public website does not provide a customer upload,
account, payment checkout or hosted execution API.

Approval/operator identities, approval signing keys and evaluation clocks are
fixtures. A generated destination signing key is separate but remains on the
same host. Neither signatures nor local checksums protect against a host
administrator or establish independent partner evidence. Local records are
not encrypted by ATG. Do not use real client information, live credentials or
production keys in these demonstrations.

On POSIX systems, the Mission 04 source changes create new durable JSON state
files with owner-only permissions and new containing directories with mode
0700. This is a source change pending a separately reviewed package release;
published local.5 is unchanged. Existing directory permissions are not repaired.
Windows deployments require separately configured and checked NTFS ACLs.
A fresh Windows probe found inherited Modify access for sandbox principals,
including on atomic temporary and replacement files. These source modes do
not create an owner-only Windows ACL. See the
[Windows follow-up](docs/mission-04-windows-review.md) and its fresh-state probe.
These controls do not isolate processes running as the same OS user.

## Before any client-data evaluation

Keep initial evaluations synthetic. Before accepting real information, agree
an explicit data-flow and deployment boundary, data minimisation, permitted
processors, access/retention/deletion responsibilities, credential/key custody,
authenticated roles, monitoring and incident handling. Test backup/restore,
anti-rollback and partner-controlled conditional writes/fencing. Complete an
independent security assessment appropriate to the agreed deployment. A
passing repository test suite is not a substitute for that assessment.

See [Mission 04 review](docs/mission-04-security-review.md) for the bounded
source review and remaining gates. No supported production version is implied.

This policy is not a security audit, certification, warranty or deployment
approval.
