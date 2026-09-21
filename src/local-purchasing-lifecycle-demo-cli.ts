import {
  renderLocalPurchasingLifecycleDemo,
  runLocalPurchasingLifecycleDemo,
} from "./local-purchasing-lifecycle-demo.js";

export async function runLocalPurchasingLifecycleDemoCli(
  args: readonly string[],
  io: { stdout: (value: string) => void; stderr: (value: string) => void } = {
    stdout: (value) => console.log(value),
    stderr: (value) => console.error(value),
  },
): Promise<number> {
  try {
    if (args.some((arg) => arg !== "--json")) {
      io.stderr(JSON.stringify({ error: { code: "UNKNOWN_OPTION", message: "Use no option for the readable table or --json for machine-readable evidence." } }));
      return 1;
    }
    const pack = await runLocalPurchasingLifecycleDemo();
    io.stdout(args.includes("--json") ? JSON.stringify(pack, null, 2) : renderLocalPurchasingLifecycleDemo(pack));
    return 0;
  } catch {
    io.stderr(JSON.stringify({
      error: { code: "P3_M161_DEMO_FAILED", message: "The local synthetic purchasing lifecycle demonstration failed closed." },
      externalActionOccurred: false,
    }));
    return 1;
  }
}

if (require.main === module) {
  void runLocalPurchasingLifecycleDemoCli(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
