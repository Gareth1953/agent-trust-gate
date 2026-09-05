import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorityRegenerationControl,
  createRiskSnapshot,
  createSyntheticAuthority,
  type RegenerationEvent,
  type Scope,
} from "../src/authority-regeneration-control.js";

const BASE_SCOPE: Scope = {
  purpose: "CLIENT_HEDGE",
  legalEntity: "BANK_UK_01",
  portfolio: "PORTFOLIO_A",
  counterparty: "CP_173",
  strategy: "CLIENT_HEDGE_STRATEGY_A",
};

function seeded(mode: Parameters<typeof createSyntheticAuthority>[0] = "SAME_PURPOSE") {
  const arc = new AuthorityRegenerationControl(createSyntheticAuthority(mode));
  arc.recordExecutedAction({
    actionId: "ACTION-001",
    agentId: "CLIENT_HEDGE_AGENT_01",
    amount: 9_000_000,
    scope: BASE_SCOPE,
    consumedAt: "2026-09-05T13:00:00.000Z",
    authorityId: "AUTH-PFE-001",
    synthetic: true,
  });
  return arc;
}

function event(overrides: Partial<RegenerationEvent> = {}): RegenerationEvent {
  const occurredAt = overrides.occurredAt ?? "2026-09-05T13:20:00.000Z";
  return {
    eventId: "EVENT-001",
    authorityId: "AUTH-PFE-001",
    sourceActionId: "ACTION-001",
    eventType: "UNWIND",
    lifecycleStatus: "EXECUTED_CONFIRMED",
    attributionStatus: "DIRECT",
    attributionMethod: "synthetic-position-level-causal-attribution.v1",
    scope: BASE_SCOPE,
    previousExposure: 65_000_000,
    currentExposure: 58_000_000,
    rawCapacityRelease: 7_000_000,
    attributedEligibleRelease: 6_000_000,
    evidence: createRiskSnapshot(58_000_000, occurredAt),
    consequenceVector: [
      { consequenceClass: "COUNTERPARTY_PFE", delta: -7_000_000, material: true, authorityCovered: true },
    ],
    occurredAt,
    synthetic: true,
    ...overrides,
  };
}

test("risk capacity can return while NONE mode leaves delegated authority unchanged", () => {
  const arc = seeded("NONE");
  const result = arc.evaluateRegeneration(event());
  assert.equal(result.decision, "REFUSE");
  assert.equal(result.refusalCode, "ATG-ARC-001 NO_REGENERATION_RIGHT");
  assert.equal(arc.getState().totalAvailable, 1_000_000);
});

test("raw risk delta is evidence only; eligible attribution and cap determine regeneration", () => {
  const arc = seeded("SAME_PURPOSE");
  const result = arc.evaluateRegeneration(event({ rawCapacityRelease: 7_000_000, attributedEligibleRelease: 2_500_000 }));
  assert.equal(result.decision, "PASS");
  assert.equal(result.permittedRegeneration, 2_500_000);
  assert.equal(arc.getState().totalAvailable, 3_500_000);
});

test("same-purpose unwind creates regeneration lineage and eligible GatePass", () => {
  const arc = seeded("SAME_PURPOSE");
  const regen = arc.evaluateRegeneration(event());
  assert.equal(regen.decision, "PASS");
  assert.equal(regen.permittedRegeneration, 6_000_000);

  const action = arc.evaluateAction(
    {
      actionId: "ACTION-002",
      agentId: "CLIENT_HEDGE_AGENT_02",
      agentGroupId: "CLIENT_HEDGE_AGENTS",
      exactAction: "Synthetic client hedge",
      pfeIncrease: 5_000_000,
      scope: BASE_SCOPE,
      requestedAt: "2026-09-05T13:21:00.000Z",
      synthetic: true,
    },
    createRiskSnapshot(58_000_000, "2026-09-05T13:21:00.000Z"),
  );
  assert.equal(action.decision, "PASS");
  assert.ok(action.gatePass);
  assert.equal(action.gatePass?.allocation.originalAuthority, 1_000_000);
  assert.equal(action.gatePass?.allocation.regenerationCredits[0]?.amount, 4_000_000);
  assert.equal(action.gatePass?.regenerationLineage.length, 1);
});

test("cross-purpose risk-capacity laundering is refused despite ample firm headroom", () => {
  const arc = seeded("SAME_PURPOSE");
  assert.equal(arc.evaluateRegeneration(event()).decision, "PASS");
  const propScope = { ...BASE_SCOPE, purpose: "PROPRIETARY", strategy: "PROP_STRATEGY_Z" };
  const action = arc.evaluateAction(
    {
      actionId: "PROP-001",
      agentId: "PROP_AGENT_01",
      agentGroupId: "CLIENT_HEDGE_AGENTS",
      exactAction: "Synthetic proprietary trade",
      pfeIncrease: 5_000_000,
      scope: propScope,
      requestedAt: "2026-09-05T13:21:00.000Z",
      synthetic: true,
    },
    createRiskSnapshot(40_000_000, "2026-09-05T13:21:00.000Z"),
  );
  assert.equal(action.decision, "REFUSE");
  assert.equal(action.refusalCode, "ATG-ARC-003 REGENERATION_PURPOSE_MISMATCH");
  assert.equal(action.firmRiskCapacityBefore, 60_000_000);
});

test("REVERSAL_BOUND refuses market movement even when PFE falls", () => {
  const arc = seeded("REVERSAL_BOUND");
  const result = arc.evaluateRegeneration(
    event({
      eventType: "MARKET_MOVEMENT",
      sourceActionId: undefined,
      attributionStatus: "PORTFOLIO_LEVEL",
    }),
  );
  assert.equal(result.decision, "REFUSE");
  assert.ok(
    result.refusalCode === "ATG-ARC-005 REGENERATION_EVENT_NOT_ELIGIBLE" ||
      result.refusalCode === "ATG-ARC-006 REVERSAL_NOT_PROVEN",
  );
});

test("model recalibration does not manufacture authority", () => {
  const arc = seeded("LIVE_CEILING");
  const result = arc.evaluateRegeneration(
    event({
      eventType: "MODEL_CHANGE",
      sourceActionId: undefined,
      attributionStatus: "UNATTRIBUTABLE",
      attributionMethod: "model-recalibration",
    }),
  );
  assert.equal(result.decision, "REFUSE");
  assert.equal(result.refusalCode, "ATG-ARC-005 REGENERATION_EVENT_NOT_ELIGIBLE");
});

test("indeterminate lifecycle event is fenced", () => {
  const arc = seeded("REVERSAL_BOUND");
  const result = arc.evaluateRegeneration(event({ lifecycleStatus: "INDETERMINATE" }));
  assert.equal(result.decision, "REFUSE");
  assert.equal(result.refusalCode, "ATG-ARC-016 REGENERATION_EVENT_INDETERMINATE");
});

test("cross-dimensional consequence without authority blocks regeneration", () => {
  const arc = seeded("SAME_PURPOSE");
  const result = arc.evaluateRegeneration(
    event({
      consequenceVector: [
        { consequenceClass: "COUNTERPARTY_PFE", delta: -7_000_000, material: true, authorityCovered: true },
        { consequenceClass: "LIQUIDITY", delta: 2_000_000, material: true, authorityCovered: false },
      ],
    }),
  );
  assert.equal(result.decision, "REFUSE");
  assert.equal(result.refusalCode, "ATG-ARC-015 REGENERATION_EVENT_CREATES_UNAUTHORISED_CONSEQUENCE");
});

test("duplicate event cannot regenerate authority twice", () => {
  const arc = seeded("SAME_PURPOSE");
  assert.equal(arc.evaluateRegeneration(event()).decision, "PASS");
  const replay = arc.evaluateRegeneration(event());
  assert.equal(replay.decision, "REFUSE");
  assert.equal(replay.refusalCode, "ATG-ARC-009 DOUBLE_REGENERATION_ATTEMPT");
});

test("two agents cannot reserve more regenerated authority than exists", () => {
  const arc = seeded("SAME_PURPOSE");
  assert.equal(arc.evaluateRegeneration(event({ attributedEligibleRelease: 6_000_000 })).decision, "PASS");

  const risk = createRiskSnapshot(40_000_000, "2026-09-05T13:21:00.000Z");
  const first = arc.evaluateAction(
    {
      actionId: "RACE-1",
      agentId: "CLIENT_HEDGE_AGENT_01",
      agentGroupId: "CLIENT_HEDGE_AGENTS",
      exactAction: "Race one",
      pfeIncrease: 4_000_000,
      scope: BASE_SCOPE,
      requestedAt: "2026-09-05T13:21:00.000Z",
      synthetic: true,
    },
    risk,
  );
  const second = arc.evaluateAction(
    {
      actionId: "RACE-2",
      agentId: "CLIENT_HEDGE_AGENT_02",
      agentGroupId: "CLIENT_HEDGE_AGENTS",
      exactAction: "Race two",
      pfeIncrease: 4_000_000,
      scope: BASE_SCOPE,
      requestedAt: "2026-09-05T13:21:00.000Z",
      synthetic: true,
    },
    risk,
  );
  assert.equal(first.decision, "PASS");
  assert.equal(second.decision, "REFUSE");
  assert.equal(second.refusalCode, "ATG-ARC-012 INSUFFICIENT_DELEGATED_AUTHORITY");
});

test("revocation invalidates regenerated descendants and GatePasses", () => {
  const arc = seeded("SAME_PURPOSE");
  assert.equal(arc.evaluateRegeneration(event()).decision, "PASS");
  const pass = arc.evaluateAction(
    {
      actionId: "ACTION-REVOCATION",
      agentId: "CLIENT_HEDGE_AGENT_02",
      agentGroupId: "CLIENT_HEDGE_AGENTS",
      exactAction: "Synthetic client hedge",
      pfeIncrease: 2_000_000,
      scope: BASE_SCOPE,
      requestedAt: "2026-09-05T13:21:00.000Z",
      synthetic: true,
    },
    createRiskSnapshot(50_000_000, "2026-09-05T13:21:00.000Z"),
  );
  assert.equal(pass.decision, "PASS");
  assert.ok(pass.gatePass);
  arc.revokeAuthority();
  assert.throws(() => arc.consumeGatePass(pass.gatePass!.gatePassId, "2026-09-05T13:21:10.000Z"), /revoked/);
  assert.equal(arc.getState().regeneratedAvailable, 0);
});

test("GatePass is one-use and carries regeneration lineage", () => {
  const arc = seeded("SAME_PURPOSE");
  assert.equal(arc.evaluateRegeneration(event()).decision, "PASS");
  const result = arc.evaluateAction(
    {
      actionId: "ONE-USE",
      agentId: "CLIENT_HEDGE_AGENT_02",
      agentGroupId: "CLIENT_HEDGE_AGENTS",
      exactAction: "Synthetic one-use trade",
      pfeIncrease: 3_000_000,
      scope: BASE_SCOPE,
      requestedAt: "2026-09-05T13:21:00.000Z",
      synthetic: true,
    },
    createRiskSnapshot(50_000_000, "2026-09-05T13:21:00.000Z"),
  );
  assert.equal(result.decision, "PASS");
  assert.ok(result.gatePass);
  assert.equal(result.gatePass!.regenerationLineage.length, 1);
  const consumed = arc.consumeGatePass(result.gatePass!.gatePassId, "2026-09-05T13:21:10.000Z");
  assert.equal(consumed.consumed, true);
  assert.throws(() => arc.consumeGatePass(result.gatePass!.gatePassId, "2026-09-05T13:21:20.000Z"), /replay/);
});

test("stale evidence fails closed", () => {
  const arc = seeded("SAME_PURPOSE");
  const stale = event({
    occurredAt: "2026-09-05T13:20:00.000Z",
    evidence: createRiskSnapshot(58_000_000, "2026-09-05T13:00:00.000Z", { maxAgeMs: 60_000 }),
  });
  const result = arc.evaluateRegeneration(stale);
  assert.equal(result.decision, "REFUSE");
  assert.equal(result.refusalCode, "ATG-ARC-010 RISK_EVIDENCE_STALE");
});

test("unapproved risk-model version cannot regenerate authority", () => {
  const arc = seeded("SAME_PURPOSE");
  const result = arc.evaluateRegeneration(
    event({ evidence: createRiskSnapshot(58_000_000, "2026-09-05T13:20:00.000Z", { modelVersion: "PFE-8.0-UNAPPROVED" }) }),
  );
  assert.equal(result.decision, "REFUSE");
  assert.equal(result.refusalCode, "ATG-ARC-014 REGENERATION_MODEL_VERSION_UNACCEPTED");
});

test("released unconsumed GatePass returns its reservations", () => {
  const arc = seeded("SAME_PURPOSE");
  assert.equal(arc.evaluateRegeneration(event()).decision, "PASS");
  const before = arc.getState().totalAvailable;
  const decision = arc.evaluateAction(
    {
      actionId: "RELEASE-ME",
      agentId: "CLIENT_HEDGE_AGENT_02",
      agentGroupId: "CLIENT_HEDGE_AGENTS",
      exactAction: "Synthetic reservation release",
      pfeIncrease: 3_000_000,
      scope: BASE_SCOPE,
      requestedAt: "2026-09-05T13:21:00.000Z",
      synthetic: true,
    },
    createRiskSnapshot(50_000_000, "2026-09-05T13:21:00.000Z"),
  );
  assert.equal(decision.decision, "PASS");
  assert.ok(decision.gatePass);
  assert.equal(arc.getState().totalAvailable, before - 3_000_000);
  const released = arc.releaseGatePass(decision.gatePass!.gatePassId);
  assert.equal(released.revoked, true);
  assert.equal(arc.getState().totalAvailable, before);
});
