import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createGatewayServer, createGlobalMarketingReadinessReport, type GatewayRequestLogEntry, type GlobalMarketingReadinessReport } from "../src/index.js";

const cli = resolve("dist/src/cli.js");
const docs = ["README.md","positioning.md","developer-adoption-channels.md","launch-message-boundaries.md","future-automated-marketing.md","pre-launch-checklist.md","agent-integration-invitation.md"];

test("global marketing readiness is versioned and every activation surface remains disabled",()=>{
  const r=createGlobalMarketingReadinessReport(new Date("2026-06-28T12:00:00.000Z"));
  assert.equal(r.global_marketing_readiness_version,"atg.global-marketing-readiness.v1");
  assert.equal(r.global_marketing_enabled,false);assert.equal(r.automated_outreach_enabled,false);assert.equal(r.public_distribution_enabled,false);assert.equal(r.analytics_tracking_enabled,false);assert.equal(r.paid_ads_enabled,false);assert.equal(r.signup_capture_enabled,false);
  assert.equal(r.outbound_agent_contact_enabled,false);assert.equal(r.automated_agent_outreach_enabled,false);assert.equal(r.external_agent_scanning_enabled,false);assert.equal(r.human_approval_required_before_contact,true);
});

test("positioning, channels, assets, and agent discovery remain planning only",()=>{
  const r=createGlobalMarketingReadinessReport(),ids=new Set(r.distribution_channels.map(c=>c.id));
  assert.equal(r.positioning_model.category,"pre-action trust gateway for AI agents");assert.match(r.positioning_model.overclaim_boundaries.join(" "),/does not prove compliance/i);
  for(const id of ["public_github_repository","developer_docs_site","npm_package","mcp_tool_directory","hosted_sandbox"])assert.equal(ids.has(id),true,id);
  assert.equal(r.distribution_channels.some(c=>(c.status as string)==="live"),false);
  assert.equal(r.developer_adoption_assets.openapi_available,true);assert.equal(r.developer_adoption_assets.sdk_wrappers_available,true);assert.equal(r.developer_adoption_assets.mcp_adapter_available,true);assert.equal(r.developer_adoption_assets.hosted_demo_available,false);
  assert.deepEqual(r.agent_to_agent_discovery_readiness.supported_future_protocols,["MCP-style tools","Agent Manifest","A2A-style Agent Card","OpenAPI","SDK wrappers"]);
});

test("checks and distribution gates preserve approval and safety boundaries",()=>{
  const r=createGlobalMarketingReadinessReport(),ids=new Set(r.checks.map(c=>c.id));
  for(const id of ["payment_processing_not_enabled","automatic_purchase_not_enabled","outreach_not_enabled","analytics_not_enabled","docs_site_not_deployed"])assert.equal(ids.has(id),true,id);
  assert.match(r.required_before_global_distribution.join(" "),/explicit Gareth approval before launch/i);assert.match(r.required_before_global_distribution.join(" "),/legal and terms review/i);
  assert.match(r.recommended_distribution_controls.join(" "),/avoid compliance overclaims/i);assert.match(r.recommended_distribution_controls.join(" "),/require Gareth approval before public distribution/i);
});

test("CLI JSON and output modes are local and parseable",()=>{
  const j=spawnSync(process.execPath,[cli,"--global-marketing-readiness","--json"],{encoding:"utf8"});assert.equal(j.status,0);assert.equal((JSON.parse(j.stdout) as GlobalMarketingReadinessReport).global_marketing_enabled,false);
  const d=mkdtempSync(`${tmpdir()}\\atg-marketing-`),p=resolve(d,"x","report.json");try{assert.equal(spawnSync(process.execPath,[cli,"--global-marketing-readiness","--output",p],{encoding:"utf8"}).status,0);assert.equal(existsSync(p),true);}finally{rmSync(d,{recursive:true,force:true});}
});

test("GET global marketing readiness includes request ID and logs locally",async()=>{
  const d=mkdtempSync(`${tmpdir()}\\atg-marketing-http-`),l=resolve(d,"gateway.jsonl"),s=createGatewayServer({gatewayLogPath:l});await new Promise<void>(r=>s.listen(0,"127.0.0.1",r));try{const a=s.address() as AddressInfo,res=await fetch(`http://127.0.0.1:${a.port}/v1/global-marketing-readiness`),b=await res.json() as GlobalMarketingReadinessReport&{request_id:string};assert.equal(res.status,200);assert.match(b.request_id,/^gw_/);assert.equal(b.public_distribution_enabled,false);}finally{await new Promise<void>((r,j)=>s.close(e=>e?j(e):r()));assert.equal((JSON.parse(readFileSync(l,"utf8")) as GatewayRequestLogEntry).endpoint,"/v1/global-marketing-readiness");rmSync(d,{recursive:true,force:true});}
});

test("marketing docs and discovery drafts are local, parseable, and contain no targets or secrets",()=>{
  const dir=resolve("docs/global-marketing-readiness");for(const f of docs)assert.equal(existsSync(resolve(dir,f)),true,f);const source=docs.map(f=>readFileSync(resolve(dir,f),"utf8")).join("\n");assert.match(source,/local-only/i);assert.match(source,/no automated outreach|no outreach is sent/i);assert.match(source,/no ads|no advertising/i);assert.match(source,/no analytics|analytics.*not enabled/i);assert.match(source,/no signups|signups.*not collected/i);
  const card=JSON.parse(readFileSync(resolve("docs/public-developer/agent-card-draft.json"),"utf8"));assert.equal(card.public_endpoint_enabled,false);assert.equal(card.payment_processing_enabled,false);assert.equal(card.automatic_purchase_enabled,false);assert.equal(card.executes_actions,false);
  const invitationSource=readFileSync(resolve("examples/global-marketing/agent-integration-invitation.example.json"),"utf8"),invitation=JSON.parse(invitationSource);assert.equal(invitation.outbound_contact_enabled,false);assert.equal(invitation.automatic_sending_enabled,false);assert.equal(invitation.human_approval_required_before_sending,true);
  assert.doesNotMatch(invitationSource,/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|https?:\/\/|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/i);
});
