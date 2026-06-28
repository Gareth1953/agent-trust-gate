import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";
import {
  readLocalBillingPlansFile,
  type LocalBillingPlansResult,
} from "./billing-plans.js";

export const BILLING_PAYMENT_READINESS_VERSION = "atg.billing-payment-readiness.v1" as const;
export const BILLING_PAYMENT_READINESS_SAFETY_STATEMENT =
  "Billing and payment readiness is a local planning snapshot only. It does not bill customers, process payments, collect payment details, enable automatic purchase, expose a public service, or execute actions.";

export type BillingPaymentReadinessStatus = "pass" | "partial" | "fail" | "not_started" | "future";
export type BillingPaymentReadinessSeverity = "info" | "warning" | "critical";

export interface BillingPaymentReadinessCheck {
  id: string;
  label: string;
  status: BillingPaymentReadinessStatus;
  severity: BillingPaymentReadinessSeverity;
  evidence: string[];
  recommendation: string;
}

export interface BillingPaymentReadinessReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  billing_payment_readiness_version: typeof BILLING_PAYMENT_READINESS_VERSION;
  generated_at: string;
  local_only: true;
  billing_enabled: false;
  payment_processing_enabled: false;
  automatic_purchase_enabled: false;
  real_charges_enabled: false;
  payment_provider_configured: false;
  pci_scope_assessed: false;
  overall: {
    billing_payment_readiness_percent: 20;
    status: "local_billing_payment_planning_only";
    next_gate: "define_payment_provider_and_billing_controls_before_enabling_payments";
  };
  plan_model: {
    plan_catalogue_available: true;
    plans_are_placeholders: true;
    currency: "GBP";
    billing_mode: "not_enabled";
    plans: LocalBillingPlansResult["plans"];
    source: LocalBillingPlansResult;
  };
  billing_model: {
    concepts: string[];
    billing_enabled: false;
    real_invoice_generation_enabled: false;
    receipt_generation_enabled: "placeholder_only";
    tax_calculation_enabled: false;
  };
  payment_model: {
    payment_processing_enabled: false;
    payment_provider_configured: false;
    provider: null;
    test_mode_available: false;
    live_mode_available: false;
    card_collection_enabled: false;
    bank_payment_enabled: false;
    crypto_payment_enabled: false;
    machine_to_machine_payment_enabled: false;
    automatic_purchase_enabled: false;
    payment_security_ready: false;
  };
  machine_purchase_model: {
    machine_purchase_supported_in_future: true;
    automatic_purchase_enabled: false;
    purchase_authorization_model: "future";
    agent_purchase_policy_required: true;
    human_approval_required_before_enabling: true;
    entitlement_upgrade_signal_available: true;
    purchase_endpoint_available: false;
    payment_execution_available: false;
  };
  checks: BillingPaymentReadinessCheck[];
  required_before_payments: string[];
  recommended_payment_controls: string[];
  safety_statement: string;
}

export function createBillingPaymentReadinessReport(options: {
  now?: Date;
  plansFile?: string;
} = {}): BillingPaymentReadinessReport {
  const planSource = readLocalBillingPlansFile(options.plansFile);
  return {
    contract_version: CONTRACT_VERSION,
    billing_payment_readiness_version: BILLING_PAYMENT_READINESS_VERSION,
    generated_at: (options.now ?? new Date()).toISOString(),
    local_only: true,
    billing_enabled: false,
    payment_processing_enabled: false,
    automatic_purchase_enabled: false,
    real_charges_enabled: false,
    payment_provider_configured: false,
    pci_scope_assessed: false,
    overall: {
      billing_payment_readiness_percent: 20,
      status: "local_billing_payment_planning_only",
      next_gate: "define_payment_provider_and_billing_controls_before_enabling_payments",
    },
    plan_model: {
      plan_catalogue_available: true,
      plans_are_placeholders: true,
      currency: "GBP",
      billing_mode: "not_enabled",
      plans: planSource.plans,
      source: planSource,
    },
    billing_model: {
      concepts: ["account_id", "tenant_id", "billing_owner", "plan_code", "billing_status", "billing_interval", "invoice_status", "receipt_status", "tax_status", "payment_status"],
      billing_enabled: false,
      real_invoice_generation_enabled: false,
      receipt_generation_enabled: "placeholder_only",
      tax_calculation_enabled: false,
    },
    payment_model: {
      payment_processing_enabled: false,
      payment_provider_configured: false,
      provider: null,
      test_mode_available: false,
      live_mode_available: false,
      card_collection_enabled: false,
      bank_payment_enabled: false,
      crypto_payment_enabled: false,
      machine_to_machine_payment_enabled: false,
      automatic_purchase_enabled: false,
      payment_security_ready: false,
    },
    machine_purchase_model: {
      machine_purchase_supported_in_future: true,
      automatic_purchase_enabled: false,
      purchase_authorization_model: "future",
      agent_purchase_policy_required: true,
      human_approval_required_before_enabling: true,
      entitlement_upgrade_signal_available: true,
      purchase_endpoint_available: false,
      payment_execution_available: false,
    },
    checks: readinessChecks(planSource),
    required_before_payments: [
      "payment provider selection and due diligence",
      "reviewed payment terms and customer billing terms",
      "tax and VAT review",
      "refund and cancellation policy",
      "invoice and receipt policy",
      "PCI and payment security scope review",
      "fraud, abuse, chargeback, and dispute controls",
      "production customer account and tenant model",
      "auditable entitlement-to-plan mapping",
      "billing ledger and reconciliation design",
      "payment failure and incident process",
      "manual approval before enabling automatic machine purchase",
    ],
    recommended_payment_controls: [
      "keep payment details outside Agent Trust Gate where possible",
      "use provider-hosted payment collection after due diligence",
      "never log payment credentials or provider secrets",
      "separate billing, payment, entitlement, and account states",
      "idempotent payment and entitlement transitions",
      "auditable invoice, receipt, refund, and reconciliation records",
      "per-tenant billing ownership",
      "fraud and abuse monitoring before charging",
      "payment incident response and rollback",
      "manual approval before enabling automatic purchase",
      "automatic purchase limits and revocation controls",
    ],
    safety_statement: BILLING_PAYMENT_READINESS_SAFETY_STATEMENT,
  };
}

export function formatBillingPaymentReadinessForConsole(report: BillingPaymentReadinessReport): string {
  return [
    "Agent Trust Gate billing and payment readiness",
    `billing_payment_readiness_version: ${report.billing_payment_readiness_version}`,
    `generated_at: ${report.generated_at}`,
    `billing_payment_readiness_percent: ${report.overall.billing_payment_readiness_percent}`,
    `status: ${report.overall.status}`,
    `billing_enabled: ${report.billing_enabled}`,
    `payment_processing_enabled: ${report.payment_processing_enabled}`,
    `automatic_purchase_enabled: ${report.automatic_purchase_enabled}`,
    `real_charges_enabled: ${report.real_charges_enabled}`,
    `payment_provider_configured: ${report.payment_provider_configured}`,
    `pci_scope_assessed: ${report.pci_scope_assessed}`,
    `placeholder_plans: ${report.plan_model.plans.length}`,
    "",
    `next_gate: ${report.overall.next_gate}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function writeBillingPaymentReadinessReport(
  outputPath: string,
  report = createBillingPaymentReadinessReport(),
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function readinessChecks(plans: LocalBillingPlansResult): BillingPaymentReadinessCheck[] {
  return [
    check("placeholder_plan_catalogue_available", "Placeholder plan catalogue available", "partial", "info", [`${plans.plan_count} price-free local placeholder plan(s) are available.`], "Validate pricing and terms before defining any commercial tariff."),
    check("entitlement_upgrade_signals_available", "Entitlement upgrade signals available", "partial", "info", ["Local entitlement and upgrade-required signals exist without purchase execution."], "Bind entitlements to reviewed plans and customer ownership only after account controls exist."),
    check("billing_model_available", "Billing model available", "partial", "warning", ["Billing owner, plan, invoice, receipt, tax, and payment status concepts are documented."], "Implement an auditable ledger and reconciliation process before billing."),
    check("payment_provider_missing", "Payment provider missing", "not_started", "critical", ["No payment processor, SDK, credentials, test mode, live mode, or webhook exists."], "Complete legal, security, scope, and operational review before provider selection."),
    check("real_billing_disabled", "Real billing disabled", "pass", "info", ["No customer charges, real invoices, or payable receipts are generated."], "Keep billing disabled until every payment and customer gate is approved."),
    check("payment_details_collection_disabled", "Payment details collection disabled", "pass", "info", ["No card, bank, crypto, wallet, or payment credential collection exists."], "Minimize payment data scope and prefer provider-hosted collection if payments are introduced."),
    check("pci_scope_not_assessed", "PCI scope not assessed", "not_started", "critical", ["No payment flow exists and no qualified PCI scope assessment has occurred."], "Assess payment-data scope with qualified specialists before implementation."),
    check("tax_and_billing_terms_missing", "Tax and billing terms missing", "not_started", "critical", ["No approved tariff, tax treatment, billing terms, refund, or cancellation policy exists."], "Obtain qualified tax and legal review before charging."),
    check("billing_ledger_missing", "Billing ledger missing", "not_started", "critical", ["No invoice, receipt, payment, refund, tax, or reconciliation ledger exists."], "Design immutable, auditable financial records before billing."),
    check("payment_monitoring_missing", "Payment monitoring missing", "future", "warning", ["Payments are disabled, so no transaction or failure monitoring exists."], "Add transaction, fraud, reconciliation, failure, and dispute monitoring before charging."),
    check("automatic_purchase_disabled", "Automatic purchase disabled", "pass", "info", ["No purchase endpoint or payment execution path exists."], "Require governed authorization, limits, revocation, fraud controls, and human approval before enabling."),
    check("public_hosting_not_enabled", "Public hosting not enabled", "pass", "info", ["The gateway remains local-only and localhost-bound by default."], "Do not expose billing or payment surfaces before production hosting and security gates are complete."),
  ];
}

function check(id: string, label: string, status: BillingPaymentReadinessStatus, severity: BillingPaymentReadinessSeverity, evidence: string[], recommendation: string): BillingPaymentReadinessCheck {
  return { id, label, status, severity, evidence, recommendation };
}
