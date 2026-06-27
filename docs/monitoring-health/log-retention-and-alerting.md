# Log Retention And Alerting

Local JSONL logs currently support deterministic audit summaries. Before public
hosting, approve a policy covering:

- logging purpose, minimization, redaction, access, and integrity;
- retention periods, deletion, legal hold, backup, and customer requests;
- regional storage and processor responsibilities;
- separation of operational, security, audit, and billing records;
- request-ID propagation without logging raw API keys or sensitive payloads;
- alert thresholds for errors, unauthorized requests, abuse, and rate limits;
- severity, deduplication, escalation, acknowledgement, and closure;
- evidence preservation and incident-response handoff.

No external alerts are sent. No uptime SLA is measured or guaranteed. Payment
and billing monitoring must be designed before either capability is enabled.
