import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type PlaceholderBillingInterval = "none" | "future" | "future_usage_based";

export interface PlaceholderBillingPlan {
  plan_code: string;
  label: string;
  price: null;
  billing_interval: PlaceholderBillingInterval;
  decision_allowance: number | null;
  rate_limit_max_requests: number | null;
  payment_required: false;
  automatic_purchase_available: false;
}

export interface PlaceholderBillingPlansFile {
  currency: "GBP";
  billing_mode: "not_enabled";
  plans: PlaceholderBillingPlan[];
}

export interface LocalBillingPlansResult {
  plans_file_provided: boolean;
  plans_file_found: boolean;
  plans_file_path: string | null;
  plan_count: number;
  currency: "GBP";
  billing_mode: "not_enabled";
  plans: PlaceholderBillingPlan[];
}

export class BillingPlansConfigError extends Error {
  readonly code = "INVALID_BILLING_PLANS_CONFIG";

  constructor(message: string) {
    super(message);
    this.name = "BillingPlansConfigError";
  }
}

export function defaultPlaceholderBillingPlans(): PlaceholderBillingPlan[] {
  return [
    {
      plan_code: "local_demo",
      label: "Local Demo",
      price: null,
      billing_interval: "none",
      decision_allowance: 1000,
      rate_limit_max_requests: 60,
      payment_required: false,
      automatic_purchase_available: false,
    },
    {
      plan_code: "future_starter",
      label: "Future Starter",
      price: null,
      billing_interval: "future",
      decision_allowance: null,
      rate_limit_max_requests: null,
      payment_required: false,
      automatic_purchase_available: false,
    },
    {
      plan_code: "future_machine_to_machine",
      label: "Future Machine-to-Machine",
      price: null,
      billing_interval: "future_usage_based",
      decision_allowance: null,
      rate_limit_max_requests: null,
      payment_required: false,
      automatic_purchase_available: false,
    },
  ];
}

export function readLocalBillingPlansFile(plansFile?: string): LocalBillingPlansResult {
  if (plansFile === undefined) {
    const plans = defaultPlaceholderBillingPlans();
    return {
      plans_file_provided: false,
      plans_file_found: false,
      plans_file_path: null,
      plan_count: plans.length,
      currency: "GBP",
      billing_mode: "not_enabled",
      plans,
    };
  }

  const resolvedPath = resolve(plansFile);
  if (!existsSync(resolvedPath)) {
    throw new BillingPlansConfigError(`Local billing plans file was not found at "${resolvedPath}".`);
  }

  let source: string;
  let parsed: unknown;
  try {
    source = readFileSync(resolvedPath, "utf8");
    rejectSecretLikeContent(source);
    parsed = JSON.parse(source) as unknown;
  } catch (error) {
    if (error instanceof BillingPlansConfigError) {
      throw error;
    }
    throw new BillingPlansConfigError(`Unable to read local billing plans file: ${errorMessage(error)}`);
  }

  if (!isBillingPlansFile(parsed)) {
    throw new BillingPlansConfigError(
      "Local billing plans must use GBP placeholders with null prices and disabled payment and automatic-purchase flags.",
    );
  }
  const codes = new Set<string>();
  for (const plan of parsed.plans) {
    if (codes.has(plan.plan_code)) {
      throw new BillingPlansConfigError(`Duplicate local plan_code: ${plan.plan_code}`);
    }
    codes.add(plan.plan_code);
  }
  return {
    plans_file_provided: true,
    plans_file_found: true,
    plans_file_path: resolvedPath,
    plan_count: parsed.plans.length,
    currency: parsed.currency,
    billing_mode: parsed.billing_mode,
    plans: parsed.plans,
  };
}

function isBillingPlansFile(value: unknown): value is PlaceholderBillingPlansFile {
  if (!isRecord(value) || !hasOnlyKeys(value, ["currency", "billing_mode", "plans"])) {
    return false;
  }
  return value.currency === "GBP" && value.billing_mode === "not_enabled" &&
    Array.isArray(value.plans) && value.plans.length > 0 && value.plans.every(isBillingPlan);
}

function isBillingPlan(value: unknown): value is PlaceholderBillingPlan {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    "plan_code", "label", "price", "billing_interval", "decision_allowance",
    "rate_limit_max_requests", "payment_required", "automatic_purchase_available",
  ])) {
    return false;
  }
  return nonEmptyString(value.plan_code) && nonEmptyString(value.label) && value.price === null &&
    (value.billing_interval === "none" || value.billing_interval === "future" || value.billing_interval === "future_usage_based") &&
    nullableNonNegativeInteger(value.decision_allowance) && nullableNonNegativeInteger(value.rate_limit_max_requests) &&
    value.payment_required === false && value.automatic_purchase_available === false;
}

function rejectSecretLikeContent(source: string): void {
  if (/(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY)/.test(source)) {
    throw new BillingPlansConfigError("Local billing plans file contains secret-like content.");
  }
  if (/"(?:api[_-]?key|secret|password|card_number|cvv|bank_account|wallet_address)"\s*:/i.test(source)) {
    throw new BillingPlansConfigError("Local billing plans file must not contain credentials or payment details.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nullableNonNegativeInteger(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isInteger(value) && value >= 0);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
