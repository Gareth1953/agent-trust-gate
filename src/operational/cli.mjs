#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { openOperationalService, provisionOperationalRecord } from './runtime.mjs';
import { provisionDeployment } from './setup.mjs';
import { AtgHumanApprovals } from './sdk.mjs';

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'init') {
    if (args.length !== 2) throw new Error('Usage: atg-operational init NEW_ABSOLUTE_DIRECTORY ABSOLUTE_PUBLIC_TRUST_JSON');
    process.umask(0o077); console.log(JSON.stringify(provisionDeployment(...args), null, 2));
  } else if (command === 'record-create') {
    if (args.length !== 3) throw new Error('Usage: atg-operational record-create DESTINATION_CONFIG RECORD_ID DOCUMENT_JSON');
    process.umask(0o077); console.log(JSON.stringify(provisionOperationalRecord(args[0], args[1], JSON.parse(readFileSync(args[2], 'utf8')))));
  } else if (command === 'serve') {
    const [mode, configPath, portText, ...rest] = args;
    if (rest.length || !['gateway', 'destination'].includes(mode) || !configPath || !/^\d+$/.test(portText || '') || +portText < 1 || +portText > 65535) throw new Error('Usage: atg-operational serve gateway|destination ABSOLUTE_CONFIG PORT');
    process.umask(0o077);
    const tls = process.env.ATG_TLS_KEY_FILE && process.env.ATG_TLS_CERT_FILE ? { key: readFileSync(process.env.ATG_TLS_KEY_FILE), cert: readFileSync(process.env.ATG_TLS_CERT_FILE) } : undefined;
    const service = openOperationalService({ mode, configPath, port: +portText, host: process.env.ATG_BIND_HOST || '127.0.0.1', ...(tls ? { tls } : {}) });
    await service.listen(); console.log(JSON.stringify({ service: mode, listening: true, port: +portText, operationalScope: 'single-tenant-versioned-record-update' }));
    for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => service.close().then(() => process.exit(0), () => process.exit(1)));
  } else if (['inspect', 'approve', 'revoke'].includes(command)) {
    const [requestId, reviewedDigest, ...rest] = args;
    if (rest.length || !requestId || (command !== 'inspect' && !/^[a-f0-9]{64}$/.test(reviewedDigest || ''))) throw new Error('Usage: atg-operational inspect ID | approve ID REVIEWED_DIGEST | revoke ID REVIEWED_DIGEST');
    if (!process.env.ATG_HUMAN_ACCESS_TOKEN || !process.env.ATG_GATEWAY_URL) throw new Error('Set ATG_GATEWAY_URL and ATG_HUMAN_ACCESS_TOKEN in the separate approver session.');
    const human = new AtgHumanApprovals({ gatewayUrl: process.env.ATG_GATEWAY_URL, accessToken: process.env.ATG_HUMAN_ACCESS_TOKEN });
    console.log(JSON.stringify(await human[command](requestId, reviewedDigest), null, 2));
  } else {
    console.log('ATG operational record plugin — Node 24.19+\ninit NEW_ABSOLUTE_DIRECTORY ABSOLUTE_PUBLIC_TRUST_JSON\nrecord-create DESTINATION_CONFIG RECORD_ID DOCUMENT_JSON\nserve gateway|destination ABSOLUTE_CONFIG PORT\ninspect REQUEST_ID\napprove REQUEST_ID REVIEWED_DIGEST\nrevoke REQUEST_ID REVIEWED_DIGEST\nNo fixture identities, tokens, signing keys or fixed clocks are supplied. See README.md.');
    if (command && command !== '--help') process.exitCode = 1;
  }
} catch (error) { console.error(error.code || 'OPERATION_FAILED: check configuration, trust and permissions.'); process.exitCode = 1; }
