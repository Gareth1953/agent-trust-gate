import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { createRefusalGraphSignal, normalizeRefusalReasons, type RefusalGraphReceiptInput } from "../src/index.js";

const docPath=resolve("docs/refusalgraph-signal-engine.md");
const configPath=resolve("config/refusalgraph-signal-engine-safety.json");
const inputPath=resolve("examples/refusalgraph-signal-engine-input-receipt.json");
const outputPath=resolve("examples/refusalgraph-signal-engine-output-signal.json");
const rejectedPath=resolve("examples/refusalgraph-signal-private-data-rejected.json");
const priorTests=[resolve("test/agent-to-agent-trust-handshake.test.ts"),resolve("test/refusalgraph-core.test.ts"),resolve("test/agent-clearing-house-foundation.test.ts")];
const outputKeys=["signal_id","source_receipt_id","action_category","proposed_action_type","refusal_type","refusal_reason_codes","risk_level","impact_level","evidence_status","approval_status","evidence_hashes","private_data_included","anonymised","pseudonymised","evidence_hash_only","recommended_next_step","created_at","status"].sort();

function receipt(overrides:Partial<RefusalGraphReceiptInput>={}):RefusalGraphReceiptInput{return{receipt_id:"local-receipt-test",decision:"blocked",allowed:false,blocked:true,action_category:"other",proposed_action_type:"other",risk_level:"medium",impact_level:"medium",evidence_status:"incomplete",approval_status:"not_requested",reasons:["Policy blocked the request."],missing_evidence:[],evidence_hashes:[],timestamp:"2026-06-29T12:00:00.000Z",...overrides};}
function readJson(path:string):Record<string,unknown>{return JSON.parse(readFileSync(path,"utf8")) as Record<string,unknown>;}
function assertNoEnabledFlags(value:unknown,path="root"):void{if(Array.isArray(value)){value.forEach((item,index)=>assertNoEnabledFlags(item,`${path}[${index}]`));return;}if(typeof value!=="object"||value===null)return;for(const [key,item] of Object.entries(value)){if(key.endsWith("_enabled"))assert.equal(item,false,`${path}.${key}`);assertNoEnabledFlags(item,`${path}.${key}`);}}

test("signal engine files exist and prior handshake, RefusalGraph, and clearing tests remain present",()=>{
  for(const path of [docPath,configPath,inputPath,outputPath,rejectedPath,...priorTests])assert.equal(existsSync(path),true,path);
});

test("blocked, approval-required, and missing-evidence receipts create refusal signals",()=>{
  const blocked=createRefusalGraphSignal(receipt());assert.ok(blocked);assert.equal(blocked.refusal_type,"policy_blocked");assert.equal(blocked.recommended_next_step,"refuse_transaction");
  const approval=createRefusalGraphSignal(receipt({decision:"approval_required",blocked:false,reasons:["Human approval is missing."],approval_status:"not_requested"}));assert.ok(approval);assert.equal(approval.refusal_type,"approval_required");assert.ok(approval.refusal_reason_codes.includes("missing_human_approval"));assert.equal(approval.recommended_next_step,"require_human_approval");
  const evidence=createRefusalGraphSignal(receipt({decision:"missing_evidence",blocked:false,reasons:["Evidence is incomplete."],missing_evidence:["local-placeholder"]}));assert.ok(evidence);assert.equal(evidence.refusal_type,"missing_evidence");assert.ok(evidence.refusal_reason_codes.includes("missing_evidence"));assert.equal(evidence.recommended_next_step,"require_more_evidence");
});

test("fully allowed low-risk receipt creates no refusal signal",()=>{
  assert.equal(createRefusalGraphSignal(receipt({decision:"allow",allowed:true,blocked:false,risk_level:"low",impact_level:"low",evidence_status:"sufficient",approval_status:"not_requested",reasons:[],missing_evidence:[]})),null);
});

test("signal output is strictly allowlisted, pseudonymised, hash-only, and private-data-free",()=>{
  const privateMarker="PRIVATE_CUSTOMER_VALUE_SHOULD_NOT_COPY";
  const signal=createRefusalGraphSignal({...receipt({action_category:"customer_name_in_category",proposed_action_type:"send_to_private_target",reasons:["Private data risk.","Unknown custom private reason."],evidence_hashes:["raw evidence text","sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]}),customer_name:privateMarker,customer_email:privateMarker,company_name:privateMarker,bank_account:privateMarker,card_number:privateMarker,wallet_address:privateMarker,api_key:privateMarker,access_token:privateMarker,private_document_text:privateMarker,invoice_number:privateMarker,contract_text:privateMarker,real_agent_endpoint:privateMarker,real_url:privateMarker,real_email_content:privateMarker});
  assert.ok(signal);assert.deepEqual(Object.keys(signal).sort(),outputKeys);assert.equal(signal.action_category,"other");assert.equal(signal.proposed_action_type,"other");assert.equal(signal.private_data_included,false);assert.equal(signal.anonymised,true);assert.equal(signal.pseudonymised,true);assert.equal(signal.evidence_hash_only,true);assert.equal(signal.status,"draft_only");assert.equal(signal.source_receipt_id.startsWith("receipt_"),true);assert.deepEqual(signal.evidence_hashes,["sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]);assert.doesNotMatch(JSON.stringify(signal),new RegExp(privateMarker));
});

test("reason normalisation maps required phrases without copying raw text",()=>{
  const cases:Array<[string,string]>=[
    ["Human approval is missing.","missing_human_approval"],
    ["Evidence is incomplete.","missing_evidence"],
    ["Identity is unclear.","weak_or_missing_identity"],
    ["Payment intent is unclear.","payment_intent_unclear"],
    ["Money movement requested.","money_movement_requested"],
    ["Publish the landing page.","publishing_requested"],
    ["Deploy the package.","deployment_requested"],
    ["Unrecognised custom concern.","unknown_or_unclear_intent"],
  ];
  for(const [reason,expected] of cases){const codes=normalizeRefusalReasons([reason],{approval_status:"approved",risk_level:"medium"});assert.ok(codes.includes(expected as never),`${reason} -> ${expected}`);assert.doesNotMatch(JSON.stringify(codes),new RegExp(reason.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i"));}
});

test("identity and payment ambiguity select safe next steps",()=>{
  const identity=createRefusalGraphSignal(receipt({decision:"identity_unclear",reasons:["Identity is unclear."],approval_status:"approved"}));assert.ok(identity);assert.equal(identity.recommended_next_step,"require_identity_verification");
  const payment=createRefusalGraphSignal(receipt({decision:"payment_intent_unclear",action_category:"financial_action",proposed_action_type:"initiate_payment",reasons:["Payment intent is unclear."],approval_status:"approved"}));assert.ok(payment);assert.equal(payment.recommended_next_step,"clarify_payment_intent");
});

test("tracked example output stays aligned with the pure engine",()=>{
  const input=readJson(inputPath) as unknown as RefusalGraphReceiptInput,expected=readJson(outputPath);assert.deepEqual(createRefusalGraphSignal(input),expected);
  const rejected=readJson(rejectedPath);assert.equal(rejected.private_data_included,false);assert.equal(rejected.output_allowed_fields_only,true);assert.deepEqual(rejected.private_fields_copied,[]);assertNoEnabledFlags(rejected);
});

test("signal engine safety config keeps all persistence, network, fee, payment, and execution flags disabled",()=>{
  const config=readJson(configPath);assert.equal(config.status,"draft_only");assert.equal(config.version,"0.1.0");for(const requirement of ["requires_human_approval","requires_gareth_final_approval","requires_technical_validation","requires_security_review","requires_privacy_review","requires_legal_review","requires_commercial_validation"])assert.equal(config[requirement],true,requirement);assertNoEnabledFlags(config);
  for(const flag of ["signal_engine_enabled","signal_persistence_enabled","network_enabled","external_lookup_enabled","public_api_enabled","agent_to_agent_lookup_enabled","machine_to_machine_fee_enabled","payment_enabled","billing_enabled","settlement_enabled","tracking_enabled","signup_enabled","deployment_enabled","publishing_enabled","outreach_enabled","webhook_enabled","third_party_connections_enabled","private_data_export_enabled","action_execution_enabled","automatic_purchase_enabled"])assert.equal(config[flag],false,flag);
});

test("signal engine docs and examples contain no live endpoints, identities, credentials, wallets, or payment links",()=>{
  const source=[docPath,configPath,inputPath,outputPath,rejectedPath].map(path=>readFileSync(path,"utf8")).join("\n");assert.match(source,/does not execute actions/i);assert.match(source,/does not perform network lookups/i);assert.match(source,/does not expose private data/i);assert.match(source,/All live, commercial, network, persistent, or external use requires Gareth final approval/i);
  assert.doesNotMatch(source,/https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);assert.doesNotMatch(source,/\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
