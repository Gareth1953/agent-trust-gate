import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const root = process.cwd();
const requiredDocs = [
  "docs/enterprise-positioning-validation-pack.md",
  "docs/executive-decision-brief.md",
  "docs/supplier-bank-change-control-model.md",
  "docs/iam-workflow-observability-atg-comparison.md",
  "docs/workflow-governance-assessment-offer.md",
  "docs/enterprise-reviewer-scorecard.md",
  "docs/enterprise-positioning-publication-gate.md",
];
const scenarioFiles = [
  "examples/supplier-bank-change-approved.json",
  "examples/supplier-bank-change-account-mismatch.json",
  "examples/supplier-bank-change-supplier-mismatch.json",
  "examples/supplier-bank-change-missing-verification.json",
  "examples/supplier-bank-change-self-verification.json",
  "examples/supplier-bank-change-wrong-approver-role.json",
  "examples/supplier-bank-change-authority-limit-exceeded.json",
  "examples/supplier-bank-change-dual-approval-missing.json",
  "examples/supplier-bank-change-expired.json",
  "examples/supplier-bank-change-replay.json",
  "examples/supplier-bank-change-action-digest-mismatch.json",
  "examples/supplier-bank-change-unverifiable-standing.json",
  "examples/supplier-bank-change-delegation-out-of-scope.json",
  "examples/supplier-bank-change-commercial-authority-refused.json",
  "examples/supplier-bank-change-execution-receipt-missing.json",
  "examples/supplier-bank-change-revoked-human-authority.json",
];
const implementationFiles = [
  "src/supplier-bank-change-model.ts",
  "src/supplier-bank-change-cli.ts",
  "test/supplier-bank-change.test.ts",
  "scripts/validate-enterprise-positioning-pack.mjs",
  "site/supplier-bank-change-demo.html",
  "package.json",
];
const requiredFiles = [...requiredDocs, ...scenarioFiles, ...implementationFiles];
const claimSafeFiles = [
  "docs/executive-decision-brief.md",
  "docs/supplier-bank-change-control-model.md",
  "docs/iam-workflow-observability-atg-comparison.md",
  "docs/workflow-governance-assessment-offer.md",
  "docs/enterprise-reviewer-scorecard.md",
  "site/supplier-bank-change-demo.html",
];
const prohibitedClaims = [
  "total AI adoption",
  "total business AI platform",
  "one trust layer for your entire business",
  "business-wide AI adoption platform",
  "high-end business tool",
  "safe AI adoption",
  "fraud-proof",
  "prevents supplier fraud",
  "guarantees authorised payments",
  "legally verified authority",
  "enterprise-ready",
  "production-ready",
  "certified safe agent",
  "compliant AI-agent action",
  "regulatory certification",
  "security certification",
];
const requiredReasonCodes = new Map([
  ["valid_exact_change", "ALL_CONTROLS_PASSED"],
  ["changed_account_details", "ACCOUNT_DETAILS_CHANGED"],
  ["changed_supplier", "SUPPLIER_CHANGED"],
  ["missing_independent_verification", "INDEPENDENT_VERIFICATION_MISSING"],
  ["self_verification", "SEPARATION_OF_DUTIES_FAILED"],
  ["wrong_approver_role", "APPROVER_ROLE_UNAUTHORISED"],
  ["authority_limit_exceeded", "AUTHORITY_LIMIT_EXCEEDED"],
  ["dual_approval_missing", "DUAL_APPROVAL_REQUIRED"],
  ["approval_expired", "APPROVAL_EXPIRED"],
  ["replayed_gatepass", "GATEPASS_ALREADY_CONSUMED"],
  ["action_digest_mismatch", "ACTION_DIGEST_MISMATCH"],
  ["agent_standing_unverifiable", "AGENT_STANDING_UNVERIFIABLE"],
  ["delegation_out_of_scope", "DELEGATION_OUT_OF_SCOPE"],
  ["commercial_authority_confusion", "COMMERCIAL_AUTHORITY_CONFUSION"],
  ["execution_claim_without_execution_receipt", "EXECUTION_RECEIPT_MISSING"],
  ["revoked_human_authority", "APPROVER_AUTHORITY_REVOKED"],
]);

const checks = [];
const check = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
const read = (path) => readFileSync(join(root, path), "utf8");

check(
  "required_files",
  requiredFiles.every((path) => existsSync(join(root, path))),
  `${requiredFiles.length} required pack, scenario, implementation and demonstrator files exist`,
);

const positioning = read("docs/enterprise-positioning-validation-pack.md");
const allDocs = requiredDocs.map(read).join("\n");
const approvedLanguage = [
  "Enterprise AI Action Trust and Governance — initially delivered as a local exact-action evaluation.",
  "Verify authority before a consequential AI-agent action.",
  "Agent Trust Gate™ lets an enterprise test whether an agent’s proposed action has the mandate, approvals, limits and evidence the business requires before anything irreversible happens.",
  "Verify Before Settlement.",
  "No mandate. No evidence. No signed GatePass. No settlement.",
  "Agent Trust Gate™ exists to make digital trust verifiable before action, observable during execution and accountable afterwards.",
  "Land vertically through one consequential action. Test whether the same trust model can be reused horizontally across a second workflow.",
];
check(
  "approved_language_present",
  approvedLanguage.every((phrase) => positioning.includes(phrase)),
  "approved category, headline, buyer explanation, central principles and vertical-first strategy are present",
);

const claimSafeCombined = claimSafeFiles.map(read).join("\n");
const prohibitedFound = prohibitedClaims.filter((phrase) =>
  claimSafeCombined.toLocaleLowerCase("en-GB").includes(phrase.toLocaleLowerCase("en-GB"))
);
check(
  "prohibited_claims_absent_from_reviewer_assets",
  prohibitedFound.length === 0,
  prohibitedFound.length === 0
    ? "prohibited phrases appear only in explicit do-not-use inventories"
    : `prohibited reviewer-facing phrases: ${prohibitedFound.join(", ")}`,
);
check(
  "prohibited_inventory_complete",
  prohibitedClaims.every((phrase) => positioning.includes(`“${phrase}”`)),
  "the validation pack retains the complete prohibited-claims search inventory",
);

const estimatedLabel = "ESTIMATED AND NOT YET MARKET-VALIDATED.";
const estimatedPrice = "£5,000–£10,000 plus VAT where applicable";
const pricingFiles = [
  "docs/enterprise-positioning-validation-pack.md",
  "docs/executive-decision-brief.md",
  "docs/workflow-governance-assessment-offer.md",
  "docs/enterprise-positioning-publication-gate.md",
];
check(
  "pricing_is_estimated",
  pricingFiles.every((path) => read(path).includes(estimatedLabel))
    && pricingFiles.slice(0, 3).every((path) => read(path).includes(estimatedPrice)),
  "all pricing uses the approved range and visible estimated/not-market-validated label",
);

const cta = "Request a scoped workflow-governance assessment.";
const ctaFiles = [
  "docs/enterprise-positioning-validation-pack.md",
  "docs/executive-decision-brief.md",
  "docs/workflow-governance-assessment-offer.md",
  "docs/enterprise-reviewer-scorecard.md",
];
check(
  "primary_cta_consistent",
  ctaFiles.every((path) => read(path).includes(cta)),
  "the primary call to action is consistent across the pack, brief, offer and scorecard",
);

const scenarioValues = [];
const invalidJson = [];
for (const path of scenarioFiles) {
  try {
    scenarioValues.push({ path, value: JSON.parse(read(path)), source: read(path) });
  } catch (error) {
    invalidJson.push(`${path}: ${error instanceof Error ? error.message : "invalid JSON"}`);
  }
}
check(
  "scenario_json_valid",
  invalidJson.length === 0 && scenarioValues.length === 16,
  invalidJson.length === 0 ? "all 16 scenario JSON files parse" : invalidJson.join("; "),
);

const onDiskScenarios = readdirSync(join(root, "examples"))
  .filter((file) => /^supplier-bank-change-.*\.json$/.test(file));
check(
  "scenario_inventory_exact",
  onDiskScenarios.length === 16 && scenarioFiles.every((path) =>
    onDiskScenarios.includes(path.replace("examples/", ""))
  ),
  "the fixture inventory contains exactly the 16 required supplier-change scenarios",
);

const scenarioSafetyFailures = scenarioValues.filter(({ value }) =>
  value.synthetic !== true
  || value.realData !== false
  || value.networkAccess !== false
  || value.externalActionPerformed !== false
  || value.scenarioVersion !== "atg.supplier-bank-change.scenario.local.v1"
);
check(
  "scenario_safety_flags",
  scenarioSafetyFailures.length === 0,
  scenarioSafetyFailures.length === 0
    ? "every scenario is explicitly synthetic, no-real-data, offline and no-external-action"
    : `unsafe scenario flags: ${scenarioSafetyFailures.map(({ path }) => path).join(", ")}`,
);

const scenarioContractFailures = scenarioValues.filter(({ value }) =>
  requiredReasonCodes.get(value.scenarioId) !== value.expected?.reasonCode
  || !["GATEPASS_ISSUED", "REFUSED"].includes(value.expected?.decision)
);
check(
  "scenario_reason_contract",
  scenarioContractFailures.length === 0
    && new Set(scenarioValues.map(({ value }) => value.scenarioId)).size === 16,
  scenarioContractFailures.length === 0
    ? "all scenario IDs map to the required stable expected reason codes"
    : `scenario contract failures: ${scenarioContractFailures.map(({ path }) => path).join(", ")}`,
);

const scenarioText = scenarioValues.map(({ source }) => source).join("\n");
const forbiddenDataPatterns = [
  { label: "IBAN", pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/ },
  { label: "sort code", pattern: /\b\d{2}[- ]\d{2}[- ]\d{2}\b/ },
  { label: "full numeric account value", pattern: /"(?:accountNumber|bankAccount|account_number)"\s*:\s*"?\d{8,}"?/i },
  { label: "SWIFT/BIC field", pattern: /"(?:swift|bic|swiftBic)"\s*:/i },
  { label: "credential or secret field", pattern: /"(?:password|credential|secret|apiKey|accessToken|privateKey)"\s*:/i },
  { label: "private key material", pattern: /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i },
];
const unsafeData = forbiddenDataPatterns.filter(({ pattern }) => pattern.test(scenarioText));
check(
  "no_bank_numbers_or_secrets",
  unsafeData.length === 0,
  unsafeData.length === 0
    ? "scenario files contain no full account numbers, IBANs, sort codes, SWIFT/BIC fields, credentials or secrets"
    : `unsafe data patterns: ${unsafeData.map(({ label }) => label).join(", ")}`,
);
check(
  "fictional_supplier_allowlist",
  scenarioText.includes("Northbridge Office Systems Ltd")
    && !/"supplierName"\s*:\s*"(?!Northbridge Office Systems Ltd|Fictional Meridian Workspace Ltd)[^"]+"/.test(scenarioText),
  "only the two explicitly fictional supplier labels appear in self-contained scenario actions",
);

const implementationSource = [
  "src/supplier-bank-change-model.ts",
  "src/supplier-bank-change-cli.ts",
  "site/supplier-bank-change-demo.html",
].map(read).join("\n");
const networkPatterns = [
  /\bfetch\s*\(/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
  /EventSource/i,
  /sendBeacon/i,
  /https?:\/\//i,
  /\bnet\.connect\b/i,
  /\bhttp\.request\b/i,
  /\bhttps\.request\b/i,
];
check(
  "no_network_or_external_integration_code",
  networkPatterns.every((pattern) => !pattern.test(implementationSource)),
  "model, CLI and static demonstrator contain no network, ERP, bank or payment call path",
);
check(
  "no_external_action_claim",
  !/externalActionPerformed\s*["']?\s*:\s*true/i.test(implementationSource + scenarioText)
    && implementationSource.includes("externalActionPerformed: false")
    && scenarioValues.every(({ source }) => source.includes('"externalActionPerformed": false')),
  "implementation and fixtures preserve externalActionPerformed: false",
);

const fiveStages = [
  "identity verification",
  "authority verification",
  "business-policy evaluation",
  "GatePass decision",
  "execution evidence",
];
check(
  "five_stages_distinguished",
  [positioning, read("docs/supplier-bank-change-control-model.md"), read("site/supplier-bank-change-demo.html")]
    .every((source) => fiveStages.every((stage) => source.toLowerCase().includes(stage.toLowerCase()))),
  "pack, control model and screen distinguish identity, authority, policy, decision and execution evidence",
);

const clarificationFiles = [
  "docs/executive-decision-brief.md",
  "docs/enterprise-positioning-validation-pack.md",
  "docs/supplier-bank-change-control-model.md",
  "docs/iam-workflow-observability-atg-comparison.md",
  "docs/workflow-governance-assessment-offer.md",
  "site/supplier-bank-change-demo.html",
  "src/supplier-bank-change-model.ts",
  "examples/supplier-bank-change-missing-verification.json",
];
const clarificationText = clarificationFiles.map(read).join("\n").replaceAll("’", "'");
const independentClarification = "Configured evidence shows that the organisation's independent-verification step was completed; ATG does not determine whether the bank details are correct.";
const authorityClarification = "configured evidence of current organisational authority for this exact action";
const legacyEvidenceWording = /approved independent-verification evidence|current human authority|current approved verification evidence/i;
check(
  "enterprise_evidence_wording_clarified",
  clarificationText.includes(independentClarification)
    && clarificationText.toLowerCase().includes(authorityClarification)
    && clarificationText.includes("ATG does not independently establish legal authority.")
    && !legacyEvidenceWording.test(clarificationText),
  "enterprise wording describes configured independent-verification-step and organisational-authority evidence without claiming bank-detail correctness or legal authority",
);

const html = read("site/supplier-bank-change-demo.html");
const requiredScreenPhrases = [
  "Proposed supplier change",
  "Requesting agent",
  "Principal",
  "Delegation",
  "Independent-verification-step evidence",
  "Configured organisational-authority evidence",
  "Exact-action digest",
  "GatePass or refusal",
  "Separate execution status",
  "Limitations",
  "No ERP, bank, payment, directory or supplier system is connected.",
  "No real supplier data is used.",
  "No external action occurs.",
];
check(
  "demonstrator_content",
  requiredScreenPhrases.every((phrase) => html.includes(phrase))
    && requiredReasonCodes.size === [...html.matchAll(/id:\s*"([^"]+)"/g)].length,
  "the unlinked static demonstrator covers all 16 scenarios and required reviewer fields",
);
check(
  "demonstrator_static_safety",
  !/<form\b|<iframe\b|<input\b|<img\b|<video\b/i.test(html)
    && !/localStorage|sessionStorage|document\.cookie|analytics|tracking\s*pixel/i.test(html)
    && !/<script\b[^>]*\bsrc\s*=/i.test(html)
    && !/<link\b[^>]*\brel=["']?stylesheet/i.test(html),
  "demonstrator has no form, upload, iframe, external asset, analytics, cookie or storage path",
);

const publicRouteSources = [
  ...readdirSync(join(root, "discovery-site"))
    .filter((file) => file.endsWith(".html") || file.endsWith(".xml") || file.endsWith(".txt"))
    .map((file) => read(`discovery-site/${file}`)),
  read("public/index.html"),
  ...readdirSync(join(root, ".github", "workflows"))
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .map((file) => read(`.github/workflows/${file}`)),
].join("\n");
check(
  "not_linked_or_deployed_publicly",
  !publicRouteSources.includes("supplier-bank-change-demo")
    && !publicRouteSources.includes("site/supplier-bank-change-demo.html"),
  "the local demonstrator is absent from current public pages and deployment workflows",
);

const localLinkFailures = [];
for (const sourcePath of requiredDocs) {
  const source = read(sourcePath);
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (!href || /^(?:https?:|mailto:|#)/i.test(href)) continue;
    const pathOnly = href.split("#", 1)[0];
    if (!pathOnly) continue;
    const target = normalize(join(dirname(sourcePath), pathOnly));
    if (!existsSync(join(root, target))) localLinkFailures.push(`${sourcePath}: ${href}`);
  }
}
check(
  "all_local_pack_links_exist",
  localLinkFailures.length === 0,
  localLinkFailures.length === 0
    ? "all relative links in the seven pack documents resolve locally"
    : `missing local links: ${localLinkFailures.join(", ")}`,
);

const executiveWords = read("docs/executive-decision-brief.md")
  .replace(/[`#*|>\[\]()-]/g, " ")
  .split(/\s+/)
  .filter(Boolean).length;
check(
  "executive_brief_length",
  executiveWords <= 1000,
  `executive brief is ${executiveWords} words (maximum two-page-equivalent threshold: 1000)`,
);

const packageJson = JSON.parse(read("package.json"));
check(
  "package_commands",
  packageJson.scripts?.["demo:supplier-bank-change"]?.includes("supplier-bank-change-cli.js")
    && packageJson.scripts?.["validate:enterprise-positioning-pack"]?.includes("validate-enterprise-positioning-pack.mjs")
    && `${packageJson.scripts?.posttest ?? ""}`.includes("supplier-bank-change.test.js"),
  "package exposes the local demo and validator and includes the new suite in the complete test run",
);

check(
  "publication_gate_blocked",
  read("docs/enterprise-positioning-publication-gate.md").includes("BLOCKED — REVIEW BRANCH ONLY")
    && read("docs/enterprise-positioning-publication-gate.md").includes("P3-M157 authorises publication to its named review branch only.")
    && read("docs/enterprise-positioning-publication-gate.md").includes("No external contact occurs without separate written approval from Gareth.")
    && read("docs/enterprise-positioning-publication-gate.md").includes("The main public homepage is not replaced or modified without separate mission authority."),
  "only the named review branch is authorised; merge, live-site publication, external contact and homepage replacement remain expressly blocked",
);

const valid = checks.every(({ passed }) => passed);
console.log([
  "Agent Trust Gate enterprise positioning validation pack",
  `valid: ${valid}`,
  `checks: ${checks.filter(({ passed }) => passed).length}/${checks.length} passed`,
  "",
  ...checks.map(({ id, passed, detail }) => `- ${id}: ${passed ? "pass" : "fail"} — ${detail}`),
  "",
  JSON.stringify({
    valid,
    reviewBranchOnly: true,
    scenarioCount: scenarioValues.length,
    networkAccess: false,
    externalActionPerformed: false,
    realDataUsed: false,
    livePublicationPerformed: false,
    buyerOrReviewerContacted: false,
  }, null, 2),
].join("\n"));

if (!valid) process.exitCode = 1;
