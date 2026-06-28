# Incident Severity Model

- `sev0_critical`: future hosted service-wide outage, confirmed widespread key
  exposure, or a future payment integrity incident after payments are enabled.
  Immediate escalation is required.
- `sev1_high`: suspected key exposure, repeated unauthorized requests affecting
  a client, or a sustained rate-limit spike. Urgent escalation is required.
- `sev2_medium`: evidence generation failure, malformed logs affecting audit, or
  isolated repeated authorization errors. Record, investigate, and recover.
- `sev3_low`: isolated non-blocking local issue. Record and correct through normal
  maintenance.

Payment incidents are future scenarios only. Payments and billing are not enabled.
This local classification is not production incident response or certification.
