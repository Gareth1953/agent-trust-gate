export const UNIQUE_ADVANTAGE_RADAR_VERSION = "atg.unique-advantage-radar.v1" as const;

export type AdvantageDimension =
  | "uniqueness_score"
  | "defensibility_score"
  | "agent_to_agent_value_score"
  | "machine_to_machine_fee_potential_score"
  | "refusalgraph_value_score"
  | "private_data_safety_score"
  | "developer_adoption_score"
  | "commercial_clarity_score"
  | "big_company_resistance_score"
  | "simplicity_score";

export type AdvantageBand = "weak" | "ordinary" | "promising" | "strong" | "exceptional";

export type AdvantageRecommendation =
  | "reject_or_defer"
  | "improve_before_building"
  | "build_if_safe"
  | "high_priority"
  | "strategic_priority";

export interface UniqueAdvantageInput {
  [key: string]: unknown;
  feature_name: string;
  uniqueness_score: number;
  defensibility_score: number;
  agent_to_agent_value_score: number;
  machine_to_machine_fee_potential_score: number;
  refusalgraph_value_score: number;
  private_data_safety_score: number;
  developer_adoption_score: number;
  commercial_clarity_score: number;
  big_company_resistance_score: number;
  simplicity_score: number;
}

export interface UniqueAdvantageResult {
  feature_name: string;
  overall_advantage_score: number;
  advantage_band: AdvantageBand;
  recommendation: AdvantageRecommendation;
  strongest_dimensions: AdvantageDimension[];
  weakest_dimensions: AdvantageDimension[];
  private_data_included: false;
  live_scanning_performed: false;
  external_lookup_performed: false;
  payment_or_fee_triggered: false;
  action_executed: false;
  status: "draft_only";
}

const DIMENSIONS: readonly AdvantageDimension[] = [
  "uniqueness_score",
  "defensibility_score",
  "agent_to_agent_value_score",
  "machine_to_machine_fee_potential_score",
  "refusalgraph_value_score",
  "private_data_safety_score",
  "developer_adoption_score",
  "commercial_clarity_score",
  "big_company_resistance_score",
  "simplicity_score",
];

export function scoreUniqueAdvantage(input: UniqueAdvantageInput): UniqueAdvantageResult {
  const scores = DIMENSIONS.map((dimension) => ({
    dimension,
    score: clampUniqueAdvantageScore(input[dimension]),
  }));
  const overallScore = roundToTwo(
    scores.reduce((total, item) => total + item.score, 0) / scores.length,
  );
  const band = advantageBandForScore(overallScore);
  const highest = Math.max(...scores.map((item) => item.score));
  const lowest = Math.min(...scores.map((item) => item.score));

  return {
    feature_name: normalizeFeatureName(input.feature_name),
    overall_advantage_score: overallScore,
    advantage_band: band,
    recommendation: recommendationForBand(band),
    strongest_dimensions: scores
      .filter((item) => item.score === highest)
      .map((item) => item.dimension),
    weakest_dimensions: scores
      .filter((item) => item.score === lowest)
      .map((item) => item.dimension),
    private_data_included: false,
    live_scanning_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    action_executed: false,
    status: "draft_only",
  };
}

export function clampUniqueAdvantageScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(10, Math.max(0, value));
}

export function advantageBandForScore(score: number): AdvantageBand {
  const value = clampUniqueAdvantageScore(score);
  if (value < 4) return "weak";
  if (value < 6) return "ordinary";
  if (value < 7.5) return "promising";
  if (value < 9) return "strong";
  return "exceptional";
}

function recommendationForBand(band: AdvantageBand): AdvantageRecommendation {
  const recommendations: Record<AdvantageBand, AdvantageRecommendation> = {
    weak: "reject_or_defer",
    ordinary: "improve_before_building",
    promising: "build_if_safe",
    strong: "high_priority",
    exceptional: "strategic_priority",
  };
  return recommendations[band];
}

function normalizeFeatureName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return normalized || "unnamed_feature";
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
