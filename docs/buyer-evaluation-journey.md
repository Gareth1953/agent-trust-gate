# Buyer Evaluation Journey

P3-M141 makes the public buyer path easier to understand without changing the local-only safety boundary.

The buyer journey is:

**SEE IT -> TEST IT -> BUY A PILOT**

Core rule:

**No mandate. No evidence. No verified intent. No signed GatePass. No settlement.**

## 1. See It

Start with the one-command reviewer kit:

```powershell
npm run demo:reviewer-kit
```

The reviewer kit remains the recommended first experience. It shows the GatePass lifecycle, adversarial scorecard, developer wrapper summary, and safety boundary in one local deterministic demo.

Useful links:

- [One-command reviewer demo kit](one-command-reviewer-demo-kit.md)
- [Reviewer demo kit quickstart](reviewer-demo-kit-quickstart.md)
- [Reviewer demo output guide](reviewer-demo-output-guide.md)

## 2. Test It

After the reviewer kit, a developer or technical reviewer can inspect the local proof flow:

```powershell
npm run demo:gatepass-round-trip
npm run demo:gatepass-scorecard
npm run demo:gatepass-wrapper
```

This tests the local proof-of-concept only. It does not execute real tools, contact networks, process payments, execute settlement, or provide production middleware.

Useful links:

- [GatePass create-verify-reject round trip](gatepass-create-verify-reject-round-trip.md)
- [GatePass adversarial metrics and latency scorecard](gatepass-adversarial-metrics-and-latency-scorecard.md)
- [GatePass developer wrapper and local integration example](gatepass-developer-wrapper-and-local-integration-example.md)

## 3. Buy A Pilot

If the local evaluation is commercially relevant, a buyer may request an **Agent Trust Gate(TM) Paid Evaluation Pilot**.

The pilot is a paid, controlled, non-production evaluation of how GatePass-style checks could apply to a buyer's proposed AI-agent action workflow. It is local, manual-input only, human-approved, non-custodial, non-autonomous, advisory, and demonstrative.

Useful links:

- [Paid pilot commercial entry](paid-pilot-commercial-entry.md)
- [Paid pilot scope and deliverables](paid-pilot-scope-and-deliverables.md)
- [Paid pilot pricing boundary](paid-pilot-pricing-boundary.md)
- [Paid pilot enquiry template](paid-pilot-enquiry-template.md)

## What Not To Infer

The buyer journey does not imply:

- production readiness;
- real payment protection;
- real settlement enforcement;
- production signing;
- legal/compliance/security certification;
- guaranteed safety;
- guaranteed trust;
- guaranteed commercial results;
- automatic paid-pilot acceptance;
- automatic access after payment.

Public enquiries: `gpmiddleton71@gmail.com`
