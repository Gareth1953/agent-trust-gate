import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const pages = ["index.html", "technology.html", "evidence.html", "controlled-buyer-pilot.html", "contact.html", "privacy.html"];

test("all M164 browser-review pages retain one H1 and shared local assets", () => {
  for (const page of pages) {
    const html = read(`discovery-site/${page}`);
    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, page);
    assert.match(html, /href="\.\/corporate\.css"/i, page);
    assert.match(html, /src="\.\/corporate\.js"/i, page);
  }
});

test("narrow grid cards can shrink without creating body overflow", () => {
  const css = read("discovery-site/corporate.css");
  assert.match(css, /\.card\s*\{[^}]*min-width:\s*0;/s);
  assert.match(css, /\.code-route\s*\{[^}]*overflow:\s*auto;/s);
});

test("pilot limitations panel has explicit dark-surface contrast", () => {
  const css = read("discovery-site/corporate.css");
  const pilot = read("discovery-site/controlled-buyer-pilot.html");
  assert.match(pilot, /class="surface dark"/);
  assert.match(css, /\.surface\.dark\s*\{[^}]*color:\s*var\(--white\)[^}]*background:\s*#0d1c2d/s);
  assert.match(css, /\.surface\.dark p\s*\{[^}]*color:\s*#aab9c8/s);
});

test("mobile menu supports Escape close and restores toggle focus", () => {
  const script = read("discovery-site/corporate.js");
  assert.match(script, /event\.key === 'Escape'/);
  assert.match(script, /nav\.classList\.contains\('open'\)/);
  assert.match(script, /toggle\.focus\(\)/);
});

test("responsive evidence tables support keyboard horizontal scrolling", () => {
  const script = read("discovery-site/corporate.js");
  assert.match(script, /querySelectorAll\('\.table-scroll'\)/);
  assert.match(script, /event\.key !== 'ArrowLeft'/);
  assert.match(script, /event\.key !== 'ArrowRight'/);
  assert.match(script, /table\.scrollBy/);
});
