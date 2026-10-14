import { STANDALONE_PLUGIN_VERSION } from "../dist/src/standalone-plugin.js";
import { mkdirSync, readFileSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative as relativePath, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'plugin-build', 'package');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const visited = new Set();
function copyModule(relative) {
  if (visited.has(relative)) return;
  visited.add(relative);
  const source = join(root, relative);
  if (!existsSync(source)) throw new Error(`Missing compiled module: ${relative}; run npm run build first.`);
  const content = readFileSync(source, 'utf8');
  mkdirSync(dirname(join(output, relative)), { recursive: true });
  cpSync(source, join(output, relative));
  for (const match of content.matchAll(/(?:require\(|from\s+|import\()['"](\.\.?\/[^'"]+)['"]/g)) {
    const dependency = resolve(dirname(source), match[1]);
    const inside = relativePath(join(root, 'dist', 'src'), dependency);
    if (inside.startsWith('..') || isAbsolute(inside)) throw new Error('Unexpected runtime dependency.');
    copyModule(dependency.slice(root.length + 1));
  }
  if (relative.endsWith('.js')) copyModule(relative.replace(/\.js$/, '.d.ts'));
}
copyModule('dist/src/standalone-plugin.js');
copyModule('dist/src/standalone-plugin-cli.js');
// Optional Node 24 SQLite entrypoint; legacy root import stays Node 20 compatible.
copyModule('dist/src/shared-purchase-order.js');
mkdirSync(join(output, 'src'), { recursive: true });
cpSync(join(root, 'src/human-authority-demo.mjs'), join(output, 'src/human-authority-demo.mjs'));
mkdirSync(join(output, 'scripts'), { recursive: true });
for (const name of ['shared-worker-demo.mjs', 'multi-worker-child.mjs']) cpSync(join(root, 'scripts', name), join(output, 'scripts', name));
cpSync(join(root, 'LICENSE'), join(output, 'LICENSE'));
cpSync(join(root, 'docs/standalone-plugin.md'), join(output, 'README.md'));
cpSync(join(root, 'docs/shared-worker-evaluation.md'), join(output, 'SHARED-WORKERS.md'));
writeFileSync(join(output, 'package.json'), JSON.stringify({
  name: '@agent-trust-gate/plugin', version: STANDALONE_PLUGIN_VERSION, private: true,
  description: 'Installable local synthetic ATG evaluation plugin; no live execution.',
  main: './dist/src/standalone-plugin.js', types: './dist/src/standalone-plugin.d.ts',
  exports: { '.': { types: './dist/src/standalone-plugin.d.ts', default: './dist/src/standalone-plugin.js' },
    './shared-purchase-order': { types: './dist/src/shared-purchase-order.d.ts', default: './dist/src/shared-purchase-order.js' } },
  bin: { 'atg-plugin': './dist/src/standalone-plugin-cli.js', 'atg-multi-worker': './scripts/shared-worker-demo.mjs' },
  engines: { node: '>=20' }, license: 'MIT',
  files: ['dist/src', 'scripts', 'src/human-authority-demo.mjs', 'README.md', 'SHARED-WORKERS.md', 'LICENSE'],
}, null, 2) + '\n');
console.log(`Standalone plugin staged at ${output}. No registry publication performed.`);
