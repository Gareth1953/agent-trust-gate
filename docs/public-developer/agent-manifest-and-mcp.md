# Agent Manifest and MCP-Style Adapter

`GET /v1/agent-manifest.json` returns agent-readable capabilities, tool metadata,
authentication headers, usage signals, and safety limits. The tracked copy is
`docs/agent-trust-gate.agent-manifest.json`.

`examples/mcp-adapter/` demonstrates local MCP-style tool dispatch. It is not a
production MCP server. Every tool declares `executes_actions: false`; tools read
status or return trust decisions and evidence only. No payment or automatic
purchase tool is provided.
