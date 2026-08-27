# External Authority Evidence Integration Principle

## Core principle

Agent Trust Gate™ (ATG) is designed to complement trusted identity, authority and approval systems rather than replace them.

An organisation may already have authoritative sources that establish facts such as:

- who a person or software agent is;
- whether a person is currently active in the organisation;
- what role, mandate or delegated authority exists;
- what authentication or approval evidence was produced;
- which limits, accounts, departments, jurisdictions or risk tiers apply.

ATG can treat trustworthy external authority evidence as an input to its own decision process. ATG then asks a narrower, action-specific question:

> **Does this evidence authorise this agent to perform this exact action, here and now, within these limits?**

If the evidence and proposed action satisfy the applicable ATG policy, an action-bound GatePass may be issued. If authority, scope, freshness, evidence or another required condition cannot be established, the action is refused and the reason can be recorded.

## Architecture direction

```text
trusted identity / authority / approval evidence
                    |
                    v
          Agent Trust Gate™
                    |
          verify agent standing
          verify human authority
          verify mandate and scope
          verify limits and evidence
          reconstruct exact action
          bind decision to exact action
                    |
          +---------+---------+
          |                   |
          v                   v
    signed GatePass      recorded refusal
          |
          v
  separately controlled execution
```

The upstream source establishes evidence. ATG does not automatically trust an assertion merely because it is presented. The verifier must be able to determine whether the source, evidence and current context are acceptable under policy.

## Why this is an advantage

### Use what the organisation already trusts

ATG does not need to become another enterprise identity directory, authentication platform, approval system or universal credential issuer. A future integration can consume suitable evidence from systems the organisation already operates and trusts.

### Add exact-action context

Existing systems may establish identity, role, permission, approval or delegation. Those facts do not necessarily answer whether a specific AI-agent action is authorised at the moment it is proposed.

ATG adds the exact-action decision layer: who is acting, under whose authority, for what exact action, within which scope and limits, using which evidence, at what time.

### Avoid rip-and-replace positioning

The architectural goal is compatibility with existing authority infrastructure. ATG can sit downstream of trusted evidence sources and upstream of consequential execution.

### Fail closed when authority cannot be established

If external authority evidence is unavailable, untrusted, stale, revoked, insufficiently scoped or inconsistent with the exact action, ATG should not manufacture authority. The action should fail closed under the applicable policy.

### Keep decision evidence separate from execution evidence

A GatePass records that an exact action was permitted under the evaluated evidence and policy. It does not prove that the action was later executed. Execution remains a separate event with separate evidence.

## Possible future evidence sources

Depending on a separately scoped real-world integration, external evidence could potentially come from sources such as:

- organisation identity and employee directories;
- organisation-controlled authentication systems;
- role or entitlement stores;
- approval workflows;
- signed delegations or mandates;
- policy engines;
- verified organisational records;
- other customer-approved authority sources.

This list describes an integration direction only. It does not claim that the public demonstrator currently connects to any of these systems.

## Current implementation boundary

The public Agent Trust Gate repository remains a local reference demonstrator.

It currently uses deterministic synthetic/local evidence. It does **not** provide live IAM, SSO, enterprise-directory, external credential, identity-provider, WebAuthn, payment, settlement, cloud, production key-management or production enforcement integrations.

The repository therefore demonstrates the decision architecture, evidence model, exact-action binding, GatePass/refusal behaviour and local proof flows. Any real external authority source would require a separately scoped integration, trust model, security review and written agreement.

## Buyer/reviewer summary

> **Bring the authority evidence you already trust. ATG determines whether it is sufficient for the exact AI action now being proposed.**

This preserves the distinction between upstream identity/authority evidence and ATG's downstream exact-action decision.

**Capability is not authority. Identity is not authority. Approval is not enough unless it applies to the exact action.**

**Verify Before Settlement.**
