import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CommandExecutionError, runCheckedCommand } from '../scripts/checked-command.mjs';

test('checked launcher returns successful stdout', () => {
  assert.equal(runCheckedCommand(process.execPath, ['-e', 'process.stdout.write("ok")']), 'ok');
});
for (const stream of ['stdout', 'stderr']) {
  test('checked launcher preserves nonzero code and ' + stream + ' diagnostics', () => {
    assert.throws(() => runCheckedCommand(process.execPath, ['-e', 'process.' + stream + '.write("failure detail"); process.exit(23)']), error => {
      assert.ok(error instanceof CommandExecutionError); assert.equal(error.exitCode, 23);
      assert.match(error.message, /exit 23/); assert.match(error.message, /failure detail/); return true;
    });
  });
}
test('spawn failure cannot be reported as success', () => {
  assert.throws(() => runCheckedCommand(join(tmpdir(), 'missing-command-' + randomUUID()), []), error => {
    assert.ok(error instanceof CommandExecutionError); assert.equal(error.exitCode, 1); assert.match(error.message, /ENOENT/); return true;
  });
});
test('command timeout remains a failed command', () => {
  assert.throws(() => runCheckedCommand(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeout: 200 }), error => {
    assert.ok(error instanceof CommandExecutionError); assert.equal(error.exitCode, 1); assert.match(error.message, /ETIMEDOUT/); return true;
  });
});
test('package smoke process preserves npm failure code and uses an isolated cache with a spaced CLI path', () => {
  const root = mkdtempSync(join(tmpdir(), 'atg-command-failure-'));
  try {
    mkdirSync(join(root, 'scripts'));
    for (const file of ['test-standalone-plugin-package.mjs', 'checked-command.mjs']) {
      copyFileSync(fileURLToPath(new URL('../scripts/' + file, import.meta.url)), join(root, 'scripts', file));
    }
    writeFileSync(join(root, 'scripts/build-standalone-plugin.mjs'), '// Stub build; this test verifies command failure propagation only.');
    const fakeNpm = join(root, 'npm CLI with spaces.mjs');
    writeFileSync(fakeNpm, 'console.log(JSON.stringify(process.argv.slice(2))); process.exit(23);');
    const result = spawnSync(process.execPath, [join(root, 'scripts/test-standalone-plugin-package.mjs')], {
      cwd: root, encoding: 'utf8', env: { ...process.env, npm_execpath: fakeNpm }, timeout: 20_000,
    });
    assert.equal(result.status, 23, result.stderr); assert.match(result.stderr, /exit 23/);
    assert.match(result.stderr, /--cache/); assert.match(result.stderr, /atg-plugin-installed-.*npm-cache/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
