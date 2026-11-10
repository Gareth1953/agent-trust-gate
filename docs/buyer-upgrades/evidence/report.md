# ATG buyer evaluation

**Production NO-GO.** Local synthetic execution only. No independent review or real partner integration.

- exact-action-and-reuse: PASS_WITHIN_SYNTHETIC_BOUNDARY
- changed-request: PASS_WITHIN_SYNTHETIC_BOUNDARY
- direct-unapproved-command: PASS_WITHIN_SYNTHETIC_BOUNDARY
- revoke: PASS_WITHIN_SYNTHETIC_BOUNDARY
- emergencyStop: PASS_WITHIN_SYNTHETIC_BOUNDARY
- expired-authority: PASS_WITHIN_SYNTHETIC_BOUNDARY

- same-user-database-edit: SECURITY FAIL — attack succeeded
- coherent-all-role-clone-replay: SECURITY FAIL — attack succeeded

Both same-user state editing and coherent cloning remain successful attacks. Signatures and local checksums do not establish independent custody.

Elapsed 3230 ms on v24.22.1, linux; this is a functional run, not a latency benchmark.
