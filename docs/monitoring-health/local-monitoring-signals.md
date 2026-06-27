# Local Monitoring Signals

The report contains:

- gateway health, request-ID, logging, metering, rate-limit, and readiness availability;
- whether the local request-log file exists;
- valid request, error, rate-limit, unauthorized, and malformed-line counts;
- first and last valid request timestamps;
- current gateway-process start time and uptime when called through the gateway;
- explicit false flags for production monitoring, external alerting, and public uptime SLA.

Statuses are deliberately narrow:

- `local_monitoring_signals_only` means local inspection exists;
- `pass` means a local capability is present, not production-certified;
- `partial` means useful local evidence exists but hosted controls are incomplete;
- `not_started` or `future` identifies controls that are not implemented.

Request logs support local audit and diagnostics. They are not a durable metrics
pipeline, availability history, security information system, or uptime proof.
