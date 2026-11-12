import { canonicalDestinationEvidence } from "./destination-evidence.js";
import { type CustodyWitness, type WitnessGrant, type WitnessResult } from "./custody-witness.js";

export const BROKER_MAX_BYTES = 64 * 1024;
export const BROKER_COMMIT_PATH = "/v1/synthetic-record/commit";
export const BROKER_LOOKUP_PATH = "/v1/synthetic-record/lookup";
export const BROKER_SCHEMA = "atg.openshell-broker.synthetic.v1";

export interface BrokerReply {
  schema: typeof BROKER_SCHEMA;
  syntheticOnly: true;
  productionReady: false;
  outcome: WitnessResult["outcome"];
  reason: string;
  automaticRetryPermitted: false;
  receipt: WitnessResult["receipt"];
  domainId?: string;
}
export const brokerRefusal = (reason: string, unknown = false): BrokerReply => ({
  schema: BROKER_SCHEMA, syntheticOnly: true, productionReady: false,
  outcome: unknown ? "UNKNOWN" : "REJECTED", reason,
  automaticRetryPermitted: false, receipt: null,
});

/** A deliberately small wire contract: canonical UTF-8 JSON only. Requiring
 * exact canonical bytes also rejects duplicate keys and ambiguous encodings.
 * No arbitrary URL, callback, database, clock, signing or admin operation. */
export function handleBrokerRequest(writer: CustodyWitness, method: string, path: string, bytes: Uint8Array): BrokerReply {
  if (method !== "POST" || ![BROKER_COMMIT_PATH, BROKER_LOOKUP_PATH].includes(path)) return brokerRefusal("BROKER_ROUTE_REFUSED");
  try {
    if (!bytes.byteLength || bytes.byteLength > BROKER_MAX_BYTES) throw Error();
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const input: unknown = JSON.parse(text);
    if (canonicalDestinationEvidence(input) !== text || !input || typeof input !== "object" || Array.isArray(input)) throw Error();
    const body = input as Record<string, unknown>;
    if (Object.keys(body).sort().join(",") !== "grant,payload" || !body.grant || typeof body.grant !== "object" || Array.isArray(body.grant)
      || !body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) throw Error();
    const original = body.grant as WitnessGrant;
    if (Object.keys(original).sort().join(",") !== "issuance,proposedAction" || !original.proposedAction) throw Error();
    const payload = body.payload as Record<string, unknown>;
    // Reconstruct the effect from the ACTUAL HTTP payload. Never authorise a
    // signed envelope and then execute an unrelated body supplied beside it.
    const grant: WitnessGrant = {
      issuance: original.issuance,
      proposedAction: { ...original.proposedAction, canonicalArguments: payload,
        targetIdentity: payload.resourceId as string,
        amount: typeof payload.amountMinorUnits === "number" ? payload.amountMinorUnits / 100 : null,
        currency: payload.currency as string },
    };
    const result = path === BROKER_COMMIT_PATH ? writer.execute(grant) : writer.lookup(grant);
    return { ...result, schema: BROKER_SCHEMA, syntheticOnly: true, productionReady: false };
  } catch { return brokerRefusal("BROKER_BODY_INVALID"); }
}
