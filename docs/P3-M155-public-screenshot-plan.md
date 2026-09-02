# P3-M155 Public Screenshot Plan

## Publication rule

Screenshots are not captured or embedded automatically. Gareth should capture and approve them manually from the local prototype after running `npm run prototype:exact-action`.

Every published image must contain only the synthetic Northstar Retail Ltd, Alex Morgan, Northstar Procurement Agent 04 and Harbour Supply Ltd scenario data. Crop out browser chrome and terminals where practical. Never expose a personal local path, terminal username, hostname, API key, token, environment variable, browser profile, extension, bookmark, notification or unrelated tab.

## Required images

1. **Prototype overview** — hero, six-stage workflow and the synthetic-data/no-real-action status strip.
2. **GatePass issued** — allowed £23,750 action with the clear success panel and 20/20 check summary.
3. **Simulated purchase completed** — execution status, GatePass consumed and synthetic purchase reference.
4. **Trust Receipt** — executive summary visible; receipt ID, exact action, amount, reason, GatePass status, execution status, timestamp and verification status readable.
5. **Replay blocked** — `BLOCKED_REPLAY`, primary replay reason and confirmation that no second purchase occurred.
6. **Overspend refusal** — `ACTION REFUSED`, £31,000 requested, £25,000 authorised maximum, GatePass not issued and execution blocked.

## Capture checklist

- Use the default browser zoom and a clean viewport wide enough to avoid clipped values.
- Confirm the header says **WORKING LOCAL PILOT-READY PROTOTYPE**.
- Confirm all visible people, organisations, suppliers, identifiers and offers are synthetic.
- Ensure no developer console, address-bar query, download shelf or local filesystem path is visible.
- Expand only the receipt section needed for the image; avoid publishing long raw signatures unless specifically useful.
- Inspect every final crop for secrets, tokens, customer information and private browser content.
- Use neutral filenames such as `atg-exact-action-01-overview.png` through `atg-exact-action-06-overspend-refusal.png`.
- Obtain Gareth's explicit final publication choice; this plan does not publish images.
