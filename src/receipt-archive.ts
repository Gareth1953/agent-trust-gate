import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { VerificationReceipt } from "./types.js";

export function saveReceiptToArchive(
  receipt: VerificationReceipt,
  archiveDirectory = "receipts",
): string {
  mkdirSync(archiveDirectory, { recursive: true });

  const safeTimestamp = receipt.timestamp.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const fileName = `${safeTimestamp}_${receipt.receipt_id}.json`;
  const archivePath = join(archiveDirectory, fileName);

  writeFileSync(archivePath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return archivePath;
}
