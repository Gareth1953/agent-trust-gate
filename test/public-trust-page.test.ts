import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pagePath=resolve("docs/public-trust-page.md");
const faqPath=resolve("docs/public-trust-faq.md");
const configPath=resolve("config/public-trust-page.json");
const previewPath=resolve("examples/public-trust-page-preview.json");
const blockedPath=resolve("examples/public-trust-publication-blocked.json");
const disabledFlags=["public_page_enabled","deployment_enabled","public_binding_enabled","tracking_enabled","analytics_enabled","signup_enabled","contact_form_enabled","email_sending_enabled","billing_enabled","payment_enabled","outreach_enabled","external_scanning_enabled","automatic_purchase_enabled"];

function readJson(path:string):Record<string,unknown>{return JSON.parse(readFileSync(path,"utf8")) as Record<string,unknown>;}
function assertNoEnabledFlags(value:unknown,path="root"):void{if(Array.isArray(value)){value.forEach((item,index)=>assertNoEnabledFlags(item,`${path}[${index}]`));return;}if(typeof value!=="object"||value===null)return;for(const [key,item] of Object.entries(value)){if(key.endsWith("_enabled"))assert.equal(item,false,`${path}.${key}`);assertNoEnabledFlags(item,`${path}.${key}`);}}

test("public trust page documents and configuration exist with safe defaults",()=>{
  for(const path of [pagePath,faqPath,configPath,previewPath,blockedPath])assert.equal(existsSync(path),true,path);
  const config=readJson(configPath);assert.equal(config.status,"draft_only");assert.equal(config.version,"0.1.0");assert.equal(config.published,false);assert.equal(config.live_url,null);
  for(const flag of disabledFlags)assert.equal(config[flag],false,flag);assertNoEnabledFlags(config);
});

test("public trust page publication requires launch control, legal review, and Gareth approval",()=>{
  const config=readJson(configPath);
  assert.equal(config.requires_gareth_final_approval,true);assert.equal(config.requires_commercial_launch_control,true);assert.equal(config.requires_legal_review_before_publication,true);assert.equal(config.default_publication_decision,"blocked");
});

test("preview remains draft-only with no live URL or active capability",()=>{
  const preview=readJson(previewPath);assert.equal(preview.page_status,"draft_only");assert.equal(preview.public_page_enabled,false);assert.equal(preview.published,false);assert.equal(preview.deployment_enabled,false);assert.equal(preview.live_url,null);assert.equal(preview.final_approval_required,true);assert.equal(preview.requires_gareth_final_approval,true);assert.equal(preview.executes_actions,false);assertNoEnabledFlags(preview);
});

test("proposed trust page publication remains blocked",()=>{
  const blocked=readJson(blockedPath);assert.equal(blocked.proposed_action,"publish_public_trust_page");assert.equal(blocked.decision,"blocked");assert.equal(blocked.published,false);assert.equal(blocked.live_url,null);assert.equal(blocked.executes_actions,false);assertNoEnabledFlags(blocked);
  const state=blocked.control_state as Record<string,unknown>;assert.equal(state.public_page_enabled,false);assert.equal(state.deployment_enabled,false);assert.equal(state.gareth_final_approval_recorded,false);assert.equal(state.legal_review_completed,false);assert.equal(state.requires_gareth_final_approval,true);assert.equal(state.requires_legal_review_before_publication,true);
});

test("public trust content contains required claims, limits, and final human control",()=>{
  const page=readFileSync(pagePath,"utf8"),faq=readFileSync(faqPath,"utf8");
  for(const heading of ["What Agent Trust Gate Is","Why It Exists","The Problem It Solves","What It Checks Before Agent Action","Human Approval Gate","Evidence and Receipts","What Agent Trust Gate Does Not Claim","What Agent Trust Gate Will Never Do Automatically","Current Status","Trust Commitments","Example Use Cases","Final Human Control Statement"])assert.match(page,new RegExp(`## ${heading}`));
  assert.match(page,/pre-action governance and receipt layer/i);assert.match(page,/evaluates proposed actions before they happen/i);assert.match(page,/evidence-backed receipts/i);assert.match(page,/does not guarantee legality, truth, safety, compliance, security, accuracy, or zero harm/i);assert.match(page,/does not replace legal, financial, compliance, security, medical, or other professional advice/i);assert.match(page,/must not autonomously publish, email, charge, buy, sell, sign up users, deploy, scan live targets, or move money/i);assert.match(page,/Gareth final approval is required before any commercial launch or live activation/i);
  for(const question of ["Is Agent Trust Gate live?","Does Agent Trust Gate perform actions itself?","Can it approve money movement automatically?","Does it guarantee compliance?","Does it replace human approval?","Does it store private customer data?","Can it be used by other agents?","What is a trust receipt?","What happens when an action is too risky?","Who makes the final decision?","Can it be connected to commercial systems yet?"])assert.match(faq,new RegExp(`## ${question.replace(/[?]/g,"\\?")}`));
});

test("public trust pack contains no live URLs, credentials, tracking IDs, or payment links",()=>{
  const source=[pagePath,faqPath,configPath,previewPath,blockedPath].map(path=>readFileSync(path,"utf8")).join("\n");
  assert.doesNotMatch(source,/https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|G-[A-Z0-9]{8,}/i);
});
