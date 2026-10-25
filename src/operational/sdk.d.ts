export interface RecordAction { recordId: string; expectedVersion: number; document: Record<string, unknown>; }
export type OperationalStatus = 'PENDING' | 'APPROVED' | 'REVOKED' | 'DISPATCHED' | 'CLAIMED' | 'UNKNOWN' | 'EXECUTED' | 'REJECTED';
export interface Proposal { requestId: string; action: RecordAction; digest: string; before: Record<string, unknown>; beforeHash: string; createdAt: number; status: OperationalStatus; }
export interface Outcome { requestId: string; status: OperationalStatus; receipt?: unknown; requiresReconciliation?: boolean; }
export declare class AtgOperationalPlugin {
  constructor(options: { gatewayUrl: string; agentToken: string });
  propose(action: RecordAction): Promise<Proposal>;
  status(requestId: string): Promise<Proposal & { receipt: unknown }>;
  execute(requestId: string): Promise<Outcome>;
  reconcile(requestId: string): Promise<Outcome>;
}
export declare class AtgHumanApprovals {
  constructor(options: { gatewayUrl: string; accessToken: string });
  inspect(requestId: string): Promise<Proposal & { agentId: string }>;
  approve(requestId: string, reviewedDigest: string): Promise<Outcome>;
  revoke(requestId: string, reviewedDigest: string): Promise<Outcome>;
}
