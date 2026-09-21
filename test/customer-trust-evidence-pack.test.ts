import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createM162EvidenceBundle,
  verifyCustomerTrustReceipt,
  verifyM162EvidenceBundle,
  type M162EvidenceBundle,
} from "../src/customer-trust-evidence-pack.js";
import { runCustomerTrustEvidencePackCli } from "../src/customer-trust-evidence-pack-cli.js";
import { LocalDurableLifecycleStore } from "../src/durable-action-lifecycle.js";
import {
  REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS,
  executeThroughRegisteredSyntheticPurchasingAdapter,
  runLocalPurchasingLifecycleDemo,
} from "../src/local-purchasing-lifecycle-demo.js";
import { MCP_EXACT_ACTION_PROTOCOL_VERSION } from "../src/mcp-exact-action-gateway.js";
import { McpStdioProtocolServer, type JsonRpcResponse } from "../src/mcp-stdio-server.js";
import { validateJsonSchemaFile } from "../src/json-schema-validator.js";

const directories: string[] = [];
let bundle: M162EvidenceBundle;

before(async () => { bundle = await createM162EvidenceBundle(); });
afterEach(() => { while (directories.length > 0) rmSync(directories.pop()!, { recursive: true, force: true }); });

function tempRoot(): string { const root = mkdtempSync(join(tmpdir(), "atg-p3-m162-test-")); directories.push(root); return root; }
function clone<T>(value: T): T { return structuredClone(value); }
function metric(id: string): number { return bundle.metrics.metrics.find((item) => item.metricId === id)!.value; }
function responseResult(response: JsonRpcResponse | null): Record<string, unknown> { assert.ok(response && "result" in response); return response.result as Record<string, unknown>; }

test("generates one deterministic non-authorising Customer Trust Receipt per M161 case", async () => {
  const again = await createM162EvidenceBundle();
  assert.equal(bundle.customerTrustReceipts.length, 10);
  assert.deepEqual(again, bundle);
  assert.ok(bundle.customerTrustReceipts.every((item) => !item.authorityGranted && !item.executable && !item.reservable));
});

test("Customer Trust Receipts describe the ten expected source cases and outcomes", () => {
  assert.deepEqual(bundle.customerTrustReceipts.map((item) => [item.sourceCaseId, item.atgVerdict]), [
    ["01_exact_authorised_purchase", "ACCEPT"], ["02_quantity_substitution", "REJECT"],
    ["03_supplier_substitution", "REJECT"], ["04_price_band_breach", "REFER"],
    ["05_gatepass_reuse", "REJECT"], ["06_gatepass_revocation", "REJECT"],
    ["07_shadow_mode", "SHADOW"], ["08_aggregate_ceiling", "REFER"],
    ["09_authority_expansion_attempt", "REJECT"], ["10_emergency_recovery_lifecycle", "REJECT"],
  ]);
});

test("intact receipts verify and content tampering fails", async () => {
  const source = await runLocalPurchasingLifecycleDemo();
  assert.equal(verifyCustomerTrustReceipt(bundle.customerTrustReceipts[0], source).verified, true);
  const changed = clone(bundle.customerTrustReceipts[0]!); changed.plainEnglishControlOutcome = "changed";
  assert.equal(verifyCustomerTrustReceipt(changed, source).verified, false);
});

test("source substitution, broken linkage, missing evidence and unsupported versions fail closed", async () => {
  for (const mutate of [
    (b: any) => { b.sourceM161.canonicalDigest = "sha256:" + "0".repeat(64); },
    (b: any) => { b.customerTrustReceipts[0].evidenceLink.digest = "sha256:" + "0".repeat(64); },
    (b: any) => { b.customerTrustReceipts.pop(); },
    (b: any) => { b.bundleVersion = "unknown"; },
  ]) { const changed: any = clone(bundle); mutate(changed); assert.equal((await verifyM162EvidenceBundle(changed)).verified, false); }
});

test("Customer Trust Receipts cannot masquerade as GatePasses or execution authority", async () => {
  const changed: any = clone(bundle); changed.customerTrustReceipts[0].authorityGranted = true; changed.customerTrustReceipts[0].executable = true;
  const result = await verifyM162EvidenceBundle(changed);
  assert.equal(result.verified, false); assert.equal(result.authorityGranted, false); assert.equal(result.executionAttempted, false);
});

test("an M162 artefact cannot reach the registered synthetic execution callback", async () => {
  const registered = REGISTERED_SYNTHETIC_PURCHASING_ADAPTERS[0]!;
  const result = await executeThroughRegisteredSyntheticPurchasingAdapter({
    store: new LocalDurableLifecycleStore({ statePath: join(tempRoot(), "state.json") }),
    gatePass: bundle.customerTrustReceipts[0] as any,
    decisionReceipt: null,
    proposedAction: null,
    adapterId: registered.adapterId,
    resourceId: registered.resourceId,
  });
  assert.equal(result.outcome, "REJECTED");
  assert.equal(result.adapterReached, false);
  assert.deepEqual(result.reasonCodes, ["EXECUTION_AUTHORITY_MISSING"]);
});

test("coverage claims expose evidence, test references, limitations and honest gaps", () => {
  const map = bundle.coverageMap;
  assert.deepEqual(map.totals, { DEMONSTRATED: 18, PARTIALLY_DEMONSTRATED: 2, NOT_DEMONSTRATED: 3, OUT_OF_SCOPE: 2 });
  for (const entry of map.entries.filter((item) => item.status === "DEMONSTRATED")) {
    assert.ok(entry.evidenceReference); assert.ok(entry.evidenceDigest); assert.ok(entry.acceptanceTestReference); assert.ok(entry.knownLimitation);
  }
  assert.ok(map.entries.some((item) => item.status === "PARTIALLY_DEMONSTRATED"));
  assert.ok(map.entries.some((item) => item.status === "NOT_DEMONSTRATED"));
  assert.ok(map.entries.some((item) => item.status === "OUT_OF_SCOPE"));
});

test("unsupported coverage claims and total mutations fail verification", async () => {
  const changed: any = clone(bundle); changed.coverageMap.entries.find((item: any) => item.status === "NOT_DEMONSTRATED").status = "DEMONSTRATED"; changed.coverageMap.totals.DEMONSTRATED++;
  assert.equal((await verifyM162EvidenceBundle(changed)).verified, false);
});

test("metrics reconcile with the ten synthetic cases and expose all rate operands", () => {
  assert.equal(metric("METRIC-TOTAL-CASES"), 10);
  assert.deepEqual([metric("METRIC-VERDICT-ACCEPT"), metric("METRIC-VERDICT-REJECT"), metric("METRIC-VERDICT-REFER"), metric("METRIC-VERDICT-SHADOW")], [1, 6, 2, 1]);
  assert.equal(metric("METRIC-SHADOW-GATEPASSES"), 0);
  assert.equal(metric("METRIC-AUTOMATIC-CRASH-RETRIES"), 0);
  for (const item of bundle.metrics.metrics.filter((entry) => entry.percentage !== null)) { assert.equal(item.percentage, Number(((item.numerator! / item.denominator!) * 100).toFixed(2))); }
});

test("rejected, referred, revoked and shadow evidence reports no synthetic execution", () => {
  assert.ok(bundle.customerTrustReceipts.slice(1).every((item) => item.syntheticExecutionStatus !== "ACKNOWLEDGED"));
});

test("metric tampering and evidence mismatch fail verification", async () => {
  const changed: any = clone(bundle); changed.metrics.metrics[0].value = 11;
  assert.equal((await verifyM162EvidenceBundle(changed)).verified, false);
});

test("manifest covers every required artefact with canonical digests", () => {
  assert.deepEqual(bundle.manifest.entries.map((item) => item.artefactId), ["source-m161", "customer-trust-receipts", "assurance-coverage-map", "assurance-metrics", "buyer-adoption-proof-pack", "buyer-adoption-proof-pack-markdown"]);
  assert.ok(bundle.manifest.entries.every((item) => item.required && item.canonicalDigest.startsWith("sha256:")));
});

test("manifest digest tampering fails verification", async () => {
  const changed: any = clone(bundle); changed.manifest.manifestDigest = "sha256:" + "f".repeat(64);
  assert.equal((await verifyM162EvidenceBundle(changed)).verified, false);
});

test("reviewer and machine forms agree and preserve limitations and non-claims", () => {
  assert.ok(bundle.reviewerMarkdown.includes(bundle.buyerAdoptionProofPack.packDigest));
  assert.ok(bundle.reviewerMarkdown.includes("No external action occurred"));
  assert.ok(bundle.reviewerMarkdown.includes("not production"));
  assert.equal(bundle.buyerAdoptionProofPack.customerValidated, false);
  assert.equal(bundle.buyerAdoptionProofPack.productionReady, false);
});

test("all M162 schemas validate their generated artefacts", () => {
  const checks: Array<[string, unknown]> = [
    ["schemas/customer-trust-receipt.schema.json", bundle.customerTrustReceipts[0]],
    ["schemas/assurance-coverage-map.schema.json", bundle.coverageMap],
    ["schemas/assurance-metrics.schema.json", bundle.metrics],
    ["schemas/buyer-adoption-proof-pack.schema.json", bundle.buyerAdoptionProofPack],
    ["schemas/m162-evidence-bundle.schema.json", bundle],
  ];
  for (const [path, value] of checks) assert.deepEqual(validateJsonSchemaFile(path, value).errors, []);
});

test("CLI generation is byte-identical and verification accepts both copies", async () => {
  const first = tempRoot(); const second = tempRoot(); const io = { stdout: (_value: string) => {}, stderr: (_value: string) => {} };
  assert.equal(await runCustomerTrustEvidencePackCli(["generate", "--output-dir", first], io), 0);
  assert.equal(await runCustomerTrustEvidencePackCli(["generate", "--output-dir", second], io), 0);
  const names = readdirSync(first).sort(); assert.deepEqual(names, readdirSync(second).sort());
  for (const name of names) assert.deepEqual(readFileSync(join(first, name)), readFileSync(join(second, name)));
  assert.equal(await runCustomerTrustEvidencePackCli(["verify", "--input", join(first, "evidence-bundle.json")], io), 0);
});

test("CLI verifier returns non-zero for tampered input", async () => {
  const root = tempRoot(); const path = join(root, "tampered.json"); const changed: any = clone(bundle); changed.bundleDigest = "tampered"; writeFileSync(path, JSON.stringify(changed));
  assert.equal(await runCustomerTrustEvidencePackCli(["verify", "--input", path], { stdout: () => {}, stderr: () => {} }), 1);
});

test("MCP still exposes exactly atg.evaluate_action", async () => {
  const server = new McpStdioProtocolServer();
  await server.handleLine(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: MCP_EXACT_ACTION_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "m162-test", version: "1" } } }));
  await server.handleLine(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }));
  const result = responseResult(await server.handleLine(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }))) as { tools: Array<{ name: string }> };
  assert.deepEqual(result.tools.map((item) => item.name), ["atg.evaluate_action"]);
});

test("generated evidence contains no credentials, personal data or live-effect claim", () => {
  const text = JSON.stringify(bundle).toLowerCase();
  for (const prohibited of ["password", "private key", "api_key", "customer@example", "real payment executed"]) assert.equal(text.includes(prohibited), false);
  assert.equal(bundle.externalActionOccurred, false);
});
