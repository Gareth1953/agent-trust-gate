# P3-M155 Buyer Demo Script

## 5–8 minute Exact Action Trust Gateway walkthrough

**Status:** Working local pilot-ready prototype. Synthetic data and simulated procurement execution only.

**Before the call:** run `npm install`, then `npm run prototype:exact-action`. Open the loopback URL printed in the terminal. Keep **A · Allowed** selected. State that every identity, supplier, offer and action is synthetic and execution is simulated.

### 0:00–1:00 — Here is the human and their authority

“Here is the human: Alex Morgan, Procurement Director at fictional Northstar Retail Ltd. Here is their verified authority: active appointment, synthetic authentication evidence, supplier-purchasing scope, approved department and jurisdiction, medium risk tier, and a £25,000 maximum.”

Point to the authority card and expiry. Explain that the Human Authority Proof is created only after the exact action passes these authority bounds.

### 1:00–2:00 — Here is the agent and bounded mandate

“Here is Northstar Procurement Agent 04. Its standing record links the software identity to an accountable principal and a signed, current capability scope.”

“Here is the bounded mandate: source, compare and negotiate 200 units of Product X, then purchase up to £25,000 only subject to ATG approval.”

Point out supplier/category, currency, jurisdiction, risk, quantity, validity and evidence bounds.

### 2:00–3:00 — Here is what the agent found

Show the three synthetic supplier offers. Explain that deterministic agent work compares price, delivery and terms, records a £250 negotiation improvement with Harbour Supply Ltd and selects a £23,750 proposed purchase.

“This is not a general permission. This exact supplier, amount, product, quantity, terms, policy, timestamp and nonce become one canonical action digest.”

### 3:00–4:00 — Run ATG and execute once

Select **Run ATG verification**.

Confirm:

- `GATEPASS_ISSUED`;
- Human authority: `VERIFIED`;
- Agent standing: `VERIFIED`;
- Exact action: `VERIFIED`;
- 20 of 20 checks pass.

Select **Simulate purchase**. Confirm `SIMULATED_PURCHASE_COMPLETED` and GatePass `CONSUMED`. Remind the buyer that no procurement API, order or payment was touched.

### 4:00–5:00 — Open and verify the Trust Receipt

Select **Open Trust Receipt**. Start with the executive summary: who authorised, which agent acted, the exact action and amount, why ATG allowed it, GatePass state, execution state, timestamp and receipt verification state.

Expand the full audit detail only as needed. Show raw JSON as the future SIEM/GRC/audit-system-shaped evidence. Select **Verify receipt**. Optionally demonstrate local copy or JSON/text download.

### 5:00–6:00 — Replay the GatePass

Select **Re-run same GatePass**.

Confirm `BLOCKED_REPLAY`, `GATEPASS_REPLAY`, no second simulated purchase and a new receipt explaining the block. Explain that successful execution consumed the process-local nonce.

### 6:00–7:00 — Show the £31,000 refusal

Select **B · Overspend**, then **Run ATG verification**.

Pause on the top panel:

- `ACTION_REFUSED`;
- primary reason: requested action exceeds verified human purchasing authority;
- requested: £31,000;
- authorised maximum: £25,000;
- GatePass: `NOT ISSUED`;
- execution: `BLOCKED`.

Explain that affected policy and binding checks remain available underneath, but they are consequences of the clear root authority failure. Confirm the purchase button cannot execute and open the refusal receipt.

### 7:00–8:00 — Finish at the integration boundary

Show the final flow:

```text
AI AGENT / TOOL → ATG EXACT ACTION TRUST GATEWAY → BUYER SANDBOX SYSTEM
```

Explain that V1 uses the synthetic adapter; a controlled future pilot would replace it with a buyer-controlled sandbox adapter under separate scope. Production integration is not included.

Close with:

> “ATG does not ask whether an AI agent is generally trusted. It asks whether this exact agent action is authorised to happen now, under this exact verified human and organisational authority.”
