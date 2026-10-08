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
mkdirSync(join(output, 'src'), { recursive: true });
cpSync(join(root, 'src/human-authority-demo.mjs'), join(output, 'src/human-authority-demo.mjs'));
cpSync(join(root, 'LICENSE'), join(output, 'LICENSE'));
cpSync(join(root, 'docs/standalone-plugin.md'), join(output, 'README.md'));
writeFileSync(join(output, 'package.json'), JSON.stringify({
  name: '@agent-trust-gate/plugin', version: '0.1.0-local.1', private: true,
  description: 'Installable local synthetic ATG evaluation plugin; no live execution.',
  main: './dist/src/standalone-plugin.js', types: './dist/src/standalone-plugin.d.ts',
  exports: { '.': { types: './dist/src/standalone-plugin.d.ts', default: './dist/src/standalone-plugin.js' } },
  bin: { 'atg-plugin': './dist/src/standalone-plugin-cli.js' },
  engines: { node: '>=20' }, license: 'MIT',
  files: ['dist/src', 'src/human-authority-demo.mjs', 'README.md', 'LICENSE'],
}, null, 2) + '\n');
console.log(`Standalone plugin staged at ${output}. No registry publication performed.`);
