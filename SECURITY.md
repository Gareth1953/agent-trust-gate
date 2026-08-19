# Security Policy

Agent Trust Gate™ is a public, local-first synthetic demonstrator. It is not a
hosted or production service, payment processor, settlement engine, production
identity service, or production security control. No production release or
version is currently supported.

## Reporting a potential security issue

Potential security issues in this repository may be reported responsibly to
`gpmiddleton71@gmail.com`. No private security-reporting channel is configured
or assumed by this repository. If GitHub private security reporting or a
private security advisory is enabled and appropriate for the issue, that route
may also be used.

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

The review surface is the repository code, documentation, schemas, static
examples and local CLI. No live API, external-agent contact, cloud call, real
payment, settlement execution, action execution or production cryptographic
signing is active.

This policy is not a security audit, certification, warranty or deployment
approval.
