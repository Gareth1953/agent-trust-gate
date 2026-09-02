import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";

export const DEMO_VERSION = "P3-M153-v1";
export const FIXED_ISSUED_AT = "2026-07-31T18:00:00.000Z";
export const FIXED_VALIDATION_AT = "2026-07-31T18:02:00.000Z";

const DEMO_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJbXTkK/IG1n1NMzOBhKfX657cPBMOzEsToIs+fHlU0a
-----END PRIVATE KEY-----
`;

export const DEMO_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAvkswB2EG8RrGJqk6/3sSVRpV7tH/OyioqEC5CdaFTPs=
-----END PUBLIC KEY-----
`;

const EMPLOYEES = Object.freeze({
  "EMP-NORTHSTAR-0042": {
    employeeId: "EMP-NORTHSTAR-0042",
    displayName: "Alex Morgan",
    role: "Procurement Director",
    department: "Procurement",
    organisationId: "ORG-NORTHSTAR-RETAIL-SYNTHETIC",
    organisationName: "Northstar Retail Ltd",
    appointmentStatus: "active",
    status: "active",
    permissions: {
      purchase: {
        currency: "GBP",
        maxAmount: 25000,
        department: "Procurement",
        jurisdiction: "GB",
        riskTiers: ["medium"],
        permittedSuppliers: ["SUP-HARBOUR-001"],
        permittedCategories: ["product_x"],
      },
    },
  },
  "EMP-NORTHSTAR-0091": {
    employeeId: "EMP-NORTHSTAR-0091",
    displayName: "Jordan Lee",
    role: "Procurement Analyst",
    department: "Procurement",
    organisationId: "ORG-NORTHSTAR-RETAIL-SYNTHETIC",
    organisationName: "Northstar Retail Ltd",
    appointmentStatus: "active",
    status: "active",
    permissions: {
      supplier_research: { currency: "GBP", maxAmount: 0 },
    },
  },
  "EMP-1007": {
    employeeId: "EMP-1007",
    displayName: "Sarah Collins",
    role: "Senior Returns Supervisor",
    department: "Retail Operations",
    status: "active",
    permissions: {
      refund: { currency: "GBP", maxAmount: 1000 },
      exchange: { currency: "GBP", maxAmount: 1500 },
      credit_note: { currency: "GBP", maxAmount: 2500 },
    },
  },
  "EMP-2044": {
    employeeId: "EMP-2044",
    displayName: "Daniel Reed",
    role: "Finance Manager",
    department: "Finance",
    status: "active",
    permissions: {
      refund: { currency: "GBP", maxAmount: 5000 },
      repayment: { currency: "GBP", maxAmount: 10000 },
      credit_note: { currency: "GBP", maxAmount: 5000 },
      write_off: { currency: "GBP", maxAmount: 2500 },
    },
  },
  "EMP-3901": {
    employeeId: "EMP-3901",
    displayName: "Aisha Khan",
    role: "Senior Finance Director",
    department: "Finance",
    status: "active",
    permissions: {
      refund: { currency: "GBP", maxAmount: 50000 },
      repayment: { currency: "GBP", maxAmount: 50000 },
      credit_note: { currency: "GBP", maxAmount: 50000 },
      write_off: { currency: "GBP", maxAmount: 25000 },
    },
  },
  "EMP-7780": {
    employeeId: "EMP-7780",
    displayName: "Martin Hughes",
    role: "Former Returns Supervisor",
    department: "Retail Operations",
    status: "inactive",
    permissions: {
      refund: { currency: "GBP", maxAmount: 1000 },
    },
  },
});

const AUTHENTICATIONS = Object.freeze({
  "AUTH-NORTHSTAR-ALEX-001": {
    employeeId: "EMP-NORTHSTAR-0042",
    status: "verified",
    method: "organisation_passkey_fixture",
    phishingResistant: true,
    userPresence: true,
    userVerification: true,
    assurance: "high_demo_fixture",
  },
  "AUTH-NORTHSTAR-JORDAN-001": {
    employeeId: "EMP-NORTHSTAR-0091",
    status: "verified",
    method: "organisation_security_key_fixture",
    phishingResistant: true,
    userPresence: true,
    userVerification: true,
    assurance: "high_demo_fixture",
  },
  "AUTH-SARAH-001": {
    employeeId: "EMP-1007",
    status: "verified",
    method: "organisation_passkey_fixture",
    phishingResistant: true,
    userPresence: true,
    userVerification: true,
    assurance: "high_demo_fixture",
  },
  "AUTH-DANIEL-001": {
    employeeId: "EMP-2044",
    status: "verified",
    method: "organisation_security_key_fixture",
    phishingResistant: true,
    userPresence: true,
    userVerification: true,
    assurance: "high_demo_fixture",
  },
  "AUTH-AISHA-001": {
    employeeId: "EMP-3901",
    status: "verified",
    method: "organisation_smart_card_fixture",
    phishingResistant: true,
    userPresence: true,
    userVerification: true,
    assurance: "high_demo_fixture",
  },
  "AUTH-MARTIN-001": {
    employeeId: "EMP-7780",
    status: "verified",
    method: "organisation_passkey_fixture",
    phishingResistant: true,
    userPresence: true,
    userVerification: true,
    assurance: "high_demo_fixture",
  },
});

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getHumanAuthorityFixture(employeeId, authId) {
  const employee = EMPLOYEES[employeeId];
  const authentication = AUTHENTICATIONS[authId];
  return {
    employee: employee ? deepClone(employee) : null,
    authentication: authentication ? deepClone(authentication) : null,
  };
}

export function canonicalize(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(",")}}`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function minutesAfter(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function signObject(unsignedObject) {
  const payload = Buffer.from(canonicalize(unsignedObject), "utf8");
  const signature = sign(
    null,
    payload,
    createPrivateKey(DEMO_PRIVATE_KEY_PEM),
  ).toString("base64");

  return {
    ...unsignedObject,
    integrity: {
      suite: "Ed25519-local-fixture-v1",
      keyId: "atg-human-authority-demo-key-2026-01",
      signature,
      warning:
        "Public local-demo fixture key only. Not production key custody or a post-quantum signature.",
    },
  };
}

export function verifySignedObject(signedObject) {
  const { integrity, ...unsignedObject } = signedObject;
  if (!integrity?.signature) return false;
  return verify(
    null,
    Buffer.from(canonicalize(unsignedObject), "utf8"),
    createPublicKey(DEMO_PUBLIC_KEY_PEM),
    Buffer.from(integrity.signature, "base64"),
  );
}

const BASE_ACTION = Object.freeze({
  actionId: "ACT-REFUND-77291",
  type: "refund",
  amount: 475,
  currency: "GBP",
  orderId: "ORD-77291",
  customerRef: "CUST-1842",
  destination: "original_payment_method:visa_4921",
  reasonCode: "returned_defective_item",
  evidenceRefs: [
    "RETURN-AUTH-77291",
    "WAREHOUSE-RECEIPT-8831",
    "INSPECTION-PASSED-8831",
  ],
  requestedBy: "AGENT-RETURNS-17",
  accountRef: "UK-RETAIL-RETURNS",
  jurisdiction: "GB",
  requiresIndependentApproval: true,
  secondApprovalRequiredAbove: 750,
});

export const SCENARIOS = Object.freeze([
  {
    id: "authorised_refund",
    title: "Authorised £475 refund",
    expected: "allowed",
    action: BASE_ACTION,
    approverId: "EMP-1007",
    authId: "AUTH-SARAH-001",
    validationAt: FIXED_VALIDATION_AT,
  },
  {
    id: "authorised_credit_note",
    title: "Authorised £1,250 credit note",
    expected: "allowed",
    action: {
      ...BASE_ACTION,
      actionId: "ACT-CREDIT-4822",
      type: "credit_note",
      amount: 1250,
      orderId: "ORD-93011",
      invoiceId: "INV-4822",
      destination: "customer_account:CUST-6401",
      reasonCode: "pricing_correction",
      accountRef: "UK-TRADE-CREDIT",
      requestedBy: "AGENT-FINANCE-09",
      secondApprovalRequiredAbove: 3000,
    },
    approverId: "EMP-1007",
    authId: "AUTH-SARAH-001",
    validationAt: FIXED_VALIDATION_AT,
  },
  {
    id: "inactive_employee_refused",
    title: "Inactive employee blocked",
    expected: "refused",
    expectedCode: "IDENTITY_INACTIVE",
    action: BASE_ACTION,
    approverId: "EMP-7780",
    authId: "AUTH-MARTIN-001",
    validationAt: FIXED_VALIDATION_AT,
  },
  {
    id: "authority_limit_refused",
    title: "Refund above authority limit blocked",
    expected: "refused",
    expectedCode: "AUTHORITY_LIMIT_EXCEEDED",
    action: {
      ...BASE_ACTION,
      actionId: "ACT-REFUND-77292",
      amount: 1200,
    },
    approverId: "EMP-1007",
    authId: "AUTH-SARAH-001",
    validationAt: FIXED_VALIDATION_AT,
  },
  {
    id: "self_approval_refused",
    title: "Restricted self-approval blocked",
    expected: "refused",
    expectedCode: "SEPARATION_OF_DUTIES_FAILED",
    action: {
      ...BASE_ACTION,
      actionId: "ACT-REFUND-77293",
      requestedBy: "EMP-1007",
    },
    approverId: "EMP-1007",
    authId: "AUTH-SARAH-001",
    validationAt: FIXED_VALIDATION_AT,
  },
  {
    id: "dual_approval_missing_refused",
    title: "Missing second approver blocked",
    expected: "refused",
    expectedCode: "SECOND_APPROVER_REQUIRED",
    action: {
      ...BASE_ACTION,
      actionId: "ACT-REPAYMENT-5510",
      type: "repayment",
      amount: 7500,
      orderId: "ORD-5510",
      destination: "original_payment_method:bank_transfer_2201",
      accountRef: "UK-FINANCE-REPAYMENTS",
      secondApprovalRequiredAbove: 5000,
    },
    approverId: "EMP-2044",
    authId: "AUTH-DANIEL-001",
    validationAt: FIXED_VALIDATION_AT,
  },
  {
    id: "changed_action_refused",
    title: "Changed amount after approval blocked",
    expected: "refused",
    expectedCode: "EXACT_ACTION_MISMATCH",
    action: BASE_ACTION,
    executionActionPatch: { amount: 975 },
    approverId: "EMP-1007",
    authId: "AUTH-SARAH-001",
    validationAt: FIXED_VALIDATION_AT,
  },
  {
    id: "expired_approval_refused",
    title: "Expired human approval blocked",
    expected: "refused",
    expectedCode: "HUMAN_PROOF_EXPIRED",
    action: BASE_ACTION,
    approverId: "EMP-1007",
    authId: "AUTH-SARAH-001",
    validationAt: "2026-07-31T18:06:00.000Z",
  },
  {
    id: "replayed_approval_refused",
    title: "Replayed approval blocked",
    expected: "refused",
    expectedCode: "HUMAN_PROOF_REPLAYED",
    action: BASE_ACTION,
    approverId: "EMP-1007",
    authId: "AUTH-SARAH-001",
    validationAt: FIXED_VALIDATION_AT,
    nonceState: "consumed",
  },
  {
    id: "dual_approval_allowed",
    title: "Two authorised humans approve £7,500 repayment",
    expected: "allowed",
    action: {
      ...BASE_ACTION,
      actionId: "ACT-REPAYMENT-5511",
      type: "repayment",
      amount: 7500,
      orderId: "ORD-5511",
      destination: "original_payment_method:bank_transfer_2201",
      accountRef: "UK-FINANCE-REPAYMENTS",
      secondApprovalRequiredAbove: 5000,
    },
    approverId: "EMP-2044",
    authId: "AUTH-DANIEL-001",
    secondApproverId: "EMP-3901",
    secondAuthId: "AUTH-AISHA-001",
    validationAt: FIXED_VALIDATION_AT,
  },
]);

function refusal(scenario, actionDigest, checks, code, message) {
  return {
    demoVersion: DEMO_VERSION,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    expected: scenario.expected,
    observed: "refused",
    matchedExpectation: scenario.expected === "refused",
    decision: {
      outcome: "REFUSED",
      code,
      message,
    },
    canonicalActionDigest: actionDigest,
    checks,
    humanAuthorityProof: null,
    gatePass: null,
    executionReceipt: null,
    safetyBoundary: "local_synthetic_no_real_action",
  };
}

function checkApprover({
  employeeId,
  authId,
  action,
  label,
}) {
  const employee = EMPLOYEES[employeeId];
  const authentication = AUTHENTICATIONS[authId];

  if (!employee) {
    return { ok: false, code: "IDENTITY_UNKNOWN", message: `${label} identity is unknown.` };
  }
  if (employee.status !== "active") {
    return { ok: false, code: "IDENTITY_INACTIVE", message: `${label} identity is not active.` };
  }
  if (
    !authentication ||
    authentication.employeeId !== employeeId ||
    authentication.status !== "verified" ||
    !authentication.userPresence ||
    !authentication.userVerification
  ) {
    return {
      ok: false,
      code: "AUTHENTICATION_NOT_VERIFIED",
      message: `${label} authentication evidence is not verified.`,
    };
  }

  const permission = employee.permissions[action.type];
  if (!permission) {
    return {
      ok: false,
      code: "ACTION_TYPE_NOT_AUTHORISED",
      message: `${label} is not authorised for ${action.type}.`,
    };
  }
  if (permission.currency !== action.currency) {
    return {
      ok: false,
      code: "CURRENCY_NOT_AUTHORISED",
      message: `${label} authority does not cover ${action.currency}.`,
    };
  }
  if (action.amount > permission.maxAmount) {
    return {
      ok: false,
      code: "AUTHORITY_LIMIT_EXCEEDED",
      message: `${label} limit is ${permission.currency} ${permission.maxAmount}; requested amount is ${action.currency} ${action.amount}.`,
    };
  }
  if (permission.department && permission.department !== action.department) {
    return {
      ok: false,
      code: "DEPARTMENT_NOT_AUTHORISED",
      message: `${label} authority does not cover department ${action.department}.`,
    };
  }
  if (permission.jurisdiction && permission.jurisdiction !== action.jurisdiction) {
    return {
      ok: false,
      code: "JURISDICTION_NOT_AUTHORISED",
      message: `${label} authority does not cover jurisdiction ${action.jurisdiction}.`,
    };
  }
  if (permission.riskTiers && !permission.riskTiers.includes(action.riskTier)) {
    return {
      ok: false,
      code: "RISK_TIER_NOT_AUTHORISED",
      message: `${label} authority does not cover risk tier ${action.riskTier}.`,
    };
  }
  if (permission.permittedSuppliers && !permission.permittedSuppliers.includes(action.supplierId)) {
    return {
      ok: false,
      code: "SUPPLIER_NOT_AUTHORISED",
      message: `${label} authority does not cover supplier ${action.supplierId}.`,
    };
  }
  if (permission.permittedCategories && !permission.permittedCategories.includes(action.category)) {
    return {
      ok: false,
      code: "CATEGORY_NOT_AUTHORISED",
      message: `${label} authority does not cover category ${action.category}.`,
    };
  }

  return {
    ok: true,
    employee,
    authentication,
    permission,
  };
}

export function runScenario(inputScenario) {
  const scenario = deepClone(inputScenario);
  const action = scenario.action;
  const actionDigest = sha256(canonicalize(action));
  const checks = [];

  const first = checkApprover({
    employeeId: scenario.approverId,
    authId: scenario.authId,
    action,
    label: "Primary approver",
  });
  checks.push({
    check: "primary_identity_authentication_and_authority",
    passed: first.ok,
    detail: first.ok
      ? `${first.employee.displayName} is active, strongly authenticated and authorised up to ${first.permission.currency} ${first.permission.maxAmount}.`
      : first.message,
  });
  if (!first.ok) {
    return refusal(scenario, actionDigest, checks, first.code, first.message);
  }

  if (
    action.requiresIndependentApproval &&
    action.requestedBy === scenario.approverId
  ) {
    checks.push({
      check: "separation_of_duties",
      passed: false,
      detail: "The restricted action requester cannot approve their own action.",
    });
    return refusal(
      scenario,
      actionDigest,
      checks,
      "SEPARATION_OF_DUTIES_FAILED",
      "The restricted action requester cannot approve their own action.",
    );
  }
  checks.push({
    check: "separation_of_duties",
    passed: true,
    detail: "Requester and primary approver are independent.",
  });

  const requiresSecond =
    Number.isFinite(action.secondApprovalRequiredAbove) &&
    action.amount > action.secondApprovalRequiredAbove;

  let second = null;
  if (requiresSecond) {
    if (!scenario.secondApproverId || !scenario.secondAuthId) {
      checks.push({
        check: "second_approver",
        passed: false,
        detail: `A second authorised human is required above ${action.currency} ${action.secondApprovalRequiredAbove}.`,
      });
      return refusal(
        scenario,
        actionDigest,
        checks,
        "SECOND_APPROVER_REQUIRED",
        "A second independently authorised human approval is required.",
      );
    }

    if (scenario.secondApproverId === scenario.approverId) {
      checks.push({
        check: "second_approver",
        passed: false,
        detail: "The second approver must be a different natural person.",
      });
      return refusal(
        scenario,
        actionDigest,
        checks,
        "SECOND_APPROVER_NOT_INDEPENDENT",
        "The second approver must be a different natural person.",
      );
    }

    second = checkApprover({
      employeeId: scenario.secondApproverId,
      authId: scenario.secondAuthId,
      action,
      label: "Second approver",
    });
    checks.push({
      check: "second_approver",
      passed: second.ok,
      detail: second.ok
        ? `${second.employee.displayName} independently passed identity, authentication and authority checks.`
        : second.message,
    });
    if (!second.ok) {
      return refusal(scenario, actionDigest, checks, second.code, second.message);
    }
  } else {
    checks.push({
      check: "second_approver",
      passed: true,
      detail: "No second approver is required at this value threshold.",
    });
  }

  const proofIssuedAt = scenario.authorityIssuedAt ?? FIXED_ISSUED_AT;
  const proofExpiresAt = scenario.authorityExpiresAt ?? minutesAfter(proofIssuedAt, 5);
  const proofNonce = `hap-${scenario.id}-nonce-v1`;
  const humanAuthorityProofUnsigned = {
    type: "ATG_HUMAN_AUTHORITY_PROOF",
    version: "1.0",
    proofId: `HAP-${scenario.id.toUpperCase()}`,
    organisationId: scenario.organisationId ?? first.employee.organisationId ?? "ORG-DEMO-RETAIL-001",
    organisationName: scenario.organisationName ?? first.employee.organisationName ?? "Synthetic Demo Organisation",
    policyId: scenario.authorityPolicyId ?? "POLICY-HUMAN-AUTHORITY-DEMO-1",
    policyVersion: scenario.authorityPolicyVersion ?? "2026-07-31",
    actionDigest,
    actionType: action.type,
    amount: action.amount,
    currency: action.currency,
    accountRef: action.accountRef,
    jurisdiction: action.jurisdiction,
    decision: "APPROVED",
    primaryApprover: {
      employeeId: first.employee.employeeId,
      displayName: first.employee.displayName,
      role: first.employee.role,
      department: first.employee.department,
      status: first.employee.status,
      authentication: first.authentication,
      authorityLimit: first.permission,
    },
    secondApprover: second
      ? {
          employeeId: second.employee.employeeId,
          displayName: second.employee.displayName,
          role: second.employee.role,
          department: second.employee.department,
          status: second.employee.status,
          authentication: second.authentication,
          authorityLimit: second.permission,
        }
      : null,
    separationOfDuties: "passed",
    issuedAt: proofIssuedAt,
    expiresAt: proofExpiresAt,
    nonce: proofNonce,
    nonceState: scenario.nonceState ?? "unused",
    claimsBoundary:
      "Synthetic local demonstrator. No real identity provider, employee database, WebAuthn ceremony, payment, refund or post-quantum signature.",
  };

  const humanAuthorityProof = signObject(humanAuthorityProofUnsigned);
  const proofSignatureValid = verifySignedObject(humanAuthorityProof);
  checks.push({
    check: "human_authority_proof_signature",
    passed: proofSignatureValid,
    detail: proofSignatureValid
      ? "The local fixture signature verifies over the exact Human Authority Proof."
      : "The Human Authority Proof signature did not verify.",
  });
  if (!proofSignatureValid) {
    return refusal(
      scenario,
      actionDigest,
      checks,
      "HUMAN_PROOF_SIGNATURE_INVALID",
      "The Human Authority Proof signature did not verify.",
    );
  }

  const validationAt = scenario.validationAt ?? FIXED_VALIDATION_AT;
  if (new Date(validationAt).getTime() > new Date(proofExpiresAt).getTime()) {
    checks.push({
      check: "human_authority_proof_freshness",
      passed: false,
      detail: `Proof expired at ${proofExpiresAt}; validation occurred at ${validationAt}.`,
    });
    return {
      ...refusal(
        scenario,
        actionDigest,
        checks,
        "HUMAN_PROOF_EXPIRED",
        "The Human Authority Proof expired before GatePass verification.",
      ),
      humanAuthorityProof,
    };
  }
  checks.push({
    check: "human_authority_proof_freshness",
    passed: true,
    detail: "The Human Authority Proof is within its verifier-owned validity window.",
  });

  if (humanAuthorityProof.nonceState !== "unused") {
    checks.push({
      check: "human_authority_proof_replay",
      passed: false,
      detail: `Nonce state is ${humanAuthorityProof.nonceState}, not unused.`,
    });
    return {
      ...refusal(
        scenario,
        actionDigest,
        checks,
        "HUMAN_PROOF_REPLAYED",
        "The Human Authority Proof nonce has already been consumed.",
      ),
      humanAuthorityProof,
    };
  }
  checks.push({
    check: "human_authority_proof_replay",
    passed: true,
    detail: "The Human Authority Proof nonce is unused.",
  });

  if (scenario.authorityOnly === true) {
    return {
      demoVersion: DEMO_VERSION,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      expected: scenario.expected,
      observed: "allowed",
      matchedExpectation: scenario.expected === "allowed",
      decision: {
        outcome: "ALLOWED",
        code: "VERIFIED_HUMAN_AUTHORITY",
        message:
          "Verified natural-person identity, authentication, appointment status and bounded business authority passed.",
      },
      canonicalActionDigest: actionDigest,
      checks,
      humanAuthorityProof,
      gatePass: null,
      executionReceipt: null,
      safetyBoundary: "local_synthetic_no_real_action",
    };
  }

  const humanProofDigest = sha256(canonicalize(humanAuthorityProof));
  const gatePassUnsigned = {
    type: "ATG_GATEPASS",
    version: "P3-M153-demo-1",
    gatePassId: `GP-${scenario.id.toUpperCase()}`,
    actionDigest,
    humanAuthorityProofDigest: humanProofDigest,
    issuedAt: validationAt,
    expiresAt: minutesAfter(validationAt, 2),
    nonce: `gp-${scenario.id}-nonce-v1`,
    status: "issued",
    executionMode: "simulated_only",
  };
  const gatePass = signObject(gatePassUnsigned);
  checks.push({
    check: "gatepass_signature",
    passed: verifySignedObject(gatePass),
    detail: "The local fixture GatePass signature verifies.",
  });

  const executionAction = {
    ...action,
    ...(scenario.executionActionPatch ?? {}),
  };
  const executionActionDigest = sha256(canonicalize(executionAction));

  if (executionActionDigest !== gatePass.actionDigest) {
    checks.push({
      check: "exact_action_binding",
      passed: false,
      detail: `Approved digest ${gatePass.actionDigest} does not match execution digest ${executionActionDigest}.`,
    });
    return {
      ...refusal(
        scenario,
        actionDigest,
        checks,
        "EXACT_ACTION_MISMATCH",
        "The action changed after human approval, so execution is blocked.",
      ),
      humanAuthorityProof,
      gatePass,
    };
  }
  checks.push({
    check: "exact_action_binding",
    passed: true,
    detail: "The execution request exactly matches the human-approved canonical action.",
  });

  const executionReceiptUnsigned = {
    type: "ATG_EXECUTION_RECEIPT",
    version: "P3-M153-demo-1",
    receiptId: `EXEC-${scenario.id.toUpperCase()}`,
    gatePassId: gatePass.gatePassId,
    humanAuthorityProofId: humanAuthorityProof.proofId,
    actionDigest: executionActionDigest,
    outcome: "SIMULATED_EXECUTION_COMPLETED",
    executedAt: minutesAfter(validationAt, 1),
    externalSideEffect: false,
    warning:
      "Demonstration receipt only. No real refund, repayment, credit note, exchange or external action occurred.",
  };
  const executionReceipt = signObject(executionReceiptUnsigned);

  checks.push({
    check: "execution_receipt_signature",
    passed: verifySignedObject(executionReceipt),
    detail: "The separate simulated execution receipt signature verifies.",
  });

  return {
    demoVersion: DEMO_VERSION,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    expected: scenario.expected,
    observed: "allowed",
    matchedExpectation: scenario.expected === "allowed",
    decision: {
      outcome: "ALLOWED",
      code: "VERIFIED_HUMAN_AUTHORITY",
      message:
        "Verified natural-person identity, authentication, business authority and exact-action binding passed.",
    },
    canonicalActionDigest: actionDigest,
    checks,
    humanAuthorityProof,
    gatePass,
    executionReceipt,
    safetyBoundary: "local_synthetic_no_real_action",
  };
}

export function runAllScenarios() {
  return SCENARIOS.map(runScenario);
}

export function createSummary(results) {
  return {
    demoVersion: DEMO_VERSION,
    total: results.length,
    matched: results.filter((result) => result.matchedExpectation).length,
    allowed: results.filter((result) => result.observed === "allowed").length,
    refused: results.filter((result) => result.observed === "refused").length,
    allMatched: results.every((result) => result.matchedExpectation),
  };
}
