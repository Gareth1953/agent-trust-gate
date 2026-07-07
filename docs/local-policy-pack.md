# Local Policy Pack

Agent Trust Gate™ uses deterministic local policy rules to decide whether an agent-led action can receive a placeholder signed gate pass, require review, or be refused.

## Policy Areas

- **Mandate policy:** authority must be present, scoped, and current.
- **Evidence policy:** evidence must be present and fresh.
- **Verified intent policy:** declared intent must be present.
- **Limits policy:** the synthetic amount or action limit must not be exceeded.
- **Approval policy:** medium and high-risk categories are gated; high-risk categories require explicit approval before an allow verdict.
- **Risk-tier policy:** categories are classified as low, medium, high, or prohibited.
- **Settlement-block policy:** settlement is blocked unless every check passes and the result is `allow_signed_gate_pass`; even then no settlement is executed.

## Decision Principle

**Fast when safe. Gated when uncertain. Stopped when unsafe.**

Low risk is eligible for a fast path only after mandate, evidence, intent, limits, and approval checks pass. Medium risk is gated for review. Money, legal, contractual, and customer-impacting categories require explicit approval. Prohibited categories always produce refusal receipts.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

This policy pack is local demo policy only. It does not provide legal advice, compliance certification, live payment approval, action permission, or real-world settlement permission.
