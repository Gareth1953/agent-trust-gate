# Local Agent Framework Integration Example

## Purpose

This page shows a LangGraph-style local integration pattern without importing
LangGraph or any external framework package. It is a framework-inspired local
adapter only.

## Pattern

1. A local agent step proposes a tool call.
2. The local adapter creates or receives a GatePass and proof package.
3. `wrapGatePassTool` intercepts the proposed call.
4. GatePass checks proof before the local mock tool is considered.
5. The wrapper returns an audit-style local result.
6. No live agent framework execution occurs.

## What The Demo Includes

- one allowed low-risk local mock tool call;
- one identity-only blocked call;
- one require-evidence result;
- one require-human-review result;
- one require-signed-GatePass result.

## Integration Boundary

This is a LangGraph-style local integration pattern, not a LangGraph dependency,
not an official LangGraph integration, not a production adapter, and not live
agent framework execution. There is no external network call, no live systems
contact, no direct bot messaging, no live agent-to-agent communication, and no
action execution.

Public contact: gpmiddleton71@gmail.com
