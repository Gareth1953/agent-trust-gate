# Public Launch Checklist

This checklist covers global publication of the repository as code and documentation only.

## Repository

- [ ] README positioning and links are accurate.
- [ ] License, security policy, contribution guide, changelog, and release notes are present.
- [ ] Manifest reports `local_demo_only`.
- [ ] Schemas and JSON examples parse.
- [ ] Tests, build, and typecheck pass.
- [ ] `.env`, generated logs, and private artifacts remain ignored.

## Required safety boundary

- [ ] No live APIs.
- [ ] No live or real payments.
- [ ] No real settlement or settlement execution.
- [ ] No external agent contact.
- [ ] No live endpoint, cloud call, or network call.
- [ ] No secret, token, or credential.
- [ ] No banking or wallet logic.
- [ ] No x402 or AP2 activation.
- [ ] No public outreach automation.
- [ ] No autonomous action execution.
- [ ] No production cryptographic signing.
- [ ] AUC is not integrated.
- [ ] Agent Contact System is not integrated.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

Passing this checklist is not production payment readiness, legal or compliance certification, a security audit, or live deployment approval.
