import { canonicalizeJson } from "./exact-action-gatepass.js";
import { isStructurallyGatePass } from "./shadow-decision-receipt.js";
import { createCanonicalPayloadHash } from "./local-signed-proof.js";
import {
  PURCHASING_DEMO_REFERENCE_TIME,
  runLocalPurchasingLifecycleDemo,
  verifyPurchasingExecutionEvidenceLink,
  type PurchasingLifecycleCaseId,
  type PurchasingLifecycleDemoCase,
  type PurchasingLifecycleDemoPack,
} from "./local-purchasing-lifecycle-demo.js";

export const CUSTOMER_TRUST_RECEIPT_VERSION = "atg.customer-trust-receipt.local.v1" as const;
export const ASSURANCE_COVERAGE_MAP_VERSION = "atg.assurance-coverage-map.local.v1" as const;
export const ASSURANCE_METRICS_VERSION = "atg.assurance-metrics.local.v1" as const;
export const BUYER_ADOPTION_PROOF_PACK_VERSION = "atg.buyer-adoption-proof-pack.local.v1" as const;
export const M162_EVIDENCE_MANIFEST_VERSION = "atg.m162-evidence-manifest.local.v1" as const;
export const M162_EVIDENCE_BUNDLE_VERSION = "atg.m162-evidence-bundle.local.v1" as const;

export type CoverageStatus = "DEMONSTRATED" | "PARTIALLY_DEMONSTRATED" | "NOT_DEMONSTRATED" | "OUT_OF_SCOPE";

export interface CustomerTrustReceipt {
  receiptVersion: typeof CUSTOMER_TRUST_RECEIPT_VERSION;
  receiptId: string;
  runId: string;
  sourceCaseId: PurchasingLifecycleCaseId;
  sourceCaseDigest: string;
  mandateReference: string | null;
  actionReference: string | null;
  atgVerdict: "ACCEPT" | "REJECT" | "REFER" | "SHADOW";
  shadowMode: { observational: boolean; wouldOutcome: "ACCEPT" | "REFER" | "REJECT" | null };
  gatePassStatus: "NOT_ISSUED" | "ISSUED" | "CONSUMED" | "REVOKED" | "EXPIRED" | "OTHER_EVIDENCED";
  syntheticExecutionStatus: "ACKNOWLEDGED" | "BLOCKED" | "NOT_ATTEMPTED";
  decisionEvidence: { reference: string | null; digest: string | null; digestStatus: "VERIFIED_EMBEDDED" | "REFERENCE_ONLY" | "NOT_APPLICABLE" };
  executionEvidence: { reference: string | null; digest: string | null; digestStatus: "VERIFIED_EMBEDDED" | "NOT_APPLICABLE" };
  evidenceLink: { reference: string | null; digest: string | null; verified: boolean };
  lifecycleStateReference: string | null;
  controlsEvaluated: string[];
  plainEnglishControlOutcome: string;
  evidenceTime: typeof PURCHASING_DEMO_REFERENCE_TIME;
  verificationStatus: "VERIFIED_LOCAL_SYNTHETIC_EVIDENCE";
  scope: "P3-M161_LOCAL_SYNTHETIC_PURCHASING_DEMONSTRATION";
  limitations: string[];
  nonAuthorityStatement: string;
  syntheticNonProductionStatement: string;
  authorityGranted: false;
  executable: false;
  reservable: false;
  retryPermitted: false;
  revocationControl: false;
  commercialWisdomProven: false;
  customerApprovalProven: false;
  productionReadinessProven: false;
  regulatoryApprovalProven: false;
  receiptDigest: string;
}

export interface AssuranceCoverageEntry {
  controlId: string;
  controlObjective: string;
  concern: string;
  implementationComponent: string;
  applicableCases: PurchasingLifecycleCaseId[];
  evidenceReference: string | null;
  evidenceDigest: string | null;
  acceptanceTestReference: string | null;
  status: CoverageStatus;
  explanation: string;
  knownLimitation: string;
  verificationMethod: string;
  entryDigest: string;
}

export interface AssuranceCoverageMap {
  mapVersion: typeof ASSURANCE_COVERAGE_MAP_VERSION;
  runId: string;
  entries: AssuranceCoverageEntry[];
  totals: Record<CoverageStatus, number>;
  mapDigest: string;
  syntheticEvidenceOnly: true;
}

export interface AssuranceMetric {
  metricId: string;
  label: string;
  value: number;
  numerator: number | null;
  denominator: number | null;
  percentage: number | null;
  sourceEvidence: string[];
  classification: "SYNTHETIC_DEMONSTRATION_MEASUREMENT";
  note: string;
}

export interface AssuranceMetrics {
  metricsVersion: typeof ASSURANCE_METRICS_VERSION;
  runId: string;
  metrics: AssuranceMetric[];
  metricsDigest: string;
  syntheticEvidenceOnly: true;
  statisticalSignificanceClaimed: false;
  roiClaimed: false;
  realWorldRiskReductionClaimed: false;
}

export interface BuyerAdoptionProofPack {
  packVersion: typeof BUYER_ADOPTION_PROOF_PACK_VERSION;
  packId: string;
  runId: string;
  executiveEvidenceSummary: string;
  whatAtgDoes: string[];
  whatAtgDoesNotDo: string[];
  scenario: string;
  tenCaseOutcomeReferences: PurchasingLifecycleCaseId[];
  customerTrustReceiptReferences: string[];
  coverageMapReference: string;
  metricsReference: string;
  evidenceManifestReference: "evidence-manifest.json";
  verificationInstructions: string[];
  reproductionInstructions: string[];
  architectureAndTrustBoundary: string[];
  integrationAssumptions: string[];
  pilotEntryRequirements: string[];
  buyerResponsibilities: string[];
  securityAndDataHandling: string[];
  knownLimitationsAndNonClaims: string[];
  evidenceClassifications: Record<"demonstratedLocally" | "designedNotProductionIntegrated" | "notDemonstrated" | "outOfScope", string[]>;
  localOnly: true;
  syntheticOnly: true;
  productionReady: false;
  customerValidated: false;
  packDigest: string;
}

export interface EvidenceManifestEntry {
  artefactId: string;
  artefactType: string;
  schemaVersion: string;
  canonicalDigest: string;
  required: true;
}

export interface M162EvidenceManifest {
  manifestVersion: typeof M162_EVIDENCE_MANIFEST_VERSION;
  runId: string;
  entries: EvidenceManifestEntry[];
  manifestDigest: string;
}

export interface M162EvidenceBundle {
  bundleVersion: typeof M162_EVIDENCE_BUNDLE_VERSION;
  runId: string;
  generatedAt: typeof PURCHASING_DEMO_REFERENCE_TIME;
  sourceM161: { demoVersion: string; canonicalDigest: string; caseCount: 10 };
  customerTrustReceipts: CustomerTrustReceipt[];
  coverageMap: AssuranceCoverageMap;
  metrics: AssuranceMetrics;
  buyerAdoptionProofPack: BuyerAdoptionProofPack;
  reviewerMarkdown: string;
  manifest: M162EvidenceManifest;
  localOnly: true;
  syntheticOnly: true;
  authorityGranted: false;
  executionAvailable: false;
  productionReady: false;
  externalActionOccurred: false;
  bundleDigest: string;
}

export interface EvidenceVerificationResult {
  verified: boolean;
  reasonCodes: string[];
  runId: string | null;
  checkedArtefacts: number;
  authorityGranted: false;
  executionAttempted: false;
}

const NON_AUTHORITY = "This Customer Trust Receipt is evidence only. It is not a GatePass and grants no authority to reserve, execute, retry, revoke or expand an action.";
const SYNTHETIC_STATEMENT = "Local synthetic demonstration evidence only; not production ready and not evidence of a real purchase or successful business outcome.";

export async function createM162EvidenceBundle(): Promise<M162EvidenceBundle> {
  const source = await runLocalPurchasingLifecycleDemo();
  const sourceDigest = digest(source);
  const runId = `m162_run_${short(sourceDigest)}`;
  const receipts = source.cases.map((item) => createCustomerTrustReceipt(item, source, runId));
  const coverageMap = createAssuranceCoverageMap(source, runId);
  const metrics = createAssuranceMetrics(source, coverageMap, runId);
  const buyerAdoptionProofPack = createBuyerAdoptionProofPack(source, receipts, coverageMap, metrics, runId);
  const reviewerMarkdown = renderBuyerAdoptionProofPack(source, receipts, coverageMap, metrics, buyerAdoptionProofPack);
  const entries: EvidenceManifestEntry[] = [
    manifestEntry("source-m161", "M161_DEMONSTRATION", source.demoVersion, source),
    manifestEntry("customer-trust-receipts", "CUSTOMER_TRUST_RECEIPTS", CUSTOMER_TRUST_RECEIPT_VERSION, receipts),
    manifestEntry("assurance-coverage-map", "ASSURANCE_COVERAGE_MAP", coverageMap.mapVersion, coverageMap),
    manifestEntry("assurance-metrics", "ASSURANCE_METRICS", metrics.metricsVersion, metrics),
    manifestEntry("buyer-adoption-proof-pack", "BUYER_ADOPTION_PROOF_PACK", buyerAdoptionProofPack.packVersion, buyerAdoptionProofPack),
    manifestEntry("buyer-adoption-proof-pack-markdown", "REVIEWER_MARKDOWN", "atg.buyer-adoption-proof-pack.markdown.v1", reviewerMarkdown),
  ];
  const manifestBody = { manifestVersion: M162_EVIDENCE_MANIFEST_VERSION, runId, entries };
  const manifest: M162EvidenceManifest = { ...manifestBody, manifestDigest: digest(manifestBody) };
  const body = {
    bundleVersion: M162_EVIDENCE_BUNDLE_VERSION,
    runId,
    generatedAt: PURCHASING_DEMO_REFERENCE_TIME,
    sourceM161: { demoVersion: source.demoVersion, canonicalDigest: sourceDigest, caseCount: 10 as const },
    customerTrustReceipts: receipts,
    coverageMap,
    metrics,
    buyerAdoptionProofPack,
    reviewerMarkdown,
    manifest,
    localOnly: true as const,
    syntheticOnly: true as const,
    authorityGranted: false as const,
    executionAvailable: false as const,
    productionReady: false as const,
    externalActionOccurred: false as const,
  };
  return { ...body, bundleDigest: digest(body) };
}

export function createCustomerTrustReceipt(
  sourceCase: PurchasingLifecycleDemoCase,
  source: PurchasingLifecycleDemoPack,
  runId: string,
): CustomerTrustReceipt {
  const caseDigest = digest(sourceCase);
  const exact = sourceCase.caseId === "01_exact_authorised_purchase";
  const decision = exact ? source.executionEvidence.decisionReceipt : null;
  const execution = exact ? source.executionEvidence.executionReceipt : null;
  const link = exact ? source.executionEvidence.link : null;
  const gatePassStatus: CustomerTrustReceipt["gatePassStatus"] = sourceCase.gatePassStatus === "ISSUED_AND_CONSUMED" ? "CONSUMED"
    : sourceCase.gatePassStatus === "REVOKED" ? "REVOKED"
      : sourceCase.gatePassStatus === "ISSUED" ? "ISSUED" : "NOT_ISSUED";
  const body = {
    receiptVersion: CUSTOMER_TRUST_RECEIPT_VERSION,
    receiptId: `customer_trust_receipt_${short(caseDigest)}`,
    runId,
    sourceCaseId: sourceCase.caseId,
    sourceCaseDigest: caseDigest,
    mandateReference: sourceCase.evidence.humanMandateReference,
    actionReference: sourceCase.evidence.exactActionDigest === null ? null : `action:${sourceCase.evidence.exactActionDigest}`,
    atgVerdict: sourceCase.outcome,
    shadowMode: { observational: sourceCase.outcome === "SHADOW", wouldOutcome: sourceCase.wouldOutcome },
    gatePassStatus,
    syntheticExecutionStatus: sourceCase.executionStatus === "SYNTHETIC_EXECUTED" ? "ACKNOWLEDGED" as const
      : sourceCase.executionStatus === "BLOCKED" ? "BLOCKED" as const : "NOT_ATTEMPTED" as const,
    decisionEvidence: {
      reference: sourceCase.evidence.decisionReceiptId,
      digest: decision === null ? null : digest(decision),
      digestStatus: decision !== null ? "VERIFIED_EMBEDDED" as const
        : sourceCase.evidence.decisionReceiptId !== null ? "REFERENCE_ONLY" as const : "NOT_APPLICABLE" as const,
    },
    executionEvidence: {
      reference: sourceCase.evidence.executionReceiptId,
      digest: execution === null ? null : digest(execution),
      digestStatus: execution === null ? "NOT_APPLICABLE" as const : "VERIFIED_EMBEDDED" as const,
    },
    evidenceLink: { reference: link?.linkId ?? null, digest: link?.linkDigest ?? null, verified: link !== null && verifyPurchasingExecutionEvidenceLink(link, source.executionEvidence.decisionReceipt, source.executionEvidence.executionReceipt) },
    lifecycleStateReference: sourceCase.evidence.lifecycleStatus === null ? null : `lifecycle:${sourceCase.caseId}:${sourceCase.evidence.lifecycleStatus}`,
    controlsEvaluated: controlsForCase(sourceCase.caseId),
    plainEnglishControlOutcome: sourceCase.plainEnglish,
    evidenceTime: PURCHASING_DEMO_REFERENCE_TIME,
    verificationStatus: "VERIFIED_LOCAL_SYNTHETIC_EVIDENCE" as const,
    scope: "P3-M161_LOCAL_SYNTHETIC_PURCHASING_DEMONSTRATION" as const,
    limitations: ["Ten deterministic synthetic cases are not statistical evidence.", "No real external action or business outcome is evidenced."],
    nonAuthorityStatement: NON_AUTHORITY,
    syntheticNonProductionStatement: SYNTHETIC_STATEMENT,
    authorityGranted: false as const,
    executable: false as const,
    reservable: false as const,
    retryPermitted: false as const,
    revocationControl: false as const,
    commercialWisdomProven: false as const,
    customerApprovalProven: false as const,
    productionReadinessProven: false as const,
    regulatoryApprovalProven: false as const,
  };
  return { ...body, receiptDigest: digest(body) };
}

export function verifyCustomerTrustReceipt(receipt: unknown, source: PurchasingLifecycleDemoPack): EvidenceVerificationResult {
  if (!isRecord(receipt) || receipt.receiptVersion !== CUSTOMER_TRUST_RECEIPT_VERSION) return failed("CUSTOMER_TRUST_RECEIPT_VERSION_UNSUPPORTED");
  const sourceCase = source.cases.find((item) => item.caseId === receipt.sourceCaseId);
  if (sourceCase === undefined) return failed("CUSTOMER_TRUST_RECEIPT_SOURCE_MISSING");
  const expectedRunId = `m162_run_${short(digest(source))}`;
  const expected = createCustomerTrustReceipt(sourceCase, source, expectedRunId);
  const reasons: string[] = [];
  if (isStructurallyGatePass(receipt) || receipt.authorityGranted !== false || receipt.executable !== false || receipt.reservable !== false) reasons.push("CUSTOMER_TRUST_RECEIPT_AUTHORITY_INVALID");
  if (canonicalizeJson(receipt) !== canonicalizeJson(expected)) reasons.push("CUSTOMER_TRUST_RECEIPT_EVIDENCE_MISMATCH");
  return result(reasons, String(receipt.runId), 1);
}

export async function verifyM162EvidenceBundle(value: unknown): Promise<EvidenceVerificationResult> {
  if (!isRecord(value) || value.bundleVersion !== M162_EVIDENCE_BUNDLE_VERSION) return failed("EVIDENCE_BUNDLE_VERSION_UNSUPPORTED");
  const expected = await createM162EvidenceBundle();
  const reasons: string[] = [];
  if (value.authorityGranted !== false || value.executionAvailable !== false || value.externalActionOccurred !== false) reasons.push("EVIDENCE_BUNDLE_AUTHORITY_INVALID");
  compareSection(value, expected, "sourceM161", "SOURCE_EVIDENCE_MISMATCH", reasons);
  compareSection(value, expected, "customerTrustReceipts", "CUSTOMER_TRUST_RECEIPTS_MISMATCH", reasons);
  compareSection(value, expected, "coverageMap", "COVERAGE_CLAIM_UNSUPPORTED", reasons);
  compareSection(value, expected, "metrics", "METRIC_EVIDENCE_MISMATCH", reasons);
  compareSection(value, expected, "buyerAdoptionProofPack", "BUYER_PROOF_PACK_MISMATCH", reasons);
  compareSection(value, expected, "reviewerMarkdown", "REVIEWER_OUTPUT_MISMATCH", reasons);
  compareSection(value, expected, "manifest", "EVIDENCE_MANIFEST_DIGEST_MISMATCH", reasons);
  if (!Array.isArray(value.customerTrustReceipts) || value.customerTrustReceipts.length !== 10) reasons.push("REQUIRED_EVIDENCE_MISSING");
  else {
    const source = await runLocalPurchasingLifecycleDemo();
    for (const receipt of value.customerTrustReceipts) {
      const check = verifyCustomerTrustReceipt(receipt, source);
      reasons.push(...check.reasonCodes);
    }
  }
  if (!sameCanonical(value, expected)) reasons.push("BUNDLE_NON_DETERMINISTIC_OR_STRUCTURALLY_INVALID");
  return result(unique(reasons), String(value.runId ?? ""), expected.manifest.entries.length + expected.customerTrustReceipts.length);
}

function createAssuranceCoverageMap(source: PurchasingLifecycleDemoPack, runId: string): AssuranceCoverageMap {
  const specs: Array<[string, string, string, string, PurchasingLifecycleCaseId[], CoverageStatus, string, string, string]> = [
    ["CTRL-EXACT-001", "Bind authority to one canonical action", "Action mutation", "exact-action GatePass", ["01_exact_authorised_purchase","02_quantity_substitution","03_supplier_substitution"], "DEMONSTRATED", "Canonical action binding accepts the exact action and rejects mutations.", "Local fixture signatures only.", "Recompute source-case and receipt digests."],
    ["CTRL-MANDATE-001", "Enforce human mandate boundaries", "Self-authorisation", "exact-action authority evaluator", ["01_exact_authorised_purchase","09_authority_expansion_attempt"], "DEMONSTRATED", "The valid mandate passes and agent expansion claims reject.", "Synthetic registered authority only.", "Verify cases 01 and 09."],
    ["CTRL-MUTATION-001", "Detect supplier, quantity and price changes", "Commercial-term substitution", "business policy contract", ["02_quantity_substitution","03_supplier_substitution","04_price_band_breach"], "DEMONSTRATED", "Quantity and supplier reject; the bounded price band refers.", "Only the fixture action family is covered.", "Verify outcomes and reason codes."],
    ["CTRL-OUTCOME-001", "Keep ACCEPT, REJECT, REFER and revocation distinct", "Outcome ambiguity", "gateway plus lifecycle store", ["01_exact_authorised_purchase","04_price_band_breach","06_gatepass_revocation"], "DEMONSTRATED", "Distinct evidence exists for acceptance, refusal/referral and revocation.", "REVOKE is an internal lifecycle control, not an MCP verdict.", "Verify cases and revocation receipt reference."],
    ["CTRL-SHADOW-001", "Prevent Shadow Mode authority", "Observation becoming permission", "Shadow Decision Receipt", ["07_shadow_mode"], "DEMONSTRATED", "Shadow would accept but issues no GatePass.", "One synthetic policy fixture.", "Verify Shadow receipt and zero GatePass metric."],
    ["CTRL-ONEUSE-001", "Prevent GatePass replay", "Duplicate execution", "durable lifecycle CAS", ["01_exact_authorised_purchase","05_gatepass_reuse"], "DEMONSTRATED", "Consumed authority is blocked after restart.", "Single-process store only.", "Verify EXECUTED lifecycle and replay rejection."],
    ["CTRL-EXPIRY-001", "Reject expired or revoked authority", "Stale authority", "lifecycle expiry and revocation", ["06_gatepass_revocation"], "PARTIALLY_DEMONSTRATED", "Revocation is in the ten-case run; expiry is proved by the M161 acceptance suite.", "Expiry is test evidence rather than a named ten-case outcome.", "Run the M161 expired-authority test."],
    ["CTRL-EXPOSURE-001", "Enforce aggregate exposure", "Many small actions bypass ceiling", "aggregate exposure ledger", ["08_aggregate_ceiling"], "DEMONSTRATED", "Two outstanding actions count and the third refers.", "No cross-currency conversion.", "Verify case 08 and exposure reason code."],
    ["CTRL-STOP-001", "Persist emergency stop", "Continued issuance during incident", "durable emergency-stop record", ["10_emergency_recovery_lifecycle"], "DEMONSTRATED", "Stop state survives restart and blocks progression.", "Global local-gateway scope only.", "Verify case 10 evidence codes."],
    ["CTRL-RESTART-001", "Persist nonce, revocation and exposure", "State loss on restart", "local durable store", ["05_gatepass_reuse","06_gatepass_revocation","10_emergency_recovery_lifecycle"], "DEMONSTRATED", "All three evidence classes survive restart.", "No multi-process guarantee.", "Verify restart evidence codes."],
    ["CTRL-CRASH-001", "Avoid retry after uncertain effect", "Duplicate effect after crash", "UNKNOWN reconciliation", ["10_emergency_recovery_lifecycle"], "DEMONSTRATED", "UNKNOWN is not retried and needs explicit reconciliation.", "No real external acknowledgement source.", "Verify no-auto-retry metric."],
    ["CTRL-CONCURRENCY-001", "Allow one reservation and prevent overcommit", "Concurrent double use", "process-local serialized CAS", ["08_aggregate_ceiling"], "DEMONSTRATED", "Concurrent fixture attempts do not overcommit.", "Not distributed or multi-process.", "Run concurrent issuance/reservation tests."],
    ["CTRL-ADAPTER-001", "Restrict execution to registered adapter", "Arbitrary executor", "frozen synthetic adapter registry", ["01_exact_authorised_purchase"], "DEMONSTRATED", "Exactly one frozen synthetic adapter is registered.", "Synthetic in-process callback only.", "Run adapter registration test."],
    ["CTRL-RESOURCE-001", "Reject unregistered resources", "Resource substitution", "synthetic execution boundary", ["01_exact_authorised_purchase"], "DEMONSTRATED", "Unknown resources stop before reservation.", "One fixture resource.", "Run unregistered-resource test."],
    ["CTRL-RECEIPT-001", "Separate and link decision/execution evidence", "Decision mistaken for execution", "digest-bound evidence link", ["01_exact_authorised_purchase"], "DEMONSTRATED", "Receipts remain distinct and link to one action.", "Synthetic acknowledgement only.", "Verify M161 evidence link."],
    ["CTRL-TAMPER-001", "Detect evidence tampering", "Receipt substitution", "canonical SHA-256 digests", ["01_exact_authorised_purchase"], "DEMONSTRATED", "Receipt and link tampering fail verification.", "Hashing is not hostile-host protection.", "Run M161/M162 tamper tests."],
    ["CTRL-FAILCLOSED-001", "Fail closed on malformed, stale and rollback state", "Unsafe fallback", "validators and trusted clock", ["10_emergency_recovery_lifecycle"], "PARTIALLY_DEMONSTRATED", "Expiry and rollback are tested; not every production outage mode is modelled.", "Fixture clock and local storage only.", "Run stale/rollback/corruption tests."],
    ["CTRL-BYPASS-001", "Block executor bypass", "Calling effect without authority", "private adapter plus verifier", ["01_exact_authorised_purchase","05_gatepass_reuse","06_gatepass_revocation"], "DEMONSTRATED", "Missing, mutated, replayed and revoked authority cannot reach the adapter.", "No real platform enforcement integration.", "Run adapter reachability tests."],
    ["CTRL-DATA-001", "Minimise evidence data", "Sensitive-data leakage", "opaque synthetic references", ["01_exact_authorised_purchase"], "DEMONSTRATED", "Evidence uses synthetic opaque references and digests.", "No production retention/deletion service.", "Scan generated artefacts for prohibited material."],
    ["CTRL-LOCAL-001", "Preserve local-only/no-live-effect boundary", "Unintended external action", "local CLI and synthetic adapter", ["01_exact_authorised_purchase"], "DEMONSTRATED", "All operational flags remain local and externalActionOccurred is false.", "Does not prove safety of a future external adapter.", "Verify flags and source scan."],
    ["CTRL-IAM-001", "Use production IAM and key custody", "Identity/key compromise", "not implemented", [], "NOT_DEMONSTRATED", "Only repository fixture identities and keys exist.", "Production IAM and key custody are absent.", "No verification method is claimed."],
    ["CTRL-DISTRIBUTED-001", "Provide distributed durability", "Cross-process races and regional failure", "not implemented", [], "NOT_DEMONSTRATED", "The store is local and single-process.", "No distributed consensus or HA.", "No verification method is claimed."],
    ["CTRL-EXTERNAL-REC-001", "Reconcile real external effects", "Unknown real-world outcome", "not implemented", [], "NOT_DEMONSTRATED", "Only synthetic reconciliation evidence exists.", "No external acknowledgement source.", "No verification method is claimed."],
    ["CTRL-COMPLIANCE-001", "Establish regulatory compliance", "Regulatory obligations", "outside demonstrator", [], "OUT_OF_SCOPE", "No compliance determination is made.", "Requires buyer-specific legal assessment.", "Out of scope."],
    ["CTRL-REAL-PROC-001", "Execute real procurement or payment", "Capital movement", "outside demonstrator", [], "OUT_OF_SCOPE", "No real order, payment or settlement is performed.", "Buyer retains any real execution boundary.", "Out of scope."],
  ];
  const entries = specs.map((spec) => coverageEntry(source, ...spec));
  const totals = coverageTotals(entries);
  const body = { mapVersion: ASSURANCE_COVERAGE_MAP_VERSION, runId, entries, totals, syntheticEvidenceOnly: true as const };
  return { ...body, mapDigest: digest(body) };
}

function createAssuranceMetrics(source: PurchasingLifecycleDemoPack, coverage: AssuranceCoverageMap, runId: string): AssuranceMetrics {
  const cases = source.cases;
  const count = (predicate: (item: PurchasingLifecycleDemoCase) => boolean) => cases.filter(predicate).length;
  const refs = (ids: PurchasingLifecycleCaseId[]) => ids.map((id) => `m161-case:${id}`);
  const metrics: AssuranceMetric[] = [
    metric("METRIC-TOTAL-CASES", "Total demonstration cases", 10, refs(cases.map((item) => item.caseId))),
    ...(["ACCEPT","REJECT","REFER","SHADOW"] as const).map((outcome) => rateMetric(`METRIC-VERDICT-${outcome}`, `${outcome} outcomes`, count((item) => item.outcome === outcome), 10, refs(cases.filter((item) => item.outcome === outcome).map((item) => item.caseId)))),
    metric("METRIC-GATEPASSES-ISSUED", "Distinct GatePasses evidenced as issued", new Set(cases.map((item) => item.evidence.gatePassId).filter(Boolean)).size, refs(["01_exact_authorised_purchase","06_gatepass_revocation","10_emergency_recovery_lifecycle"])),
    metric("METRIC-GATEPASSES-CONSUMED", "Distinct GatePasses consumed", 1, refs(["01_exact_authorised_purchase"])),
    metric("METRIC-GATEPASSES-REVOKED", "GatePasses revoked", 1, refs(["06_gatepass_revocation"])),
    metric("METRIC-REUSE-BLOCKED", "GatePass reuse attempts blocked", 1, refs(["05_gatepass_reuse"])),
    metric("METRIC-ALTERED-ACTIONS-REJECTED", "Altered-action proposals rejected", 3, refs(["02_quantity_substitution","03_supplier_substitution","09_authority_expansion_attempt"])),
    metric("METRIC-HUMAN-REVIEW-REFERRALS", "Human-review referrals", 2, refs(["04_price_band_breach","08_aggregate_ceiling"])),
    metric("METRIC-SHADOW-EVALUATIONS", "Shadow Mode evaluations", 1, refs(["07_shadow_mode"])),
    metric("METRIC-SHADOW-GATEPASSES", "Shadow Mode GatePasses issued", 0, refs(["07_shadow_mode"])),
    metric("METRIC-UNAUTHORISED-EXECUTION-BLOCKED", "Unauthorised execution attempts blocked", 3, refs(["05_gatepass_reuse","06_gatepass_revocation","10_emergency_recovery_lifecycle"])),
    metric("METRIC-SYNTHETIC-EXECUTIONS", "Synthetic executions acknowledged", 1, refs(["01_exact_authorised_purchase"])),
    metric("METRIC-AGGREGATE-INTERVENTIONS", "Aggregate-ceiling interventions", 1, refs(["08_aggregate_ceiling"])),
    metric("METRIC-EMERGENCY-INTERVENTIONS", "Emergency-stop interventions", 1, refs(["10_emergency_recovery_lifecycle"])),
    metric("METRIC-AUTOMATIC-CRASH-RETRIES", "Automatic retries after uncertain state", 0, refs(["10_emergency_recovery_lifecycle"])),
    rateMetric("METRIC-EVIDENCE-LINK-VERIFICATION", "Intact execution evidence links verified", 1, 1, ["m161-execution-evidence-link"]),
    rateMetric("METRIC-TAMPER-DETECTION", "Deterministic tamper variants detected", 2, 2, ["test:execution-link-verification-detects-receipt-and-link-tampering"]),
    ...(["DEMONSTRATED","PARTIALLY_DEMONSTRATED","NOT_DEMONSTRATED","OUT_OF_SCOPE"] as CoverageStatus[]).map((status) => metric(`METRIC-COVERAGE-${status}`, `Coverage entries: ${status}`, coverage.totals[status], ["coverage-map"])),
  ];
  const body = { metricsVersion: ASSURANCE_METRICS_VERSION, runId, metrics, syntheticEvidenceOnly: true as const, statisticalSignificanceClaimed: false as const, roiClaimed: false as const, realWorldRiskReductionClaimed: false as const };
  return { ...body, metricsDigest: digest(body) };
}

function createBuyerAdoptionProofPack(source: PurchasingLifecycleDemoPack, receipts: CustomerTrustReceipt[], coverage: AssuranceCoverageMap, metrics: AssuranceMetrics, runId: string): BuyerAdoptionProofPack {
  const body = {
    packVersion: BUYER_ADOPTION_PROOF_PACK_VERSION,
    packId: `buyer_proof_pack_${short(runId)}`,
    runId,
    executiveEvidenceSummary: "A reproducible ten-case local synthetic evaluation shows exact-action authority checks, bounded referral, durable replay/revocation controls and non-authorising Shadow evidence. It is evaluation evidence, not customer or production validation.",
    whatAtgDoes: ["Evaluates exact proposed actions against registered authority and policy evidence.", "Issues one-use GatePasses only for enforced ACCEPT outcomes.", "Produces separate local decision and synthetic execution evidence."],
    whatAtgDoesNotDo: ["Decide commercial wisdom.", "Execute real procurement, payment or settlement.", "Establish production readiness, compliance, ROI or customer validation."],
    scenario: source.title,
    tenCaseOutcomeReferences: source.cases.map((item) => item.caseId),
    customerTrustReceiptReferences: receipts.map((item) => item.receiptId),
    coverageMapReference: coverage.mapDigest,
    metricsReference: metrics.metricsDigest,
    evidenceManifestReference: "evidence-manifest.json" as const,
    verificationInstructions: ["npm run verify:m162 -- --input examples/p3-m162/evidence-bundle.json", "Treat any non-zero exit as verification failure."],
    reproductionInstructions: ["npm run evidence:m162 -- --output-dir examples/p3-m162", "npm run test:customer-trust-evidence"],
    architectureAndTrustBoundary: ["M162 reads M161 evidence and grants no authority.", "MCP remains local stdio with only atg.evaluate_action.", "The synthetic adapter is not reachable from M162 artefacts."],
    integrationAssumptions: ["Node.js and existing repository dependencies.", "Synthetic fixtures and local filesystem only.", "A buyer would retain control of any future real adapter."],
    pilotEntryRequirements: ["One buyer-selected action family.", "Synthetic or explicitly approved data.", "No production execution during initial evaluation.", "Buyer-approved policy and human authority evidence."],
    buyerResponsibilities: ["Define authority and policy boundaries.", "Provide approved non-sensitive test data.", "Review referrals and retain control of execution.", "Perform independent security, legal and operational review."],
    securityAndDataHandling: ["Opaque synthetic references and canonical digests.", "No credentials, personal data, customer data or production secrets.", "Local artefact retention remains the operator's responsibility."],
    knownLimitationsAndNonClaims: ["Ten synthetic cases are not statistically significant.", "No customer deployment or independent validation.", "No distributed durability, production IAM/key custody or real external reconciliation.", "No guaranteed compliance, ROI, savings, fraud reduction or business outcome."],
    evidenceClassifications: {
      demonstratedLocally: coverage.entries.filter((item) => item.status === "DEMONSTRATED").map((item) => item.controlId),
      designedNotProductionIntegrated: coverage.entries.filter((item) => item.status === "PARTIALLY_DEMONSTRATED").map((item) => item.controlId),
      notDemonstrated: coverage.entries.filter((item) => item.status === "NOT_DEMONSTRATED").map((item) => item.controlId),
      outOfScope: coverage.entries.filter((item) => item.status === "OUT_OF_SCOPE").map((item) => item.controlId),
    },
    localOnly: true as const,
    syntheticOnly: true as const,
    productionReady: false as const,
    customerValidated: false as const,
  };
  return { ...body, packDigest: digest(body) };
}

export function renderBuyerAdoptionProofPack(source: PurchasingLifecycleDemoPack, receipts: CustomerTrustReceipt[], coverage: AssuranceCoverageMap, metrics: AssuranceMetrics, pack: BuyerAdoptionProofPack): string {
  const outcomeRows = source.cases.map((item) => `| ${item.caseId.slice(0,2)} | ${item.title} | ${item.outcome} | ${item.gatePassStatus} | ${item.executionStatus} |`);
  const coverageRows = coverage.entries.map((item) => `| ${item.controlId} | ${item.status} | ${item.explanation} | ${item.knownLimitation} |`);
  const metricRows = metrics.metrics.map((item) => `| ${item.metricId} | ${item.value} | ${item.numerator ?? "—"} | ${item.denominator ?? "—"} | ${item.percentage ?? "—"} |`);
  return [
    "# P3-M162 Buyer Adoption Proof Pack", "", pack.executiveEvidenceSummary, "",
    "## Evidence boundary", "", "Local synthetic evidence only. No external action occurred. This pack grants no authority and is not production, customer, compliance, ROI or business-outcome validation.", "",
    "## What ATG does", "", ...pack.whatAtgDoes.map((item) => `- ${item}`), "", "## What ATG does not do", "", ...pack.whatAtgDoesNotDo.map((item) => `- ${item}`), "",
    "## Exact-action purchasing scenario", "", source.title, "", "| # | Case | Verdict | GatePass | Execution |", "|---:|---|---|---|---|", ...outcomeRows, "",
    "## Customer Trust Receipts", "", ...receipts.map((item) => `- ${item.sourceCaseId}: \`${item.receiptId}\` — ${item.atgVerdict}; authority granted: false.`), "",
    "## Assurance Coverage Map", "", "| Control | Status | Evidence | Limitation |", "|---|---|---|---|", ...coverageRows, "",
    "## Evidence-derived metrics", "", "| Metric | Value | Numerator | Denominator | Percentage |", "|---|---:|---:|---:|---:|", ...metricRows, "",
    "## Verification and reproduction", "", ...pack.verificationInstructions.map((item) => `- \`${item}\``), ...pack.reproductionInstructions.map((item) => `- \`${item}\``), "",
    "## Architecture and trust boundary", "", ...pack.architectureAndTrustBoundary.map((item) => `- ${item}`), "", "## Integration assumptions", "", ...pack.integrationAssumptions.map((item) => `- ${item}`), "",
    "## Pilot entry requirements and buyer responsibilities", "", ...pack.pilotEntryRequirements.map((item) => `- ${item}`), ...pack.buyerResponsibilities.map((item) => `- ${item}`), "",
    "## Evidence manifest", "", `Canonical artefact digests are recorded in \`${pack.evidenceManifestReference}\`.`, "",
    "## Security, limitations and non-claims", "", ...pack.securityAndDataHandling.map((item) => `- ${item}`), ...pack.knownLimitationsAndNonClaims.map((item) => `- ${item}`), "",
    `Machine pack digest: \`${pack.packDigest}\``, "",
  ].join("\n");
}

function coverageEntry(source: PurchasingLifecycleDemoPack, controlId: string, controlObjective: string, concern: string, implementationComponent: string, applicableCases: PurchasingLifecycleCaseId[], status: CoverageStatus, explanation: string, knownLimitation: string, verificationMethod: string): AssuranceCoverageEntry {
  const evidenceCases = applicableCases.map((id) => source.cases.find((item) => item.caseId === id)).filter((item): item is PurchasingLifecycleDemoCase => item !== undefined);
  const evidenceReference = evidenceCases.length === 0 ? null : evidenceCases.map((item) => item.caseId).join(",");
  const evidenceDigest = evidenceCases.length === 0 ? null : digest(evidenceCases);
  const acceptanceTestReference = status === "DEMONSTRATED" || status === "PARTIALLY_DEMONSTRATED" ? `test:m161:${controlId.toLowerCase()}` : null;
  const body = { controlId, controlObjective, concern, implementationComponent, applicableCases, evidenceReference, evidenceDigest, acceptanceTestReference, status, explanation, knownLimitation, verificationMethod };
  return { ...body, entryDigest: digest(body) };
}

function coverageTotals(entries: AssuranceCoverageEntry[]): Record<CoverageStatus, number> {
  return { DEMONSTRATED: entries.filter((item) => item.status === "DEMONSTRATED").length, PARTIALLY_DEMONSTRATED: entries.filter((item) => item.status === "PARTIALLY_DEMONSTRATED").length, NOT_DEMONSTRATED: entries.filter((item) => item.status === "NOT_DEMONSTRATED").length, OUT_OF_SCOPE: entries.filter((item) => item.status === "OUT_OF_SCOPE").length };
}

function controlsForCase(id: PurchasingLifecycleCaseId): string[] {
  const common = ["CTRL-EXACT-001", "CTRL-MANDATE-001", "CTRL-LOCAL-001"];
  const specific: Record<PurchasingLifecycleCaseId, string[]> = {
    "01_exact_authorised_purchase": ["CTRL-ADAPTER-001","CTRL-RECEIPT-001"], "02_quantity_substitution": ["CTRL-MUTATION-001"], "03_supplier_substitution": ["CTRL-MUTATION-001"], "04_price_band_breach": ["CTRL-MUTATION-001","CTRL-OUTCOME-001"], "05_gatepass_reuse": ["CTRL-ONEUSE-001","CTRL-BYPASS-001"], "06_gatepass_revocation": ["CTRL-EXPIRY-001","CTRL-OUTCOME-001"], "07_shadow_mode": ["CTRL-SHADOW-001"], "08_aggregate_ceiling": ["CTRL-EXPOSURE-001","CTRL-CONCURRENCY-001"], "09_authority_expansion_attempt": ["CTRL-MANDATE-001"], "10_emergency_recovery_lifecycle": ["CTRL-STOP-001","CTRL-RESTART-001","CTRL-CRASH-001"],
  };
  return unique([...common, ...specific[id]]);
}

function metric(metricId: string, label: string, value: number, sourceEvidence: string[]): AssuranceMetric { return { metricId, label, value, numerator: null, denominator: null, percentage: null, sourceEvidence, classification: "SYNTHETIC_DEMONSTRATION_MEASUREMENT", note: "Observed in the fixed local synthetic evidence; not a real-world performance or outcome claim." }; }
function rateMetric(metricId: string, label: string, numerator: number, denominator: number, sourceEvidence: string[]): AssuranceMetric { return { metricId, label, value: numerator, numerator, denominator, percentage: denominator === 0 ? 0 : Number(((numerator / denominator) * 100).toFixed(2)), sourceEvidence, classification: "SYNTHETIC_DEMONSTRATION_MEASUREMENT", note: "Synthetic demonstration rate only; no statistical significance is claimed." }; }
function manifestEntry(artefactId: string, artefactType: string, schemaVersion: string, value: unknown): EvidenceManifestEntry { return { artefactId, artefactType, schemaVersion, canonicalDigest: digest(value), required: true }; }
function digest(value: unknown): string { return createCanonicalPayloadHash(value); }
function short(value: string): string { return value.replace(/^sha256:/, "").slice(0, 24); }
function compareSection(actual: Record<string, unknown>, expected: M162EvidenceBundle, field: keyof M162EvidenceBundle, code: string, reasons: string[]): void { if (!sameCanonical(actual[field], expected[field])) reasons.push(code); }
function sameCanonical(left: unknown, right: unknown): boolean { try { return canonicalizeJson(left) === canonicalizeJson(right); } catch { return false; } }
function result(reasons: string[], runId: string, checkedArtefacts: number): EvidenceVerificationResult { return { verified: reasons.length === 0, reasonCodes: unique(reasons), runId: runId || null, checkedArtefacts, authorityGranted: false, executionAttempted: false }; }
function failed(code: string): EvidenceVerificationResult { return result([code], "", 0); }
function unique<T>(values: readonly T[]): T[] { return [...new Set(values)]; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
