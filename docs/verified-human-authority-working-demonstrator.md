# P3-M153 — Verified Human Authority Working Demonstrator

**Status:** Working local demonstrator with a static browser presentation.  
**Boundary:** Synthetic identities, permissions, authentication evidence and transactions only.

## Buyer-visible purpose

P3-M153 turns the P3-M152A roadmap into a working demonstration of a stronger human-in-the-loop control.

The demonstration does not accept a simple `approved: true` field. It checks whether the approving natural person is represented by an active organisation identity, has organisation-controlled authentication evidence, holds current authority for the exact action, is independent from the requester where required, and has not exceeded an approval limit.

A valid result creates three separate linked objects:

1. **Human Authority Proof** — who approved, how the identity was authenticated, what authority applied and which exact action digest was reviewed.
2. **GatePass** — one-use local permission bound to the Human Authority Proof and exact action.
3. **Execution receipt** — separate evidence that the same action was simulated after verification.

## Run it

```bash
npm run demo:human-authority
npm run demo:human-authority -- --summary-only
npm run demo:human-authority -- --scenario authorised_refund
npm run demo:human-authority -- --json
npm run test:human-authority
```

## Demonstrated scenarios

- authorised £475 refund;
- authorised £1,250 credit note;
- inactive employee refusal;
- authority-limit refusal;
- restricted self-approval refusal;
- missing second approver refusal;
- changed action after approval refusal;
- expired Human Authority Proof refusal;
- replayed Human Authority Proof refusal;
- successful two-person approval of a £7,500 repayment.

## Browser demonstration

The GitHub Pages presentation is available at:

``discovery-site/human-authority-demo.html` in this repository`

The browser page is an explanatory visual scenario runner. The Node.js command-line demonstrator and test suite are the technical evidence path.

## Core rule

> No verified identity.  
> No confirmed authority.  
> No exact-action Human Authority Proof.  
> No valid GatePass.  
> No action.

## Security and claims boundary

This demonstrator uses:

- fictional employees and customer/order references;
- fixed authentication assertions rather than a real identity provider;
- a public Ed25519 fixture private key solely to demonstrate object signing and verification;
- local SHA-256 exact-action digests;
- no network calls;
- no real WebAuthn ceremony;
- no passwords, biometrics, production credentials or customer data;
- no HR, IAM, SSO, retailer, bank, government or payment integration;
- no real refund, credit note, repayment, exchange or external side effect;
- no production key custody;
- no post-quantum implementation or quantum-safety claim;
- no legal, compliance or security certification.

The signature suite is algorithm-labelled so later systems can migrate or add validated standard post-quantum evidence seals without changing the meaning of the canonical approved action.
