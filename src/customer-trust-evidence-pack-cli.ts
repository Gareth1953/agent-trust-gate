import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createM162EvidenceBundle, verifyM162EvidenceBundle } from "./customer-trust-evidence-pack.js";

export interface CustomerTrustEvidenceCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

const DEFAULT_IO: CustomerTrustEvidenceCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export async function runCustomerTrustEvidencePackCli(args: readonly string[], io: CustomerTrustEvidenceCliIo = DEFAULT_IO): Promise<number> {
  try {
    const [command, option, path, ...rest] = args;
    if (rest.length > 0 || path === undefined) return usage(io);
    if (command === "generate" && option === "--output-dir") {
      const outputDir = resolve(path);
      const bundle = await createM162EvidenceBundle();
      mkdirSync(outputDir, { recursive: true });
      const files: Record<string, unknown> = {
        "evidence-bundle.json": bundle,
        "customer-trust-receipts.json": bundle.customerTrustReceipts,
        "assurance-coverage-map.json": bundle.coverageMap,
        "assurance-metrics.json": bundle.metrics,
        "buyer-adoption-proof-pack.json": bundle.buyerAdoptionProofPack,
        "evidence-manifest.json": bundle.manifest,
      };
      for (const [name, value] of Object.entries(files)) writeFileSync(join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
      writeFileSync(join(outputDir, "buyer-adoption-proof-pack.md"), bundle.reviewerMarkdown, "utf8");
      io.stdout(JSON.stringify({ generated: true, outputDir, runId: bundle.runId, bundleDigest: bundle.bundleDigest, authorityGranted: false, externalActionOccurred: false }));
      return 0;
    }
    if (command === "verify" && option === "--input") {
      const input = resolve(path);
      const value: unknown = JSON.parse(readFileSync(input, "utf8"));
      const result = await verifyM162EvidenceBundle(value);
      io.stdout(JSON.stringify(result));
      return result.verified ? 0 : 1;
    }
    return usage(io);
  } catch {
    io.stderr(JSON.stringify({ error: { code: "P3_M162_EVIDENCE_OPERATION_FAILED", message: "The local evidence operation failed closed." }, authorityGranted: false, executionAttempted: false }));
    return 1;
  }
}

function usage(io: CustomerTrustEvidenceCliIo): number {
  io.stderr(JSON.stringify({ error: { code: "USAGE", message: "Use generate --output-dir <directory> or verify --input <evidence-bundle.json>." } }));
  return 1;
}

if (require.main === module) {
  void runCustomerTrustEvidencePackCli(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
