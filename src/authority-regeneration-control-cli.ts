import {
  ARC_REFERENCE_TIME,
  AuthorityRegenerationControl,
  createRiskSnapshot,
  createSyntheticAuthority,
  type RegenerationEvent,
} from "./authority-regeneration-control.js";

function scope() {
  return {
    purpose: "CLIENT_HEDGE",
    legalEntity: "BANK_UK_01",
    portfolio: "PORTFOLIO_A",
    counterparty: "CP_173",
    strategy: "CLIENT_HEDGE_STRATEGY_A",
  };
}

const arc = new AuthorityRegenerationControl(createSyntheticAuthority("SAME_PURPOSE"));
arc.recordExecutedAction({
  actionId: "ACTION-ORIGINAL-001",
  agentId: "CLIENT_HEDGE_AGENT_01",
  amount: 9_000_000,
  scope: scope(),
  consumedAt: "2026-09-05T13:00:00.000Z",
  authorityId: "AUTH-PFE-001",
  synthetic: true,
});

const afterHedge = createRiskSnapshot(58_000_000, "2026-09-05T13:20:00.000Z");
const regenerationEvent: RegenerationEvent = {
  eventId: "UNWIND-99417",
  authorityId: "AUTH-PFE-001",
  sourceActionId: "ACTION-ORIGINAL-001",
  eventType: "UNWIND",
  lifecycleStatus: "EXECUTED_CONFIRMED",
  attributionStatus: "DIRECT",
  attributionMethod: "synthetic-position-level-causal-attribution.v1",
  scope: scope(),
  previousExposure: 65_000_000,
  currentExposure: 58_000_000,
  rawCapacityRelease: 7_000_000,
  attributedEligibleRelease: 6_000_000,
  evidence: afterHedge,
  consequenceVector: [
    { consequenceClass: "COUNTERPARTY_PFE", delta: -7_000_000, material: true, authorityCovered: true },
  ],
  occurredAt: "2026-09-05T13:20:00.000Z",
  synthetic: true,
};

const regeneration = arc.evaluateRegeneration(regenerationEvent);

const clientAction = arc.evaluateAction(
  {
    actionId: "ACTION-CLIENT-002",
    agentId: "CLIENT_HEDGE_AGENT_02",
    agentGroupId: "CLIENT_HEDGE_AGENTS",
    exactAction: "Enter synthetic client hedge transaction creating GBP 5m PFE",
    pfeIncrease: 5_000_000,
    scope: scope(),
    requestedAt: "2026-09-05T13:21:00.000Z",
    synthetic: true,
  },
  createRiskSnapshot(58_000_000, "2026-09-05T13:21:00.000Z"),
);

const propScope = { ...scope(), purpose: "PROPRIETARY", strategy: "PROP_STRATEGY_Z" };
const propAction = arc.evaluateAction(
  {
    actionId: "ACTION-PROP-003",
    agentId: "PROP_TRADING_AGENT_01",
    agentGroupId: "CLIENT_HEDGE_AGENTS",
    exactAction: "Enter synthetic proprietary transaction creating GBP 5m PFE",
    pfeIncrease: 5_000_000,
    scope: propScope,
    requestedAt: "2026-09-05T13:22:00.000Z",
    synthetic: true,
  },
  createRiskSnapshot(58_000_000, "2026-09-05T13:22:00.000Z"),
);

console.log(
  JSON.stringify(
    {
      prototype: "ATG Authority Regeneration Control",
      version: "local synthetic v1",
      coreRule: "Economic capacity can change without human permission. Delegated AI authority cannot.",
      safety: {
        syntheticDataOnly: true,
        liveTrading: false,
        externalExecution: false,
        realMoney: false,
      },
      originalStateAfterConsumption: {
        firmRiskCapacityCanExistIndependently: true,
        delegatedAuthorityBeforeRegeneration: 1_000_000,
      },
      regeneration,
      samePurposeAction: {
        decision: clientAction.decision,
        reason: clientAction.reason,
        regenerationLineage: clientAction.gatePass?.regenerationLineage ?? [],
      },
      crossPurposeAttempt: {
        decision: propAction.decision,
        refusalCode: propAction.refusalCode,
        reason: propAction.reason,
      },
      finalAuthorityState: arc.getState(),
      generatedAt: ARC_REFERENCE_TIME,
    },
    null,
    2,
  ),
);
