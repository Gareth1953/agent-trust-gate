import { canonicalDestinationEvidence } from "./destination-evidence.js";

/** Resource and framing boundary for the same-host synthetic transport.
 * This is not caller authentication or OS-principal isolation. */
export const DESTINATION_IPC_MAX_BYTES = 256 * 1024;
export const DESTINATION_IPC_MAX_PENDING = 64;
export const isDestinationRequestId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);

export function snapshotDestinationMessage(value: unknown): Record<string, unknown> {
  const text = canonicalDestinationEvidence(value);
  if (Buffer.byteLength(text, "utf8") > DESTINATION_IPC_MAX_BYTES) throw new Error("DESTINATION_MESSAGE_TOO_LARGE");
  const copy: unknown = JSON.parse(text);
  if (!copy || typeof copy !== "object" || Array.isArray(copy)) throw new Error("DESTINATION_MESSAGE_INVALID");
  return copy as Record<string, unknown>;
}

export function snapshotDestinationCommand(value: unknown, correlated = false): Record<string, unknown> {
  const message = snapshotDestinationMessage(value);
  const required: Record<string, string[]> = {
    configure: ["trust"], state: [], stop: [], close: [], register: ["approval", "token"],
    submit: ["approval", "token", "lookup"], lookup: ["approval", "lookup"], fence_lookup: ["approval", "lookup"],
  };
  if (typeof message.op !== "string" || !Object.hasOwn(required, message.op)) throw new Error("DESTINATION_OPERATION_INVALID");
  const expected = ["op", ...required[message.op]!, ...(correlated ? ["id"] : [])];
  const optional = ["submit", "lookup", "fence_lookup"].includes(message.op) ? ["barrier", "testFault"] : [];
  if (expected.some(key => !Object.hasOwn(message, key)) || Object.keys(message).some(key => !expected.includes(key) && !optional.includes(key))
    || (correlated && !isDestinationRequestId(message.id))) throw new Error("DESTINATION_COMMAND_INVALID");
  if (Object.hasOwn(message, "token") && !isDestinationRequestId(message.token)) throw new Error("CLAIM_INVALID");
  if (Object.hasOwn(message, "barrier") && !["before_operation", "before_commit", "after_commit"].includes(message.barrier as string)) throw new Error("DESTINATION_BARRIER_INVALID");
  if (Object.hasOwn(message, "testFault") && !["incomplete-fence", "non-authoritative", "stale", "wrong-transaction", "missing-fence", "wrong-destination", "wrong-action", "wrong-state-version"].includes(message.testFault as string)) throw new Error("EVIDENCE_TEST_FAULT_INVALID");
  return message;
}

export function snapshotDestinationReply(value: unknown): Record<string, unknown> {
  const message = snapshotDestinationMessage(value);
  if (!isDestinationRequestId(message.id) || Object.keys(message).length !== 2
    || (Object.hasOwn(message, "value") === Object.hasOwn(message, "error"))
    || (Object.hasOwn(message, "error") && (typeof message.error !== "string" || message.error.length > 1000))) throw new Error("DESTINATION_REPLY_INVALID");
  return message;
}
