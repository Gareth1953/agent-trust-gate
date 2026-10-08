import { join } from "node:path";
import { AtgPurchaseOrderConnector, PURCHASE_ORDER_CONNECTOR_BOUNDARY } from "./purchase-order-connector.js";
import { createSyntheticPluginRequest } from "./standalone-plugin.js";

/** Use a new host-owned directory per run. No remote services are contacted. */
export async function runPurchaseOrderDemo(stateDirectory: string): Promise<unknown> {
  const scenarios: Record<string, unknown> = {};
  for (const scenario of ["normal", "changed_bank", "lost_ack", "timeout_before_commit"] as const) {
    const c = new AtgPurchaseOrderConnector({ stateDirectory: join(stateDirectory, scenario) });
    try {
      const request = createSyntheticPluginRequest("enforced"); const approval = await c.approve(request);
      if (scenario === "changed_bank") c.updateBusinessState({ supplierBankReference: "fixture-bank-B" });
      const execution = await c.execute(approval.evaluationId, request,
        { fault: scenario === "lost_ack" ? "timeout_after_commit" : scenario === "timeout_before_commit" ? "timeout_before_commit" : "none" });
      const reconciliation = execution.outcome === "UNKNOWN" ? c.reconcile(approval.evaluationId) : null;
      const expected = scenario === "normal" ? execution.outcome === "EXECUTED" && execution.evidence?.authorisedRequestMatchesRecordedOutcome
        : scenario === "changed_bank" ? execution.reason === "BUSINESS_STATE_CHANGED_REAPPROVAL_REQUIRED"
        : scenario === "lost_ack" ? execution.outcome === "UNKNOWN" && reconciliation?.outcome === "EXECUTED"
        : execution.outcome === "UNKNOWN" && reconciliation?.outcome === "NOT_EXECUTED";
      scenarios[scenario] = { passed: Boolean(expected), execution, reconciliation, destinationRecordCount: c.getDestinationRecords().length };
    } finally { c.close(); }
  }
  const passed = Object.values(scenarios).every(s => (s as { passed: boolean }).passed);
  if (!passed) throw new Error("PURCHASE_ORDER_DEMO_FAILED");
  return { passed, capabilities: PURCHASE_ORDER_CONNECTOR_BOUNDARY, scenarios };
}
