import { SharedPurchaseOrder } from '../dist/src/shared-purchase-order.js';
import { createSyntheticPluginRequest } from '../dist/src/standalone-plugin.js';
import { createOperatorAuthorityEvidence } from '../dist/src/durable-action-lifecycle.js';
import { readSync, writeSync } from 'node:fs';
let store, claim, faultStage;
try { store = new SharedPurchaseOrder({ stateDirectory: process.argv[2], syntheticFaultInjector: stage => { if (stage === faultStage) { writeSync(1, JSON.stringify({stage}) + '\n'); readSync(0, Buffer.alloc(1), 0, 1, null); faultStage = null; } } }); }
catch (error) { process.send({ phase: 'open-failed', error: String(error) }); process.exitCode = 1; process.disconnect(); }
if (store) {
  process.send({ phase: 'ready', pid: process.pid });
  process.on('message', async message => {
    try {
      faultStage = message.faultStage;
      let value;
      switch (message.op) {
        case 'approve': value = await store.approve(message.request ?? createSyntheticPluginRequest('enforced')); break;
        case 'claim': claim = store.claim(message.id, message.request); value = claim; break;
        case 'submit': value = store.submit(message.claim ?? claim); break;
        case 'ack': value = store.acknowledge(message.claim ?? claim); break;
        case 'reconcile': value = store.reconcile(message.id, message.invalidEvidence ? { ...createOperatorAuthorityEvidence(), evidenceDigest: 'invalid' } : undefined); break;
        case 'revoke': value = store.revoke(message.id); break;
        case 'stop': value = store.emergencyStop(message.active); break;
        case 'state': store.updateBusinessState(); value = store.getBusinessState(); break;
        case 'snapshot': value = { authority: store.snapshot(), records: store.getDestinationRecords() }; break;
        case 'close': store.close(); process.send({ phase: 'closed', value: true }); process.disconnect(); return;
        default: throw new Error('UNKNOWN_OPERATION');
      }
      // IPC acknowledgements are explicit barriers. No submission/acknowledgement occurs without a new command.
      process.send({ phase: message.op, value });
    } catch (error) { process.send({ phase: message.op, error: String(error) }); }
  });
}
