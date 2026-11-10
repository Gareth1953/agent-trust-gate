import { fork, type ChildProcess } from "node:child_process";
import { join, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { validateDestinationTrust, type DestinationTrust } from "./destination-evidence.js";
import { DESTINATION_IPC_MAX_PENDING, snapshotDestinationCommand, snapshotDestinationMessage, snapshotDestinationReply } from "./destination-ipc-protocol.js";

/** Fixed local IPC endpoint only. No URLs, receipt-supplied keys, or live callback executor. */
export class SyntheticDestinationProcess {
  readonly child: ChildProcess;
  readonly #pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
  #failed = false;
  #fail(): void {
    this.#failed = true;
    for (const p of this.#pending.values()) { clearTimeout(p.timer); p.reject(new Error("DESTINATION_UNAVAILABLE")); }
    this.#pending.clear();
  }
  private constructor(child: ChildProcess) {
    this.child = child;
    child.on("message", (value: unknown) => {
      // Startup has a separate listener and is not a response to a command.
      if (value && typeof value === "object" && (value as { phase?: unknown }).phase === "ready") return;
      let m: Record<string, unknown>;
      try { m = snapshotDestinationReply(value); } catch { this.#fail(); return; }
      const id = m.id as string, p = this.#pending.get(id); if (!p) return;
      this.#pending.delete(id); clearTimeout(p.timer);
      if (Object.hasOwn(m, "error")) p.reject(new Error(m.error as string)); else p.resolve(m.value);
    });
    const fail = () => this.#fail();
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
        const onMessage = (m: unknown) => {
          try {
            const v = snapshotDestinationMessage(m);
            if (v.phase !== "ready" || typeof v.publicKeyPem !== "string" || v.pid !== child.pid
              || Object.keys(v).sort().join(",") !== "phase,pid,publicKeyPem") throw new Error("DESTINATION_START_INVALID");
            cleanup(); resolve({ publicKeyPem: v.publicKeyPem });
          } catch { cleanup(); reject(new Error("DESTINATION_START_INVALID")); }
        };
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
    let command: Record<string, unknown>;
    try { command = snapshotDestinationCommand(message); } catch (error) { return Promise.reject(error); }
    if (this.#pending.size >= DESTINATION_IPC_MAX_PENDING) return Promise.reject(new Error("DESTINATION_REQUEST_CAPACITY_REACHED"));
    const id=randomUUID();
    return new Promise((resolve, reject) => {
      const timer=setTimeout(() => { this.#pending.delete(id); reject(new Error("DESTINATION_RESPONSE_TIMEOUT")); }, 15000);
      this.#pending.set(id, { resolve, reject, timer });
      const unavailable = () => { const p=this.#pending.get(id); if(p) { clearTimeout(p.timer); this.#pending.delete(id); reject(new Error("DESTINATION_UNAVAILABLE")); } };
      try { this.child.send({ ...command, id }, error => { if (error) unavailable(); }); } catch { unavailable(); }
    });
  }
  async close(): Promise<void> { if (!this.#failed) await this.request({ op: "close" }); }
}
