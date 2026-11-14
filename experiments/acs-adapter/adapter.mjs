// Experimental ACS v0.1.0 tool-hook subset, pinned to upstream release v0.1.4.
// Local synthetic preflight only. NOT an ACS-Core implementation or executor.
import { canonicalDestinationEvidence as canonical } from '../../dist/src/destination-evidence.js';
import { verifyExactActionAtExecution } from '../../dist/src/exact-action-gatepass.js';

const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v, names) => object(v) && Object.keys(v).sort().join(',') === [...names].sort().join(',');
const timestamp = v => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;

/** grant and context must be supplied by the trusted host, never extracted from
 * agent metadata. The host must retain context's nonce store across calls.
 * An allow is preflight admission, not execution truth; the destination must
 * independently recheck/consume authority at commit, as the witness demo does.
 * Delegate/passkey profiles require additional enforcement and are unsupported.
 */
export function evaluateAcsToolHook(input, grant, context) {
  let request;
  try {
    const encoded = canonical(input);
    if (Buffer.byteLength(encoded) > 65536) throw Error('oversized');
    request = JSON.parse(encoded);
    if (!keys(request, ['jsonrpc', 'method', 'id', 'params']) || request.jsonrpc !== '2.0'
      || !(typeof request.id === 'string' || (typeof request.id === 'number' && Number.isFinite(request.id)))
      || !object(request.params) || !uuid(request.params.request_id)) throw Error('envelope');
  } catch {
    return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid or unsupported ACS request' } };
  }
  const p = request.params;
  const respond = (decision, reason, details = {}) => ({ jsonrpc: '2.0', id: request.id, result: {
    type: 'final', acs_version: '0.1.0', request_id: p.request_id, decision,
    reasoning: reason, reason_codes: [reason], policy_data: { atg: {
      synthetic_only: true, preflight_only: true, executed: false,
      automatic_retry_permitted: false, ...details,
    } }, metadata: { evaluator: 'deterministic', evaluator_version: 'atg-acs-experiment-1' },
  } });
  try {
    if (request.method !== 'steps/toolCallRequest' || p.acs_version !== '0.1.0'
      || !keys(p, ['acs_version', 'request_id', 'timestamp', 'metadata', 'payload'])
      || !timestamp(p.timestamp) || !keys(p.metadata, ['agent_id', 'session_id'])
      || !uuid(p.metadata.session_id) || !keys(p.payload, ['tool', 'operation', 'arguments'])
      || !keys(p.payload.tool, ['name', 'version']) || !object(p.payload.arguments)) {
      return respond('deny', 'ATG_ACS_UNSUPPORTED_PROFILE');
    }
    // Strict snapshots also reject accessors, cycles and non-JSON grants before
    // any approval material or request can be read by the legacy verifier.
    const bound = JSON.parse(canonical(grant));
    if (!keys(bound, ['issuance', 'proposedAction'])) return respond('deny', 'ATG_ACS_UNSUPPORTED_AUTHORITY_PROFILE');
    const a = bound.proposedAction;
    if (a.toolIdentity !== 'atg.custody.synthetic-record' || a.toolSchemaVersion !== '1.0.0'
      || a.operationName !== 'record_synthetic_order') return respond('deny', 'ATG_ACS_UNSUPPORTED_TOOL');
    const args = Object.create(null);
    for (const [key, wrapped] of Object.entries(p.payload.arguments)) {
      if (!keys(wrapped, ['value'])) return respond('deny', 'ATG_ACS_UNSUPPORTED_ARGUMENT_WRAPPER');
      args[key] = wrapped.value;
    }
    if (p.metadata.agent_id !== a.subjectAgentIdentity || p.metadata.session_id !== a.nativeSessionId
      || p.payload.tool.name !== a.toolIdentity || p.payload.tool.version !== a.toolSchemaVersion
      || p.payload.operation !== a.operationName || canonical(args) !== canonical(a.canonicalArguments)) {
      return respond('deny', 'ATG_ACS_ACTION_BINDING_MISMATCH');
    }
    const check = verifyExactActionAtExecution(bound.issuance.gatePass, a, context);
    if (!check.verified) return respond('deny', 'ATG_AUTHORITY_NOT_VERIFIED', { reasons: check.reasonCodes });
    return respond('allow', 'ATG_SYNTHETIC_PREFLIGHT_VERIFIED', {
      gate_pass_id: check.gatePassId, action_digest: check.actionDigest,
    });
  } catch {
    return respond('deny', 'ATG_ACS_VERIFIER_UNAVAILABLE_OR_INVALID');
  }
}
