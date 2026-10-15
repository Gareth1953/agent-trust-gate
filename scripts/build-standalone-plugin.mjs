import { STANDALONE_PLUGIN_VERSION } from "../dist/src/standalone-plugin.js";
import { mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative as relativePath, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args=process.argv.slice(2);
if(args.length!==0 && (args.length!==2 || args[0]!=='--output' || !isAbsolute(args[1]))) throw new Error('Use --output NEW_ABSOLUTE_DIRECTORY or no arguments.');
const output = args.length ? args[1] : join(root, 'plugin-build', 'package');
if(existsSync(output))throw new Error('PACKAGE_STAGING_ALREADY_EXISTS: preserve it and choose a fresh --output directory.');
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
copyModule('dist/src/destination-evidence.js');
copyModule('dist/src/destination-process-client.js');
copyModule('dist/src/separate-destination-authority.js');
mkdirSync(join(output, 'src'), { recursive: true });
cpSync(join(root, 'src/human-authority-demo.mjs'), join(output, 'src/human-authority-demo.mjs'));
mkdirSync(join(output, 'scripts'), { recursive: true });
for (const name of ['shared-worker-demo.mjs', 'multi-worker-child.mjs', 'destination-process.mjs', 'mission-03-fixture.mjs', 'mission-03-worker.mjs', 'destination-evidence-demo.mjs', 'verify-destination-evidence.mjs', 'separate-destination-authority-entry.mjs']) cpSync(join(root, 'scripts', name), join(output, 'scripts', name));
cpSync(join(root, 'LICENSE'), join(output, 'LICENSE'));
cpSync(join(root, 'docs/standalone-plugin.md'), join(output, 'README.md'));
cpSync(join(root, 'docs/mission-04-package-security.md'), join(output, 'SECURITY.md'));
cpSync(join(root, 'docs/mission-04-package-release-notes.md'), join(output, 'RELEASE-NOTES.md'));
cpSync(join(root, 'docs/shared-worker-evaluation.md'), join(output, 'SHARED-WORKERS.md'));
cpSync(join(root, 'docs/destination-evidence-evaluation.md'), join(output, 'DESTINATION-EVIDENCE.md'));
cpSync(join(root, 'docs/mission-03-partner-adapter-contract.md'), join(output, 'PARTNER-ADAPTER-CONTRACT.md'));
mkdirSync(join(output,'schemas'),{recursive:true});
cpSync(join(root,'schemas/destination-evidence.synthetic.v1.schema.json'),join(output,'schemas/destination-evidence.synthetic.v1.schema.json'));
writeFileSync(join(output, 'package.json'), JSON.stringify({
  name: '@agent-trust-gate/plugin', version: STANDALONE_PLUGIN_VERSION, private: true,
  description: 'Installable local synthetic ATG evaluation plugin; no live execution.',
  main: './dist/src/standalone-plugin.js', types: './dist/src/standalone-plugin.d.ts',
  exports: { '.': { types: './dist/src/standalone-plugin.d.ts', default: './dist/src/standalone-plugin.js' },
    './shared-purchase-order': { types: './dist/src/shared-purchase-order.d.ts', default: './dist/src/shared-purchase-order.js' },
    './destination-evidence': { types: './dist/src/destination-evidence.d.ts', default: './dist/src/destination-evidence.js' },
    './destination-process-client': { types: './dist/src/destination-process-client.d.ts', default: './dist/src/destination-process-client.js' },
    './separate-destination-authority': { types: './dist/src/separate-destination-authority.d.ts', import: './scripts/separate-destination-authority-entry.mjs', require: './dist/src/separate-destination-authority.js', default: './scripts/separate-destination-authority-entry.mjs' },
    './destination-evidence-fixture': './scripts/mission-03-fixture.mjs',
    './destination-evidence-schema': './schemas/destination-evidence.synthetic.v1.schema.json' },
  bin: { 'atg-plugin': './dist/src/standalone-plugin-cli.js', 'atg-multi-worker': './scripts/shared-worker-demo.mjs',
    'atg-destination-evidence':'./scripts/destination-evidence-demo.mjs', 'atg-evidence-verify':'./scripts/verify-destination-evidence.mjs' },
  engines: { node: '>=20' }, license: 'MIT',
  files: ['dist/src', 'scripts', 'schemas', 'src/human-authority-demo.mjs', 'README.md', 'SECURITY.md', 'RELEASE-NOTES.md', 'SHARED-WORKERS.md', 'DESTINATION-EVIDENCE.md', 'PARTNER-ADAPTER-CONTRACT.md', 'LICENSE'],
}, null, 2) + '\n');
console.log(`Standalone plugin staged at ${output}. No registry publication performed.`);
