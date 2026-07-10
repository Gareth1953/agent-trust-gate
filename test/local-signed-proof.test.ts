import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  createCanonicalPayload,
  createLocalDemoKeyPair,
  LOCAL_SIGNED_PROOF_ALGORITHM,
  LOCAL_SIGNED_PROOF_SCHEMA_VERSION,
  signLocalMoneyGateProof,
  signLocalTrustReceipt,
  verifyLocalMoneyGateProofSignature,
  verifyLocalSignedProof,
  verifyLocalTrustReceiptSignature,
  type LocalSignedProofEnvelope,
} from "../src/local-signed-proof.js";

const docPath = "docs/local-signed-receipt-and-proof-prototype.md";
const schemaPath = "schemas/local-signed-proof.schema.json";
const signedReceiptPath = "examples/local-signed-trust-receipt-valid.json";
const tamperedReceiptPath = "examples/local-signed-trust-receipt-tampered-invalid.json";
const signedProofPath = "examples/local-signed-money-gate-proof-valid.json";
const tamperedProofPath = "examples/local-signed-money-gate-proof-tampered-invalid.json";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

test("local signed proof docs schema and examples exist", () => {
  for (const path of [docPath, schemaPath, signedReceiptPath, tamperedReceiptPath, signedProofPath, tamperedProofPath]) {
    assert.equal(existsSync(path), true, path);
  }
  const readme = readFileSync("README.md", "utf8");
  assert.match(readme, /docs\/local-signed-receipt-and-proof-prototype\.md/);
});

test("valid local signed trust receipt verifies", () => {
  const signed = readJson<unknown>(signedReceiptPath);
  const decision = verifyLocalTrustReceiptSignature(signed);
  assert.equal(decision.verified, true);
  assert.equal(decision.payloadHashMatches, true);
  assert.equal(decision.signatureValid, true);
  assert.deepEqual(decision.reasonCodes, ["signature_valid"]);
});

test("tampered local signed trust receipt fails verification", () => {
  const signed = readJson<unknown>(tamperedReceiptPath);
  const decision = verifyLocalTrustReceiptSignature(signed);
  assert.equal(decision.verified, false);
  assert.equal(decision.payloadHashMatches, false);
  assert.equal(decision.signatureValid, false);
  assert.ok(decision.reasonCodes.includes("payload_hash_mismatch"));
  assert.ok(decision.reasonCodes.includes("signature_invalid"));
});

test("malformed signature metadata and unsigned receipt fail closed", () => {
  const signed = readJson<LocalSignedProofEnvelope<Record<string, unknown>>>(signedReceiptPath);
  const malformed = structuredClone(signed) as unknown as Record<string, unknown>;
  const metadata = malformed.signatureMetadata as Record<string, unknown>;
  delete metadata.signature;

  const malformedDecision = verifyLocalTrustReceiptSignature(malformed);
  assert.equal(malformedDecision.verified, false);
  assert.ok(malformedDecision.reasonCodes.includes("malformed_signature_metadata"));
  assert.ok(malformedDecision.reasonCodes.includes("signature_invalid"));

  const unsignedDecision = verifyLocalTrustReceiptSignature(signed.payload);
  assert.equal(unsignedDecision.verified, false);
  assert.ok(unsignedDecision.reasonCodes.includes("malformed_signed_proof"));
});

test("valid local signed money-gate proof verifies", () => {
  const signed = readJson<unknown>(signedProofPath);
  const decision = verifyLocalMoneyGateProofSignature(signed);
  assert.equal(decision.verified, true);
  assert.equal(decision.payloadHashMatches, true);
  assert.equal(decision.signatureValid, true);
  assert.deepEqual(decision.reasonCodes, ["signature_valid"]);
});

test("tampered local signed money-gate proof fails verification", () => {
  const signed = readJson<unknown>(tamperedProofPath);
  const decision = verifyLocalMoneyGateProofSignature(signed);
  assert.equal(decision.verified, false);
  assert.equal(decision.payloadHashMatches, false);
  assert.equal(decision.signatureValid, false);
  assert.ok(decision.reasonCodes.includes("payload_hash_mismatch"));
  assert.ok(decision.reasonCodes.includes("signature_invalid"));
});

test("local signed proof metadata preserves local-only and non-authorisation flags", () => {
  const signedExamples = [
    readJson<LocalSignedProofEnvelope<unknown>>(signedReceiptPath),
    readJson<LocalSignedProofEnvelope<unknown>>(signedProofPath),
  ];
  for (const signed of signedExamples) {
    const metadata = signed.signatureMetadata;
    assert.equal(metadata.signatureSchemaVersion, LOCAL_SIGNED_PROOF_SCHEMA_VERSION);
    assert.equal(metadata.algorithm, LOCAL_SIGNED_PROOF_ALGORITHM);
    assert.equal(metadata.keyId, "local-demo-ed25519-p3-m117");
    assert.match(metadata.payloadHash, /^sha256:[a-f0-9]{64}$/);
    assert.equal(metadata.localDemoOnly, true);
    assert.equal(metadata.productionSigning, false);
    assert.equal(metadata.paymentAuthorisation, false);
    assert.equal(metadata.settlementAuthorisation, false);
  }
});

test("local demo keypair and canonical payload helpers are deterministic and bounded", () => {
  const keyPair = createLocalDemoKeyPair();
  assert.equal(keyPair.localDemoOnly, true);
  assert.equal(keyPair.productionSigning, false);
  assert.match(keyPair.note, /non-secret/i);
  assert.match(keyPair.note, /not for production signing/i);

  const first = createCanonicalPayload({ b: 2, a: { d: 4, c: 3 } });
  const second = createCanonicalPayload({ a: { c: 3, d: 4 }, b: 2 });
  assert.equal(first, second);
});

test("runtime signing helpers create locally verifiable envelopes", () => {
  const receipt = readJson<LocalSignedProofEnvelope<Record<string, unknown>>>(signedReceiptPath).payload;
  const proof = readJson<LocalSignedProofEnvelope<Record<string, unknown>>>(signedProofPath).payload;
  assert.equal(verifyLocalTrustReceiptSignature(signLocalTrustReceipt(receipt as never)).verified, true);
  assert.equal(verifyLocalMoneyGateProofSignature(signLocalMoneyGateProof(proof as never)).verified, true);

  const wrongType = verifyLocalSignedProof(readJson<unknown>(signedReceiptPath), {
    expectedPayloadType: "local_money_gate_proof",
  });
  assert.equal(wrongType.verified, false);
  assert.ok(wrongType.reasonCodes.includes("payload_type_mismatch"));
});

test("signed proof schema requires signature and safe authorisation flags", () => {
  const schema = readJson<Record<string, unknown>>(schemaPath);
  const signatureMetadata = (schema.properties as Record<string, unknown>).signatureMetadata as Record<string, unknown>;
  const required = signatureMetadata.required as string[];
  for (const field of [
    "signatureSchemaVersion",
    "algorithm",
    "keyId",
    "signedAt",
    "payloadHash",
    "signature",
    "localDemoOnly",
    "productionSigning",
    "paymentAuthorisation",
    "settlementAuthorisation",
  ]) {
    assert.ok(required.includes(field), field);
  }
  const properties = signatureMetadata.properties as Record<string, Record<string, unknown>>;
  assert.equal(properties.localDemoOnly?.const, true);
  assert.equal(properties.productionSigning?.const, false);
  assert.equal(properties.paymentAuthorisation?.const, false);
  assert.equal(properties.settlementAuthorisation?.const, false);
});

test("docs and examples preserve public contact, core line, and safety boundary", () => {
  const doc = readFileSync(docPath, "utf8");
  assert.match(doc, /gpmiddleton71@gmail\.com/);
  assert.match(doc, /No mandate\. No evidence\. No verified intent\. No signed gate pass\. No settlement\./);
  assert.match(doc, /not production signing/i);
  assert.match(doc, /not payment authorisation/i);
  assert.match(doc, /not settlement authorisation/i);

  const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
  const combined = [
    "README.md",
    "PUBLIC_LAUNCH_CHECKLIST.md",
    "CHANGELOG.md",
    "RELEASE_NOTES.md",
    docPath,
    schemaPath,
    signedReceiptPath,
    tamperedReceiptPath,
    signedProofPath,
    tamperedProofPath,
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  const p3m117Artifacts = [
    docPath,
    schemaPath,
    signedReceiptPath,
    tamperedReceiptPath,
    signedProofPath,
    tamperedProofPath,
  ].map((path) => readFileSync(path, "utf8")).join("\n");

  assert.doesNotMatch(combined, new RegExp(oldEmail.replace(".", "\\.")));
  assert.doesNotMatch(p3m117Artifacts, /https?:\/\/|paypal\.com|api\.stripe|stripe\.checkout|webhook_url|wallet_address|bank_account_number|x402|\bap2\b|fetch\s*\(/i);
  assert.doesNotMatch(combined, /productionSigning\": true|paymentAuthorisation\": true|settlementAuthorisation\": true/);
});
