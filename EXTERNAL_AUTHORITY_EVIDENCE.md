# ATG Integration Advantage: Use Trusted Authority Evidence You Already Have

Agent Trust Gate™ is designed to complement existing identity, authority and approval infrastructure rather than replace it.

A future organisation-specific integration can treat trustworthy external identity, organisational standing, mandate, delegation or approval evidence as input. ATG then asks the action-specific question:

> **Does this evidence authorise this agent to perform this exact action, here and now, within these limits?**

```text
existing trusted authority evidence
        -> Agent Trust Gate™
        -> exact-action verification
        -> signed GatePass OR recorded refusal
        -> separately controlled execution
```

This creates a clear separation of responsibilities:

- upstream systems can establish identity, role, authentication, delegation or approval evidence;
- ATG evaluates whether that evidence is sufficient for the exact proposed action;
- ATG binds an allowed decision to that action through GatePass;
- insufficient, stale, untrusted or out-of-scope evidence fails closed;
- decision evidence remains separate from execution evidence.

## Why this matters

**No rip-and-replace requirement.** ATG need not become another enterprise identity directory, authentication platform or universal credential issuer.

**Exact-action context.** Identity or permission alone does not prove authority for a particular consequential action.

**Protocol-agnostic direction.** Suitable customer-approved authority evidence can potentially feed the same ATG exact-action decision layer.

**Fail closed.** ATG does not manufacture authority when the evidence cannot establish it.

> **Bring the authority evidence you already trust. ATG determines whether it is sufficient for the exact AI action now being proposed.**

## Current boundary

The public repository remains a local reference demonstrator using deterministic synthetic/local evidence. It does not currently connect to live IAM, SSO, identity-provider, enterprise-directory, external credential, WebAuthn, payment, settlement or production enforcement systems.

Any real external authority integration would require a separately scoped trust model, security review and written agreement.

For the full architecture and claims boundary, see:

- [External Authority Evidence Integration Principle](docs/external-authority-evidence-integration-principle.md)
- [Reviewer Start Here](REVIEWER_START_HERE.md)

**Capability is not authority.**

**Verify Before Settlement.**
