# Abuse Signal Model

Abuse signals are deterministic labels, not findings of malicious intent:

- `none`: no local signal applies.
- `suspicious_volume`: request count is near or at the configured maximum.
- `over_limit`: a protected request exceeded the local maximum.
- `repeated_errors`: three or more errors were supplied to the status calculator.
- `unknown_client`: the inspected client is absent from local configuration.

The gateway does not inspect payload intent, fingerprint devices, enrich IPs,
scan the internet, or contact an external fraud service. Signals should support
human investigation, not automatically accuse, purchase, bill, or execute.

Raw API keys are never included in these signals or local gateway request logs.
