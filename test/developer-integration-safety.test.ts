import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const guidePath=resolve("docs/developer-integration-safety.md");
const apiDraftPath=resolve("docs/developer-integration-api-draft.md");
const configPath=resolve("config/developer-integration-safety.json");
const requestPath=resolve("examples/developer-integration-request-draft.json");
const responsePath=resolve("examples/developer-integration-response-blocked.json");
const approvalPath=resolve("examples/developer-integration-approval-placeholder.json");
const disabledFlags=["integration_enabled","external_api_enabled","public_api_enabled","agent_to_agent_enabled","third_party_connections_enabled","webhook_enabled","live_customer_data_enabled","action_execution_enabled","deployment_enabled","publishing_enabled","outreach_enabled","tracking_enabled","analytics_enabled","signup_enabled","billing_enabled","payment_enabled","automatic_purchase_enabled","external_scanning_enabled"];

function readJson(path:string):Record<string,unknown>{return JSON.parse(readFileSync(path,"utf8")) as Record<string,unknown>;}
function assertNoEnabledFlags(value:unknown,path="root"):void{if(Array.isArray(value)){value.forEach((item,index)=>assertNoEnabledFlags(item,`${path}[${index}]`));return;}if(typeof value!=="object"||value===null)return;for(const [key,item] of Object.entries(value)){if(key.endsWith("_enabled"))assert.equal(item,false,`${path}.${key}`);assertNoEnabledFlags(item,`${path}.${key}`);}}

test("developer integration safety files exist and config disables every integration surface",()=>{
  for(const path of [guidePath,apiDraftPath,configPath,requestPath,responsePath,approvalPath])assert.equal(existsSync(path),true,path);
  const config=readJson(configPath);assert.equal(config.status,"draft_only");assert.equal(config.version,"0.1.0");assert.equal(config.default_integration_decision,"blocked");assert.equal(config.failure_mode,"fail_closed");
  for(const flag of disabledFlags)assert.equal(config[flag],false,flag);assertNoEnabledFlags(config);
});

test("developer integration requires all human and review gates",()=>{
  const config=readJson(configPath);
  for(const requirement of ["requires_human_approval","requires_gareth_final_approval","requires_technical_validation","requires_security_review","requires_legal_review"])assert.equal(config[requirement],true,requirement);
});

test("request draft remains local and non-executing",()=>{
  const request=readJson(requestPath);assert.equal(request.status,"draft_only");assert.equal(request.local_only,true);assert.equal(request.integration_enabled,false);assert.equal(request.action_execution_enabled,false);assert.equal(request.executes_actions,false);assert.equal(request.human_approval_status,"not_requested");assertNoEnabledFlags(request);
});

test("response remains blocked with missing evidence and approval",()=>{
  const response=readJson(responsePath);assert.equal(response.decision,"blocked");assert.equal(response.allowed,false);assert.equal(response.blocked,true);assert.equal(response.approval_required,true);assert.equal(response.gareth_final_approval_required,true);assert.equal(response.executes_actions,false);assert.ok((response.missing_evidence as unknown[]).length>0);assertNoEnabledFlags(response);
});

test("approval placeholder cannot enable integration or execution",()=>{
  const approval=readJson(approvalPath);assert.equal(approval.status,"placeholder_only_blocked");assert.equal(approval.decision,"blocked");assert.equal(approval.executes_actions,false);assertNoEnabledFlags(approval);
  const requirements=approval.approval_requirements as Record<string,unknown>;for(const key of ["human_approval_recorded","gareth_final_approval_recorded","technical_validation_complete","security_review_complete","legal_review_complete"])assert.equal(requirements[key],false,key);
});

test("integration guide and API draft define required fail-closed safety boundaries",()=>{
  const guide=readFileSync(guidePath,"utf8"),api=readFileSync(apiDraftPath,"utf8");
  for(const heading of ["Integration Status","Integration Purpose","Safe Input Requirements","Safe Output Requirements","Trust Receipt Structure","Human Approval Flow","Blocked Action Categories","Agent-to-Agent Safety Rules","Developer Do / Do Not Table","External Integration Readiness Checklist","Gareth Final Approval Gate"])assert.match(guide,new RegExp(`## ${heading}`));
  assert.match(guide,/evaluates proposed actions before they happen/i);assert.match(guide,/does not perform the action itself/i);assert.match(guide,/does not autonomously approve high-impact actions/i);assert.match(guide,/must not move money, publish, email, deploy, buy, sell, sign up users, track users, scrape targets, activate billing/i);assert.match(guide,/External integration is disabled unless explicitly approved by Gareth/i);
  for(const field of ["action_id","actor_type","actor_name","proposed_action","action_category","target","impact_level","evidence","human_approval_status","requested_output","decision","allowed","blocked","risk_level","approval_required","gareth_final_approval_required","reasons","missing_evidence","receipt_id","receipt_status","timestamp"])assert.match(api,new RegExp(`\`${field}\``),field);
  assert.match(api,/draft only, not a live public API/i);assert.match(api,/must not accept real customer data/i);assert.match(api,/must not be exposed externally/i);assert.match(api,/trigger actions/i);
});

test("developer integration pack contains no live URLs, credentials, tracking IDs, or payment links",()=>{
  const source=[guidePath,apiDraftPath,configPath,requestPath,responsePath,approvalPath].map(path=>readFileSync(path,"utf8")).join("\n");
  assert.doesNotMatch(source,/https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/i);
  assert.doesNotMatch(source,/\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
