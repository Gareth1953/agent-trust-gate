import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { auditReceipts, listReceipts } from "./receipt-audit.js";
import { verifyBeforeAction } from "./verify-before-action.js";
import type { VerifyBeforeActionInput } from "./types.js";

const USAGE =
  "Usage: npm run verify -- <path-to-action.json> [--save]\n       npm run verify -- --audit\n       npm run verify -- --list-receipts";

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
  const filePath = args.find((arg) => arg !== "--save");

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
