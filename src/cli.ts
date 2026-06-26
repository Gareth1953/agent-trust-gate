import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { auditReceipts, listReceipts } from "./receipt-audit.js";
import { verifyBeforeAction } from "./verify-before-action.js";
import type { VerifyBeforeActionInput } from "./types.js";

const USAGE =
  "Usage: npm run verify -- <path-to-action.json> [--save] [--policy standard|strict|regulated]\n       npm run verify -- --audit\n       npm run verify -- --list-receipts";

export function runCli(args: string[]): number {
  if (args.includes("--audit")) {
    console.log(JSON.stringify(auditReceipts(), null, 2));
    return 0;
  }

  if (args.includes("--list-receipts")) {
    console.log(JSON.stringify(listReceipts(), null, 2));
    return 0;
  }

  const saveReceipt = args.includes("--save");
  const parsedArgs = parseVerificationArgs(args);
  if (parsedArgs.error !== undefined) {
    console.error(parsedArgs.error);
    console.error(USAGE);
    return 1;
  }

  const { filePath, policyProfile } = parsedArgs;

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
    const receipt = verifyBeforeAction(
      input as VerifyBeforeActionInput,
      policyProfile === undefined ? {} : { policy_profile: policyProfile },
    );
    if (saveReceipt) {
      const archivePath = saveReceiptToArchive(receipt);
      console.error(`Saved receipt to ${archivePath}`);
    }
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

function parseVerificationArgs(args: string[]): {
  filePath?: string;
  policyProfile?: string;
  error?: string;
} {
  let filePath: string | undefined;
  let policyProfile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--save") {
      continue;
    }

    if (arg === "--policy") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: "Missing policy profile after --policy." };
      }
      policyProfile = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return { error: `Unknown option "${arg}".` };
    }

    if (filePath !== undefined) {
      return { error: `Unexpected extra argument "${arg}".` };
    }

    filePath = arg;
  }

  const result: {
    filePath?: string;
    policyProfile?: string;
  } = {};

  if (filePath !== undefined) {
    result.filePath = filePath;
  }

  if (policyProfile !== undefined) {
    result.policyProfile = policyProfile;
  }

  return result;
}

function saveReceiptToArchive(receipt: ReturnType<typeof verifyBeforeAction>): string {
  const archiveDirectory = "receipts";
  mkdirSync(archiveDirectory, { recursive: true });

  const safeTimestamp = receipt.timestamp.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const fileName = `${safeTimestamp}_${receipt.receipt_id}.json`;
  const archivePath = join(archiveDirectory, fileName);

  writeFileSync(archivePath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return archivePath;
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}
