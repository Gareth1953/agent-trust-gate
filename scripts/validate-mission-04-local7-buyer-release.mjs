import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve('.');
const cliArgs = process.argv.slice(2);
assert.ok(cliArgs.length === 0 || (cliArgs.length === 2 && cliArgs[0] === '--reuse-installed'), 'Use no arguments or --reuse-installed PRIOR_SUMMARY');
const prior = cliArgs.length ? JSON.parse(readFileSync(resolve(cliArgs[1]), 'utf8')) : null;
const npm = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const node20 = process.env.ATG_NODE20_PATH;
assert.match(process.version, /^v24\./, 'Run with actual Node 24');
assert.ok(node20, 'Set ATG_NODE20_PATH to the preserved actual Node 20 executable');
const v20 = spawnSync(node20, ['--version'], { encoding: 'utf8' });
assert.equal(v20.status, 0); assert.match(v20.stdout, /^v20\./);
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const archive = 'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.7.tgz';
const sealed = JSON.parse(readFileSync('reports/mission-04-local7-buyer-release/archive.json', 'utf8'));
assert.equal(sha(archive), sealed.sha256, 'Sealed archive changed; never repack during validation');
if (prior) {
  assert.equal(prior.sha256, sealed.sha256, 'Only identical archive bytes can reuse installed checks');
  assert.equal(prior.node24, process.version); assert.equal(prior.node20, v20.stdout.trim());
  assert.equal(prior.node20Sha256, sha(node20));
}
const oldArchives = {
  1: '636b4e50e78af5560588663ac761700a637c1643974b31b3c4cbacf22bd64590',
  2: '3303ae690b2b00de22e9b0ed6c52078d06fd1571d77984ea10d0f8484c02ee2a',
  3: '62086a6cf7740ff72dafa81b821097d593b262ec019481654fb84caca5b673f0',
  4: '164a25d41fdda287c4da265f7511802af4f358e7a3f5460395d6bf9377a66800',
  5: '672484c3d3ac3e2efe69f2dee66fef465f10700c73c992274a6b1ea382bb2d7e',
  6: 'bb22f8b3cad69e9b00182836adc81cd9b6df6cb9e4e621f0cbe4b4e58405fa10',
};
const preserved = {};
for (const [version, hash] of Object.entries(oldArchives)) {
  const file = 'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.' + version + '.tgz';
  assert.equal(sha(file), hash); preserved[file] = hash;
}
for (const file of ['discovery-site/challenge-results.json', 'discovery-site/challenge.html', 'discovery-site/multi-worker-results-local.4.json', 'discovery-site/destination-evidence-results-local.5.json','discovery-site/destination-evidence-results-local.6.json']) preserved[file] = sha(file);
mkdirSync('.atg-evaluation/mission04-local7-validation', { recursive: true });
const output = mkdtempSync(join(root, '.atg-evaluation/mission04-local7-validation/run-'));
const env = { ...process.env, npm_execpath: npm };
delete env.ATG_PACKAGED_EVIDENCE_PATH;
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const mainFiles = pkg.scripts.test.split('&& node --test ')[1].trim().split(/\s+/);
const postFiles = pkg.scripts.posttest.replace(/^node --test /, '').trim().split(/\s+/);
const node24Only = ['test/multi-worker.test.mjs', 'test/destination-evidence.test.mjs'];
const summary = { reviewedMissionCommit: '8ca808a05afd46f2c034f9ced613b9929d11710d', reviewedWindowsCommit: 'be72c69097c3faca1e5b2f91369e68b8aa777aba',
  reviewedRepairCommit: 'ce7259ad05d4f82cc0c865ea213ba90d9020d34a', originalWindowsIncidentAttributed: false, version: '0.1.0-local.7', unpublished: true, archive, archiveSize: sealed.size, sha256: sealed.sha256,
  node24: process.version, node20: v20.stdout.trim(), node20Sha256: sha(node20), output,
  node20Scope: { mainFiles, compatiblePostFiles: postFiles.filter(file => !node24Only.includes(file)), excludedNode24Only: node24Only },
  preservedArtifacts: preserved, startedAt: new Date().toISOString(), checks: [] };
let publicCase;
const step = (name, runtime, args) => [name, runtime, args];
const npmStep = (name, script) => step(name, process.execPath, [npm, 'run', script]);
const steps = [
  npmStep('build', 'build'), npmStep('typecheck', 'typecheck'),
  step('installed-destination-node24', process.execPath, ['scripts/test-installed-destination-evidence.mjs', '--archive', archive, '--expected-version', '0.1.0-local.7']),
  step('installed-destination-node20', node20, () => ['scripts/test-installed-destination-evidence.mjs', '--archive', archive, '--expected-version', '0.1.0-local.7', '--public-case', publicCase]),
  step('installed-security-node24', process.execPath, ['scripts/test-installed-mission-04-local7-security.mjs', '--archive', archive]),
  step('installed-security-node20', node20, ['scripts/test-installed-mission-04-local7-security.mjs', '--archive', archive]),
  step('installed-legacy-node24', process.execPath, ['scripts/test-standalone-plugin-package.mjs', '--archive', archive]),
  step('installed-legacy-node20', node20, ['scripts/test-standalone-plugin-package.mjs', '--archive', archive]),
  npmStep('full-regression-node24', 'test'),
  step('legacy-main-regression-node20', node20, ['--test', ...mainFiles]),
  step('compatible-post-regression-node20', node20, ['--test', ...summary.node20Scope.compatiblePostFiles]),
  npmStep('reviewer', 'reviewer'), npmStep('public-claims', 'validate:public-claims'), npmStep('discovery-site', 'validate:discovery-site'),
  npmStep('archive-bytes-checksums-links-evidence', 'validate:plugin-release'),
  step('npm-audit', process.execPath, [npm, 'audit', '--json']),
  step('diff-check', 'git', ['diff', '--check']),
];
console.log('Release validation: ' + output);
for (const [name, executable, argsValue] of steps) {
  if (prior && name.startsWith('installed-')) {
    const previous = prior.checks.find(check => check.name === name);
    assert.equal(previous?.exitCode, 0, 'A non-passing installed check cannot be reused');
    assert.equal(sha(previous.log), previous.sha256, 'Original installed-check evidence changed');
    summary.checks.push({ ...previous, reusedFrom: resolve(cliArgs[1]) });
    if (name === 'installed-destination-node24') publicCase = previous.installedSummary.publicVerificationDirectory;
    console.log(name + ': reused passing exact-archive evidence (unchanged bytes/runtimes)');
    continue;
  }
  const args = typeof argsValue === 'function' ? argsValue() : argsValue;
  const result = spawnSync(executable, args, { cwd: root, env, encoding: 'utf8', windowsHide: true, timeout:600000, maxBuffer:100*1024*1024 });
  const log = (result.stdout ?? '') + '\n' + (result.stderr ?? '') + (result.error?.stack ?? '');
  const logPath = join(output, name + '.log'); writeFileSync(logPath, log, { flag: 'wx' });
  const check = { name, executable, args, exitCode: result.status, error: result.error?.message ?? null, log: logPath, sha256: sha(logPath) };
  summary.checks.push(check);
  if (result.status === 0 && name.startsWith('installed-')) {
    // Legacy helper has a trailing retained-state line; its JSON result is earlier.
    const jsonLines = result.stdout.trim().split(/\r?\n/).filter(line => line.startsWith('{'));
    const parsed = JSON.parse(jsonLines.at(-1)); assert.equal(parsed.passed, true); check.installedSummary = parsed;
    if (name !== 'installed-legacy-node24' && name !== 'installed-legacy-node20') assert.equal(parsed.sha256, sealed.sha256);
    if (name === 'installed-destination-node24') {
      publicCase = parsed.publicVerificationDirectory;
      const recordingPath = 'discovery-site/destination-evidence-results-local.7.json';
      if (!existsSync(recordingPath)) {
        const observations = JSON.parse(readFileSync(parsed.observations, 'utf8'));
        for (const item of observations.cases) item.retainedState = 'Retained locally in the fresh exact-archive installation project; see local release report.';
        observations.capture = { archiveFile: sealed.filename, archiveSha256: sealed.sha256, installedFromExactArchive: true, freshProjectOutsideRepository: true,
          recordedAt: new Date().toISOString(), reviewedMissionCommit: summary.reviewedWindowsCommit, reviewedRepairCommit: summary.reviewedRepairCommit, originalWindowsIncidentAttributed: false, unpublishedCandidate: true,
          provenance: 'Captured from the exact local.7 installed archive in a fresh project. Synthetic destination keys, fixed clock and same-host records; not independent external capture.' };
        assert.equal(JSON.stringify(observations).includes('BEGIN PRIVATE KEY'), false);
        writeFileSync(recordingPath, JSON.stringify(observations, null, 2) + '\n', { flag: 'wx' });
      }
      assert.equal(JSON.parse(readFileSync(recordingPath, 'utf8')).capture.archiveSha256, sealed.sha256);
    }
  }
  check.counts = [...log.matchAll(/(?:# |ℹ )?(tests|pass|fail|skipped) (\d+)/g)].map(match => ({ kind: match[1], count: Number(match[2]) }));
  writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(name + ': ' + result.status);
  if (result.error || result.status !== 0) { console.error(log.slice(-14000)); break; }
}
summary.finishedAt = new Date().toISOString();
summary.preservedArtifactsUnchanged = Object.entries(preserved).every(([file, hash]) => sha(file) === hash);
summary.sealedArchiveUnchanged = sha(archive) === sealed.sha256;
summary.passed = summary.checks.length === steps.length && summary.checks.every(check => check.exitCode === 0) && summary.preservedArtifactsUnchanged && summary.sealedArchiveUnchanged;
writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
if (!summary.passed) process.exitCode = 1;
console.log(JSON.stringify({ passed: summary.passed, summary: join(output, 'summary.json') }));
