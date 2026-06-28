// Safety: this local client requests trust decisions and evidence only. It never executes actions.

export class AgentTrustGateError extends Error {
  constructor(message, { status, code, details = [], response } = {}) {
    super(message);
    this.name = "AgentTrustGateError";
    this.status = status;
    this.code = code ?? "GATEWAY_REQUEST_FAILED";
    this.details = details;
    this.response = response;
  }
}

export class AgentTrustGateClient {
  #baseUrl;
  #clientId;
  #apiKey;

  constructor({
    baseUrl = "http://127.0.0.1:8787",
    clientId,
    apiKey,
  } = {}) {
    const url = new URL(baseUrl);
    if (!isLocalHostname(url.hostname)) {
      throw new TypeError("Agent Trust Gate SDK starter clients support localhost URLs only.");
    }

    this.#baseUrl = url.toString().replace(/\/$/, "");
    this.#clientId = nonEmptyString(clientId);
    this.#apiKey = nonEmptyString(apiKey);
  }

  health() {
    return this.#request("/v1/health");
  }

  decide(action, options = {}) {
    requireObject(action, "action");
    const body = options.policyProfile === undefined
      ? action
      : { policy_profile: options.policyProfile, action };
    return this.#request("/v1/decision", { method: "POST", body });
  }

  createApprovalPack(action, options = {}) {
    requireObject(action, "action");
    const body = {
      action,
      ...(options.policyProfile === undefined ? {} : { policy_profile: options.policyProfile }),
      ...(options.saveApprovalPack === undefined
        ? {}
        : { save_approval_pack: options.saveApprovalPack === true }),
    };
    return this.#request("/v1/approval-pack", { method: "POST", body });
  }

  createEvidenceBundle(reviewRecordPath, options = {}) {
    if (typeof reviewRecordPath !== "string" || reviewRecordPath.trim().length === 0) {
      throw new TypeError("reviewRecordPath must be a non-empty local path.");
    }
    return this.#request("/v1/evidence-bundle", {
      method: "POST",
      body: {
        review_record_path: reviewRecordPath,
        ...(options.saveEvidenceBundle === undefined
          ? {}
          : { save_evidence_bundle: options.saveEvidenceBundle === true }),
      },
    });
  }

  openapi() {
    return this.#request("/v1/openapi.json");
  }

  entitlement() {
    return this.#request("/v1/entitlement");
  }

  commercialReadiness() {
    return this.#request("/v1/commercial-readiness");
  }

  hostedReadiness() {
    return this.#request("/v1/hosted-readiness");
  }

  securityReadiness() {
    return this.#request("/v1/security-readiness");
  }

  rateLimitStatus() {
    return this.#request("/v1/rate-limit-status");
  }

  monitoringHealth() {
    return this.#request("/v1/monitoring-health");
  }

  incidentResponseReadiness() {
    return this.#request("/v1/incident-response-readiness");
  }

  customerTenantReadiness() {
    return this.#request("/v1/customer-tenant-readiness");
  }

  async #request(path, { method = "GET", body } = {}) {
    const headers = { Accept: "application/json" };
    if (this.#clientId !== undefined) {
      headers["X-ATG-Client-ID"] = this.#clientId;
    }
    if (this.#apiKey !== undefined) {
      headers["X-ATG-API-Key"] = this.#apiKey;
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${this.#baseUrl}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      throw new AgentTrustGateError(
        payload?.error?.message ?? `Gateway request failed with HTTP ${response.status}.`,
        {
          status: response.status,
          code: payload?.error?.code,
          details: Array.isArray(payload?.error?.details) ? payload.error.details : [],
          response: payload,
        },
      );
    }
    return payload;
  }
}

export function createAgentTrustGateClient(options) {
  return new AgentTrustGateClient(options);
}

async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new AgentTrustGateError("Gateway returned a non-JSON response.", {
      status: response.status,
      code: "INVALID_GATEWAY_RESPONSE",
    });
  }
}

function isLocalHostname(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]";
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function requireObject(value, name) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${name} must be an action descriptor object.`);
  }
}
