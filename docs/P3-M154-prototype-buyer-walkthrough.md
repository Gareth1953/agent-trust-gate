# P3-M154 buyer walkthrough

## Purpose

This walkthrough demonstrates one commercial idea in plain language: an AI agent may research and negotiate, but the exact purchase is not allowed through the simulated procurement boundary until ATG verifies the human, the mandate, the agent, the evidence and the exact action.

Start locally:

```text
npm run prototype:exact-action
```

Open `http://127.0.0.1:8794`.

The screen must always show **WORKING LOCAL PILOT PROTOTYPE**, **Synthetic data only**, **Simulated procurement execution only**, and **No real payment or external action**.

## Allowed action and replay

1. Open the default **A · Allowed** scenario.
2. In **Authorised Human**, show Alex Morgan, Procurement Director, Northstar Retail Ltd, active authority and a £25,000 limit.
3. In **Bounded Mandate**, show the human instruction, 200-unit quantity bound, permitted actions, £25,000 maximum and expiry.
4. In **Agent Work**, show all three offers. Explain that Harbour opened at £24,000 and the fixed negotiation reduced it to £23,750 with Net 45 terms.
5. In **Proposed Exact Action**, show Harbour Supply Ltd, Product X, 200 units and £23,750 GBP.
6. Select **Run ATG verification**.
7. Confirm that all 20 checks show **PASS** and the decision shows **GATEPASS_ISSUED** with a generated GatePass ID and exact-action digest.
8. Select **Simulate purchase**.
9. Confirm **SIMULATED_PURCHASE_COMPLETED**, a synthetic procurement reference and **Consumed: YES**.
10. Select **Open Trust Receipt**. Point out that the human-readable and JSON receipts carry the same generated human, agent, mandate, evidence, digest, decision and execution references.
11. Select **Verify receipt**. Confirm **VERIFIED**.
12. Select **Re-run same GatePass**.
13. Confirm **BLOCKED_REPLAY** and the explanation **GatePass already consumed / replay refused**. Confirm that no second synthetic purchase reference is created.

## Overspend refusal

1. Select **B · Overspend**.
2. Confirm the proposed total is £31,000 while Alex's and the mandate's maximum is £25,000.
3. Select **Run ATG verification**.
4. Confirm **ACTION_REFUSED** and blocked human-authority, standing-limit, amount and policy checks.
5. Confirm no GatePass ID is present and **Simulate purchase** remains disabled.
6. Select **Open Trust Receipt**.
7. Confirm the refusal section states:
   - Requested: £31,000
   - Authorised maximum: £25,000
   - No GatePass issued
   - No purchase executed
8. Select **Verify receipt**. A refusal receipt can verify as an authentic, internally consistent record even though the requested action was not allowed.

## Additional buyer scenarios

- **C · Wrong authority:** Jordan Lee is active and authenticated but lacks purchase authority.
- **D · Expired authority:** the signed authority proof exists but is outside its validity window.
- **E · Tampering:** issue for £23,750, then present £24,250 at execution; digest mismatch blocks.
- **F · Replay:** the dedicated replay journey proves one successful use and one closed second attempt.
- **G · Agent standing:** the agent's signed delegation is revoked; GatePass evaluation fails closed.

## Buyer takeaway

ATG is positioned between an agent's exact request and an irreversible system boundary. It translates cryptographic and policy checks into a receipt a procurement, risk, audit or technology buyer can read. V1 is a working local pilot prototype with synthetic execution—not a production deployment or certification.
