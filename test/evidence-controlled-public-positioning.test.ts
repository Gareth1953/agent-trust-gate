import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateDiscoverySite } from "../src/discovery-site-validator.js";
import { validatePublicClaims } from "../src/public-claims-evidence-validator.js";
import { MCP_EXACT_ACTION_PROTOCOL_VERSION } from "../src/mcp-exact-action-gateway.js";
import { McpStdioProtocolServer, type JsonRpcResponse } from "../src/mcp-stdio-server.js";

const read = (path: string) => readFileSync(path, "utf8");
const bundle = JSON.parse(read("examples/p3-m162/evidence-bundle.json")) as Record<string, unknown>;
const index = read("discovery-site/index.html");
const pilot = read("discovery-site/controlled-buyer-pilot.html");
const readme = read("README.md");

test("public claims validate against locked M162 evidence", () => {
  const report = validatePublicClaims();
  assert.equal(report.valid, true, report.checks.filter((item) => !item.passed).map((item) => item.id).join(","));
  assert.equal(report.checks.length, 25);
});

test("altered M162 coverage and verdict metrics fail public-claim validation", () => {
  const changed: any = structuredClone(bundle);
  changed.coverageMap.totals.DEMONSTRATED = 19;
  changed.metrics.metrics.find((item: any) => item.metricId === "METRIC-VERDICT-REJECT").value = 5;
  const report = validatePublicClaims({ evidenceBundle: changed });
  assert.equal(report.valid, false);
  assert.equal(report.checks.find((item) => item.id === "coverage_totals")?.passed, false);
  assert.equal(report.checks.find((item) => item.id === "verdict_metrics")?.passed, false);
});

test("unsupported public metrics and omitted synthetic label fail closed", () => {
  const changed = readme.replace("18 DEMONSTRATED", "19 DEMONSTRATED").replace(/observed in the deterministic ten-case synthetic demonstration/gi, "observed");
  const report = validatePublicClaims({ readme: changed, indexHtml: index.replace(/Observed in the deterministic ten-case synthetic demonstration\./g, "Observed.") });
  assert.equal(report.valid, false);
  assert.equal(report.checks.find((item) => item.id === "no_unsupported_public_metrics")?.passed, false);
  assert.equal(report.checks.find((item) => item.id === "synthetic_metric_label")?.passed, false);
});

test("Customer Trust Receipt authority language and Shadow GatePass claims are prohibited", () => {
  const authority = validatePublicClaims({ indexHtml: `${index}<p>Customer Trust Receipt authorises execution.</p>` });
  assert.equal(authority.valid, false);
  assert.equal(authority.checks.find((item) => item.id === "prohibited_implications")?.passed, false);
  const shadow = validatePublicClaims({ indexHtml: index.replace("Shadow Mode:</strong> runs", "Shadow Mode issues a GatePass. Shadow Mode:</strong> runs") });
  assert.equal(shadow.checks.find((item) => item.id === "shadow_non_authority")?.passed, false);
});

test("README and home page use the exact product positioning and trust boundary", () => {
  for (const source of [readme, index]) {
    assert.match(source, /Exact Action Trust Gateway for AI agents/i);
    assert.match(source, /does not decide whether an action is commercially wise/i);
    assert.match(source, /atg\.evaluate_action/);
  }
});

test("home page presents all ten verified purchasing cases without outcome inflation", () => {
  for (const title of ["Exact authorised purchase", "Quantity substitution", "Supplier substitution", "Price-band breach", "GatePass reuse", "GatePass revocation", "Shadow Mode", "Aggregate ceiling", "Authority expansion", "Emergency/recovery"]) assert.ok(index.includes(title), title);
  assert.match(index, /1\/10 ACCEPT/); assert.match(index, /6\/10 REJECT/); assert.match(index, /2\/10 REFER/); assert.match(index, /1\/10 SHADOW/);
});

test("Coverage Map exposes demonstrated, partial, absent and out-of-scope totals", () => {
  for (const phrase of ["18</strong><span>DEMONSTRATED", "2</strong><span>PARTIALLY_DEMONSTRATED", "3</strong><span>NOT_DEMONSTRATED", "2</strong><span>OUT_OF_SCOPE", "25</strong><span>TOTAL CONTROLS"]) assert.ok(index.includes(phrase), phrase);
});

test("pilot price is indicative, scope-dependent and has no checkout path", () => {
  const contact = read("discovery-site/contact.html");
  assert.match(index, /Paid evaluation pilots starting from £1,500/);
  assert.match(contact, /Paid evaluation pilots starting from £1,500/);
  assert.match(`${index}\n${contact}\n${pilot}`, /indicative[^.]*scope-dependent/i);
  assert.match(pilot, /Paid evaluation pilots starting from £1,500/);
  assert.doesNotMatch(`${index}\n${contact}\n${pilot}`, /<form\b|href=["'][^"']*(?:paypal|stripe|checkout)/i);
});

test("controlled buyer pilot is discoverable and preserves M163 authority boundaries", () => {
  assert.match(index, /href="\.\/controlled-buyer-pilot\.html"/);
  assert.match(read("discovery-site/sitemap.xml"), /controlled-buyer-pilot\.html/);
  assert.match(pilot, /Only <code>atg\.evaluate_action<\/code> is exposed/);
  assert.match(pilot, /Customer Trust Receipts are non-authorising/);
  assert.match(pilot, /buyer retains control of any real execution boundary/i);
  assert.match(pilot, /Observed in the deterministic ten-case synthetic demonstration\./);
  assert.doesNotMatch(pilot, /93\/100|1,394 tests|Executive Trust Receipt|gpmiddleton71@gmail\.com/i);
});

test("site runtime contains no analytics, telemetry, tracking or network call", () => {
  const script = read("discovery-site/corporate.js");
  assert.doesNotMatch(script, /posthog|analytics|telemetry|tracking|https?:\/\/|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage/i);
  assert.match(read("discovery-site/privacy.html"), /no contact forms, analytics, tracking/i);
});

test("accessibility and responsive controls are present", () => {
  const css = read("discovery-site/corporate.css");
  assert.equal((index.match(/<h1\b/gi) ?? []).length, 1);
  assert.match(index, /<nav[^>]+aria-label="Primary navigation"/i);
  assert.match(index, /class="table-scroll"[^>]+tabindex="0"/i);
  assert.match(css, /:focus-visible/); assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /max-width:\s*980px/); assert.match(css, /max-width:\s*760px/); assert.match(css, /overflow-x:\s*auto/);
});

test("claims register inventories every evidence class and resolves sources", () => {
  const register = JSON.parse(read("docs/P3-M163-public-claims-evidence-register.json")) as { claims: Array<{ classification: string; evidenceSource: string }> };
  assert.ok(register.claims.length >= 15);
  assert.deepEqual(new Set(register.claims.map((item) => item.classification)), new Set(["DEMONSTRATED", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED", "OUT_OF_SCOPE"]));
  assert.ok(register.claims.every((item) => read(item.evidenceSource).length > 0));
});

test("discovery-site validator passes with internal links and zero analytics", () => {
  const report = validateDiscoverySite();
  assert.equal(report.valid, true, report.checks.filter((item) => !item.passed).map((item) => `${item.id}:${item.detail}`).join("\n"));
  assert.equal(report.checks.find((item) => item.id === "no_analytics_or_tracking")?.passed, true);
  assert.equal(report.checks.find((item) => item.id === "all_local_public_links_valid")?.passed, true);
});

test("MCP tools/list remains exactly atg.evaluate_action", async () => {
  const server = new McpStdioProtocolServer();
  await server.handleLine(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: MCP_EXACT_ACTION_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "m163-public-test", version: "1" } } }));
  await server.handleLine(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }));
  const response = await server.handleLine(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })) as JsonRpcResponse;
  assert.ok("result" in response);
  const result = response.result as { tools: Array<{ name: string }> };
  assert.deepEqual(result.tools.map((item) => item.name), ["atg.evaluate_action"]);
});

test("public positioning preserves local synthetic non-production non-claims", () => {
  const combined = `${readme}\n${index}\n${read("discovery-site/evidence.html")}`;
  for (const phrase of ["not production ready", "No customer adoption", "regulatory approval", "guaranteed compliance", "guaranteed safety", "proven ROI", "statistical significance", "real external-effect reconciliation", "business-outcome correctness"]) assert.match(combined, new RegExp(phrase, "i"), phrase);
});
