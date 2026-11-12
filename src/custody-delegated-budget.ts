import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { canonicalBudgetEvidence, verifyDelegatedBudgetRequest, type BudgetTrust, type DelegatedRequest,
  type HostVerifiedCaller } from "./delegated-budget-witness.js";

export const custodyPayloadDigest = (p: unknown): string => createHash('sha256').update(canonicalBudgetEvidence(p)).digest('hex');

/** Called only during explicit creation of a NEW custody store. No migration. */
export function createCustodyBudget(db: DatabaseSync, trust: BudgetTrust): void {
  db.exec(`CREATE TABLE delegated_account(id INTEGER PRIMARY KEY CHECK(id=1),committed INTEGER NOT NULL,last_clock_ms INTEGER NOT NULL) STRICT;
    CREATE TABLE delegated_mandates(id TEXT PRIMARY KEY,digest TEXT NOT NULL,committed INTEGER NOT NULL) STRICT;
    CREATE TABLE delegated_revocations(id TEXT PRIMARY KEY) STRICT;
    CREATE TABLE delegated_actions(gate_id TEXT PRIMARY KEY,action_digest TEXT NOT NULL,mandate_id TEXT NOT NULL,root_id TEXT NOT NULL,leaf_id TEXT NOT NULL,account_id TEXT NOT NULL,amount INTEGER NOT NULL,payload_digest TEXT NOT NULL) STRICT;
    CREATE TABLE delegated_outcome_audit(gate_id TEXT PRIMARY KEY,event_id TEXT NOT NULL UNIQUE,witness_id TEXT NOT NULL,evidence_digest TEXT NOT NULL) STRICT;`);
  db.prepare('INSERT INTO delegated_account VALUES(1,0,0)').run();
  // The ceiling and all enrolled keys are pinned by the parent store trust digest.
  if (trust.accountCeilingMinor < 0) throw Error('BUDGET_CEILING_INVALID');
}

export function verifyCustodyDelegation(request: unknown, trust: BudgetTrust, caller: HostVerifiedCaller,
  ms: number, gateId: string, payload: {tenantId:string;resourceId:string;payeeReference:string;currency:string;amountMinorUnits:number},
  toolId: string, destination: string) {
  const checked = verifyDelegatedBudgetRequest(request, trust, caller, ms);
  const a=checked.action;
  if (a.actionId!==gateId || a.tenantId!==payload.tenantId || a.resourceId!==payload.resourceId ||
      a.payeeId!==payload.payeeReference || a.currency!==payload.currency || a.amountMinor!==payload.amountMinorUnits ||
      a.toolId!==toolId || a.destinationId!==destination || a.payloadDigest!==custodyPayloadDigest(payload))
    throw Error('DELEGATED_DESTINATION_ACTION_MISMATCH');
  return checked;
}

/** Runs under the SAME BEGIN IMMEDIATE as passkey consumption and the effect.
 * An acknowledgement loss cannot refund committed exposure. There is no agent
 * budget-reset/release/reconciliation command. No cross-database transaction. */
export function consumeCustodyBudget(db: DatabaseSync, trust: BudgetTrust,
  checked: ReturnType<typeof verifyDelegatedBudgetRequest>, caller: HostVerifiedCaller, ms: number): string | null {
  const {mandate,action,actionDigest}=checked;
  const account=db.prepare('SELECT * FROM delegated_account WHERE id=1').get();
  if (!account || !Number.isSafeInteger(ms) || ms<=0 || ms<Number(account.last_clock_ms)) throw Error('DELEGATED_CLOCK_ROLLBACK');
  db.prepare('UPDATE delegated_account SET last_clock_ms=? WHERE id=1').run(ms);
  if (db.prepare('SELECT id FROM delegated_revocations WHERE id=?').get(mandate.mandateId)) return 'DELEGATED_MANDATE_REVOKED';
  const m=db.prepare('SELECT * FROM delegated_mandates WHERE id=?').get(mandate.mandateId);
  const mandateDigest=custodyPayloadDigest(mandate);
  if (m && m.digest!==mandateDigest) return 'DELEGATED_MANDATE_REISSUE_CHANGED';
  const committed=Number(account.committed), mandateSpent=m?Number(m.committed):0;
  if (![committed,mandateSpent].every(n=>Number.isSafeInteger(n)&&n>=0) ||
      action.amountMinor===0 || action.amountMinor>trust.accountCeilingMinor-committed ||
      action.amountMinor>mandate.maxTotalMinor-mandateSpent) return 'SHARED_ROOT_OR_MANDATE_BUDGET_EXCEEDED';
  if (db.prepare('SELECT gate_id FROM delegated_actions WHERE gate_id=?').get(action.actionId)) return 'DELEGATED_ACTION_ALREADY_USED';
  if (!m) db.prepare('INSERT INTO delegated_mandates VALUES(?,?,0)').run(mandate.mandateId,mandateDigest);
  db.prepare('UPDATE delegated_mandates SET committed=committed+? WHERE id=?').run(action.amountMinor,mandate.mandateId);
  db.prepare('UPDATE delegated_account SET committed=committed+? WHERE id=1').run(action.amountMinor);
  db.prepare('INSERT INTO delegated_actions VALUES(?,?,?,?,?,?,?,?)').run(action.actionId,actionDigest,mandate.mandateId,
    trust.rootPrincipalId,caller.agentId,trust.accountId,action.amountMinor,action.payloadDigest!);
  return null;
}

export interface DelegatedApprovalSummary {
  rootPrincipalId:string; accountId:string; mandateId:string; missionId:string;
  agentChain:string[]; accountCeilingMinor:number; mandateCeilingMinor:number;
}
export function delegatedApprovalSummary(request: DelegatedRequest, trust: BudgetTrust): DelegatedApprovalSummary {
  return {rootPrincipalId:trust.rootPrincipalId,accountId:trust.accountId,mandateId:request.mandate.body.mandateId,
    missionId:request.mandate.body.missionId,agentChain:request.delegations.map(d=>d.body.childId),
    accountCeilingMinor:trust.accountCeilingMinor,mandateCeilingMinor:request.mandate.body.maxTotalMinor};
}
