# Agent-to-Agent Discovery Pack

This local pack renders machine-readable descriptions of Agent Trust Gate™ so agents, developer tools, and AI platforms can understand its purpose, capabilities, limits, approval path, and draft private-pilot metadata without live access.

```text
npm run a2a:discovery -- examples/agent-to-agent-discovery-pack-input.json --pretty
```

Renderer modes produce an agent card, offer, technical review, capabilities, disabled capabilities, pilot manifest, approval policy, pricing metadata, `llms.txt`-style text, and developer Markdown. Machine-to-machine discovery here means reading local files, not connecting to a service.

Agents can understand the local concept and boundaries but cannot call an endpoint, public API, real agent, tool, payment rail, or action executor. Nothing is hosted or published. Gareth approval is required before publishing and again before any future live-agent access. Quantum-readiness is positioning and future inventory awareness only, not quantum security or PQC compliance.
