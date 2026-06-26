import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..", "..");
const actionPath = "examples/integrations/sample-public-post.json";

const result =
  process.platform === "win32"
    ? spawnSync(
        "cmd.exe",
        ["/d", "/s", "/c", `npm run verify -- ${actionPath} --json --fail-on-block`],
        {
          cwd: projectRoot,
          encoding: "utf8",
        },
      )
    : spawnSync("npm", ["run", "verify", "--", actionPath, "--json", "--fail-on-block"], {
        cwd: projectRoot,
        encoding: "utf8",
      });

let decision;
try {
  decision = JSON.parse(result.stdout);
} catch {
  console.log("error: Agent Trust Gate did not return parseable JSON.");
  process.exitCode = 1;
}

if (decision !== undefined) {
  if (decision.ok === false) {
    console.log(`error: ${decision.error.code} - ${decision.error.message}`);
    process.exitCode = 1;
  } else if (decision.allowed === true) {
    console.log(`allowed: ${decision.action_type} passed the local trust gate.`);
    console.log("no action executed: this example only demonstrates preflight checking.");
    process.exitCode = 0;
  } else {
    console.log(`blocked: ${decision.action_type} did not pass the local trust gate.`);
    console.log(`risk_level: ${decision.risk_level}`);
    console.log("no action executed: blocked actions must not proceed.");
    process.exitCode = 2;
  }
}
