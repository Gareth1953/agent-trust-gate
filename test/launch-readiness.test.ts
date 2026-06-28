import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { createGatewayServer, createLaunchReadinessReport, type GatewayRequestLogEntry, type LaunchReadinessReport } from "../src/index.js";

const cli = resolve("dist/src/cli.js");
const docs = ["README.md","product-overview.md","local-quickstart.md","gateway-api.md","openapi-and-sdk.md","agent-manifest-and-mcp.md","approval-evidence-layer.md","usage-entitlements-rate-limits.md","billing-and-machine-purchase-boundaries.md","hosted-launch-roadmap.md","safety-and-limitations.md"];

test("launch readiness is versioned and all public/commercial surfaces remain disabled",()=>{
  const r=createLaunchReadinessReport(new Date("2026-06-28T12:00:00.000Z"));
  assert.equal(r.launch_readiness_version,"atg.launch-readiness.v1");
  assert.equal(r.public_launch_enabled,false);assert.equal(r.public_docs_ready,false);assert.equal(r.hosted_service_enabled,false);assert.equal(r.package_published,false);assert.equal(r.payments_enabled,false);assert.equal(r.automatic_purchase_enabled,false);assert.equal(r.overall.developer_launch_readiness_percent,35);
});
test("documentation inventory and developer assets cover required integration surfaces",()=>{
  const r=createLaunchReadinessReport(),ids=new Set(r.documentation_sections.map(s=>s.id));
  for(const id of ["product_overview","local_quickstart","gateway_api","openapi_contract","sdk_wrappers","agent_manifest","mcp_adapter","billing_payment_readiness","machine_purchase_policy"])assert.equal(ids.has(id),true,id);
  assert.equal(r.developer_assets.openapi_available,true);assert.equal(r.developer_assets.sdk_wrappers_available,true);assert.equal(r.developer_assets.mcp_adapter_available,true);assert.equal(r.developer_assets.hosted_demo_available,false);assert.equal(r.developer_assets.public_api_available,false);
});
test("launch checks and blockers remain explicit",()=>{
  const r=createLaunchReadinessReport(),ids=new Set(r.launch_checks.map(c=>c.id));
  for(const id of ["local_docs_created","no_payments_enabled","no_automatic_purchase_enabled","hosted_service_not_enabled"])assert.equal(ids.has(id),true,id);
  assert.match(r.required_before_public_launch.join(" "),/production security review/i);assert.match(r.required_before_public_launch.join(" "),/legal and terms review/i);assert.match(r.required_before_public_launch.join(" "),/explicit Gareth approval/i);assert.match(r.recommended_launch_controls.join(" "),/no compliance overclaims/i);
});
test("CLI JSON and output modes are local and parseable",()=>{
  const j=spawnSync(process.execPath,[cli,"--launch-readiness","--json"],{encoding:"utf8"});assert.equal(j.status,0);assert.equal((JSON.parse(j.stdout) as LaunchReadinessReport).public_launch_enabled,false);
  const d=mkdtempSync(`${tmpdir()}\\atg-launch-`),p=resolve(d,"x","launch.json");try{assert.equal(spawnSync(process.execPath,[cli,"--launch-readiness","--output",p],{encoding:"utf8"}).status,0);assert.equal(existsSync(p),true);}finally{rmSync(d,{recursive:true,force:true});}
});
test("GET launch readiness includes request ID and logs locally",async()=>{
  const d=mkdtempSync(`${tmpdir()}\\atg-launch-http-`),l=resolve(d,"gateway.jsonl"),s=createGatewayServer({gatewayLogPath:l});await new Promise<void>(r=>s.listen(0,"127.0.0.1",r));try{const a=s.address() as AddressInfo,res=await fetch(`http://127.0.0.1:${a.port}/v1/launch-readiness`),b=await res.json() as LaunchReadinessReport&{request_id:string};assert.equal(res.status,200);assert.match(b.request_id,/^gw_/);assert.equal(b.hosted_service_enabled,false);}finally{await new Promise<void>((r,j)=>s.close(e=>e?j(e):r()));assert.equal((JSON.parse(readFileSync(l,"utf8")) as GatewayRequestLogEntry).endpoint,"/v1/launch-readiness");rmSync(d,{recursive:true,force:true});}
});
test("public developer docs exist and preserve local-only safety boundaries",()=>{
  const dir=resolve("docs/public-developer");for(const f of docs)assert.equal(existsSync(resolve(dir,f)),true,f);const source=docs.map(f=>readFileSync(resolve(dir,f),"utf8")).join("\n");assert.match(source,/local-only/i);assert.match(source,/no payment|payment processing.*false/i);assert.match(source,/automatic purchase.*false|no automatic purchase/i);assert.match(source,/no compliance guarantee|do not prove.*compliance/i);assert.match(source,/no.*security certification|production certifications/i);assert.doesNotMatch(source,/sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/);
});
