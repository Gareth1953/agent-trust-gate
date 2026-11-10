# External security assessment brief — proposed engagement

**Prepared only. No assessor engaged, contacted or paid.** An internal adversarial
test or second automated review must not be described as an independent audit.

## Review question

For the exact reviewed source commit and a named deployment boundary, can an
agent or gateway cause a protected destination effect without the matching,
current, unconsumed authority? Which actors can bypass or restore that boundary?

## Required assessor experience

Practical application-security and distributed-systems testing, authenticated
IPC/IAM, cryptographic protocol review using established primitives, durable
idempotency/fencing and crash/restore analysis. Bank procurement/compliance
expertise is a separate role where relevant; this brief is not certification.

## Inputs and reproducible scope

- Source commit/diff and dependency lockfile, architecture, public-key pins,
  protocol descriptions, test commands and observed platform versions.
- Fresh synthetic evaluation with retained original failures; public summaries
  initially. No production keys, customer records or payment accounts.
- Read the successful direct-SQL and all-role-clone attacks before assessing
  claims of tamper resistance or global single use.
- Identify public fixture approval/operator keys and clocks. Do not test a new
  deployment as though these constitute real authenticated human authority.

## Mandatory attack cases

Changed amount/currency/supplier/bank state; missing/referred/shadow/expired
authority; forged trust roots; wrong tenant/destination; duplicate/concurrent
submissions; revocation/stop races; stale evidence; false signed completion;
malformed/oversized/ambiguous messages; unavailable or dishonest destination;
disconnect/kill at each commit boundary; direct credential/SQL access; coherent
backup restore; tampered runtime/module; alternate protected-effect routes.

The reviewer should verify transport errors cannot become success evidence and
that a passing fixture does not hide allocation/queue or trusted-host risks.
The Node IPC object decoder runs before application validation; resource bounds
here are partial. No complete hostile-code sandbox is claimed.

## Required outputs

Reproduction steps, affected commits/configurations, severity tied to the agreed
threat model, actual observations, redacted evidence, remediation guidance and
retest results. Separate PASS, FAIL, BLOCKED and OUT OF SCOPE. State reviewer
identity, relationship and limits, including all untested operating systems.

Agree the reviewer's quotation, permitted actions, handling route, retention,
disclosure and liability terms before granting access. No fixed price, SLA,
liability allocation or legal compliance is accepted by this document.
