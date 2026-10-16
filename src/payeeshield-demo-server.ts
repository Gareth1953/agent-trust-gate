import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { PayeeShieldDemo, PAYEESHIELD_DEFAULT_REQUEST } from "./payeeshield-demo.js";
import { SUPPLIER_BANK_CHANGE_SCENARIO_IDS } from "./supplier-bank-change-model.js";

export function createPayeeShieldDemoServer() {
  const demo = new PayeeShieldDemo(), token = randomUUID();
  const staticFiles: Record<string, [string, string]> = { "/": ["index.html", "text/html"], "/app.js": ["app.js", "text/javascript"], "/style.css": ["style.css", "text/css"] };
  async function handle(req: IncomingMessage, res: ServerResponse) {
    const json = (status: number, value: unknown) => { res.writeHead(status, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(value)); };
    res.setHeader("cache-control", "no-store"); res.setHeader("x-content-type-options", "nosniff"); res.setHeader("x-frame-options", "DENY");
    res.setHeader("referrer-policy", "no-referrer");
    res.setHeader("content-security-policy", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    try {
      const address = req.socket.localPort, expectedHost = `127.0.0.1:${address}`;
      if (req.headers.host !== expectedHost || !["127.0.0.1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "")) { json(403, { error: "LOOPBACK_HOST_REQUIRED" }); return; }
      const origin = req.headers.origin;
      if (origin !== undefined && origin !== `http://${expectedHost}`) { json(403, { error: "CROSS_ORIGIN_REFUSED" }); return; }
      if (req.headers["sec-fetch-site"] === "cross-site") { json(403, { error: "CROSS_SITE_REFUSED" }); return; }
      if (req.method === "GET" && staticFiles[req.url ?? ""]) {
        const [name, mime] = staticFiles[req.url!]!;
        res.writeHead(200, { "content-type": mime + "; charset=utf-8" }); res.end(readFileSync(resolve("prototype/payeeshield", name))); return;
      }
      if (req.method === "GET" && req.url === "/api/bootstrap") { json(200, { token, defaultRequest: PAYEESHIELD_DEFAULT_REQUEST, scenarios: SUPPLIER_BANK_CHANGE_SCENARIO_IDS, snapshot: demo.snapshot() }); return; }
      if (req.method !== "POST" || !["/api/approve", "/api/execute", "/api/revoke", "/api/state-edit", "/api/reconcile"].includes(req.url ?? "")) { json(404, { error: "ROUTE_NOT_FOUND" }); return; }
      const supplied = req.headers["x-atg-demo-token"];
      if (typeof supplied !== "string" || Buffer.byteLength(supplied) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) { json(403, { error: "DEMO_TOKEN_REQUIRED" }); return; }
      if (req.headers["content-type"]?.split(";")[0] !== "application/json") { json(415, { error: "JSON_REQUIRED" }); return; }
      let size = 0; const chunks: Buffer[] = [];
      for await (const raw of req) { const chunk = Buffer.from(raw); size += chunk.length; if (size > 8192) { json(413, { error: "REQUEST_TOO_LARGE" }); return; } chunks.push(chunk); }
      const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))) as Record<string, unknown>;
      if (!body || typeof body !== "object" || Array.isArray(body)) throw Error("OBJECT_REQUIRED");
      const keys = Object.keys(body).sort().join(",");
      if (req.url === "/api/approve" && keys === "request") { json(200, demo.approve(body.request)); return; }
      if (req.url === "/api/state-edit" && keys === "") { json(200, demo.simulateStateEdit()); return; }
      if (typeof body.approvalId !== "string" || !/^[a-f0-9-]{36}$/.test(body.approvalId)) throw Error("APPROVAL_HANDLE_REQUIRED");
      if (req.url === "/api/execute" && keys === "approvalId,fault,request" && ["none", "expired", "lost_ack"].includes(body.fault as string)) { json(200, await demo.execute(body.approvalId, body.request, body.fault as "none" | "expired" | "lost_ack")); return; }
      if (req.url === "/api/revoke" && keys === "approvalId") { json(200, demo.revoke(body.approvalId)); return; }
      if (req.url === "/api/reconcile" && keys === "approvalId") { json(200, demo.reconcile(body.approvalId)); return; }
      throw Error("REQUEST_FIELDS_INVALID");
    } catch { if (!res.writableEnded) json(400, { error: "DEMO_REQUEST_REFUSED" }); }
  }
  const server = createServer((req, res) => { void handle(req, res); });
  server.requestTimeout = 10_000; server.headersTimeout = 10_000; server.maxConnections = 16;
  return server;
}
if (require.main === module) {
  const server = createPayeeShieldDemoServer();
  server.listen(8795, "127.0.0.1", () => console.log("PayeeShield × ATG local synthetic demo: http://127.0.0.1:8795\nUse fictional fixtures only. State is process-local; restarting is not recovery. No bank verification, payments or ERP writes."));
}
