# Secret Handling

Never commit real secrets. Never place production API keys in tracked examples,
fixtures, screenshots, support messages, command histories, or generated reports.

Never log raw API keys or authorization headers. Redact secrets before structured
logging, tracing, error capture, alerting, backup, or support export.

For future hosted operation:

- use environment references or a managed secret store, not repository files;
- scope each secret to the minimum service and environment;
- separate demo, development, staging, and production credentials;
- rotate keys on a defined schedule and after suspected exposure;
- support immediate revocation and audited emergency access;
- avoid sending secrets in URLs, query strings, filenames, or response bodies;
- prevent secrets from entering build artifacts and client-side bundles.

The ignored `gateway-clients.json` file and demo keys are local development aids,
not production secret storage or real-world identity authentication.

This document is guidance only and is not a security certification.
