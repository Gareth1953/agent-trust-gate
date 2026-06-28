import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const configPath=resolve("config/commercial-launch-control.json");
const blockedPath=resolve("examples/commercial-launch-blocked.json");
const placeholderPath=resolve("examples/commercial-launch-approved-placeholder.json");
const docPath=resolve("docs/commercial-launch-control.md");
const activationFlags=["launch_enabled","deployment_enabled","public_binding_enabled","publishing_enabled","package_publishing_enabled","outreach_enabled","agent_contact_enabled","external_scanning_enabled","signup_enabled","personal_data_collection_enabled","billing_enabled","payment_enabled","customer_charging_enabled","tracking_enabled","analytics_enabled","automatic_purchase_enabled","autonomous_commercial_action_enabled"];

function readJson(path:string):Record<string,unknown>{return JSON.parse(readFileSync(path,"utf8")) as Record<string,unknown>;}
function assertNoEnabledFlags(value:unknown,path="root"):void{if(Array.isArray(value)){value.forEach((item,index)=>assertNoEnabledFlags(item,`${path}[${index}]`));return;}if(typeof value!=="object"||value===null)return;for(const [key,item] of Object.entries(value)){if(key.endsWith("_enabled"))assert.equal(item,false,`${path}.${key}`);assertNoEnabledFlags(item,`${path}.${key}`);}}

test("commercial launch control exists with every activation flag disabled",()=>{
  assert.equal(existsSync(configPath),true);const config=readJson(configPath);
  assert.equal(config.status,"local_readiness_only");assert.equal(config.version,"0.1.0");assert.equal(config.default_decision,"block");
  for(const flag of activationFlags)assert.equal(config[flag],false,flag);
  assertNoEnabledFlags(config);
});

test("commercial launch control requires human validation and Gareth final approval",()=>{
  const config=readJson(configPath);
  for(const requirement of ["requires_human_approval","requires_gareth_final_approval","requires_technical_validation","requires_commercial_validation","requires_legal_review"])assert.equal(config[requirement],true,requirement);
});

test("blocked and placeholder examples cannot enable or execute launch",()=>{
  assert.equal(existsSync(blockedPath),true);assert.equal(existsSync(placeholderPath),true);
  const blocked=readJson(blockedPath),placeholder=readJson(placeholderPath);
  assert.equal(blocked.decision,"blocked");assert.equal(blocked.executes_actions,false);assertNoEnabledFlags(blocked);
  assert.equal(placeholder.status,"placeholder_only_blocked");assert.equal(placeholder.decision,"blocked");assert.equal(placeholder.executes_actions,false);assertNoEnabledFlags(placeholder);
  const approvals=placeholder.approval_requirements as Record<string,unknown>;assert.equal(approvals.gareth_final_approval_recorded,false);assert.equal(approvals.technical_validation_complete,false);assert.equal(approvals.commercial_validation_complete,false);assert.equal(approvals.legal_review_complete,false);
});

test("commercial launch control documentation defines every governance gate without live targets",()=>{
  assert.equal(existsSync(docPath),true);const source=readFileSync(docPath,"utf8");
  for(const heading of ["Launch Status","Disabled Capabilities","Human Approval Requirements","Technical Readiness Checklist","Commercial Readiness Checklist","Legal / Compliance Readiness Checklist","Absolute Safety Blocks","Launch Decision Table","Gareth Final Approval Gate"])assert.match(source,new RegExp(`## ${heading.replace("/","\\/")}`));
  assert.match(source,/must not publish, sell, email, sign up users, charge, bill, buy, scan live targets, or deploy/i);assert.match(source,/must never happen automatically/i);assert.match(source,/BLOCKED: LOCAL READINESS ONLY/);
  const all=[source,readFileSync(configPath,"utf8"),readFileSync(blockedPath,"utf8"),readFileSync(placeholderPath,"utf8")].join("\n");
  assert.doesNotMatch(all,/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|https?:\/\/|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/i);
});
