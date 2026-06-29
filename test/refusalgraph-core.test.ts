import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const corePath=resolve("docs/refusalgraph-core.md");
const schemaPath=resolve("docs/refusalgraph-signal-schema-draft.md");
const configPath=resolve("config/refusalgraph-safety.json");
const signalPath=resolve("examples/refusalgraph-signal-draft.json");
const lookupPath=resolve("examples/refusalgraph-lookup-draft.json");
const blockedPath=resolve("examples/refusalgraph-lookup-response-blocked.json");
const commercialPath=resolve("examples/refusalgraph-commercial-placeholder.json");
const disabledFlags=["refusalgraph_enabled","network_enabled","external_lookup_enabled","public_api_enabled","agent_to_agent_lookup_enabled","machine_to_machine_fee_enabled","commercial_enabled","receipt_verification_fee_enabled","payment_enabled","billing_enabled","tracking_enabled","analytics_enabled","signup_enabled","deployment_enabled","publishing_enabled","outreach_enabled","webhook_enabled","third_party_connections_enabled","live_customer_data_enabled","private_data_collection_enabled","private_data_export_enabled","identity_resolution_enabled","wallet_lookup_enabled","action_execution_enabled","automatic_purchase_enabled"];

function readJson(path:string):Record<string,unknown>{return JSON.parse(readFileSync(path,"utf8")) as Record<string,unknown>;}
function assertNoEnabledFlags(value:unknown,path="root"):void{if(Array.isArray(value)){value.forEach((item,index)=>assertNoEnabledFlags(item,`${path}[${index}]`));return;}if(typeof value!=="object"||value===null)return;for(const [key,item] of Object.entries(value)){if(key.endsWith("_enabled"))assert.equal(item,false,`${path}.${key}`);assertNoEnabledFlags(item,`${path}.${key}`);}}

test("RefusalGraph core files exist and every service or commercial surface is disabled",()=>{
  for(const path of [corePath,schemaPath,configPath,signalPath,lookupPath,blockedPath,commercialPath])assert.equal(existsSync(path),true,path);
  const config=readJson(configPath);assert.equal(config.status,"draft_only");assert.equal(config.version,"0.1.0");assert.equal(config.default_lookup_decision,"blocked");assert.equal(config.failure_mode,"fail_closed");
  for(const flag of disabledFlags)assert.equal(config[flag],false,flag);assertNoEnabledFlags(config);
});

test("RefusalGraph requires human, Gareth, technical, security, privacy, and legal review",()=>{
  const config=readJson(configPath);
  for(const requirement of ["requires_human_approval","requires_gareth_final_approval","requires_technical_validation","requires_security_review","requires_privacy_review","requires_legal_review"])assert.equal(config[requirement],true,requirement);
});

test("draft refusal signal is privacy-minimised and non-executing",()=>{
  const signal=readJson(signalPath);assert.equal(signal.status,"draft_only");assert.equal(signal.private_data_included,false);assert.equal(signal.anonymised,true);assert.equal(signal.pseudonymised,true);assert.equal(signal.evidence_hash_only,true);assert.equal(signal.action_execution_enabled,false);assert.equal(signal.network_enabled,false);assert.equal(signal.external_lookup_enabled,false);assert.equal(signal.machine_to_machine_fee_enabled,false);assert.equal(signal.executes_actions,false);assertNoEnabledFlags(signal);
});

test("draft refusal lookup does not execute or access a network",()=>{
  const lookup=readJson(lookupPath);assert.equal(lookup.query_status,"draft_only");assert.equal(lookup.result_status,"not_executed");assert.equal(lookup.refusalgraph_enabled,false);assert.equal(lookup.network_enabled,false);assert.equal(lookup.external_lookup_enabled,false);assert.equal(lookup.agent_to_agent_lookup_enabled,false);assert.equal(lookup.payment_enabled,false);assert.equal(lookup.executes_actions,false);assertNoEnabledFlags(lookup);
});

test("blocked lookup response remains blocked pending reviews and Gareth approval",()=>{
  const response=readJson(blockedPath);assert.equal(response.lookup_decision,"blocked");assert.equal(response.result_status,"not_executed");assert.equal(response.private_data_included,false);assert.equal(response.executes_actions,false);assertNoEnabledFlags(response);
  const review=response.review_state as Record<string,unknown>;assert.equal(review.requires_gareth_final_approval,true);for(const key of ["gareth_final_approval_recorded","technical_validation_complete","security_review_complete","legal_review_complete"])assert.equal(review[key],false,key);
});

test("commercial placeholder defines no live tariff, fee, network, payment, or execution",()=>{
  const commercial=readJson(commercialPath);assert.equal(commercial.commercial_status,"placeholder_only");assert.equal(commercial.possible_fee_model,"per_receipt_verification");assert.equal(commercial.possible_fee_amount,"£0.01");assert.equal(commercial.machine_to_machine_fee_enabled,false);assert.equal(commercial.payment_enabled,false);assert.equal(commercial.billing_enabled,false);assert.equal(commercial.network_enabled,false);assert.equal(commercial.external_lookup_enabled,false);assert.equal(commercial.public_api_enabled,false);assert.equal(commercial.deployment_enabled,false);assert.equal(commercial.action_execution_enabled,false);assert.equal(commercial.requires_gareth_final_approval,true);assert.equal(commercial.executes_actions,false);assertNoEnabledFlags(commercial);
});

test("RefusalGraph documents define the draft signal vocabulary and absolute boundaries",()=>{
  const core=readFileSync(corePath,"utf8"),schema=readFileSync(schemaPath,"utf8");
  for(const heading of ["What RefusalGraph Is","Why Refusal Intelligence Matters","How It Differs From Agent Payments","How It Differs From Agent Communication Protocols","What Counts As A Refusal Signal","Refusal Signal Categories","Evidence Without Private Data","Human Approval And Risk Controls","Future Machine-to-Machine Use","Future Commercial Fee Model","Current Status","Absolute Safety Blocks","Gareth Final Approval Gate"])assert.match(core,new RegExp(`## ${heading}`));
  assert.match(core,/RefusalGraph does not move money/i);assert.match(core,/does not expose private customer data/i);assert.match(core,/does not identify real customers, companies, agents, accounts, wallets, or systems/i);assert.match(core,/All external and commercial use requires Gareth final approval/i);
  for(const field of ["signal_id","source_receipt_id","action_category","proposed_action_type","refusal_type","refusal_reason_codes","risk_level","impact_level","evidence_status","approval_status","private_data_included","anonymised","pseudonymised","evidence_hash_only","recommended_next_step","created_at","status"])assert.match(schema,new RegExp(`\`${field}\``),field);
  for(const value of ["blocked","approval_required","limited","refused","missing_evidence","identity_unclear","payment_intent_unclear","high_risk_action","policy_blocked","require_human_approval","require_more_evidence","require_identity_verification","cap_spend_limit","refuse_transaction","allow_low_risk_only","create_receipt_only"])assert.match(schema,new RegExp(`\`${value}\``),value);
});

test("RefusalGraph pack contains no live endpoints, identities, credentials, wallets, or payment links",()=>{
  const source=[corePath,schemaPath,configPath,signalPath,lookupPath,blockedPath,commercialPath].map(path=>readFileSync(path,"utf8")).join("\n");
  assert.doesNotMatch(source,/https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source,/\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
