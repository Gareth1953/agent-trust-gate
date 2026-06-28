# Containment and Recovery

Planning containment steps include preserving logs and request IDs, requiring API
keys, rotating suspected exposed keys, disabling an affected client through an
approved process, reviewing unauthorized and rate-limit events, preserving
evidence, and documenting a timeline. Do not delete logs before review.

Planning recovery steps include confirming containment, restoring known-good
configuration, rerunning tests, checking the local gateway and integration
endpoints, reviewing logs, updating the incident record, and documenting lessons.

Do not re-enable future hosted or public mode without security, operational, and
legal review. These steps do not execute actions automatically, enable external
alerting, or notify customers.
