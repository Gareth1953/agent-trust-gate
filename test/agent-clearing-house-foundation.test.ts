import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const foundationPath=resolve("docs/agent-clearing-house-foundation.md");
const treatyDocPath=resolve("docs/agent-treaty-draft.md");
const decisionsPath=resolve("docs/agent-clearing-decision-types.md");
const configPath=resolve("config/agent-clearing-house-safety.json");
const requestPath=resolve("examples/agent-clearing-request-draft.json");
const treatyPath=resolve("examples/agent-treaty-draft.json");
const responsePath=resolve("examples/agent-clearing-response-blocked.json");
const feePath=resolve("examples/agent-clearing-fee-placeholder.json");
const handshakeTestPath=resolve("test/agent-to-agent-trust-handshake.test.ts");
const refusalGraphTestPath=resolve("test/refusalgraph-core.test.ts");
const disabledFlags=["agent_clearing_house_enabled","clearing_network_enabled","agent_treaty_enabled","agent_receipt_exchange_enabled","refusalgraph_live_lookup_enabled","external_agent_connections_enabled","public_api_enabled","public_protocol_enabled","machine_to_machine_trust_enabled","machine_to_machine_fee_enabled","commercial_enabled","payment_enabled","billing_enabled","settlement_enabled","tracking_enabled","analytics_enabled","signup_enabled","deployment_enabled","publishing_enabled","outreach_enabled","email_sending_enabled","webhook_enabled","third_party_connections_enabled","live_customer_data_enabled","private_data_collection_enabled","private_data_export_enabled","action_execution_enabled","automatic_clearance_enabled","purchase_enabled","automatic_purchase_enabled","external_scanning_enabled"];

function readJson(path:string):Record<string,unknown>{return JSON.parse(readFileSync(path,"utf8")) as Record<string,unknown>;}
function assertNoEnabledFlags(value:unknown,path="root"):void{if(Array.isArray(value)){value.forEach((item,index)=>assertNoEnabledFlags(item,`${path}[${index}]`));return;}if(typeof value!=="object"||value===null)return;for(const [key,item] of Object.entries(value)){if(key.endsWith("_enabled"))assert.equal(item,false,`${path}.${key}`);assertNoEnabledFlags(item,`${path}.${key}`);}}

test("clearing foundation files exist while handshake and RefusalGraph tests remain present",()=>{
  for(const path of [foundationPath,treatyDocPath,decisionsPath,configPath,requestPath,treatyPath,responsePath,feePath,handshakeTestPath,refusalGraphTestPath])assert.equal(existsSync(path),true,path);
});

test("clearing config disables every network, treaty, receipt, fee, payment, and action surface",()=>{
  const config=readJson(configPath);assert.equal(config.status,"draft_only");assert.equal(config.version,"0.1.0");assert.equal(config.default_clearance_decision,"draft_only_not_executed");assert.equal(config.failure_mode,"fail_closed");
  for(const flag of disabledFlags)assert.equal(config[flag],false,flag);assertNoEnabledFlags(config);
});

test("clearing foundation requires all human, Gareth, technical, security, privacy, legal, and commercial gates",()=>{
  const config=readJson(configPath);
  for(const requirement of ["requires_human_approval","requires_gareth_final_approval","requires_technical_validation","requires_security_review","requires_privacy_review","requires_legal_review","requires_commercial_validation"])assert.equal(config[requirement],true,requirement);
});

test("draft clearing request remains local and non-executing",()=>{
  const request=readJson(requestPath);assert.equal(request.status,"draft_only");assert.equal(request.agent_clearing_house_enabled,false);assert.equal(request.clearing_network_enabled,false);assert.equal(request.external_agent_connections_enabled,false);assert.equal(request.refusalgraph_live_lookup_enabled,false);assert.equal(request.action_execution_enabled,false);assert.equal(request.payment_enabled,false);assert.equal(request.billing_enabled,false);assert.equal(request.machine_to_machine_fee_enabled,false);assert.equal(request.executes_actions,false);assertNoEnabledFlags(request);
});

test("draft Agent Treaty is non-binding, private-data-free, and non-executing",()=>{
  const treaty=readJson(treatyPath);assert.equal(treaty.status,"draft_only");assert.equal(treaty.private_data_included,false);assert.equal(treaty.refusalgraph_check_status,"not_executed");assert.equal(treaty.agent_treaty_enabled,false);assert.equal(treaty.clearing_network_enabled,false);assert.equal(treaty.payment_enabled,false);assert.equal(treaty.billing_enabled,false);assert.equal(treaty.settlement_enabled,false);assert.equal(treaty.action_execution_enabled,false);assert.equal(treaty.executes_actions,false);assertNoEnabledFlags(treaty);
});

test("blocked clearing response remains blocked pending evidence, approval, and reviews",()=>{
  const response=readJson(responsePath);assert.equal(response.clearance_decision,"block");assert.equal(response.clearance_allowed,false);assert.equal(response.action_allowed,false);assert.equal(response.blocked,true);assert.equal(response.executes_actions,false);assert.ok((response.missing_evidence as unknown[]).length>0);assertNoEnabledFlags(response);
  const review=response.review_state as Record<string,unknown>;assert.equal(review.requires_human_approval,true);assert.equal(review.requires_gareth_final_approval,true);for(const key of ["human_approval_recorded","gareth_final_approval_recorded","technical_validation_complete","security_review_complete","legal_review_complete","commercial_validation_complete"])assert.equal(review[key],false,key);
});

test("fee placeholder cannot enable clearance, network, fees, payment, billing, settlement, deployment, API, or execution",()=>{
  const fee=readJson(feePath);assert.equal(fee.commercial_status,"placeholder_only");assert.equal(fee.possible_fee_model,"per_clearance_or_receipt_verification");assert.equal(fee.possible_fee_amount,"£0.01");assert.equal(fee.agent_clearing_house_enabled,false);assert.equal(fee.clearing_network_enabled,false);assert.equal(fee.external_agent_connections_enabled,false);assert.equal(fee.public_api_enabled,false);assert.equal(fee.public_protocol_enabled,false);assert.equal(fee.machine_to_machine_fee_enabled,false);assert.equal(fee.payment_enabled,false);assert.equal(fee.billing_enabled,false);assert.equal(fee.settlement_enabled,false);assert.equal(fee.deployment_enabled,false);assert.equal(fee.action_execution_enabled,false);assert.equal(fee.requires_gareth_final_approval,true);assert.equal(fee.executes_actions,false);assertNoEnabledFlags(fee);
});

test("clearing, treaty, and decision documents define the required concepts and absolute boundaries",()=>{
  const foundation=readFileSync(foundationPath,"utf8"),treaty=readFileSync(treatyDocPath,"utf8"),decisions=readFileSync(decisionsPath,"utf8");
  for(const heading of ["What The Agent Clearing House Is","Why Agents Need A Clearing Layer","How It Differs From Agent Communication","How It Differs From Agent Payments","How It Uses Agent-to-Agent Handshakes","How It Uses RefusalGraph","Agent Treaty Concept","Agent Receipt Concept","Clearance Decision Types","Future Machine-to-Machine Fee Model","Current Status","Absolute Safety Blocks","Gareth Final Approval Gate"])assert.match(foundation,new RegExp(`## ${heading}`));
  assert.match(foundation,/Agent Clearing House does not move money/i);assert.match(foundation,/does not execute actions/i);assert.match(foundation,/future clearing and decision layer for agent-to-agent transactions/i);assert.match(foundation,/RefusalGraph provides negative trust intelligence/i);assert.match(foundation,/All live external use requires Gareth final approval/i);
  for(const field of ["treaty_id","requesting_agent_id","receiving_agent_id","requested_action","action_category","proposed_value","proposed_fee","payment_intent_status","requested_permissions","evidence_summary","evidence_hashes","approval_status","risk_level","impact_level","refusalgraph_check_status","clearance_required","completion_terms","dispute_terms","expiry_time","status"])assert.match(treaty,new RegExp(`\`${field}\``),field);
  assert.match(treaty,/not legally binding/i);assert.match(treaty,/does not execute payment/i);assert.match(treaty,/does not execute action/i);assert.match(treaty,/does not connect to external agents/i);assert.match(treaty,/does not expose private data/i);
  for(const decision of ["accept_with_limits","refuse","block","approval_required","require_more_evidence","require_identity_verification","require_refusalgraph_check","create_receipt_only","draft_only_not_executed"])assert.match(decisions,new RegExp(`\`${decision}\``),decision);
  assert.match(decisions,/do not execute actions/i);
});

test("clearing pack contains no live endpoints, identities, credentials, wallets, checkout, or payment links",()=>{
  const source=[foundationPath,treatyDocPath,decisionsPath,configPath,requestPath,treatyPath,responsePath,feePath].map(path=>readFileSync(path,"utf8")).join("\n");
  assert.doesNotMatch(source,/https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source,/\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
