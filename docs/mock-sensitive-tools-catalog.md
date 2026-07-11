# Mock Sensitive Tools Catalog

P3-M132 defines local mock tools for the enforceable tool-calling gate demo.
No real tool is executed.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

| Mock tool | Description | Risk tier | Required proof | Required approval | Signed proof required | Settlement-sensitive | Missing-proof outcome | Valid-proof outcome |
|---|---|---:|---|---|---|---|---|---|
| `send_customer_message` | Draft a customer-facing message. | Medium | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | escalate | allow locally only |
| `write_file` | Prepare a deterministic local demo output summary. | Low | mandate, evidence, verified intent, freshness, nonce | No | Optional in demo control | No | require evidence | allow locally only |
| `export_data` | Export local review data. | High | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | block when mandate is missing | allow locally only with full proof and approval |
| `prepare_payment` | Prepare a simulated payment-like instruction. | High | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | Yes | require signed proof or block | allow locally only with signed proof |
| `approve_procurement` | Approve a local procurement step. | High | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | block stale or replayed proof | allow locally only with fresh proof and approval |
| `publish_public_post` | Publish a local demo announcement draft. | Medium | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | escalate or block when proof is missing | allow locally only |
| `escalate_access_session` | Escalate local session access for a high-risk workflow. | High | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | require human review | allow locally only after approval |
| `create_settlement_instruction` | Create a simulated settlement instruction. | Critical | mandate, evidence, verified intent, freshness, nonce, signed gate pass | Yes | Yes | Yes | block without signed gate pass | allow locally only after valid signed gate pass |

Every catalog entry is a local mock tool. The demo does not write real files,
send customer messages, export data, prepare payments, approve procurement,
publish posts, escalate access, create settlement instructions, contact live
systems, or execute actions.

Public contact: `gpmiddleton71@gmail.com`.
