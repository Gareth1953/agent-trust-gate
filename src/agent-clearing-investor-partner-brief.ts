import { createHash } from "node:crypto";

export const AGENT_CLEARING_INVESTOR_PARTNER_BRIEF_VERSION = "atg.agent-clearing-investor-partner-brief.v1" as const;

export interface AgentClearingInvestorPartnerBriefInput {
  [key: string]: unknown;
  source_narrative_id: string;
  current_demo_status: string;
  created_at: string;
}

export interface AgentClearingInvestorPartnerBrief {
  brief_id: string;
  brief_type: "agent_clearing_investor_partner_brief";
  title: "Agent Clearing House + RefusalGraph Investor / Partner Brief";
  one_sentence_summary: string;
  problem_summary: string;
  solution_summary: string;
  refusalgraph_summary: string;
  current_demo_summary: string;
  future_fee_summary: string;
  unique_advantage_summary: string;
  safety_summary: string;
  current_status: "draft_brief_not_shared_or_published";
  recommended_next_steps: string[];
  shared_externally: false;
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

const DEMO_STATUSES = new Set([
  "local_demo_complete", "local_demo_validated", "draft_only", "local_only",
]);

const RECOMMENDED_NEXT_STEPS = [
  "validate_partner_problem_demand",
  "validate_receipt_verification_value",
  "validate_refusal_lookup_value",
  "define_controlled_pilot_scope",
  "complete_security_privacy_legal_review",
  "keep_fees_payments_and_networks_disabled",
  "require_external_sharing_approval",
  "require_gareth_final_approval",
] as const;

export function createAgentClearingInvestorPartnerBrief(
  input: AgentClearingInvestorPartnerBriefInput,
): AgentClearingInvestorPartnerBrief {
  const demoStatus = safeDemoStatus(input.current_demo_status);

  return {
    brief_id: createAgentClearingInvestorPartnerBriefId(input.source_narrative_id),
    brief_type: "agent_clearing_investor_partner_brief",
    title: "Agent Clearing House + RefusalGraph Investor / Partner Brief",
    one_sentence_summary: "Agent Clearing House is a local draft pre-action clearing, receipt, verification, and refusal-intelligence layer for agent-to-agent requests before risky actions proceed.",
    problem_summary: "Agent communication protocols can carry requests and payment rails can move value, but neither alone determines whether an agent request should be accepted, limited, refused, approval-gated, receipted, or verified before action.",
    solution_summary: "Agent Clearing House evaluates declared intent, evidence, approval, identity, payment intent, risk, and RefusalGraph caution before returning a local clearing decision and receipt. It complements rather than replaces communication and payment infrastructure.",
    refusalgraph_summary: "RefusalGraph is the differentiated negative trust layer: before an agent says yes, it can check who already said no - and why. Privacy-minimized refusal patterns may become more useful and defensible as safe signal coverage grows.",
    current_demo_summary: `The current ${demoStatus} capability composes local refusal lookup, clearing decision, receipt creation, local verification readiness, fee placeholder metering, CLI output, readable reporting, and draft narrative generation without networking or execution.`,
    future_fee_summary: "Possible future fee points include clearance checks, receipt creation or verification, refusal lookups, and machine-to-machine trust signals. These are commercial hypotheses only; no fee, billing, payment, or settlement is enabled.",
    unique_advantage_summary: "Generic AI governance, payment rails, and agent communication are crowded categories. Receipt-based clearing plus privacy-minimized refusal intelligence offers a narrower opening that is useful to agents, compatible with existing rails, and capable of creating a differentiated data advantage without requiring raw customer data.",
    safety_summary: "This is a draft-only brief. It is not published, externally shared, or outreach. It is not investment advice and makes no legal, financial, regulatory, compliance, or safety guarantee. Nothing was networked, tracked, analysed, billed, paid, settled, deployed, published, emailed, or executed.",
    current_status: "draft_brief_not_shared_or_published",
    recommended_next_steps: [...RECOMMENDED_NEXT_STEPS],
    shared_externally: false,
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

export function createAgentClearingInvestorPartnerBriefId(sourceNarrativeId: string): string {
  const digest = createHash("sha256").update(sourceNarrativeId, "utf8").digest("hex");
  return `acipb_local_${digest.slice(0, 24)}`;
}

export function renderAgentClearingInvestorPartnerBriefMarkdown(
  brief: AgentClearingInvestorPartnerBrief,
): string {
  return [
    "# Agent Clearing House + RefusalGraph Investor / Partner Brief",
    "",
    "Draft-only. Not externally shared. Not published. Not investment advice.",
    "",
    "## One-Sentence Summary",
    "",
    brief.one_sentence_summary,
    "",
    "## The Market Problem",
    "",
    brief.problem_summary,
    "",
    "## The Solution",
    "",
    brief.solution_summary,
    "",
    "## RefusalGraph",
    "",
    brief.refusalgraph_summary,
    "",
    "## Current Local Demo",
    "",
    brief.current_demo_summary,
    "",
    "## Future Fee Readiness",
    "",
    brief.future_fee_summary,
    "",
    "## Unique Advantage",
    "",
    brief.unique_advantage_summary,
    "",
    "## Safety Statement",
    "",
    brief.safety_summary,
    "Nothing was shared, published, tracked, analysed, billed, paid, settled, networked, or executed.",
    "",
    "## Recommended Next Steps",
    "",
    ...brief.recommended_next_steps.map((step) => `- ${step}`),
    "",
    "Gareth final approval is required before any external use, publication, outreach, partner sharing, commercial activation, deployment, billing, payment, or settlement.",
  ].join("\n");
}

function safeDemoStatus(value: string): string {
  const token = safeToken(value);
  return DEMO_STATUSES.has(token) ? token : "draft_only";
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
