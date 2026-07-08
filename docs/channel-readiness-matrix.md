# Channel Readiness Matrix

This matrix records conservative local readiness. A status does not authorize deployment, publication, contact, payment, settlement, or execution.

| Channel | Status | Purpose | Current Boundary | Future Possibility |
|---|---|---|---|---|
| GitHub public repo | launch execution checklist prepared; human approval required before push | Public code review | No remote push performed by this mission | Human-approved public repository release |
| README/docs | documentation-ready | Explain the product, proof, and limits | Static local documentation | Reuse across approved static surfaces |
| manifest/schemas | ready for local/code launch | Code-readable capability and data shapes | Static files; no endpoint or transport | Versioned discovery assets |
| CLI proof | ready for local/code launch | Run deterministic local trust proof | No action, payment, or settlement execution | Approved developer workflows |
| static developer page | static page prepared locally, not deployed | Present code-first developer navigation | No hosting, no analytics, no contact forms, no live integrations | Separately approved static deployment assessment |
| agent-readable capability statement | documentation-ready | Describe local capabilities and disabled features | Static statement only | Approved discovery metadata |
| npm/package readiness | not approved | Possible package distribution | No package publish | Separate packaging assessment |
| MCP/A2A adapter | future candidate | Possible interface to the shared core | No active MCP/A2A integration | Separate adapter assessment |
| Agent Update Consortium bridge | not approved | Possible future update-trust bridge | AUC is not integrated | Separate AUC bridge assessment |
| Agent Contact System | prohibited until separately approved | Possible future contact-system interface | Agent Contact System is not integrated | Separate architecture and safety review |
| hosted sandbox | prohibited until separately approved | Possible controlled remote demonstration | No hosted sandbox is active | Much later security and deployment review |
| live payment/settlement | prohibited until separately approved | Possible future gated settlement interface | Live payment/settlement is not approved | Much later payment, legal, security, and human review |

Every future channel must reuse the same decision rules, receipt semantics, and safety boundary. No row activates an integration today.
