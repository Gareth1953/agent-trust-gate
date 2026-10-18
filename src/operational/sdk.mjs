import { callJson, transportUrl, validateAction } from './runtime.mjs';

/** The agent receives no approver credential, signing key or destination admin API. */
export class AtgOperationalPlugin {
  constructor({ gatewayUrl, agentToken }) {
    this.gatewayUrl = transportUrl(gatewayUrl);
    if (typeof agentToken !== 'string' || agentToken.length < 43) throw new TypeError('An operator-issued agent credential is required.');
    this.agentToken = agentToken;
  }
  propose(action) { return callJson(this.gatewayUrl, '/requests', this.agentToken, 'POST', validateAction(action)); }
  status(requestId) { return callJson(this.gatewayUrl, '/requests/' + encodeURIComponent(requestId), this.agentToken); }
  execute(requestId) { return callJson(this.gatewayUrl, '/requests/' + encodeURIComponent(requestId) + '/execute', this.agentToken, 'POST', {}); }
  reconcile(requestId) { return callJson(this.gatewayUrl, '/requests/' + encodeURIComponent(requestId) + '/reconcile', this.agentToken, 'POST', {}); }
}

/** Run in the human's trusted session, never within the agent process. */
export class AtgHumanApprovals {
  constructor({ gatewayUrl, accessToken }) { this.gatewayUrl = transportUrl(gatewayUrl); this.accessToken = accessToken; }
  inspect(requestId) { return callJson(this.gatewayUrl, '/approvals/' + encodeURIComponent(requestId), this.accessToken); }
  approve(requestId, reviewedDigest) { return callJson(this.gatewayUrl, '/requests/' + encodeURIComponent(requestId) + '/approve', this.accessToken, 'POST', { digest: reviewedDigest }); }
  revoke(requestId, reviewedDigest) { return callJson(this.gatewayUrl, '/requests/' + encodeURIComponent(requestId) + '/revoke', this.accessToken, 'POST', { digest: reviewedDigest }); }
}
