# Incident Response and Operational Recovery Readiness

This pack provides local-only incident planning signals for Agent Trust Gate. It
is not production incident response, does not enable external alerting, and does
not automate customer notification.

Run the readiness report:

```sh
npm run verify -- --incident-response-readiness
npm run verify -- --incident-response-readiness --json
```

Create a blank local incident record:

```sh
npm run verify -- --incident-template --output incidents/example-incident-record.json
```

Before public hosting, assign incident owners, approve and exercise escalation,
define log retention and key rotation, integrate monitoring and alerting, approve
customer and legal communication processes, and test rollback and recovery.

No deployment, notification, payment processing, or action execution is performed.
