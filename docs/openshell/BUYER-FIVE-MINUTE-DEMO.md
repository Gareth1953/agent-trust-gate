# Five-minute ATG + NVIDIA OpenShell buyer demonstration
**12 November 2026 — synthetic evaluation, not production.**

## Buyer proposition
OpenShell controls **where an agent can connect**; ATG checks **whether the exact proposed transaction is permitted**. The tested optional broker does not provide a live purchasing or payment integration. This is independently developed ATG work, not a NVIDIA certification, approval or commercial partnership.

## Before the session
- Have this page open: https://agenttrustgate.com/openshell-integration.html
- Have the [real OpenShell 0.1.8 CI evidence](VALIDATION.md) and [passkey-required evidence](PURCHASE-APPROVAL-VALIDATION.md) available.
- For a repeatable **local** demonstration, use Node.js 24 and OpenSSL:

```sh
npm ci --ignore-scripts
npm run demo:purchase-approval
```

The command uses a software test authenticator and the ATG broker protocol; **it does not run OpenShell, use a real enrolled person, or make any real purchase**. The separate GitHub Actions workflow runs both broker modes inside genuine OpenShell 0.1.8.

## Five-minute narrated sequence

**0:00–0:35 — The problem.**
> "A sandbox can restrict which service an agent contacts. A destination also needs to know whether the agent has authority to make this exact change. That is the narrow job ATG tests."

**0:35–1:20 — A grant alone is not permission.**
Run the scripted local demo. Point to the case where a valid issuer grant **without the configured passkey assertion** is refused. A signed approval lacking user verification is also refused.

**1:20–2:10 — Changing the purchase invalidates it.**
Point to altered payee and amount tests. These are rejected even when a prior signed grant exists. No unbound second callback is allowed.

**2:10–3:15 — Exactly one allowed effect.**
The matching issuer grant and software-fixture approval commit one **synthetic** £4,000 record update. The approval audit and one-use consumption belong to the same SQLite transaction in the tested mode.

**3:15–4:10 — Replay and uncertainty.**
The second attempt is refused. Historical lookup reads the completed result without creating another effect. In actual OpenShell tests, a stopped broker returned UNKNOWN without automatic fallback or retry.

**4:10–5:00 — Show real-runtime evidence and propose an evaluation.**
Open [actual OpenShell 0.1.8 final-source recheck](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43191045586) and [regression/custody checks](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43191045762). Explain the two distinct layers: OpenShell's destination/port/binary rule and ATG's signature, exact HTTP body and one-use record control. Invite a buyer to specify one bounded synthetic workflow and up to five acceptance questions for the indicative £1,500 supervised evaluation (subject to agreement).

## Evidence and limitations to state unprompted
- The baseline and passkey-required paths passed actual OpenShell 0.1.8 runtime tests. Test outputs are retained in `docs/openshell/`.
- The passkey mode uses a **software test fixture**. A live human enrollment and authentic device/browser ceremony have **not** happened.
- No real payment rail, purchasing API, production Entra federation, customer deployment, independent assurance, NVIDIA endorsement or Microsoft endorsement is demonstrated.
- Administrator control of writer/Docker and whole-host/writer rollback remain outside the tested safety boundary. Historical common-owner attacks in legacy modes remain reproducible.
- The published local.7 plugin and old SDK/MCP integration have **not** been silently upgraded. Production status is **NO-GO**.

## Follow-up
Ask for the buyer's **workflow, named owner, technical reviewer and five concrete acceptance questions**. Offer a scoped demonstration rather than claiming general production protection.
