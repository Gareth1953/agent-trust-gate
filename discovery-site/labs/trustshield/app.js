'use strict';
(() => {
  const data = window.ATG_S9_EVIDENCE;
  const get = id => document.getElementById(id);
  let selected = null;
  function detail(label, record) {
    const d = document.createElement('details'); d.className = 'record';
    const s = document.createElement('summary'); s.textContent = label;
    const p = document.createElement('pre'); p.tabIndex = 0; p.textContent = JSON.stringify(record, null, 2);
    d.append(s, p); get('records').append(d);
  }
  function display() {
    if (!data || data.scenarios.length !== 8) { get('status').textContent = 'EVIDENCE UNAVAILABLE'; return; }
    selected = data.scenarios.find(s => s.id === get('scenario').value);
    const r = selected;
    get('result-title').textContent = r.title; get('status').textContent = r.decision;
    get('status').dataset.tone = r.decision === 'DENY' || r.decision === 'BYPASSED' ? 'deny' : r.decision === 'ESCALATE' ? 'review' : r.decision === 'UNKNOWN' ? 'unknown' : 'allow';
    get('lesson').textContent = r.lesson; get('reason').textContent = r.reasonCode;
    get('effects').textContent = String(r.atDecision.effectCount);
    get('consumption').textContent = r.atDecision.approvalConsumption;
    get('epoch').textContent = 'S' + r.currentSnapshot.epoch;
    get('explanation').textContent = r.id === 'bypass'
      ? 'Protected D: DENY, 0 effects. Separate permissive mock: 1 unprotected synthetic effect. This is a limitation, never a protected success.'
      : r.id === 'replay' ? 'One earlier promotion remains. The replay produces 0 additional effects.'
      : r.id === 'unknown' ? 'The destination committed 1 synthetic effect. Witness completion/acknowledgement is pending: UNKNOWN, no blind retry.'
      : 'Destination manifest version: ' + r.atDecision.manifestVersion + '. No software ran.';
    get('reconcile').hidden = r.id !== 'unknown'; get('recovery').hidden = true;
    get('records').replaceChildren();
    detail('1 · Exact action and explicit synthetic approval', { action: r.approvedAction, approval: r.approval, adapterBinding: r.adapterBinding });
    detail('2 · Approval-time S1 and current signed security statement', { approvalSnapshot: r.approvalSnapshot, currentSnapshot: r.currentSnapshot });
    detail('3 · Synthetic policy and reason codes', { policy: r.policy, decision: r.decision, reasonCode: r.reasonCode });
    detail('4 · Decision / submission / destination receipts', { observed: r.observed, audit: r.audit, earlier: r.earlier });
    detail('5 · Witness and reconciliation evidence', { witness: r.witness, reconciled: r.reconciled, reader: r.reader });
  }
  get('inspect').addEventListener('click', display);
  get('scenario').addEventListener('change', display);
  get('reconcile').addEventListener('click', () => {
    if (selected?.id !== 'unknown') return;
    get('status').textContent = selected.reconciled.decision; get('status').dataset.tone = 'allow';
    get('reason').textContent = selected.reconciled.reason;
    get('recovery').textContent = 'Captured reconciliation verifies matching destination outcome and witness checkpoint. Effects remain 1; no resubmission occurred. This button reveals retained evidence only.';
    get('recovery').hidden = false; get('reconcile').hidden = true;
  });
  display();
})();
