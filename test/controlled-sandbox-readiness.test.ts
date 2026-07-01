import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createControlledSandboxRunId, runControlledSandboxReadiness, summariseControlledSandboxRun, validateSandboxAgentAccess, type ControlledSandboxReadinessInput } from "../src/controlled-sandbox-readiness.js";
import { runControlledSandboxReadinessCli } from "../src/controlled-sandbox-readiness-cli.js";

const root=process.cwd();
const allowedPath=join(root,"examples","controlled-sandbox-readiness-input-allowed.json");
const privateFields=["customer_name","customer_email","company_name","bank_account","card_number","wallet_address","api_key","access_token","private_document_text","invoice_number","contract_text","real_agent_endpoint","real_url","real_email_content"];
const load=(path=allowedPath)=>JSON.parse(readFileSync(path,"utf8")) as ControlledSandboxReadinessInput;

test("allowlisted entitled sandbox agent runs the local engine",()=>{
 const input=load(); assert.equal(validateSandboxAgentAccess(input).sandbox_access_status,"sandbox_clearing_allowed");
 const result=runControlledSandboxReadiness(input);
 assert.equal(result.sandbox_access_status,"sandbox_clearing_allowed");
 assert.equal(result.requesting_agent_allowlisted,true); assert.equal(result.sandbox_entitlement_present,true);
 for(const key of ["engine_run_id","decision","caution_level","approval_required","action_allowed","action_blocked","clearing_receipt_id","verification_result","evidence_bundle_id","replay_status","integrity_score","fee_placeholder_count"] as const) assert.notEqual(result[key],null,key);
});

test("non-allowlisted agent is denied before engine use",()=>{
 const result=runControlledSandboxReadiness(load(join(root,"examples","controlled-sandbox-readiness-agent-denied.json")));
 assert.equal(result.sandbox_access_status,"agent_not_allowlisted"); assert.equal(result.requesting_agent_allowlisted,false);
 assert.equal(result.engine_run_id,null); assert.equal(result.action_executed,false);
});

test("missing entitlement is denied before engine use",()=>{
 const result=runControlledSandboxReadiness(load(join(root,"examples","controlled-sandbox-readiness-entitlement-required.json")));
 assert.equal(result.sandbox_access_status,"sandbox_entitlement_required"); assert.equal(result.requesting_agent_allowlisted,true);
 assert.equal(result.sandbox_entitlement_present,false); assert.equal(result.engine_run_id,null);
});

test("result and summary keep every live flag false",()=>{
 const result=runControlledSandboxReadiness(load()); const summary=summariseControlledSandboxRun(result);
 for(const value of [result,summary]) { for(const key of ["private_data_included","network_lookup_performed","external_lookup_performed","public_api_enabled","tracking_triggered","analytics_triggered","payment_or_fee_triggered","billing_triggered","settlement_triggered","machine_to_machine_fee_triggered","action_executed","deployed","published"] as const) assert.equal(value[key],false,key); assert.equal(value.status,"sandbox_only"); }
});

test("IDs are deterministic and private fields never enter output",()=>{
 const id=createControlledSandboxRunId("private@example.test"); assert.equal(id,createControlledSandboxRunId("private@example.test")); assert.doesNotMatch(id,/private|example/i);
 const input=load(); Object.assign(input,{customer_name:"Private Person",api_key:"secret"}); Object.assign(input.clearing_request,{bank_account:"account"});
 const output=JSON.stringify(runControlledSandboxReadiness(input)); for(const field of privateFields) assert.equal(output.includes(field),false); assert.doesNotMatch(output,/Private Person|secret|account/);
});

test("CLI accepts local JSON and pretty output",()=>{
 const stdout:string[]=[]; const stderr:string[]=[]; assert.equal(runControlledSandboxReadinessCli([allowedPath,"--pretty"],{stdout:v=>stdout.push(v),stderr:v=>stderr.push(v)}),0); assert.equal(stderr.length,0); assert.match(stdout[0]??"",/\n  "sandbox_run_id"/); assert.equal((JSON.parse(stdout[0]??"{}") as Record<string,unknown>).public_api_enabled,false);
});

test("CLI safely handles missing path, file, JSON, agent, allowlist, and request",()=>{
 const invalid=join(root,"sandbox-invalid.tmp.json"); writeFileSync(invalid,"{bad","utf8"); const temps=[invalid];
 const cases:Array<[string[],string]>=[[[],"MISSING_INPUT_FILE"],[[join(root,"sandbox-absent.json")],"INPUT_FILE_UNREADABLE"],[[invalid],"INVALID_JSON"]];
 for(const key of ["requesting_agent","allowed_sandbox_agents","clearing_request"]){const input=load() as unknown as Record<string,unknown>; delete input[key]; const p=join(root,`sandbox-missing-${key}.tmp.json`); writeFileSync(p,JSON.stringify(input)); temps.push(p); cases.push([[p],"INVALID_INPUT"]);}
 try{for(const [args,expected] of cases){const stderr:string[]=[]; assert.equal(runControlledSandboxReadinessCli(args,{stdout:()=>undefined,stderr:v=>stderr.push(v)}),1); assert.equal((JSON.parse(stderr[0]??"{}") as {error?:{code?:string}}).error?.code,expected); for(const field of privateFields) assert.equal((stderr[0]??"").includes(field),false);}}finally{for(const p of temps)rmSync(p,{force:true});}
});

test("required docs and examples exist with live access disabled",()=>{
 for(const file of ["docs/controlled-sandbox-readiness.md","examples/controlled-sandbox-readiness-input-allowed.json","examples/controlled-sandbox-readiness-output-allowed.json","examples/controlled-sandbox-readiness-agent-denied.json","examples/controlled-sandbox-readiness-entitlement-required.json","examples/controlled-sandbox-readiness-private-data-rejected.json","examples/controlled-sandbox-readiness-live-access-blocked.json"]) assert.equal(existsSync(join(root,file)),true,file);
 const blocked=JSON.parse(readFileSync(join(root,"examples","controlled-sandbox-readiness-live-access-blocked.json"),"utf8")) as Record<string,unknown>; for(const [key,value] of Object.entries(blocked)) if(key.endsWith("_enabled")) assert.equal(value,false,key);
});
