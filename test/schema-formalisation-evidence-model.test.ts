import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { createLocalGatePassAuditReceipt } from "../src/local-gate-pass-receipt.js";
import { verifyLocalTrustReceipt } from "../src/local-trust-receipt-verifier.js";
import type { LocalGatePassDemoInput } from "../src/local-gate-pass-demo.js";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type JsonSchema = Record<string, unknown>;

const requestSchemaPath = "schemas/local-agent-action-request.schema.json";
const receiptSchemaPath = "schemas/local-trust-receipt.schema.json";
const proofSchemaPath = "schemas/local-money-gate-proof.schema.json";
const evidenceDocPath = "docs/schema-formalisation-and-evidence-model.md";

function readJson<T = JsonValue>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function schema(path: string): JsonSchema {
  return readJson<JsonSchema>(path);
}

function errorsFor(schemaValue: JsonSchema, value: unknown, path = "$"): string[] {
  const errors: string[] = [];

  if (Array.isArray(schemaValue.oneOf)) {
    const passed = schemaValue.oneOf.filter((candidate) =>
      errorsFor(candidate as JsonSchema, value, path).length === 0
    );
    if (passed.length !== 1) errors.push(`${path} must match exactly one schema`);
    return errors;
  }

  if (Object.hasOwn(schemaValue, "const") && value !== schemaValue.const) {
    errors.push(`${path} must equal ${String(schemaValue.const)}`);
  }
  if (Array.isArray(schemaValue.enum) && !schemaValue.enum.includes(value)) {
    errors.push(`${path} must be one of ${schemaValue.enum.join(", ")}`);
  }

  const type = schemaValue.type;
  if (type === "null") {
    if (value !== null) errors.push(`${path} must be null`);
    return errors;
  }
  if (type === "object") {
    if (!isRecord(value)) {
      errors.push(`${path} must be object`);
      return errors;
    }
    const properties = isRecord(schemaValue.properties) ? schemaValue.properties : {};
    for (const field of schemaValue.required as string[] | undefined ?? []) {
      if (!Object.hasOwn(value, field)) errors.push(`${path}.${field} is required`);
    }
    if (schemaValue.additionalProperties === false) {
      for (const field of Object.keys(value)) {
        if (!Object.hasOwn(properties, field)) errors.push(`${path}.${field} is not allowed`);
      }
    }
    for (const [field, childSchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, field)) {
        errors.push(...errorsFor(childSchema as JsonSchema, value[field], `${path}.${field}`));
      }
    }
  } else if (type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be array`);
      return errors;
    }
    const itemSchema = schemaValue.items as JsonSchema | undefined;
    if (itemSchema !== undefined) {
      value.forEach((item, index) => errors.push(...errorsFor(itemSchema, item, `${path}[${index}]`)));
    }
    if (schemaValue.uniqueItems === true && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${path} must contain unique items`);
    }
  } else if (type === "string") {
    if (typeof value !== "string") {
      errors.push(`${path} must be string`);
    } else {
      if (typeof schemaValue.minLength === "number" && value.length < schemaValue.minLength) {
        errors.push(`${path} is too short`);
      }
      if (typeof schemaValue.pattern === "string" && !new RegExp(schemaValue.pattern).test(value)) {
        errors.push(`${path} does not match pattern`);
      }
      if (schemaValue.format === "date-time" && Number.isNaN(Date.parse(value))) {
        errors.push(`${path} must be date-time`);
      }
    }
  } else if (type === "boolean" && typeof value !== "boolean") {
    errors.push(`${path} must be boolean`);
  } else if (type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${path} must be number`);
    if (typeof value === "number") checkNumericBounds(schemaValue, value, path, errors);
  } else if (type === "integer") {
    if (!Number.isInteger(value)) errors.push(`${path} must be integer`);
    if (typeof value === "number") checkNumericBounds(schemaValue, value, path, errors);
  }

  return errors;
}

function checkNumericBounds(schemaValue: JsonSchema, value: number, path: string, errors: string[]): void {
  if (typeof schemaValue.minimum === "number" && value < schemaValue.minimum) {
    errors.push(`${path} is below minimum`);
  }
  if (typeof schemaValue.maximum === "number" && value > schemaValue.maximum) {
    errors.push(`${path} is above maximum`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

test("schema formalisation document and README link exist", () => {
  assert.equal(existsSync(evidenceDocPath), true);
  const readme = readFileSync("README.md", "utf8");
  assert.match(readme, /docs\/schema-formalisation-and-evidence-model\.md/);
  const doc = readFileSync(evidenceDocPath, "utf8");
  assert.match(doc, /No mandate\. No evidence\. No verified intent\. No signed gate pass\. No settlement\./);
  assert.match(doc, /not production cryptographic signing/i);
  assert.match(doc, /P3-M117/i);
});

test("hardened schemas require mandate evidence verified intent proof metadata freshness and local-only fields", () => {
  const request = schema(requestSchemaPath);
  const receipt = schema(receiptSchemaPath);
  const proof = schema(proofSchemaPath);

  for (const field of [
    "schema_version",
    "request_id",
    "action_id",
    "mandate",
    "verified_intent",
    "evidence",
    "risk_context",
    "proof_metadata",
    "local_only",
    "nonce",
  ]) {
    assert.ok((request.required as string[]).includes(field), field);
  }

  const requestProperties = request.properties as Record<string, JsonSchema>;
  const mandateSchema = requestProperties.mandate as JsonSchema;
  assert.deepEqual((mandateSchema.required as string[]).sort(), [
    "expires_at",
    "issuer_ref",
    "mandate_id",
    "present",
    "scope",
  ]);
  assert.ok(((requestProperties.evidence as JsonSchema).required as string[]).includes("evidence_hash"));
  assert.ok(((requestProperties.verified_intent as JsonSchema).required as string[]).includes("status"));

  for (const field of ["schema_version", "action_id", "mandate_id", "evidence_id", "policy_decision", "issuer_ref", "verifier_ref", "proof_metadata"]) {
    assert.ok((receipt.required as string[]).includes(field), field);
  }
  assert.ok((proof.required as string[]).includes("proof_metadata"));
});

test("local examples conform to the hardened schemas", () => {
  const request = schema(requestSchemaPath);
  const receipt = schema(receiptSchemaPath);
  const proof = schema(proofSchemaPath);

  for (const path of [
    "examples/local-demo-low-risk-allow.json",
    "examples/local-demo-money-review.json",
    "examples/local-demo-no-mandate-refuse.json",
    "examples/local-demo-stale-evidence-refuse.json",
    "examples/local-demo-over-limit-refuse.json",
  ]) {
    assert.deepEqual(errorsFor(request, readJson(path)), [], path);
  }

  for (const path of [
    "examples/local-receipt-signed-gate-pass.json",
    "examples/local-receipt-review-required.json",
    "examples/local-receipt-refusal-no-mandate.json",
    "examples/local-receipt-refusal-stale-evidence.json",
    "examples/local-receipt-refusal-over-limit.json",
  ]) {
    assert.deepEqual(errorsFor(receipt, readJson(path)), [], path);
  }

  assert.deepEqual(errorsFor(proof, readJson("examples/local-end-to-end-money-gate-proof-output.json")), []);
});

test("required field enforcement fails closed for missing mandate evidence verified intent and proof metadata", () => {
  const requestSchema = schema(requestSchemaPath);
  const validRequest = readJson<Record<string, unknown>>("examples/local-demo-low-risk-allow.json");

  for (const field of ["mandate", "evidence", "verified_intent", "proof_metadata"]) {
    const candidate = structuredClone(validRequest);
    delete candidate[field];
    assert.ok(errorsFor(requestSchema, candidate).some((error) => error.includes(`${field} is required`)), field);
  }

  const withoutNonce = structuredClone(validRequest);
  delete withoutNonce.nonce;
  assert.ok(errorsFor(requestSchema, withoutNonce).some((error) => error.includes("nonce is required")));
});

test("verifier rejects local receipts that omit hardened proof metadata", () => {
  const input = readJson<LocalGatePassDemoInput>("examples/local-demo-low-risk-allow.json");
  const receipt = createLocalGatePassAuditReceipt(input);
  const tampered = structuredClone(receipt) as unknown as Record<string, unknown>;
  delete tampered.proof_metadata;
  const decision = verifyLocalTrustReceipt(tampered, {
    expected_request_id: input.request_id,
    expected_agent_id: input.agent_id,
    expected_requested_action: input.requested_action,
    current_time: input.checked_at ?? "1970-01-01T00:00:00.000Z",
  });
  assert.equal(decision.verified, false);
  assert.equal(decision.internally_consistent, false);
  assert.ok(decision.reason_codes.includes("missing_required_field"));
  assert.ok(decision.reason_codes.includes("missing_proof_metadata"));
});

test("freshness nonce issuer verifier and local-only metadata are present in proof artifacts", () => {
  const request = readJson<Record<string, unknown>>("examples/local-demo-low-risk-allow.json");
  const receipt = readJson<Record<string, unknown>>("examples/local-receipt-signed-gate-pass.json");
  const proof = readJson<Record<string, unknown>>("examples/local-end-to-end-money-gate-proof-output.json");

  assert.equal(request.local_only, true);
  assert.match(String(request.nonce), /^nonce_/);
  assert.equal((request.proof_metadata as Record<string, unknown>).schema_version, "atg.local-proof-metadata.v1");

  for (const artifact of [receipt, proof]) {
    const metadata = artifact.proof_metadata as Record<string, unknown>;
    const replay = metadata.replay_freshness as Record<string, unknown>;
    assert.equal(metadata.local_only, true);
    assert.equal(typeof metadata.issuer_ref, "string");
    assert.equal(typeof metadata.verifier_ref, "string");
    assert.match(String(metadata.nonce), /^nonce_/);
    assert.equal(replay.single_use, true);
    assert.equal(typeof replay.freshness_window_seconds, "number");
  }
});

test("contact identity and safety boundaries remain intact", () => {
  const doc = readFileSync(evidenceDocPath, "utf8");
  assert.match(doc, /gpmiddleton71@gmail\.com/);
  const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
  const scanned = [
    "README.md",
    "PUBLIC_LAUNCH_CHECKLIST.md",
    "CHANGELOG.md",
    "RELEASE_NOTES.md",
    evidenceDocPath,
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(scanned, new RegExp(oldEmail.replace(".", "\\.")));
  assert.doesNotMatch(scanned, /stripe\.checkout|paypal\.com|api\.stripe|webhook_url|wallet_address|bank_account_number|private_key|fetch\s*\(/i);
  assert.match(scanned, /No mandate\. No evidence\. No verified intent\. No signed gate pass\. No settlement\./);
});
