import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const manifestPath = "agent-trust-gate.manifest.json";
const publicRepoUrl = "https://github.com/Gareth1953/agent-trust-gate";
const expectedPagesUrl = "https://gareth1953.github.io/agent-trust-gate/";
const schemaPaths = [
  "schemas/local-agent-action-request.schema.json",
  "schemas/local-trust-receipt.schema.json",
  "schemas/local-money-gate-proof.schema.json",
] as const;
const examplePaths = [
  "examples/integration-agent-action-request.json",
  "examples/integration-trust-receipt-response.json",
  "examples/integration-money-gate-proof-response.json",
  "examples/integration-refusal-response.json",
  "examples/integration-review-response.json",
] as const;
const docPaths = [
  "docs/code-readable-developer-integration-pack.md",
  "docs/local-discovery-metadata.md",
  "docs/code-only-contact-readiness.md",
  "docs/developer-integration-checklist.md",
] as const;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function json(path: string): Record<string, unknown> {
  return JSON.parse(read(path)) as Record<string, unknown>;
}

test("static manifest parses and keeps every live capability disabled", () => {
  assert.equal(existsSync(manifestPath), true);
  const manifest = json(manifestPath);
  assert.equal(manifest.service_name, "Agent Trust Gate");
  assert.equal(manifest.project_status, "local_demo_only");
  assert.equal(manifest.static_file_only, true);
  for (const field of [
    "live_api",
    "hosted_sandbox",
    "network_calls",
    "live_systems_contact",
    "direct_bot_messaging",
    "external_agent_contact",
    "live_payments",
    "live_settlement",
    "action_execution",
    "auc_integrated",
    "agent_contact_system_integrated",
    "public_outreach_automation",
  ]) {
    assert.equal(manifest[field], false, field);
  }
  assert.equal(manifest.cryptographic_signing, "local_demo_placeholder_only");
  assert.deepEqual(manifest.supported_local_flows, [
    "gate_decision",
    "receipt_generation",
    "receipt_verification",
    "gate_pass_validity_replay_check",
    "settlement_blocker_simulation",
    "end_to_end_money_gate_proof",
    "session_intent_gate_concept_model",
    "prove_yourself_protocol_model",
    "agent_proof_contract_model",
    "agent_proof_integration_adapter_model",
    "enforceable_tool_gate_demo",
    "gatepass_core_model",
    "gatepass_round_trip_model",
    "agent_readable_gatepass_benefit_model",
    "gatepass_trust_language_model",
    "gatepass_adversarial_scorecard_model",
    "gatepass_tool_wrapper_model",
    "local_agent_framework_integration_model",
    "gatepass_reviewer_kit_model",
    "embedded_commerce_gatepass_model",
  ]);
  assert.equal(manifest.public_repository_url, publicRepoUrl);
  const manifestSource = read(manifestPath);
  for (const url of manifestSource.match(/https?:\/\/[^\s",]+/g) ?? []) {
    assert.ok([publicRepoUrl, expectedPagesUrl].includes(url), url);
  }
  assert.doesNotMatch(manifestSource, /endpoint[_-]?url|api[_-]?key|secret|wallet|bank[_-]?account/i);
});

test("documentation schemas exist, parse, and declare local-only shapes", () => {
  for (const path of schemaPaths) {
    assert.equal(existsSync(path), true, path);
    const schema = json(path);
    assert.equal(schema.type, "object", path);
    assert.equal(schema.additionalProperties, false, path);
    assert.match(String(schema.description), /local/i, path);
    assert.doesNotMatch(read(path), /https?:\/\/|endpoint[_-]?url/i, path);
  }

  const request = json(schemaPaths[0]);
  const receipt = json(schemaPaths[1]);
  const proof = json(schemaPaths[2]);
  assert.ok(Array.isArray(request.required));
  assert.ok(Array.isArray(receipt.required));
  assert.ok(Array.isArray(proof.required));
  assert.ok((request.required as unknown[]).includes("mandate"));
  assert.ok((receipt.required as unknown[]).includes("signature_metadata"));
  assert.ok((proof.required as unknown[]).includes("controls"));
});

test("integration examples parse and contain only synthetic local material", () => {
  const unsafe = /https?:\/\/|endpoint[_-]?url|api[_-]?key|access[_-]?token|bearer|password|secret|bank[_-]?account|card[_-]?number|wallet[_-]?address|routing[_-]?number|sort[_-]?code|\biban\b|\bx402\b|\bap2\b|stripe|checkout/i;
  for (const path of examplePaths) {
    assert.equal(existsSync(path), true, path);
    const source = read(path);
    assert.doesNotThrow(() => JSON.parse(source), path);
    assert.doesNotMatch(source, unsafe, path);
    assertNoCredentialValue(JSON.parse(source) as unknown, path);
  }
});

test("examples expose request, allow, review, refusal, and proof shapes", () => {
  assert.equal(json(examplePaths[0]).action_category, "money_review");
  assert.equal(json(examplePaths[1]).receipt_type, "signed_gate_pass");
  assert.equal(json(examplePaths[2]).proof_type, "local_end_to_end_money_gate");
  assert.equal(json(examplePaths[2]).proof_passed, true);
  assert.equal(json(examplePaths[3]).receipt_type, "refusal_receipt");
  assert.equal(json(examplePaths[4]).receipt_type, "review_receipt");
  for (const path of examplePaths.slice(1)) {
    const value = json(path);
    assert.notEqual(value.settlement_executed, true, path);
    assert.notEqual(value.action_executed, true, path);
  }
});

test("contact readiness and checklist preserve separate inactive integrations", () => {
  for (const path of docPaths) assert.equal(existsSync(path), true, path);
  const contact = read("docs/code-only-contact-readiness.md");
  assert.match(contact, /No live contact is active today/i);
  assert.match(contact, /No outreach automation is active today/i);
  assert.match(contact, /No agent registry submission is active today/i);

  const checklist = read("docs/developer-integration-checklist.md");
  assert.match(checklist, /AUC is not integrated/i);
  assert.match(checklist, /Agent Contact System is not integrated/i);
  assert.match(checklist, /x402 and AP2 are not activated/i);
  assert.match(checklist, /Production cryptographic signing is not approved/i);
});

test("capability statement retains local-only status and links the new assets", () => {
  const capability = read("docs/agent-readable-capability-statement.md");
  for (const declaration of [
    '"current_status": "local_demo_only"',
    '"live_payments": false',
    '"live_settlement": false',
    '"external_agent_contact": false',
    '"network_calls": false',
    '"action_execution": false',
    "agent-trust-gate.manifest.json",
    "schemas/",
    "examples/integration-*.json",
    "local-end-to-end-money-gate-proof-pack.md",
  ]) {
    assert.ok(capability.includes(declaration), declaration);
  }
});

test("README links every P3-M101 code-readable asset", () => {
  const readme = read("README.md");
  for (const path of [
    manifestPath,
    ...docPaths,
    ...schemaPaths,
  ]) {
    assert.equal(existsSync(path), true, path);
    assert.ok(readme.includes(path), path);
  }
  assert.match(readme, /Code-Readable Developer Integration Pack/);
});

function assertNoCredentialValue(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    for (const item of value) assertNoCredentialValue(item, path);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (/credential/i.test(key)) assert.equal(item, false, path + ":" + key);
    else assertNoCredentialValue(item, path);
  }
}
