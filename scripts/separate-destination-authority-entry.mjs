// Gate unsupported ESM consumers before loading the CommonJS SQLite module.
// This avoids partial CJS exports/unhandled errors after a failed ESM import.
if(Number(process.versions.node.split('.')[0])<24)throw Error('ATG_SHARED_WORKER_REQUIRES_NODE_24: optional destination authority requires Node 24+; public verification and legacy plugin support Node 20.');
export const {SeparateDestinationAuthority}=await import('../dist/src/separate-destination-authority.js');
