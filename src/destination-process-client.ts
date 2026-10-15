import { fork, type ChildProcess } from "node:child_process";
import { join, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { validateDestinationTrust, type DestinationTrust } from "./destination-evidence.js";

/** Fixed local IPC endpoint only. No URLs, receipt-supplied keys, or live callback executor. */
export class SyntheticDestinationProcess {
  readonly child: ChildProcess;
  readonly #pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
  #failed = false;
  private constructor(child: ChildProcess) {
    this.child = child;
    child.on("message", (value: unknown) => {
      const m = value as { id?: string; value?: unknown; error?: string };
      if (!m.id) return;
      const p = this.#pending.get(m.id); if (!p) return;
      this.#pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(new Error(m.error)); else p.resolve(m.value);
    });
    const fail = () => { this.#failed = true; for (const p of this.#pending.values()) { clearTimeout(p.timer); p.reject(new Error("DESTINATION_UNAVAILABLE")); } this.#pending.clear(); };
    child.on("exit", fail); child.on("error", fail); child.on("disconnect", fail);
  }
  static async start(directory: string, initialise: boolean, trust?: DestinationTrust): Promise<{ client: SyntheticDestinationProcess; publicKeyPem: string }> {
    if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("ATG_SHARED_WORKER_REQUIRES_NODE_24");
    if (!isAbsolute(directory)) throw new Error("ABSOLUTE_DESTINATION_DIRECTORY_REQUIRED");
    const child = fork(join(__dirname, "../../scripts/destination-process.mjs"), [directory, ...(initialise ? ["--initialise"] : [])], { stdio: ["pipe", "pipe", "pipe", "ipc"] });
    const client = new SyntheticDestinationProcess(child);
    try {
      const ready = await new Promise<{ publicKeyPem: string }>((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error("DESTINATION_START_TIMEOUT")); }, 15000);
        const onMessage = (m: unknown) => { const v=m as { phase?: string; publicKeyPem: string }; if (v.phase === "ready") { cleanup(); resolve(v); } };
        const onExit = () => { cleanup(); reject(new Error("DESTINATION_START_FAILED")); };
        const cleanup = () => { clearTimeout(timer); child.off("message", onMessage); child.off("exit", onExit); child.off("error", onExit); };
        child.on("message", onMessage); child.on("exit", onExit); child.on("error", onExit);
      });
      if (trust) { if (ready.publicKeyPem !== trust.destinationPublicKeyPem) throw new Error("PINNED_DESTINATION_KEY_MISMATCH"); await client.configure(trust); }
      return { client, publicKeyPem: ready.publicKeyPem };
    } catch (e) { child.kill(); throw e; }
  }
  async configure(trust: DestinationTrust): Promise<void> { validateDestinationTrust(trust); await this.request({ op: "configure", trust }); }
  request(message: Record<string, unknown>): Promise<unknown> {
    if (this.#failed || !this.child.connected) return Promise.reject(new Error("DESTINATION_UNAVAILABLE"));
    const id=randomUUID();
    return new Promise((resolve, reject) => {
      const timer=setTimeout(() => { this.#pending.delete(id); reject(new Error("DESTINATION_RESPONSE_TIMEOUT")); }, 15000);
      this.#pending.set(id, { resolve, reject, timer });
      this.child.send({ ...message, id }, error => { if (error) { const p=this.#pending.get(id); if(p) { clearTimeout(p.timer); this.#pending.delete(id); reject(new Error("DESTINATION_UNAVAILABLE")); } } });
    });
  }
  async close(): Promise<void> { if (!this.#failed) await this.request({ op: "close" }); }
}
