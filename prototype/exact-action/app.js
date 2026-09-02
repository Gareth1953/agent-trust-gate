"use strict";

const state = {
  scenarioId: "allowed",
  runId: null,
  evaluation: null,
  receipt: null,
  scenarios: [],
};

const byId = (id) => document.getElementById(id);
const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const scenarioLabels = {
  allowed: "A · Allowed",
  overspend: "B · Overspend",
  wrong_human_authority: "C · Wrong authority",
  expired_authority: "D · Expired authority",
  action_tampering: "E · Tampering",
  replay: "F · Replay",
  agent_standing_failure: "G · Agent standing",
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json();
  if (!response.ok || body.ok !== true) {
    throw new Error(body.error?.message || `Prototype request failed with status ${response.status}.`);
  }
  return body;
}

function setText(id, value) {
  byId(id).textContent = value ?? "—";
}

function setPill(id, label, stateName) {
  const element = byId(id);
  element.textContent = label;
  element.className = `pill ${stateName}`;
}

async function loadScenarios() {
  const response = await requestJson("/api/scenarios");
  state.scenarios = response.scenarios;
  const tabs = byId("scenario-tabs");
  tabs.replaceChildren();
  for (const scenario of state.scenarios) {
    const button = document.createElement("button");
    button.className = `scenario-tab${scenario.scenarioId === state.scenarioId ? " active" : ""}`;
    button.type = "button";
    button.role = "tab";
    button.setAttribute("aria-selected", String(scenario.scenarioId === state.scenarioId));
    button.dataset.scenarioId = scenario.scenarioId;
    button.textContent = scenarioLabels[scenario.scenarioId] || scenario.title;
    button.addEventListener("click", () => selectScenario(scenario.scenarioId));
    tabs.append(button);
  }
}

async function selectScenario(scenarioId) {
  state.scenarioId = scenarioId;
  state.runId = null;
  state.evaluation = null;
  state.receipt = null;
  for (const tab of document.querySelectorAll(".scenario-tab")) {
    const selected = tab.dataset.scenarioId === scenarioId;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  }
  resetDecision();
  await loadPreview();
}

async function loadPreview() {
  const response = await requestJson(`/api/preview?scenario=${encodeURIComponent(state.scenarioId)}`);
  renderPreview(response.preview);
}

function renderPreview(preview) {
  const scenario = preview.scenario;
  const human = preview.human;
  const auth = preview.authentication;
  const permission = human?.permissions?.purchase;
  setText("scenario-description", scenario.description);
  setText("human-name", human?.displayName || "Unknown synthetic employee");
  setText("human-role", human?.role || "Unknown role");
  setText("human-organisation", human?.organisationName || "Northstar Retail Ltd");
  setText("human-limit", permission ? money.format(permission.maxAmount) : "No purchasing authority");
  setText("human-authority", permission ? "Active purchasing authority fixture" : "Purchasing authority absent");
  setText("human-auth", auth ? `${auth.method} · ${auth.status}` : "Missing");
  setText("human-expiry", formatTime(scenario.humanAuthorityExpiresAt));
  setPill("human-status", permission ? "Authority fixture" : "No purchase authority", permission ? "neutral" : "block");

  setText("agent-name", preview.agent.displayName);
  setText("agent-id", preview.agent.id);
  setText("agent-standing", preview.agent.standing);
  setText("agent-capability", preview.agent.permittedCapability);
  setPill("agent-status", preview.agent.standing, preview.agent.standing === "active" ? "neutral" : "block");

  setText("mandate-objective", preview.mandate.permittedObjective);
  setText("mandate-maximum", money.format(preview.mandate.maximumAmount));
  setText("mandate-action", preview.mandate.permittedActionClasses.join(" · "));
  setText("mandate-expiry", formatTime(preview.mandate.expiresAt));
  setText("mandate-quantity", `${preview.mandate.maximumQuantity} units of ${preview.mandate.product}`);
  setText("mandate-risk", `${preview.mandate.jurisdiction} · ${preview.mandate.riskTier}`);
  setText("mandate-instruction", preview.mandate.instruction);
  setPill("mandate-status", Date.parse(preview.mandate.expiresAt) > Date.parse("2026-09-02T09:00:00.000Z") ? "Machine-readable" : "Expired", Date.parse(preview.mandate.expiresAt) > Date.parse("2026-09-02T09:00:00.000Z") ? "neutral" : "block");

  const offerRows = byId("offer-rows");
  offerRows.replaceChildren();
  for (const offer of preview.evidence.offersInspected) {
    const row = document.createElement("tr");
    if (offer.supplierId === preview.evidence.selectedSupplierId) row.className = "selected";
    const cells = [
      offer.supplierName,
      money.format(offer.totalAmount),
      `${offer.deliveryDays} days`,
      offer.paymentTerms,
    ];
    for (const cellValue of cells) {
      const cell = document.createElement("td");
      cell.textContent = cellValue;
      row.append(cell);
    }
    offerRows.append(row);
  }
  setText("negotiated-result", `${money.format(preview.evidence.negotiation.openingAmount)} → ${money.format(preview.evidence.negotiation.finalAmount)} · Net 45`);
  setText("evidence-detail", `Present · fresh until ${formatTime(preview.evidence.expiresAt)}`);
  setPill("evidence-status", "3 offers · fresh", "neutral");

  setText("action-supplier", `${scenario.proposedAction.supplierName} · ${scenario.proposedAction.supplierId}`);
  setText("action-product", `${scenario.proposedAction.product} · ${scenario.proposedAction.category}`);
  setText("action-quantity", `${scenario.proposedAction.quantity} units`);
  setText("action-total", money.format(scenario.proposedAction.totalAmount));
  setText("action-currency", scenario.proposedAction.currency);
  setText("action-digest", "Calculated when ATG evaluates the action");
  byId("execute-button").textContent = scenario.scenarioId === "action_tampering"
    ? "Try changed £24,250 action"
    : "Simulate purchase";
}

async function evaluateAction() {
  setWorking("Evaluating exact authority, standing, mandate, evidence and action binding…");
  try {
    const response = await requestJson("/api/evaluate", {
      method: "POST",
      body: JSON.stringify({ scenarioId: state.scenarioId }),
    });
    state.evaluation = response.evaluation;
    state.runId = response.evaluation.runId;
    state.receipt = response.evaluation.trustReceipt;
    renderEvaluation(response.evaluation);
  } catch (error) {
    showError(error);
  }
}

function renderEvaluation(evaluation) {
  const allowed = evaluation.decision === "GATEPASS_ISSUED";
  const proofVerified = evaluation.trustReceipt.human.authorityProofVerified;
  const standingVerified = evaluation.agentStandingReceipt.outcome === "STANDING_VERIFIED";
  setText("action-digest", evaluation.exactAction.actionDigest);
  setPill("human-status", proofVerified ? "Verified" : "Not verified", proofVerified ? "pass" : "block");
  setText("human-authority", proofVerified ? "VERIFIED — bounded purchasing authority" : evaluation.humanAuthorityResult.decision.message);
  setPill("agent-status", standingVerified ? "Verified" : "Standing not verified", standingVerified ? "pass" : "block");
  setText("agent-standing", evaluation.agentStandingReceipt.outcome);
  setPill("mandate-status", evaluation.checks.find((check) => check.id === "mandate_fresh")?.passed ? "Valid" : "Blocked", evaluation.checks.find((check) => check.id === "mandate_fresh")?.passed ? "pass" : "block");
  setPill("evidence-status", evaluation.checks.find((check) => check.id === "evidence")?.passed ? "Valid" : "Blocked", evaluation.checks.find((check) => check.id === "evidence")?.passed ? "pass" : "block");
  renderChecks(evaluation.checks);

  const panel = byId("decision-panel");
  panel.className = `decision-panel ${allowed ? "allow" : "refuse"}`;
  setText("decision-title", evaluation.decision);
  const failed = evaluation.checks.filter((check) => !check.passed);
  setText("decision-detail", allowed
    ? "Every required pre-action check passed. A signed one-use GatePass is bound to this exact action."
    : evaluation.refusal?.primaryFailureSummary || `${failed.length} required check${failed.length === 1 ? "" : "s"} failed. No GatePass was issued and execution remains blocked.`);
  renderDecisionPrimary(evaluation.trustReceipt);
  renderDecisionMeta([
    `GatePass: ${evaluation.gatePass?.gatePassId || "NOT ISSUED"}`,
    `Digest: ${evaluation.exactAction.actionDigest.slice(0, 28)}…`,
    "Execution: not yet attempted",
  ]);
  byId("execute-button").disabled = !allowed;
  byId("replay-button").hidden = true;
  enableReceipt();
  renderReceipt(state.receipt);
}

function renderChecks(checks) {
  const grid = byId("checks-grid");
  grid.replaceChildren();
  const passed = checks.filter((check) => check.passed).length;
  setText("checks-summary", `${passed} of ${checks.length} passed`);
  for (const check of checks) {
    const item = document.createElement("div");
    item.className = `check ${check.passed ? "pass" : "block"}`;
    const number = document.createElement("span");
    number.className = "check__number";
    number.textContent = String(check.ordinal).padStart(2, "0");
    const status = document.createElement("span");
    status.className = "check__status";
    status.textContent = check.status;
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = check.label;
    const reason = document.createElement("small");
    reason.textContent = check.reason;
    copy.append(title, reason);
    item.append(number, status, copy);
    grid.append(item);
  }
}

async function executeAction() {
  if (!state.runId) return;
  setWorking(state.scenarioId === "action_tampering"
    ? "Presenting the changed £24,250 action at the execution boundary…"
    : "Verifying and consuming the one-use GatePass at the simulated execution boundary…");
  try {
    const response = await requestJson("/api/execute", {
      method: "POST",
      body: JSON.stringify({
        runId: state.runId,
        useScenarioMutation: state.scenarioId === "action_tampering",
      }),
    });
    state.receipt = response.result.trustReceipt;
    renderExecution(response.result.execution);
    renderReceipt(state.receipt);
  } catch (error) {
    showError(error);
  }
}

async function replayGatePass() {
  if (!state.runId) return;
  setWorking("Presenting the already-consumed GatePass again…");
  try {
    const response = await requestJson("/api/replay", {
      method: "POST",
      body: JSON.stringify({ runId: state.runId }),
    });
    state.receipt = response.result.trustReceipt;
    renderExecution(response.result.execution);
    renderReceipt(state.receipt);
  } catch (error) {
    showError(error);
  }
}

function renderExecution(execution) {
  const completed = execution.status === "SIMULATED_PURCHASE_COMPLETED";
  const panel = byId("decision-panel");
  panel.className = `decision-panel ${completed ? "allow" : "block"}`;
  setText("decision-title", execution.status);
  setText("decision-detail", execution.reason);
  renderDecisionPrimary(state.receipt);
  renderDecisionMeta([
    `GatePass: ${execution.gatePassId || "NONE"}`,
    `Consumed: ${execution.gatePassConsumed ? "YES" : "NO"}`,
    `Simulated purchase: ${execution.simulatedPurchaseReference || "NOT CREATED"}`,
  ]);
  byId("execute-button").disabled = completed || execution.status === "BLOCKED_REPLAY";
  byId("replay-button").hidden = !completed;
  enableReceipt();
}

function renderDecisionMeta(items) {
  const meta = byId("decision-meta");
  meta.replaceChildren();
  for (const value of items) {
    const span = document.createElement("span");
    span.textContent = value;
    meta.append(span);
  }
}

function renderDecisionPrimary(receipt) {
  const container = byId("decision-primary");
  container.replaceChildren();
  container.hidden = false;
  const heading = document.createElement("strong");
  heading.className = "decision-primary__heading";
  const rows = [];
  if (receipt.refusal) {
    heading.textContent = receipt.refusal.decision === "ACTION_REFUSED"
      ? "WHY ATG BLOCKED THIS ACTION"
      : "WHY ATG BLOCKED EXECUTION";
    rows.push(
      ["Primary reason", receipt.refusal.primaryFailureSummary],
      [receipt.refusal.primaryFailure.requestedLabel || "Requested", receipt.refusal.primaryFailure.requestedDisplay || "—"],
      [receipt.refusal.primaryFailure.permittedLabel || "Authorised / permitted", receipt.refusal.primaryFailure.permittedDisplay || "—"],
      ["GatePass", receipt.refusal.gatePassIssued ? "ISSUED — NOT VALID FOR THIS EXECUTION" : "NOT ISSUED"],
      ["Execution", "BLOCKED"],
    );
  } else {
    heading.textContent = "EXACT ACTION AUTHORISED";
    rows.push(
      ["Human authority", "VERIFIED"],
      ["Agent standing", "VERIFIED"],
      ["Exact action", "VERIFIED"],
      ["Execution", receipt.executiveSummary.executionStatus === "SIMULATED_PURCHASE_COMPLETED" ? "SIMULATED PURCHASE COMPLETED" : "READY — ONE-USE GATEPASS REQUIRED"],
      ["GatePass", receipt.executiveSummary.gatePassStatus],
    );
  }
  container.append(heading);
  const list = document.createElement("dl");
  for (const [label, value] of rows) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    list.append(row);
  }
  container.append(list);
  if (receipt.refusal?.failedChecks?.length) {
    const affected = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = `Additional checks affected (${receipt.refusal.failedChecks.length})`;
    const values = document.createElement("ul");
    for (const check of receipt.refusal.failedChecks) {
      const item = document.createElement("li");
      item.textContent = `${check.label}: ${check.reason}`;
      values.append(item);
    }
    affected.append(summary, values);
    container.append(affected);
  }
}

function enableReceipt() {
  byId("receipt-button").disabled = false;
  byId("verify-button").disabled = false;
  byId("copy-receipt-button").disabled = false;
  byId("download-json-button").disabled = false;
  byId("download-text-button").disabled = false;
  byId("receipt-placeholder").hidden = true;
}

function renderReceipt(receipt) {
  if (!receipt) return;
  setText("human-receipt", receipt.humanReadableReceipt);
  setText("json-receipt", JSON.stringify(receipt, null, 2));
  const summary = byId("receipt-executive-summary");
  summary.replaceChildren();
  const values = [
    ["Who", receipt.executiveSummary.whoAuthorized],
    ["Organisation", receipt.executiveSummary.organisation],
    ["Agent", receipt.executiveSummary.whichAgent],
    ["Exact action", receipt.executiveSummary.exactAction],
    ["Amount", `${money.format(receipt.executiveSummary.amount)} ${receipt.executiveSummary.currency}`],
    ["Why", receipt.executiveSummary.whyAtgDecided],
    ["GatePass", receipt.executiveSummary.gatePassStatus],
    ["Execution", receipt.executiveSummary.executionStatus],
    ["Timestamp", formatTime(receipt.executiveSummary.timestamp)],
    ["Receipt verification", receipt.executiveSummary.receiptVerificationStatus],
  ];
  for (const [label, value] of values) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    summary.append(row);
  }
}

async function copyReceipt() {
  if (!state.receipt) return;
  await navigator.clipboard.writeText(state.receipt.humanReadableReceipt);
  byId("copy-receipt-button").textContent = "Copied locally";
  window.setTimeout(() => { byId("copy-receipt-button").textContent = "Copy receipt"; }, 1600);
}

function downloadReceipt(kind) {
  if (!state.receipt) return;
  const isJson = kind === "json";
  const payload = isJson ? `${JSON.stringify(state.receipt, null, 2)}\n` : `${state.receipt.humanReadableReceipt}\n`;
  const blob = new Blob([payload], { type: isJson ? "application/json" : "text/plain" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `${state.receipt.receiptId}.${isJson ? "json" : "txt"}`;
  link.click();
  URL.revokeObjectURL(url);
}

function toggleReceipt() {
  const viewer = byId("receipt-viewer");
  viewer.hidden = !viewer.hidden;
  byId("receipt-button").textContent = viewer.hidden ? "Open Trust Receipt" : "Close Trust Receipt";
}

async function verifyReceipt() {
  if (!state.runId) return;
  try {
    const response = await requestJson("/api/verify-receipt", {
      method: "POST",
      body: JSON.stringify({ runId: state.runId }),
    });
    const verification = response.verification;
    const element = byId("verification-result");
    element.hidden = false;
    element.className = `verification-result ${verification.verified ? "pass" : "block"}`;
    element.textContent = verification.verified
      ? `VERIFIED — ${verification.checks.length} receipt integrity and evidence checks passed.`
      : `NOT VERIFIED — ${verification.reasonCodes.join(", ")}`;
  } catch (error) {
    showError(error);
  }
}

function resetDecision() {
  const panel = byId("decision-panel");
  panel.className = "decision-panel neutral";
  setText("decision-title", "Awaiting ATG evaluation");
  setText("decision-detail", "The simulated procurement adapter remains blocked until all 20 checks pass.");
  renderDecisionMeta([]);
  byId("checks-grid").replaceChildren(createEmptyState());
  setText("checks-summary", "Not yet evaluated");
  byId("execute-button").disabled = true;
  byId("replay-button").hidden = true;
  byId("receipt-button").disabled = true;
  byId("verify-button").disabled = true;
  byId("copy-receipt-button").disabled = true;
  byId("download-json-button").disabled = true;
  byId("download-text-button").disabled = true;
  byId("receipt-viewer").hidden = true;
  byId("verification-result").hidden = true;
  byId("receipt-placeholder").hidden = false;
  byId("decision-primary").hidden = true;
  byId("decision-primary").replaceChildren();
  setText("action-digest", "Calculated when ATG evaluates the action");
}

function createEmptyState() {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = "Run ATG verification to see every pre-action check.";
  return empty;
}

function setWorking(message) {
  byId("decision-panel").className = "decision-panel neutral";
  setText("decision-title", "Checking…");
  setText("decision-detail", message);
}

function showError(error) {
  byId("decision-panel").className = "decision-panel block";
  setText("decision-title", "LOCAL PROTOTYPE ERROR");
  setText("decision-detail", error instanceof Error ? error.message : String(error));
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : `${date.toISOString().replace("T", " ").replace(".000Z", " UTC")}`;
}

byId("evaluate-button").addEventListener("click", evaluateAction);
byId("execute-button").addEventListener("click", executeAction);
byId("replay-button").addEventListener("click", replayGatePass);
byId("receipt-button").addEventListener("click", toggleReceipt);
byId("verify-button").addEventListener("click", verifyReceipt);
byId("copy-receipt-button").addEventListener("click", () => { void copyReceipt().catch(showError); });
byId("download-json-button").addEventListener("click", () => downloadReceipt("json"));
byId("download-text-button").addEventListener("click", () => downloadReceipt("text"));

void (async () => {
  try {
    await loadScenarios();
    await loadPreview();
  } catch (error) {
    showError(error);
  }
})();
