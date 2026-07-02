# Direct Agent/System Pilot Offer Pack

This local generator creates a draft private-pilot position, qualification checklist, pricing options, machine-readable offer, owner brief, and contact-message drafts for Agent Trust Gate™.

```text
npm run pilot:offer -- examples/direct-agent-system-pilot-offer-pack-input.json --pretty
```

Use `--markdown`, `--offer-json`, or `--contact-message` for alternate local output. The command reads one local JSON file and writes nothing.

The pack does not search for targets, scrape, send email or messages, publish, deploy, expose an API, connect agents, collect payment, bill, settle, track, analyse, or execute actions. Gareth must separately approve every target and message before anything is sent or shared.
