import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const quickstartPath = "docs/clone-and-run-quickstart.md";
const repoCloneUrl = "https://github.com/Gareth1953/agent-trust-gate.git";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("clone-and-run quickstart exists and is linked from README", () => {
  assert.equal(existsSync(join(root, quickstartPath)), true, quickstartPath);
  assert.match(read("README.md"), /\(docs\/clone-and-run-quickstart\.md\)/);
});

test("quickstart records the correct public clone URL and local commands", () => {
  const doc = read(quickstartPath);

  assert.match(doc, new RegExp(escapeRegExp(`git clone ${repoCloneUrl}`)));
  assert.match(doc, /\bnpm install\b/);
  assert.match(doc, /\bnpm test\b/);
  assert.match(doc, /\bnpm run build\b/);
  assert.match(doc, /\bnpm run typecheck\b/);
  assert.match(doc, /\bnpm run demo:gate:allow\b/);
  assert.match(doc, /\bnpm run proof:money-gate\b/);
});

test("quickstart keeps public contact and core safety line", () => {
  const doc = read(quickstartPath);

  assert.match(doc, new RegExp(escapeRegExp(contactEmail)));
  assert.doesNotMatch(doc, new RegExp(escapeRegExp(oldEmail), "i"));
  assert.match(doc, new RegExp(escapeRegExp(coreLine)));
  assert.match(doc, /local_demo_only/);
  assert.match(doc, /No live APIs/i);
  assert.match(doc, /live payments/i);
  assert.match(doc, /real settlement/i);
  assert.match(doc, /No signed gate pass means no settlement/i);
});

test("quickstart explains review assets without creating live capability", () => {
  const doc = read(quickstartPath);

  for (const expected of [
    "agent-trust-gate.manifest.json",
    "schemas/",
    "examples/",
    "docs/",
    "public/index.html",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected)));
  }

  assert.match(doc, /do\s+not\s+execute\s+the\s+requested\s+action\s+or\s+settlement/i);
  assert.match(doc, /not a hosted service, live API, production payment system/i);
});

test("launch records mention P3-M110 onboarding", () => {
  assert.match(read("docs/public-launch-record.md"), /P3-M110 adds the public clone-and-run developer onboarding pack/i);
  assert.match(read("docs/p3-mission-register.md"), /P3-M110 \| Public Clone-and-Run Developer Onboarding Pack/i);
});

test("quickstart does not introduce active live-action language or sensitive values", () => {
  const doc = read(quickstartPath);

  for (const forbidden of [
    /\blive API is active\b/i,
    /\blive APIs are active\b/i,
    /\blive payments are active\b/i,
    /\bsettlement execution is active\b/i,
    /\bhosted service is available\b/i,
    /\bproduction signing is active\b/i,
    /\bautomated agent contact is active\b/i,
    /\boutreach automation is active\b/i,
    /\bAUC is integrated\b/i,
    /\bAgent Contact System is integrated\b/i,
    /\bexecutes actions\b/i,
    /\bmoves money\b/i,
    /\bdeploys infrastructure\b/i,
  ]) {
    assert.doesNotMatch(doc, forbidden);
  }

  assert.doesNotMatch(doc, /sk_(?:live|test)_[a-z0-9]{16,}/i);
  assert.doesNotMatch(doc, /AKIA[0-9A-Z]{16}/);
  assert.doesNotMatch(doc, /gh[pousr]_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(doc, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i);
  assert.doesNotMatch(doc, /\b0x[a-f0-9]{40}\b/i);
  assert.doesNotMatch(doc, /\b(?:enable|activate|configure|connect|execute)\s+(?:x402|AP2|Stripe|payment processing|payment rail)\b/i);
});
