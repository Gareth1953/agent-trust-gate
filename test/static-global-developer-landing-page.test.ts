import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const pagePath = "public/index.html";
const stylePath = "public/styles.css";
const coreRule = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

test("static landing page and local stylesheet exist", () => {
  assert.equal(existsSync(pagePath), true);
  assert.equal(existsSync(stylePath), true);
});

test("landing page contains product positioning, core rule, and proof chain", () => {
  const source = read(pagePath);
  assert.match(source, /Agent Trust Gate/);
  assert.ok(source.includes(coreRule));
  assert.match(source, /local-first/i);
  assert.match(source, /Local demo only/i);
  for (const stage of [
    "Agent request",
    "Gate decision",
    "Receipt / audit artifact",
    "Receipt verification",
    "Gate pass validity / replay check",
    "Settlement blocker simulation",
    "Final money-gate proof decision",
  ]) assert.ok(source.includes(stage), stage);
});

test("landing page uses only existing local package commands", () => {
  const page = read(pagePath);
  const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  for (const script of ["test", "build", "typecheck", "demo:gate:allow", "proof:money-gate"]) {
    assert.equal(typeof packageJson.scripts[script], "string", script);
    assert.ok(page.includes(script === "test" ? "npm test" : `npm run ${script}`), script);
  }
});

test("landing page has no scripts, analytics, tracking, forms, or endpoint URLs", () => {
  const page = read(pagePath);
  const styles = read(stylePath);
  assert.doesNotMatch(page, /<script\b/i);
  assert.doesNotMatch(page, /\b(?:analytics|tracking|gtag|googletagmanager|segment|mixpanel)\b/i);
  assert.doesNotMatch(page, /<form\b/i);
  assert.doesNotMatch(page, /https?:\/\//i);
  assert.doesNotMatch(styles, /https?:\/\/|@import\b/i);
  assert.match(page, /href="styles\.css"/);
});

test("landing page states every required inactive safety boundary", () => {
  const source = read(pagePath);
  for (const boundary of [
    "No live API",
    "No live payments",
    "No real settlement",
    "No external agent contact",
    "AUC is not integrated",
    "Agent Contact System is not integrated",
  ]) assert.ok(source.includes(boundary), boundary);
});

test("landing page documentation is local and not deployed or hosted", () => {
  const source = read("docs/static-global-developer-landing-page.md");
  assert.match(source, /not deployed/i);
  assert.match(source, /not hosted/i);
  assert.match(source, /Open `public\/index\.html` directly in a browser/i);
  assert.match(source, /No HTTP server/i);
});

test("README links the landing page and supporting copy", () => {
  const source = read("README.md");
  for (const path of [
    pagePath,
    "docs/static-global-developer-landing-page.md",
    "docs/developer-landing-page-copy.md",
  ]) assert.ok(source.includes(path), path);
});

test("matrix and mission register record P3-M106 local preparation", () => {
  assert.match(read("docs/channel-readiness-matrix.md"), /static page prepared locally, not deployed/i);
  assert.match(read("docs/p3-mission-register.md"), /P3-M106 \| Static Global Developer Landing Page/);
});
