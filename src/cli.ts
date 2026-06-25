import { readFileSync } from "node:fs";

import { verifyBeforeAction } from "./verify-before-action.js";
import type { VerifyBeforeActionInput } from "./types.js";

const USAGE = "Usage: npm run verify -- <path-to-action.json>";

export function runCli(args: string[]): number {
  const filePath = args[0];

  if (filePath === undefined || filePath.trim().length === 0) {
    console.error(USAGE);
    return 1;
  }

  let fileContents: string;
  try {
    fileContents = readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Unable to read action file "${filePath}": ${errorMessage(error)}`);
    return 1;
  }

  let input: unknown;
  try {
    input = JSON.parse(fileContents);
  } catch (error) {
    console.error(`Invalid JSON in action file "${filePath}": ${errorMessage(error)}`);
    return 1;
  }

  try {
    const receipt = verifyBeforeAction(input as VerifyBeforeActionInput);
    console.log(JSON.stringify(receipt, null, 2));
    return 0;
  } catch (error) {
    console.error(`Unable to verify action: ${errorMessage(error)}`);
    return 1;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}
