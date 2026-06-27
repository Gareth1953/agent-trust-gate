# Local Rate Limits

Client configuration may include:

```json
{
  "rate_limit": {
    "max_requests": 60,
    "window": "local_runtime"
  }
}
```

Only protected `POST` requests consume the counter. The first `max_requests`
attempts are accepted by the rate-limit layer. The next attempt is `over_limit`
and receives HTTP `429` with error code `ATG_RATE_LIMIT_EXCEEDED`. Trust,
approval-pack, or evidence-bundle logic does not run for that rejected attempt.

Statuses are deterministic:

- `not_configured`: no local rate limit exists.
- `within_limit`: usage is below 80 percent.
- `near_limit`: usage is at least 80 percent but below the maximum.
- `at_limit`: usage equals the maximum; the next protected attempt is rejected.
- `over_limit`: usage exceeds the maximum and the request is rejected.

The status endpoint does not consume quota. CLI inspection uses local request
logs and labels its window `local_log_audit`; the live endpoint uses
`local_runtime` and is authoritative for the current gateway process. These are
not production-grade abuse-prevention controls.
