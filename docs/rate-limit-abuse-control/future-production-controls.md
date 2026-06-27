# Future Production Controls

Public hosting would require controls beyond this local layer:

- distributed, atomic rate limiting across instances and regions;
- lawful IP, device, user, workload, and client fingerprinting where justified;
- WAF/CDN and denial-of-service protections;
- request-size, concurrency, timeout, burst, and global emergency limits;
- abuse monitoring, structured security events, dashboards, and alerting;
- staffed fraud and abuse review with containment and appeal procedures;
- reviewed customer terms, acceptable-use rules, and privacy retention limits;
- tested incident response, rollback, recovery, and key rotation;
- payment abuse, consent, refund, and transaction controls before billing.

None of these production controls is implemented by this pack. It does not
deploy Agent Trust Gate or expose a public service.
