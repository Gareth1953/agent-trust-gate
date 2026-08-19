import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const root = process.cwd();
const requiredDocs = [
  "docs/controlled-enterprise-review-plan.md",
  "docs/enterprise-review-invitation-draft.md",
  "docs/reviewer-materials-index.md",
  "docs/reviewer-questionnaire.md",
  "docs/reviewer-feedback-handling.md",
  "docs/reviewer-selection-matrix.md",
  "docs/reviewer-response-scorecard.md",
];
const requiredTemplates = [
  "examples/reviewer-response-template.json",
  "examples/reviewer-validation-summary-template.json",
];
const requiredReferences = [
  "docs/executive-decision-brief.md",
  "docs/workflow-governance-assessment-offer.md",
  "docs/enterprise-positioning-publication-gate.md",
  "site/supplier-bank-change-demo.html",
  "examples/supplier-bank-change-approved.json",
  "examples/supplier-bank-change-account-mismatch.json",
  "examples/supplier-bank-change-missing-verification.json",
  "examples/supplier-bank-change-commercial-authority-refused.json",
];
const implementationFiles = [
  "src/enterprise-reviewer-pack.ts",
  "test/enterprise-reviewer-pack.test.ts",
  "scripts/validate-enterprise-reviewer-pack.mjs",
  "package.json",
];
const requiredFiles = [...requiredDocs, ...requiredTemplates, ...requiredReferences, ...implementationFiles];
const read = (path) => readFileSync(join(root, path), "utf8");
const checks = [];
const check = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

check(
  "required_files",
  requiredFiles.every((path) => existsSync(join(root, path))),
  `${requiredFiles.length} required reviewer-pack, reference and implementation files exist`,
);

const invitation = read("docs/enterprise-review-invitation-draft.md");
const draftMarker = "DRAFT — NOT APPROVED OR SENT.";
check(
  "invitations_draft_and_unsent",
  invitation.split(draftMarker).length - 1 >= 5
    && invitation.includes("not approved for posting")
    && !/invitation\s+(?:was|has been)\s+sent/i.test(invitation),
  "all four invitation variants and the file are visibly draft, unapproved and unsent",
);
check(
  "invitation_requirements",
  invitation.includes("approximately 15–20 minutes")
    && invitation.includes("local, synthetic and non-production")
    && invitation.includes("gpmiddleton71@gmail.com")
    && invitation.includes("Praise is not required")
    && /existing controls are sufficient/i.test(invitation)
    && /No confidential information is requested/i.test(invitation),
  "invitation variants retain time, maturity, candid-review, data-minimisation and approved-contact wording",
);
check(
  "no_outreach_mechanism_or_instruction",
  !/(send to all|recipient list|mail merge|bulk send|automated outreach|post (?:this|it) (?:on|to) LinkedIn|linkedin\.com)/i.test(invitation)
    && !/<form\b|fetch\s*\(|XMLHttpRequest|WebSocket|sendMail\s*\(|nodemailer|smtp\b/i.test(invitation),
  "draft contains no bulk-outreach, LinkedIn-posting, form, mail or network instruction",
);

const contentFiles = [...requiredDocs, ...requiredTemplates, "src/enterprise-reviewer-pack.ts"];
const content = contentFiles.map(read).join("\n");
const positiveProhibitedClaims = [
  "ATG is production-ready",
  "ATG prevents fraud",
  "ATG certifies authority",
  "ATG independently establishes legal authority",
  "reviewers endorsed ATG",
  "ATG passed enterprise review",
  "a company wants to buy ATG",
  "the price is validated",
  "a customer exists",
  "a paid assessment exists",
  "ATG is a business-wide platform",
];
const prohibitedFound = positiveProhibitedClaims.filter((claim) =>
  content.toLocaleLowerCase("en-GB").includes(claim.toLocaleLowerCase("en-GB"))
);
check(
  "prohibited_positive_claims_absent",
  prohibitedFound.length === 0,
  prohibitedFound.length === 0
    ? "no production, fraud-prevention, legal-authority, certification, adoption or endorsement claim is made"
    : `prohibited positive claims found: ${prohibitedFound.join(", ")}`,
);
check(
  "no_completed_review_claim",
  !/(five|5)\s+(?:human\s+)?reviewers?\s+(?:have\s+)?(?:completed|approved|endorsed|passed)/i.test(content)
    && !/(five|5)\s+reviews?\s+(?:have\s+)?(?:occurred|completed)/i.test(content),
  "pack does not claim that five reviews occurred or passed",
);

const responseTemplate = JSON.parse(read("examples/reviewer-response-template.json"));
const summaryTemplate = JSON.parse(read("examples/reviewer-validation-summary-template.json"));
check(
  "templates_empty_and_synthetic",
  responseTemplate.reviewerId === null
    && responseTemplate.reviewerCategory === null
    && responseTemplate.organisationType === null
    && responseTemplate.result === null
    && responseTemplate.personalDataIncluded === false
    && summaryTemplate.reviewsOccurred === false
    && summaryTemplate.eligibleCount === 0
    && summaryTemplate.passes === 0
    && summaryTemplate.overallResult === "NOT_RUN"
    && summaryTemplate.decision === null
    && summaryTemplate.reviewerSlots.every((slot) =>
      slot.reviewerId === null && slot.eligible === null && slot.reviewCompleted === false && slot.result === null
    ),
  "templates contain no reviewer identity or purported result",
);
check(
  "five_blank_reviewer_slots",
  summaryTemplate.reviewerSlots.length === 5
    && new Set(summaryTemplate.reviewerSlots.map(({ requiredCategory }) => requiredCategory)).size === 5,
  "summary has five empty, distinct required-perspective slots",
);

const selectionMatrix = read("docs/reviewer-selection-matrix.md");
check(
  "selection_matrix_unpopulated",
  selectionMatrix.includes("NO REVIEWER SELECTED, APPROVED OR CONTACTED")
    && (selectionMatrix.match(/^\|  \|  \|/gm) ?? []).length === 5,
  "selection matrix has five blank rows and no invented reviewer",
);

const permittedPersonalContact = "gpmiddleton71@gmail.com";
const emailAddresses = [...content.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(([value]) => value);
check(
  "no_unapproved_personal_information",
  emailAddresses.every((address) => address.toLocaleLowerCase("en-GB") === permittedPersonalContact)
    && !/"reviewerName"\s*:|"organisationName"\s*:|"phone"\s*:/i.test(content),
  "the only contact detail is Gareth's approved public business address; templates have no name, employer or phone fields",
);

const sensitivePatterns = [
  /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
  /\b\d{2}[- ]\d{2}[- ]\d{2}\b/g,
  /\b(?:api[_-]?key|client[_-]?secret|private[_-]?key|password)\s*[:=]\s*["'][^"']+["']/gi,
];
check(
  "no_bank_or_secret_values",
  sensitivePatterns.every((pattern) => !pattern.test(content)),
  "reviewer pack contains no IBAN, sort code, credential or secret value",
);

const price = "£5,000–£10,000 plus VAT where applicable";
const priceLabel = "ESTIMATED AND NOT YET MARKET-VALIDATED.";
const pricingFiles = [
  "docs/controlled-enterprise-review-plan.md",
  "docs/reviewer-materials-index.md",
  "docs/reviewer-questionnaire.md",
  "docs/reviewer-response-scorecard.md",
];
check(
  "pricing_estimated_and_unvalidated",
  pricingFiles.every((path) => read(path).includes(price) && read(path).includes(priceLabel)),
  "every reviewer-pack pricing reference uses the approved range and estimated/unvalidated label",
);

const cta = "Request a scoped workflow-governance assessment.";
const ctaFiles = [
  "docs/controlled-enterprise-review-plan.md",
  "docs/reviewer-materials-index.md",
  "docs/reviewer-questionnaire.md",
  "docs/reviewer-response-scorecard.md",
];
check(
  "primary_cta_consistent",
  ctaFiles.every((path) => read(path).includes(cta))
    && !/(book|buy|purchase|order) (?:an?|the) (?:assessment|demo|call)/i.test(content),
  "the controlled materials use only the approved primary call to action",
);

const plan = read("docs/controlled-enterprise-review-plan.md");
const scorecard = read("docs/reviewer-response-scorecard.md");
const model = read("src/enterprise-reviewer-pack.ts");
check(
  "pass_rule_consistent",
  [plan, scorecard].every((source) =>
    source.includes("five relevant, distinct human reviewers") || source.includes("exactly five distinct eligible humans")
  )
    && [plan, scorecard].every((source) => source.includes("at least four of five"))
    && [plan, scorecard].every((source) => source.includes("at least three"))
    && model.includes("CONTROLLED_REVIEW_REQUIRED_ELIGIBLE_COUNT = 5")
    && model.includes("CONTROLLED_REVIEW_COMPREHENSION_THRESHOLD = 4")
    && model.includes("CONTROLLED_REVIEW_COMMERCIAL_SIGNAL_THRESHOLD = 3")
    && summaryTemplate.comprehensionThreshold.required === 4
    && summaryTemplate.commercialSignalThreshold.required === 3,
  "documents, empty summary and deterministic model encode the same five/four/three thresholds",
);

const materials = read("docs/reviewer-materials-index.md");
const preservedClaims = [
  "Configured evidence shows that the organisation’s independent-verification step was completed; ATG does not determine whether the bank details are correct.",
  "configured evidence of current organisational authority for this exact action.",
  "ATG does not independently establish legal authority.",
];
check(
  "claims_boundaries_preserved",
  preservedClaims.every((claim) => materials.includes(claim)),
  "bank-detail correctness, configured organisational authority and legal-authority boundaries are preserved verbatim",
);

const sourceSafety = [
  read("src/enterprise-reviewer-pack.ts"),
  read("test/enterprise-reviewer-pack.test.ts"),
].join("\n");
check(
  "implementation_has_no_external_capability",
  !/from ["'](?:node:)?(?:http|https|net|dns|tls|dgram)|fetch\s*\(|XMLHttpRequest|WebSocket|sendMail\s*\(|nodemailer|smtp\b|<form\b/i.test(sourceSafety),
  "model and tests contain no network, DNS, mail, browser, API or form capability",
);
check(
  "no_external_action",
  model.includes("contactPerformed: false")
    && model.includes("externalActionOccurred: false")
    && responseTemplate.contactPerformed === false
    && responseTemplate.externalActionOccurred === false
    && summaryTemplate.contactPerformed === false
    && summaryTemplate.externalActionOccurred === false,
  "model and empty templates fix contact and external-action state to false",
);

const linkFailures = [];
for (const sourcePath of requiredDocs) {
  const source = read(sourcePath);
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (!href || /^(?:https?:|mailto:|#)/i.test(href)) continue;
    const pathOnly = href.split("#", 1)[0];
    if (!pathOnly) continue;
    const target = normalize(join(dirname(sourcePath), pathOnly));
    if (!existsSync(join(root, target))) linkFailures.push(`${sourcePath}: ${href}`);
  }
}
check(
  "local_links_resolve",
  linkFailures.length === 0,
  linkFailures.length === 0 ? "all reviewer-pack local links resolve" : linkFailures.join(", "),
);

const packageJson = JSON.parse(read("package.json"));
check(
  "package_commands",
  `${packageJson.scripts?.posttest ?? ""}`.includes("enterprise-reviewer-pack.test.js")
    && `${packageJson.scripts?.["test:enterprise-reviewer-pack"] ?? ""}`.includes("enterprise-reviewer-pack.test.js")
    && `${packageJson.scripts?.["validate:enterprise-reviewer-pack"] ?? ""}`.includes("validate-enterprise-reviewer-pack.mjs"),
  "full test run and dedicated reviewer test/validator commands are wired",
);

const valid = checks.every(({ passed }) => passed);
console.log([
  "Agent Trust Gate controlled enterprise reviewer validation pack",
  `valid: ${valid}`,
  `checks: ${checks.filter(({ passed }) => passed).length}/${checks.length} passed`,
  "",
  ...checks.map(({ id, passed, detail }) => `- ${id}: ${passed ? "pass" : "fail"} — ${detail}`),
  "",
  JSON.stringify({
    valid,
    reviewBranchOnly: true,
    reviewerSelected: false,
    invitationApproved: false,
    invitationSent: false,
    reviewsOccurred: false,
    realReviewerDataUsed: false,
    networkAccess: false,
    contactPerformed: false,
    externalActionOccurred: false,
    livePublicationPerformed: false,
  }, null, 2),
].join("\n"));

if (!valid) process.exitCode = 1;
