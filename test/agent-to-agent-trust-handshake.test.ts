import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const guidePath=resolve("docs/agent-to-agent-trust-handshake.md");
const schemaPath=resolve("docs/agent-to-agent-handshake-schema-draft.md");
const configPath=resolve("config/agent-to-agent-handshake-safety.json");
const requestPath=resolve("examples/agent-to-agent-handshake-request-draft.json");
const responsePath=resolve("examples/agent-to-agent-handshake-response-blocked.json");
const approvalPath=resolve("examples/agent-to-agent-handshake-approval-placeholder.json");
const refusalGraphTestPath=resolve("test/refusalgraph-core.test.ts");
const disabledFlags=["agent_to_agent_handshake_enabled","external_agent_connections_enabled","public_protocol_enabled","public_api_enabled","network_enabled","machine_to_machine_trust_enabled","third_party_connections_enabled","webhook_enabled","live_customer_data_enabled","private_data_exchange_enabled","action_execution_enabled","deployment_enabled","publishing_enabled","outreach_enabled","email_sending_enabled","tracking_enabled","analytics_enabled","signup_enabled","billing_enabled","payment_enabled","purchase_enabled","automatic_purchase_enabled","external_scanning_enabled","refusalgraph_live_lookup_enabled"];

function readJson(path:string):Record<string,unknown>{return JSON.parse(readFileSync(path,"utf8")) as Record<string,unknown>;}
function assertNoEnabledFlags(value:unknown,path="root"):void{if(Array.isArray(value)){value.forEach((item,index)=>assertNoEnabledFlags(item,`${path}[${index}]`));return;}if(typeof value!=="object"||value===null)return;for(const [key,item] of Object.entries(value)){if(key.endsWith("_enabled"))assert.equal(item,false,`${path}.${key}`);assertNoEnabledFlags(item,`${path}.${key}`);}}

test("handshake files exist while existing RefusalGraph tests remain present",()=>{
  for(const path of [guidePath,schemaPath,configPath,requestPath,responsePath,approvalPath,refusalGraphTestPath])assert.equal(existsSync(path),true,path);
});

test("handshake config disables every agent, network, protocol, data, and action surface",()=>{
  const config=readJson(configPath);assert.equal(config.status,"draft_only");assert.equal(config.version,"0.1.0");assert.equal(config.default_handshake_decision,"blocked");assert.equal(config.failure_mode,"fail_closed");
  for(const flag of disabledFlags)assert.equal(config[flag],false,flag);assertNoEnabledFlags(config);
});

test("handshake requires human, Gareth, technical, security, privacy, and legal review",()=>{
  const config=readJson(configPath);
  for(const requirement of ["requires_human_approval","requires_gareth_final_approval","requires_technical_validation","requires_security_review","requires_privacy_review","requires_legal_review"])assert.equal(config[requirement],true,requirement);
});

test("handshake request remains local, unapproved, and non-executing",()=>{
  const request=readJson(requestPath);assert.equal(request.status,"draft_only");assert.equal(request.local_only,true);assert.equal(request.human_approval_status,"not_requested");assert.equal(request.agent_to_agent_handshake_enabled,false);assert.equal(request.external_agent_connections_enabled,false);assert.equal(request.action_execution_enabled,false);assert.equal(request.payment_enabled,false);assert.equal(request.purchase_enabled,false);assert.equal(request.refusalgraph_live_lookup_enabled,false);assert.equal(request.executes_actions,false);assertNoEnabledFlags(request);
});

test("blocked handshake response permits neither trust nor action",()=>{
  const response=readJson(responsePath);assert.equal(response.handshake_decision,"blocked");assert.equal(response.trust_allowed,false);assert.equal(response.action_allowed,false);assert.equal(response.blocked,true);assert.equal(response.approval_required,true);assert.equal(response.gareth_final_approval_required,true);assert.equal(response.executes_actions,false);assert.ok((response.missing_evidence as unknown[]).length>0);assertNoEnabledFlags(response);
});

test("approval placeholder cannot enable networking, trust, lookup, or execution",()=>{
  const approval=readJson(approvalPath);assert.equal(approval.status,"placeholder_only_blocked");assert.equal(approval.handshake_decision,"blocked");assert.equal(approval.trust_allowed,false);assert.equal(approval.action_allowed,false);assert.equal(approval.executes_actions,false);assertNoEnabledFlags(approval);
  const requirements=approval.approval_requirements as Record<string,unknown>;for(const key of ["human_approval_recorded","gareth_final_approval_recorded","technical_validation_complete","security_review_complete","privacy_review_complete","legal_review_complete"])assert.equal(requirements[key],false,key);
});

test("handshake guide and schema define required declarations, checks, and RefusalGraph boundary",()=>{
  const guide=readFileSync(guidePath,"utf8"),schema=readFileSync(schemaPath,"utf8");
  for(const heading of ["Handshake Status","Purpose","Acting Agent Declaration","Receiving System Checks","Required Evidence","Risk and Impact Classification","Human Approval Requirements","Trust Receipt Exchange","Blocked Action Categories","Agent-to-Agent Do / Do Not Table","Future Machine-to-Machine Trust Use","RefusalGraph Relationship","Gareth Final Approval Gate"])assert.match(guide,new RegExp(`## ${heading}`));
  assert.match(guide,/evaluates proposed agent actions before they happen/i);assert.match(guide,/trust handshake does not mean automatic trust/i);assert.match(guide,/trust handshake does not execute the proposed action/i);assert.match(guide,/trust handshake does not bypass human approval/i);assert.match(guide,/High-impact actions require explicit approval/i);assert.match(guide,/must not move money, publish, email, deploy, buy, sell, sign up users, track users, scrape live targets, activate billing, or make automatic purchases/i);assert.match(guide,/External agent-to-agent use is disabled unless explicitly approved by Gareth/i);
  for(const field of ["handshake_id","acting_agent_id","acting_agent_name","acting_agent_type","acting_agent_purpose","receiving_system","proposed_action","action_category","impact_level","target","evidence_summary","evidence_references","requested_permissions","human_approval_status","prior_receipt_ids","requested_decision","timestamp","handshake_decision","trust_allowed","action_allowed","blocked","risk_level","approval_required","gareth_final_approval_required","reasons","missing_evidence","required_next_steps","receipt_id","receipt_status","refusalgraph_signal_reference"])assert.match(schema,new RegExp(`\`${field}\``),field);
  assert.match(schema,/not a live protocol/i);assert.match(schema,/must not be exposed externally/i);assert.match(schema,/must not trigger actions/i);assert.match(schema,/must not accept live customer data/i);assert.match(schema,/must not connect to third-party systems/i);assert.match(schema,/RefusalGraph references are local and draft-only/i);
});

test("handshake pack contains no live endpoints, credentials, tracking IDs, wallets, or payment links",()=>{
  const source=[guidePath,schemaPath,configPath,requestPath,responsePath,approvalPath].map(path=>readFileSync(path,"utf8")).join("\n");
  assert.doesNotMatch(source,/https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source,/\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
