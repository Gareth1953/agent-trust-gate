import { createHash } from "node:crypto";

export const AGENT_CLEARING_PUBLIC_DEMO_NARRATIVE_VERSION = "atg.agent-clearing-public-demo-narrative.v1" as const;

export interface AgentClearingPublicDemoNarrativeInput {
  [key: string]: unknown;
  source_report_id: string;
  caution_level: string;
  clearing_decision: string;
  created_at: string;
}

export interface AgentClearingPublicDemoNarrative {
  narrative_id: string;
  narrative_type: "agent_clearing_public_demo_narrative";
  title: "Agent Clearing House + RefusalGraph Local Demo";
  headline: "Before an agent says yes, it can check who already said no - and why.";
  problem_summary: string;
  solution_summary: string;
  demo_flow_summary: string;
  refusalgraph_summary: string;
  safety_summary: string;
  future_fee_summary: string;
  current_status: "draft_public_narrative_not_published";
  published: false;
  tracking_enabled: false;
  analytics_enabled: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  action_executed: false;
  private_data_included: false;
  status: "draft_only";
  created_at: string;
}

const CAUTION_LEVELS = new Set(["none", "low", "medium", "high", "critical"]);
const CLEARING_DECISIONS = new Set([
  "accept_with_limits", "require_more_evidence", "require_human_approval",
  "require_identity_verification", "clarify_payment_intent", "cap_spend_limit",
  "refuse_transaction", "keep_blocked", "create_receipt_only",
  "draft_only_not_executed",
]);

export function createAgentClearingPublicDemoNarrative(
  input: AgentClearingPublicDemoNarrativeInput,
): AgentClearingPublicDemoNarrative {
  const caution = safeEnum(input.caution_level, CAUTION_LEVELS, "unknown");
  const decision = safeEnum(input.clearing_decision, CLEARING_DECISIONS, "keep_blocked");

  return {
    narrative_id: createAgentClearingPublicDemoNarrativeId(input.source_report_id),
    narrative_type: "agent_clearing_public_demo_narrative",
    title: "Agent Clearing House + RefusalGraph Local Demo",
    headline: "Before an agent says yes, it can check who already said no - and why.",
    problem_summary: "AI agents will increasingly ask other agents and systems to perform work, access data, call tools, make purchases, or accept transactions. A request should not be trusted only because another agent sent it.",
    solution_summary: "Agent Clearing House provides a draft pre-action clearing, receipt, and verification layer. RefusalGraph adds local intelligence about similar requests that were blocked, limited, refused, or required stronger evidence and approval.",
    demo_flow_summary: `A local draft request was checked against supplied RefusalGraph signals, which returned ${caution} caution. The local clearing decision was ${decision}. The demo then created an unpersisted receipt, performed local verification-readiness checks, and created a non-billable fee placeholder.`,
    refusalgraph_summary: "RefusalGraph captures privacy-minimized refusal patterns rather than payment transfers or agent messages. It helps future systems ask what was refused before, why it was refused, and what proof or approval is still needed.",
    safety_summary: "This narrative is draft-only and unpublished. No action was executed, no network lookup was performed, no private data was exposed, and no tracking, analytics, signup, billing, payment, settlement, deployment, publishing, outreach, webhook, or third-party connection was activated.",
    future_fee_summary: "A future approved clearing service could charge a small fee for receipt verification, refusal lookup, or clearance checks. This draft does not record a billable event, trigger a fee, or move money.",
    current_status: "draft_public_narrative_not_published",
    published: false,
    tracking_enabled: false,
    analytics_enabled: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
    private_data_included: false,
    status: "draft_only",
    created_at: safeTimestamp(input.created_at),
  };
}

export function createAgentClearingPublicDemoNarrativeId(sourceReportId: string): string {
  const digest = createHash("sha256").update(sourceReportId, "utf8").digest("hex");
  return `acpdn_local_${digest.slice(0, 24)}`;
}

export function renderAgentClearingPublicDemoNarrativeMarkdown(
  narrative: AgentClearingPublicDemoNarrative,
): string {
  return [
    "# Agent Clearing House + RefusalGraph Local Demo",
    "",
    "Draft-only. Not published. Not a live website.",
    "",
    `> ${narrative.headline}`,
    "",
    "## The Problem",
    "",
    narrative.problem_summary,
    "",
    "## The Solution",
    "",
    narrative.solution_summary,
    "",
    "## The Local Demo Flow",
    "",
    narrative.demo_flow_summary,
    "",
    "## What RefusalGraph Adds",
    "",
    narrative.refusalgraph_summary,
    "",
    "## Safety And Human Approval",
    "",
    narrative.safety_summary,
    "High-impact actions require explicit human approval. The demo does not execute agent actions.",
    "",
    "## Future Machine-to-Machine Fee Potential",
    "",
    narrative.future_fee_summary,
    "",
    "Gareth final approval is required before any publication or commercial activation.",
  ].join("\n");
}

function safeEnum(value: string, allowed: ReadonlySet<string>, fallback: string): string {
  const token = safeToken(value);
  return allowed.has(token) ? token : fallback;
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
