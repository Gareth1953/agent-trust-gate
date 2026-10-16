import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePublicClaims } from '../src/public-claims-evidence-validator.js';
const read = (p: string) => readFileSync(p, 'utf8');

test('PayeeShield discovery distinguishes local source demo, fixture controls and uncertainty limits', () => {
  const html = read('discovery-site/payeeshield.html');
  for (const phrase of ['npm ci --ignore-scripts', 'npm run demo:payeeshield', 'Node.js 20', 'repository root', 'GitHub Pages does not run the Node server', 'public fixture signing keys', 'fixed clock', 'volatile process-local state', "same process's synthetic record", 'not independent destination evidence or durable recovery', 'No live bank verification', 'real human authentication', 'same-user code', 'not included in the published local.7 plugin', 'gareth@agenttrustgate.com']) assert.ok(html.includes(phrase), phrase);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.match(html, /aria-controls="primary-navigation"/);
  assert.doesNotMatch(html, /<form|paypal|stripe|ps_live_|api\.payeeshield/i);
});

test('buyer entry points and static metadata discover the same evaluation route', () => {
  for (const file of ['index.html', 'plugin.html', 'solutions.html']) assert.ok(read(`discovery-site/${file}`).includes('href="./payeeshield.html"'), file);
  assert.ok(read('discovery-site/sitemap.xml').includes('<loc>https://agenttrustgate.com/payeeshield.html</loc>'));
  const catalogue = JSON.parse(read('discovery-site/ai-catalog.json'));
  const entry = catalogue.entries.find((e: {url: string}) => e.url === 'https://agenttrustgate.com/payeeshield.html');
  assert.equal(entry.type, 'text/html');
  assert.equal(entry.metadata.interactionMode, 'static_read');
  assert.equal(entry.metadata.hostedApi, false);
  assert.ok(read('llms.txt').includes('https://agenttrustgate.com/payeeshield.html'));
});

test('public-claims validation catches an unsupported operational claim on the new route', () => {
  const report = validatePublicClaims({payeeshieldHtml: read('discovery-site/payeeshield.html') + '<p>ATG executed a real payment.</p>'});
  assert.equal(report.valid, false);
  assert.equal(report.checks.find(c => c.id === 'prohibited_implications')?.passed, false);
});
