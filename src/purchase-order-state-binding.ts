import { createCanonicalPayloadHash } from "./local-signed-proof.js";
import type { McpBusinessPolicyRequest } from "./mcp-exact-action-gateway.js";

export const PURCHASE_ORDER_STATE_BINDING_VERSION = "atg.purchase-order-state-binding.local.v1" as const;
export const PURCHASE_ORDER_DESTINATION_IDENTITY = "destination.local.synthetic-purchase-order.v1" as const;
export interface PurchaseOrderBusinessState {
  orderId: "PO-SYNTHETIC-001";
  orderVersion: number;
  supplierBankVersion: number;
  supplierBankReference: string;
  revision: number;
}
/** This payload has authority only inside an existing, verified GatePass signature. */
export interface PurchaseOrderStateBinding {
  bindingVersion: typeof PURCHASE_ORDER_STATE_BINDING_VERSION;
  businessState: PurchaseOrderBusinessState;
  businessStateDigest: string;
  approvedRequestDigest: string;
  supplierId: string;
  amountMinorUnits: number;
  currency: string;
  destination: typeof PURCHASE_ORDER_DESTINATION_IDENTITY;
}
export function createPurchaseOrderStateBinding(state: PurchaseOrderBusinessState, request: McpBusinessPolicyRequest): PurchaseOrderStateBinding {
  validatePurchaseOrderBusinessState(state);
  return {
    bindingVersion: PURCHASE_ORDER_STATE_BINDING_VERSION,
    businessState: structuredClone(state), businessStateDigest: createCanonicalPayloadHash(state),
    approvedRequestDigest: createCanonicalPayloadHash(request), supplierId: request.proposedAction.supplierId,
    amountMinorUnits: request.amountMinorUnits, currency: request.proposedAction.currency,
    destination: PURCHASE_ORDER_DESTINATION_IDENTITY,
  };
}
export function purchaseOrderStateBindingMatches(binding: unknown, state: PurchaseOrderBusinessState, request: McpBusinessPolicyRequest): boolean {
  try { return createCanonicalPayloadHash(binding) === createCanonicalPayloadHash(createPurchaseOrderStateBinding(state, request)); }
  catch { return false; }
}
export function validatePurchaseOrderBusinessState(s: PurchaseOrderBusinessState): void {
  if (!s || s.orderId !== "PO-SYNTHETIC-001" || !/^fixture-bank-[A-Z]$/.test(s.supplierBankReference)
    || ![s.orderVersion, s.supplierBankVersion, s.revision].every(v => Number.isSafeInteger(v) && v >= 1)) throw new Error("BUSINESS_STATE_INVALID");
}
