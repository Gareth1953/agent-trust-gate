import { readFileSync } from "node:fs";

import { ActionValidationError } from "./action-validation.js";
import {
  createApprovalPack,
  formatApprovalPackForConsole,
  saveApprovalPackToArchive,
} from "./approval-pack.js";
import { BatchDirectoryError, reviewBatch } from "./batch-review.js";
import {
  CONTRACT_VERSION,
  formatContractForConsole,
  getContractDescription,
} from "./contract.js";
import {
  createEvidenceBundle,
  EvidenceBundleError,
  formatEvidenceBundleForConsole,
  saveEvidenceBundle,
  withEvidenceBundleSaveStatus,
} from "./evidence-bundle.js";
import { auditReceipts, listReceipts } from "./receipt-audit.js";
import { saveReceiptToArchive } from "./receipt-archive.js";
import { auditReviewRecords, listReviewRecords } from "./review-audit.js";
import { DEFAULT_GATEWAY_PORT, startGatewayServer } from "./gateway-server.js";
import {
  DEFAULT_GATEWAY_CLIENT_ID,
  DEFAULT_GATEWAY_CLIENTS_FILE,
  GatewayAuthConfigError,
} from "./gateway-auth.js";
import { verifyBeforeAction } from "./verify-before-action.js";
import {
  createHumanReviewRecord,
  formatHumanReviewRecordForConsole,
  HumanReviewError,
  saveHumanReviewRecord,
  withReviewRecordSaveStatus,
} from "./human-review.js";
import {
  auditGatewayClientUsage,
  auditGatewayUsage,
  listGatewayRequests,
  readValidGatewayRequestLogEntries,
  type GatewayClientUsageAudit,
  type GatewayRequestListEntry,
  type GatewayUsageSummary,
} from "./gateway-logging.js";
import {
  createGatewayAdminSummary,
  formatGatewayAdminForConsole,
} from "./gateway-admin.js";
import {
  createGatewayOpenApiDocument,
  formatGatewayOpenApiForConsole,
  writeGatewayOpenApiDocument,
} from "./gateway-openapi.js";
import {
  createAgentIntegrationManifest,
  formatAgentManifestForConsole,
  writeAgentIntegrationManifest,
} from "./agent-manifest.js";
import {
  formatGatewayEntitlementForConsole,
  getGatewayEntitlementStatus,
  readEntitlementClientsFile,
} from "./gateway-entitlements.js";
import { normalizeClientId } from "./gateway-auth.js";
import {
  createCommercialReadinessSnapshot,
  formatCommercialReadinessForConsole,
  writeCommercialReadinessSnapshot,
} from "./commercial-readiness.js";
import {
  createHostedReadinessReport,
  formatHostedReadinessForConsole,
  writeHostedReadinessReport,
} from "./hosted-readiness.js";
import {
  createSecurityReadinessReport,
  formatSecurityReadinessForConsole,
  writeSecurityReadinessReport,
} from "./security-readiness.js";
import {
  calculateLocalRequestCount,
  createRateLimitStatus,
  formatRateLimitStatusForConsole,
  writeRateLimitStatusReport,
} from "./gateway-rate-limits.js";
import {
  createMonitoringHealthReport,
  formatMonitoringHealthForConsole,
  writeMonitoringHealthReport,
} from "./monitoring-health.js";
import {
  createIncidentRecordTemplate,
  createIncidentResponseReadinessReport,
  formatIncidentRecordTemplateForConsole,
  formatIncidentResponseReadinessForConsole,
  writeIncidentRecordTemplate,
  writeIncidentResponseReadinessReport,
} from "./incident-response-readiness.js";
import {
  createCustomerTenantReadinessReport,
  formatCustomerTenantReadinessForConsole,
  writeCustomerTenantReadinessReport,
} from "./customer-tenant-readiness.js";
import {
  createBillingPaymentReadinessReport,
  formatBillingPaymentReadinessForConsole,
  writeBillingPaymentReadinessReport,
} from "./billing-payment-readiness.js";
import { createMachinePurchasePolicyReadinessReport, formatMachinePurchasePolicyReadinessForConsole, writeMachinePurchasePolicyReadinessReport } from "./machine-purchase-policy-readiness.js";
import { createLaunchReadinessReport, formatLaunchReadinessForConsole, writeLaunchReadinessReport } from "./launch-readiness.js";
import type { VerifyBeforeActionInput } from "./types.js";

const BASE_USAGE =
  "Usage: npm run verify -- <path-to-action.json> [--save] [--approval-pack] [--save-approval-pack] [--json] [--fail-on-block] [--policy standard|strict|regulated]\n       npm run verify -- --review-approval-pack <approval-pack.json> --decision approved|rejected|needs_more_info --reviewer <name> [--review-note <note>] [--save-review-record] [--json]\n       npm run verify -- --evidence-bundle <review-record.json> [--save-evidence-bundle] [--json]\n       npm run verify -- --serve [--port 8787] [--require-api-key] [--clients-file gateway-clients.json]\n       npm run verify -- --openapi [--json] [--output <path>]\n       npm run verify -- --agent-manifest [--json] [--output <path>]\n       npm run verify -- --entitlement [--client-id <id>] [--clients-file gateway-clients.json] [--json]\n       npm run verify -- --commercial-readiness [--json] [--output <path>]\n       npm run verify -- --hosted-readiness [--json] [--output <path>]\n       npm run verify -- --security-readiness [--json] [--output <path>]\n       npm run verify -- --gateway-admin [--clients-file gateway-clients.json] [--json]\n       npm run verify -- --gateway-usage [--json]\n       npm run verify -- --client-usage [--json]\n       npm run verify -- --list-gateway-requests [--limit 20] [--json]\n       npm run verify -- --batch <directory> [--save] [--approval-pack] [--json] [--fail-on-block] [--policy standard|strict|regulated]\n       npm run verify -- --audit-reviews [--json]\n       npm run verify -- --list-review-records [--json]\n       npm run verify -- --audit [--json]\n       npm run verify -- --list-receipts [--json]\n       npm run verify -- --contract [--json]";

const USAGE = `${BASE_USAGE}\n       npm run verify -- --rate-limit-status [--client-id <id>] [--clients-file gateway-clients.json] [--json] [--output <path>]\n       npm run verify -- --monitoring-health [--json] [--output <path>]\n       npm run verify -- --incident-response-readiness [--json] [--output <path>]\n       npm run verify -- --incident-template [--json] [--output <path>]\n       npm run verify -- --customer-tenant-readiness [--tenants-file <path>] [--json] [--output <path>]\n       npm run verify -- --billing-payment-readiness [--plans-file <path>] [--json] [--output <path>]\n       npm run verify -- --machine-purchase-policy-readiness [--policy-file <path>] [--json] [--output <path>]\n       npm run verify -- --launch-readiness [--json] [--output <path>]`;

export function runCli(args: string[]): number {
  const jsonMode = args.includes("--json");
  const failOnBlock = args.includes("--fail-on-block");

  if (args.includes("--serve")) {
    return runServeMode(args, jsonMode);
  }

  if (args.includes("--openapi")) {
    return runOpenApiMode(args, jsonMode);
  }

  if (args.includes("--agent-manifest")) {
    return runAgentManifestMode(args, jsonMode);
  }

  if (args.includes("--entitlement")) {
    return runEntitlementMode(args, jsonMode);
  }

  if (args.includes("--rate-limit-status")) {
    return runRateLimitStatusMode(args, jsonMode);
  }

  if (args.includes("--monitoring-health")) {
    return runMonitoringHealthMode(args, jsonMode);
  }

  if (args.includes("--incident-response-readiness")) {
    return runIncidentResponseReadinessMode(args, jsonMode);
  }

  if (args.includes("--incident-template")) {
    return runIncidentTemplateMode(args, jsonMode);
  }

  if (args.includes("--customer-tenant-readiness")) {
    return runCustomerTenantReadinessMode(args, jsonMode);
  }

  if (args.includes("--billing-payment-readiness")) {
    return runBillingPaymentReadinessMode(args, jsonMode);
  }
  if (args.includes("--machine-purchase-policy-readiness")) return runMachinePurchasePolicyReadinessMode(args,jsonMode);
  if (args.includes("--launch-readiness")) return runLaunchReadinessMode(args,jsonMode);

  if (args.includes("--commercial-readiness")) {
    return runCommercialReadinessMode(args, jsonMode);
  }

  if (args.includes("--hosted-readiness")) {
    return runHostedReadinessMode(args, jsonMode);
  }

  if (args.includes("--security-readiness")) {
    return runSecurityReadinessMode(args, jsonMode);
  }

  if (args.includes("--gateway-admin")) {
    return runGatewayAdminMode(args, jsonMode);
  }

  if (args.includes("--gateway-usage")) {
    return runGatewayUsageMode(args, jsonMode);
  }

  if (args.includes("--client-usage")) {
    return runClientUsageMode(args, jsonMode);
  }

  if (args.includes("--list-gateway-requests")) {
    return runListGatewayRequestsMode(args, jsonMode);
  }

  if (args.includes("--evidence-bundle")) {
    return runEvidenceBundleMode(args, jsonMode);
  }

  if (args.includes("--contract")) {
    if (jsonMode) {
      console.log(JSON.stringify(getContractDescription(), null, 2));
    } else {
      console.log(formatContractForConsole());
    }
    return 0;
  }

  if (args.includes("--audit")) {
    console.log(JSON.stringify(auditReceipts(), null, 2));
    return 0;
  }

  if (args.includes("--list-receipts")) {
    console.log(JSON.stringify(listReceipts(), null, 2));
    return 0;
  }

  if (args.includes("--audit-reviews") || args.includes("--list-review-records")) {
    return runReviewAuditMode(args, jsonMode);
  }

  if (args.includes("--review-approval-pack")) {
    if (args.includes("--batch")) {
      printError(
        "UNSUPPORTED_REVIEW_MODE",
        "Batch human review decisions are not supported. Review one approval pack at a time.",
        jsonMode,
      );
      return 1;
    }

    return runHumanReviewMode(args, jsonMode);
  }

  if (args.includes("--batch")) {
    return runBatchMode(args, jsonMode, failOnBlock);
  }

  const saveReceipt = args.includes("--save");
  const approvalPackRequested = args.includes("--approval-pack");
  const saveApprovalPack = args.includes("--save-approval-pack");
  const parsedArgs = parseVerificationArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(parsedArgs.errorCode ?? "CLI_ARGUMENT_ERROR", parsedArgs.error, jsonMode);
    return 1;
  }

  const { filePath, policyProfile } = parsedArgs;

  if (filePath === undefined || filePath.trim().length === 0) {
    printError("MISSING_ACTION_FILE", USAGE, jsonMode);
    return 1;
  }

  let fileContents: string;
  try {
    fileContents = readFileSync(filePath, "utf8");
  } catch (error) {
    printError(
      "ACTION_FILE_READ_ERROR",
      `Unable to read action file "${filePath}": ${errorMessage(error)}`,
      jsonMode,
    );
    return 1;
  }

  let input: unknown;
  try {
    input = JSON.parse(fileContents);
  } catch (error) {
    printError(
      "INVALID_ACTION_JSON",
      `Invalid JSON in action file "${filePath}": ${errorMessage(error)}`,
      jsonMode,
    );
    return 1;
  }

  try {
    const receipt = verifyBeforeAction(
      input as VerifyBeforeActionInput,
      policyProfile === undefined ? {} : { policy_profile: policyProfile },
    );
    let receiptPath: string | undefined;
    if (saveReceipt) {
      receiptPath = saveReceiptToArchive(receipt);
      if (!jsonMode) {
        console.error(`Saved receipt to ${receiptPath}`);
      }
    }

    if (approvalPackRequested) {
      const approvalPack = createApprovalPack(receipt);
      const approvalPackPath = saveApprovalPack
        ? saveApprovalPackToArchive(approvalPack)
        : undefined;

      if (jsonMode) {
        console.log(
          JSON.stringify(
            toApprovalPackResult(approvalPack, approvalPackPath),
            null,
            2,
          ),
        );
      } else {
        console.log(formatApprovalPackForConsole(approvalPack, approvalPackPath));
      }

      return failOnBlock && !receipt.allowed ? 2 : 0;
    }

    if (jsonMode) {
      console.log(JSON.stringify(toIntegrationResult(receipt, receiptPath), null, 2));
    } else {
      console.log(JSON.stringify(receipt, null, 2));
    }

    return failOnBlock && !receipt.allowed ? 2 : 0;
  } catch (error) {
    printError(
      errorCode(error),
      `Unable to verify action: ${errorMessage(error)}`,
      jsonMode,
      error instanceof ActionValidationError ? error.details : undefined,
    );
    return 1;
  }
}

function runServeMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseServeArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(parsedArgs.errorCode ?? "INVALID_GATEWAY_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    startGatewayServer({
      port: parsedArgs.port,
      requireApiKey: parsedArgs.requireApiKey,
      ...(parsedArgs.clientsFile === undefined ? {} : { clientsFile: parsedArgs.clientsFile }),
    });
  } catch (error) {
    printError(errorCode(error), errorMessage(error), jsonMode);
    return 1;
  }

  return 0;
}

function runOpenApiMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseOpenApiArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_OPENAPI_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeGatewayOpenApiDocument(parsedArgs.output);
    if (jsonMode) {
      console.log(JSON.stringify(createGatewayOpenApiDocument(), null, 2));
    } else {
      console.log(formatGatewayOpenApiForConsole());
      if (outputPath !== undefined) {
        console.log(`\nSaved OpenAPI contract to ${outputPath}`);
      }
    }
    return 0;
  } catch (error) {
    printError("OPENAPI_EXPORT_ERROR", `Unable to export OpenAPI contract: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseOpenApiArgs(args: string[]): {
  output?: string;
  error?: string;
} {
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--openapi" || arg === "--json") {
      continue;
    }
    if (arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: "Missing output path after --output." };
      }
      output = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { error: `--openapi cannot be combined with ${arg}.` };
    }
    return { error: "--openapi does not accept an action file argument." };
  }
  return output === undefined ? {} : { output };
}

function runAgentManifestMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseAgentManifestArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_AGENT_MANIFEST_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeAgentIntegrationManifest(parsedArgs.output);
    if (jsonMode) {
      console.log(JSON.stringify(createAgentIntegrationManifest(), null, 2));
    } else {
      console.log(formatAgentManifestForConsole());
      if (outputPath !== undefined) {
        console.log(`\nSaved agent manifest to ${outputPath}`);
      }
    }
    return 0;
  } catch (error) {
    printError("AGENT_MANIFEST_EXPORT_ERROR", `Unable to export agent manifest: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseAgentManifestArgs(args: string[]): {
  output?: string;
  error?: string;
} {
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--agent-manifest" || arg === "--json") {
      continue;
    }
    if (arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: "Missing output path after --output." };
      }
      output = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { error: `--agent-manifest cannot be combined with ${arg}.` };
    }
    return { error: "--agent-manifest does not accept an action file argument." };
  }
  return output === undefined ? {} : { output };
}

function runEntitlementMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseEntitlementArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_ENTITLEMENT_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const entitlement = getGatewayEntitlementStatus({
      clientId: parsedArgs.clientId,
      clients: readEntitlementClientsFile(parsedArgs.clientsFile),
    });
    console.log(
      jsonMode
        ? JSON.stringify(entitlement, null, 2)
        : formatGatewayEntitlementForConsole(entitlement),
    );
    return 0;
  } catch (error) {
    printError("ENTITLEMENT_LOOKUP_ERROR", `Unable to read local entitlement: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseEntitlementArgs(args: string[]): {
  clientId: string;
  clientsFile?: string;
  error?: string;
} {
  let clientId = normalizeClientId(undefined);
  let clientsFile: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--entitlement" || arg === "--json") {
      continue;
    }
    if (arg === "--client-id" || arg === "--clients-file") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          clientId,
          ...(clientsFile === undefined ? {} : { clientsFile }),
          error: `Missing value after ${arg}.`,
        };
      }
      if (arg === "--client-id") {
        clientId = normalizeClientId(value);
      } else {
        clientsFile = value;
      }
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return {
        clientId,
        ...(clientsFile === undefined ? {} : { clientsFile }),
        error: `--entitlement cannot be combined with ${arg}.`,
      };
    }
    return {
      clientId,
      ...(clientsFile === undefined ? {} : { clientsFile }),
      error: "--entitlement does not accept an action file argument.",
    };
  }
  return clientsFile === undefined ? { clientId } : { clientId, clientsFile };
}

function runRateLimitStatusMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseRateLimitStatusArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_RATE_LIMIT_STATUS_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const clients = readEntitlementClientsFile(parsedArgs.clientsFile);
    const client = clients.find((candidate) => candidate.client_id === parsedArgs.clientId);
    const usedRequests = calculateLocalRequestCount(
      readValidGatewayRequestLogEntries(),
      parsedArgs.clientId,
    );
    const report = createRateLimitStatus({
      clientId: parsedArgs.clientId,
      ...(client?.rate_limit === undefined
        ? {}
        : { maxRequests: client.rate_limit.max_requests }),
      usedRequests,
      knownClient: parsedArgs.clientId === DEFAULT_GATEWAY_CLIENT_ID || client !== undefined,
      windowType: "local_log_audit",
    });
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeRateLimitStatusReport(parsedArgs.output, report);
    console.log(jsonMode ? JSON.stringify(report, null, 2) : formatRateLimitStatusForConsole(report));
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved rate limit status report to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("RATE_LIMIT_STATUS_ERROR", `Unable to read local rate limit status: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseRateLimitStatusArgs(args: string[]): {
  clientId: string;
  clientsFile?: string;
  output?: string;
  error?: string;
} {
  let clientId = normalizeClientId(undefined);
  let clientsFile: string | undefined;
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--rate-limit-status" || arg === "--json") {
      continue;
    }
    if (arg === "--client-id" || arg === "--clients-file" || arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { clientId, error: `Missing value after ${arg}.` };
      }
      if (arg === "--client-id") {
        clientId = normalizeClientId(value);
      } else if (arg === "--clients-file") {
        clientsFile = value;
      } else {
        output = value;
      }
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { clientId, error: `--rate-limit-status cannot be combined with ${arg}.` };
    }
    return { clientId, error: "--rate-limit-status does not accept an action file argument." };
  }
  return {
    clientId,
    ...(clientsFile === undefined ? {} : { clientsFile }),
    ...(output === undefined ? {} : { output }),
  };
}

function runMonitoringHealthMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseMonitoringHealthArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_MONITORING_HEALTH_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const report = createMonitoringHealthReport();
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeMonitoringHealthReport(parsedArgs.output, report);
    console.log(jsonMode ? JSON.stringify(report, null, 2) : formatMonitoringHealthForConsole(report));
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved monitoring health report to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("MONITORING_HEALTH_ERROR", `Unable to create monitoring health report: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseMonitoringHealthArgs(args: string[]): { output?: string; error?: string } {
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--monitoring-health" || arg === "--json") {
      continue;
    }
    if (arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: "Missing output path after --output." };
      }
      output = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { error: `--monitoring-health cannot be combined with ${arg}.` };
    }
    return { error: "--monitoring-health does not accept an action file argument." };
  }
  return output === undefined ? {} : { output };
}

function runIncidentResponseReadinessMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseOutputOnlyArgs(args, "--incident-response-readiness");
  if (parsedArgs.error !== undefined) {
    printError("INVALID_INCIDENT_RESPONSE_READINESS_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const report = createIncidentResponseReadinessReport();
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeIncidentResponseReadinessReport(parsedArgs.output, report);
    console.log(
      jsonMode
        ? JSON.stringify(report, null, 2)
        : formatIncidentResponseReadinessForConsole(report),
    );
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved incident response readiness report to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("INCIDENT_RESPONSE_READINESS_ERROR", `Unable to create incident response readiness report: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function runIncidentTemplateMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseOutputOnlyArgs(args, "--incident-template");
  if (parsedArgs.error !== undefined) {
    printError("INVALID_INCIDENT_TEMPLATE_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const template = createIncidentRecordTemplate();
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeIncidentRecordTemplate(parsedArgs.output, template);
    console.log(
      jsonMode
        ? JSON.stringify(template, null, 2)
        : formatIncidentRecordTemplateForConsole(template),
    );
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved incident record template to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("INCIDENT_TEMPLATE_ERROR", `Unable to create incident record template: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseOutputOnlyArgs(
  args: string[],
  command: "--incident-response-readiness" | "--incident-template",
): { output?: string; error?: string } {
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === command || arg === "--json") {
      continue;
    }
    if (arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: "Missing output path after --output." };
      }
      output = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { error: `${command} cannot be combined with ${arg}.` };
    }
    return { error: `${command} does not accept an action file argument.` };
  }
  return output === undefined ? {} : { output };
}

function runCustomerTenantReadinessMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseCustomerTenantReadinessArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_CUSTOMER_TENANT_READINESS_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const report = createCustomerTenantReadinessReport({
      ...(parsedArgs.tenantsFile === undefined ? {} : { tenantsFile: parsedArgs.tenantsFile }),
    });
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeCustomerTenantReadinessReport(parsedArgs.output, report);
    console.log(
      jsonMode
        ? JSON.stringify(report, null, 2)
        : formatCustomerTenantReadinessForConsole(report),
    );
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved customer and tenant readiness report to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("CUSTOMER_TENANT_READINESS_ERROR", `Unable to create customer and tenant readiness report: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseCustomerTenantReadinessArgs(args: string[]): {
  tenantsFile?: string;
  output?: string;
  error?: string;
} {
  let tenantsFile: string | undefined;
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--customer-tenant-readiness" || arg === "--json") {
      continue;
    }
    if (arg === "--tenants-file" || arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: `Missing value after ${arg}.` };
      }
      if (arg === "--tenants-file") {
        tenantsFile = value;
      } else {
        output = value;
      }
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { error: `--customer-tenant-readiness cannot be combined with ${arg}.` };
    }
    return { error: "--customer-tenant-readiness does not accept an action file argument." };
  }
  return {
    ...(tenantsFile === undefined ? {} : { tenantsFile }),
    ...(output === undefined ? {} : { output }),
  };
}

function runBillingPaymentReadinessMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseBillingPaymentReadinessArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_BILLING_PAYMENT_READINESS_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }
  try {
    const report = createBillingPaymentReadinessReport({
      ...(parsedArgs.plansFile === undefined ? {} : { plansFile: parsedArgs.plansFile }),
    });
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeBillingPaymentReadinessReport(parsedArgs.output, report);
    console.log(jsonMode ? JSON.stringify(report, null, 2) : formatBillingPaymentReadinessForConsole(report));
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved billing and payment readiness report to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("BILLING_PAYMENT_READINESS_ERROR", `Unable to create billing and payment readiness report: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseBillingPaymentReadinessArgs(args: string[]): { plansFile?: string; output?: string; error?: string } {
  let plansFile: string | undefined;
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--billing-payment-readiness" || arg === "--json") continue;
    if (arg === "--plans-file" || arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) return { error: `Missing value after ${arg}.` };
      if (arg === "--plans-file") plansFile = value;
      else output = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) return { error: `--billing-payment-readiness cannot be combined with ${arg}.` };
    return { error: "--billing-payment-readiness does not accept an action file argument." };
  }
  return { ...(plansFile === undefined ? {} : { plansFile }), ...(output === undefined ? {} : { output }) };
}
function runMachinePurchasePolicyReadinessMode(args:string[],json:boolean):number{
  const p=parseMachinePurchasePolicyReadinessArgs(args);if(p.error){printError("INVALID_MACHINE_PURCHASE_POLICY_READINESS_ARGUMENTS",p.error,json);return 1;}
  try{const r=createMachinePurchasePolicyReadinessReport({...p.policyFile===undefined?{}:{policyFile:p.policyFile}});const out=p.output===undefined?undefined:writeMachinePurchasePolicyReadinessReport(p.output,r);console.log(json?JSON.stringify(r,null,2):formatMachinePurchasePolicyReadinessForConsole(r));if(!json&&out)console.log(`\nSaved machine purchase policy readiness report to ${out}`);return 0;}catch(e){printError("MACHINE_PURCHASE_POLICY_READINESS_ERROR",`Unable to create machine purchase policy readiness report: ${errorMessage(e)}`,json);return 1;}
}
function parseMachinePurchasePolicyReadinessArgs(args:string[]):{policyFile?:string;output?:string;error?:string}{let policyFile:string|undefined,output:string|undefined;for(let i=0;i<args.length;i++){const a=args[i];if(a==="--machine-purchase-policy-readiness"||a==="--json")continue;if(a==="--policy-file"||a==="--output"){const v=args[i+1];if(v===undefined||v.startsWith("--"))return{error:`Missing value after ${a}.`};if(a==="--policy-file")policyFile=v;else output=v;i++;continue;}return{error:`--machine-purchase-policy-readiness cannot be combined with ${a}.`};}return{...(policyFile?{policyFile}:{}),...(output?{output}:{})};}
function runLaunchReadinessMode(args:string[],json:boolean):number{let output:string|undefined;for(let i=0;i<args.length;i++){const a=args[i];if(a==="--launch-readiness"||a==="--json")continue;if(a==="--output"){const v=args[++i];if(!v||v.startsWith("--")){printError("INVALID_LAUNCH_READINESS_ARGUMENTS","Missing output path after --output.",json);return 1;}output=v;continue;}printError("INVALID_LAUNCH_READINESS_ARGUMENTS",`--launch-readiness cannot be combined with ${a}.`,json);return 1;}try{const r=createLaunchReadinessReport(),p=output?writeLaunchReadinessReport(output,r):undefined;console.log(json?JSON.stringify(r,null,2):formatLaunchReadinessForConsole(r));if(!json&&p)console.log(`\nSaved launch readiness report to ${p}`);return 0;}catch(e){printError("LAUNCH_READINESS_ERROR",`Unable to create launch readiness report: ${errorMessage(e)}`,json);return 1;}}

function runCommercialReadinessMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseCommercialReadinessArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_COMMERCIAL_READINESS_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const snapshot = createCommercialReadinessSnapshot();
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeCommercialReadinessSnapshot(parsedArgs.output, snapshot);
    console.log(
      jsonMode
        ? JSON.stringify(snapshot, null, 2)
        : formatCommercialReadinessForConsole(snapshot),
    );
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved commercial readiness snapshot to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("COMMERCIAL_READINESS_EXPORT_ERROR", `Unable to create commercial readiness snapshot: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseCommercialReadinessArgs(args: string[]): {
  output?: string;
  error?: string;
} {
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--commercial-readiness" || arg === "--json") {
      continue;
    }
    if (arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: "Missing output path after --output." };
      }
      output = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { error: `--commercial-readiness cannot be combined with ${arg}.` };
    }
    return { error: "--commercial-readiness does not accept an action file argument." };
  }
  return output === undefined ? {} : { output };
}

function runHostedReadinessMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseHostedReadinessArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_HOSTED_READINESS_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const report = createHostedReadinessReport();
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeHostedReadinessReport(parsedArgs.output, report);
    console.log(
      jsonMode
        ? JSON.stringify(report, null, 2)
        : formatHostedReadinessForConsole(report),
    );
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved hosted readiness report to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("HOSTED_READINESS_EXPORT_ERROR", `Unable to create hosted readiness report: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseHostedReadinessArgs(args: string[]): {
  output?: string;
  error?: string;
} {
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--hosted-readiness" || arg === "--json") {
      continue;
    }
    if (arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: "Missing output path after --output." };
      }
      output = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { error: `--hosted-readiness cannot be combined with ${arg}.` };
    }
    return { error: "--hosted-readiness does not accept an action file argument." };
  }
  return output === undefined ? {} : { output };
}

function runSecurityReadinessMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseSecurityReadinessArgs(args);
  if (parsedArgs.error !== undefined) {
    printError("INVALID_SECURITY_READINESS_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const report = createSecurityReadinessReport();
    const outputPath = parsedArgs.output === undefined
      ? undefined
      : writeSecurityReadinessReport(parsedArgs.output, report);
    console.log(
      jsonMode
        ? JSON.stringify(report, null, 2)
        : formatSecurityReadinessForConsole(report),
    );
    if (!jsonMode && outputPath !== undefined) {
      console.log(`\nSaved security readiness report to ${outputPath}`);
    }
    return 0;
  } catch (error) {
    printError("SECURITY_READINESS_EXPORT_ERROR", `Unable to create security readiness report: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function parseSecurityReadinessArgs(args: string[]): {
  output?: string;
  error?: string;
} {
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--security-readiness" || arg === "--json") {
      continue;
    }
    if (arg === "--output") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return { error: "Missing output path after --output." };
      }
      output = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith("--")) {
      return { error: `--security-readiness cannot be combined with ${arg}.` };
    }
    return { error: "--security-readiness does not accept an action file argument." };
  }
  return output === undefined ? {} : { output };
}

function parseServeArgs(args: string[]): {
  port: number;
  requireApiKey: boolean;
  clientsFile?: string;
  error?: string;
  errorCode?: string;
} {
  let port = DEFAULT_GATEWAY_PORT;
  let requireApiKey = false;
  let clientsFile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--serve" || arg === "--json") {
      continue;
    }

    if (arg === "--require-api-key") {
      requireApiKey = true;
      if (clientsFile === undefined) {
        clientsFile = DEFAULT_GATEWAY_CLIENTS_FILE;
      }
      continue;
    }

    if (arg === "--port") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          port,
          requireApiKey,
          error: "Missing port after --port.",
          errorCode: "MISSING_GATEWAY_PORT",
        };
      }

      const parsedPort = Number(value);
      if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        return {
          port,
          requireApiKey,
          error: `Invalid gateway port "${value}". Use an integer from 1 to 65535.`,
          errorCode: "INVALID_GATEWAY_PORT",
        };
      }

      port = parsedPort;
      index += 1;
      continue;
    }

    if (arg === "--clients-file") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          port,
          requireApiKey,
          error: "Missing clients file after --clients-file.",
          errorCode: "MISSING_GATEWAY_CLIENTS_FILE",
        };
      }

      clientsFile = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return {
        port,
        requireApiKey,
        error: `--serve cannot be combined with ${arg}.`,
        errorCode: "INVALID_GATEWAY_ARGUMENTS",
      };
    }

    return {
      port,
      requireApiKey,
      error: "--serve does not accept an action file argument.",
      errorCode: "INVALID_GATEWAY_ARGUMENTS",
    };
  }

  return clientsFile === undefined
    ? { port, requireApiKey }
    : { port, requireApiKey, clientsFile };
}

function runGatewayUsageMode(args: string[], jsonMode: boolean): number {
  const conflict = gatewayUsageConflict(args);
  if (conflict !== undefined) {
    printError("INVALID_GATEWAY_USAGE_ARGUMENTS", conflict, jsonMode);
    return 1;
  }

  const usage = auditGatewayUsage();
  console.log(jsonMode ? JSON.stringify(usage, null, 2) : formatGatewayUsageForConsole(usage));
  return 0;
}

function runGatewayAdminMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseGatewayAdminArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(parsedArgs.errorCode ?? "INVALID_GATEWAY_ADMIN_ARGUMENTS", parsedArgs.error, jsonMode);
    return 1;
  }

  const admin = createGatewayAdminSummary(
    parsedArgs.clientsFile === undefined ? {} : { clientsFile: parsedArgs.clientsFile },
  );
  console.log(jsonMode ? JSON.stringify(admin, null, 2) : formatGatewayAdminForConsole(admin));
  return 0;
}

function runClientUsageMode(args: string[], jsonMode: boolean): number {
  const conflict = clientUsageConflict(args);
  if (conflict !== undefined) {
    printError("INVALID_CLIENT_USAGE_ARGUMENTS", conflict, jsonMode);
    return 1;
  }

  const usage = auditGatewayClientUsage();
  console.log(jsonMode ? JSON.stringify(usage, null, 2) : formatClientUsageForConsole(usage));
  return 0;
}

function runListGatewayRequestsMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseListGatewayRequestsArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(
      parsedArgs.errorCode ?? "INVALID_GATEWAY_REQUEST_LIST_ARGUMENTS",
      parsedArgs.error,
      jsonMode,
    );
    return 1;
  }

  const requests = listGatewayRequests(parsedArgs.limit);
  console.log(jsonMode ? JSON.stringify(requests, null, 2) : formatGatewayRequestListForConsole(requests));
  return 0;
}

function parseGatewayAdminArgs(args: string[]): {
  clientsFile?: string;
  error?: string;
  errorCode?: string;
} {
  let clientsFile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--gateway-admin" || arg === "--json") {
      continue;
    }

    if (arg === "--clients-file") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          error: "Missing clients file after --clients-file.",
          errorCode: "MISSING_GATEWAY_CLIENTS_FILE",
        };
      }

      clientsFile = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return {
        error: `--gateway-admin cannot be combined with ${arg}.`,
        errorCode: "INVALID_GATEWAY_ADMIN_ARGUMENTS",
      };
    }

    return {
      error: "--gateway-admin does not accept an action file argument.",
      errorCode: "INVALID_GATEWAY_ADMIN_ARGUMENTS",
    };
  }

  return clientsFile === undefined ? {} : { clientsFile };
}

function gatewayUsageConflict(args: string[]): string | undefined {
  for (const arg of args) {
    if (arg === "--gateway-usage" || arg === "--json") {
      continue;
    }
    if (arg.startsWith("--")) {
      return `--gateway-usage cannot be combined with ${arg}.`;
    }
    return "--gateway-usage does not accept an action file argument.";
  }

  return undefined;
}

function clientUsageConflict(args: string[]): string | undefined {
  for (const arg of args) {
    if (arg === "--client-usage" || arg === "--json") {
      continue;
    }
    if (arg.startsWith("--")) {
      return `--client-usage cannot be combined with ${arg}.`;
    }
    return "--client-usage does not accept an action file argument.";
  }

  return undefined;
}

function parseListGatewayRequestsArgs(args: string[]): {
  limit: number;
  error?: string;
  errorCode?: string;
} {
  let limit = 20;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--list-gateway-requests" || arg === "--json") {
      continue;
    }

    if (arg === "--limit") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          limit,
          error: "Missing limit after --limit.",
          errorCode: "MISSING_GATEWAY_REQUEST_LIMIT",
        };
      }

      const parsedLimit = Number(value);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        return {
          limit,
          error: `Invalid gateway request limit "${value}". Use an integer from 1 to 1000.`,
          errorCode: "INVALID_GATEWAY_REQUEST_LIMIT",
        };
      }

      limit = parsedLimit;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return {
        limit,
        error: `--list-gateway-requests cannot be combined with ${arg}.`,
        errorCode: "INVALID_GATEWAY_REQUEST_LIST_ARGUMENTS",
      };
    }

    return {
      limit,
      error: "--list-gateway-requests does not accept an action file argument.",
      errorCode: "INVALID_GATEWAY_REQUEST_LIST_ARGUMENTS",
    };
  }

  return { limit };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorCode(error: unknown): string {
  const message = errorMessage(error);
  if (message.includes("Unknown policy profile")) {
    return "UNKNOWN_POLICY_PROFILE";
  }
  if (error instanceof HumanReviewError) {
    return error.code;
  }
  if (error instanceof EvidenceBundleError) {
    return error.code;
  }
  if (error instanceof GatewayAuthConfigError) {
    return error.code;
  }
  if (error instanceof ActionValidationError) {
    return "INVALID_ACTION_DESCRIPTOR";
  }
  return "VERIFY_ACTION_ERROR";
}

function printError(
  code: string,
  message: string,
  jsonMode: boolean,
  details?: unknown[],
): void {
  if (jsonMode) {
    const errorOutput: {
      ok: false;
      contract_version: string;
      error: {
        code: string;
        message: string;
        details?: unknown[];
      };
    } = {
      ok: false,
      contract_version: CONTRACT_VERSION,
      error: {
        code,
        message,
      },
    };

    if (details !== undefined) {
      errorOutput.error.details = details;
    }

    console.log(JSON.stringify(errorOutput, null, 2));
    return;
  }

  console.error(message);
  if (code === "CLI_ARGUMENT_ERROR") {
    console.error(USAGE);
  }
}

function toIntegrationResult(
  receipt: ReturnType<typeof verifyBeforeAction>,
  receiptPath?: string,
) {
  const result: {
    ok: true;
    contract_version: string;
    allowed: boolean;
    risk_level: string;
    human_approval_required: boolean;
    action_type: string;
    actor: string;
    target: string;
    policy_profile: string;
    regulated_policy: boolean;
    approval_reason: string | null;
    reasons: string[];
    receipt_id: string;
    receipt_saved: boolean;
    receipt_path?: string;
    timestamp: string;
    checked_at: string;
  } = {
    ok: true,
    contract_version: receipt.contract_version,
    allowed: receipt.allowed,
    risk_level: receipt.risk_level,
    human_approval_required: receipt.human_approval_required,
    action_type: receipt.input_summary.action_type,
    actor: receipt.input_summary.actor,
    target: receipt.input_summary.target,
    policy_profile: receipt.policy_profile,
    regulated_policy: receipt.regulated_policy,
    approval_reason: receipt.approval_reason,
    reasons: receipt.approval_reason === null ? [] : [receipt.approval_reason],
    receipt_id: receipt.receipt_id,
    receipt_saved: receiptPath !== undefined,
    timestamp: receipt.timestamp,
    checked_at: receipt.timestamp,
  };

  if (receiptPath !== undefined) {
    result.receipt_path = receiptPath;
  }

  return result;
}

function parseVerificationArgs(args: string[]): {
  filePath?: string;
  policyProfile?: string;
  error?: string;
  errorCode?: string;
} {
  let filePath: string | undefined;
  let policyProfile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (
      arg === "--save" ||
      arg === "--approval-pack" ||
      arg === "--save-approval-pack" ||
      arg === "--json" ||
      arg === "--fail-on-block" ||
      arg === "--contract"
    ) {
      continue;
    }

    if (arg === "--policy") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          error: "Missing policy profile after --policy.",
          errorCode: "MISSING_POLICY_PROFILE",
        };
      }
      policyProfile = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return { error: `Unknown option "${arg}".`, errorCode: "UNKNOWN_CLI_OPTION" };
    }

    if (filePath !== undefined) {
      return {
        error: `Unexpected extra argument "${arg}".`,
        errorCode: "UNEXPECTED_ARGUMENT",
      };
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

function runBatchMode(args: string[], jsonMode: boolean, failOnBlock: boolean): number {
  const parsedArgs = parseBatchArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(parsedArgs.errorCode ?? "CLI_ARGUMENT_ERROR", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const result = reviewBatch(parsedArgs.batchDirectory, {
      ...(parsedArgs.policyProfile === undefined
        ? {}
        : { policy_profile: parsedArgs.policyProfile }),
      save_receipts: args.includes("--save"),
      include_approval_pack: args.includes("--approval-pack"),
    });

    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatBatchForConsole(result));
    }

    return failOnBlock && result.summary.blocked_count > 0 ? 2 : 0;
  } catch (error) {
    printError(batchErrorCode(error), errorMessage(error), jsonMode);
    return 1;
  }
}

function runHumanReviewMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseHumanReviewArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(
      parsedArgs.errorCode ?? "INVALID_HUMAN_REVIEW",
      parsedArgs.error,
      jsonMode,
      parsedArgs.details,
    );
    return 1;
  }

  try {
    const reviewRecord = createHumanReviewRecord({
      approval_pack_path: parsedArgs.approvalPackPath,
      decision: parsedArgs.decision,
      reviewer: parsedArgs.reviewer,
      ...(parsedArgs.reviewNote === undefined ? {} : { review_note: parsedArgs.reviewNote }),
    });
    const reviewRecordPath = args.includes("--save-review-record")
      ? saveHumanReviewRecord(reviewRecord)
      : undefined;

    if (jsonMode) {
      console.log(
        JSON.stringify(withReviewRecordSaveStatus(reviewRecord, reviewRecordPath), null, 2),
      );
    } else {
      console.log(formatHumanReviewRecordForConsole(reviewRecord, reviewRecordPath));
    }

    return 0;
  } catch (error) {
    printError(
      errorCode(error),
      errorMessage(error),
      jsonMode,
      error instanceof HumanReviewError ? error.details : undefined,
    );
    return 1;
  }
}

function runReviewAuditMode(args: string[], jsonMode: boolean): number {
  const auditMode = args.includes("--audit-reviews");
  const listMode = args.includes("--list-review-records");

  if (auditMode && listMode) {
    printError(
      "INCOMPATIBLE_REVIEW_AUDIT_MODE",
      "Use either --audit-reviews or --list-review-records, not both.",
      jsonMode,
    );
    return 1;
  }

  const conflict = reviewAuditConflict(args);
  if (conflict !== undefined) {
    printError("INCOMPATIBLE_REVIEW_AUDIT_MODE", conflict, jsonMode);
    return 1;
  }

  if (auditMode) {
    const audit = auditReviewRecords();
    console.log(jsonMode ? JSON.stringify(audit, null, 2) : formatReviewAuditForConsole(audit));
    return 0;
  }

  const records = listReviewRecords();
  console.log(jsonMode ? JSON.stringify(records, null, 2) : formatReviewListForConsole(records));
  return 0;
}

function runEvidenceBundleMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseEvidenceBundleArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(
      parsedArgs.errorCode ?? "INVALID_EVIDENCE_BUNDLE_INPUT",
      parsedArgs.error,
      jsonMode,
      parsedArgs.details,
    );
    return 1;
  }

  try {
    const evidenceBundle = createEvidenceBundle(parsedArgs.reviewRecordPath);
    const evidenceBundlePath = args.includes("--save-evidence-bundle")
      ? saveEvidenceBundle(evidenceBundle)
      : undefined;

    if (jsonMode) {
      console.log(
        JSON.stringify(withEvidenceBundleSaveStatus(evidenceBundle, evidenceBundlePath), null, 2),
      );
    } else {
      console.log(formatEvidenceBundleForConsole(evidenceBundle, evidenceBundlePath));
    }

    return 0;
  } catch (error) {
    printError(
      errorCode(error),
      errorMessage(error),
      jsonMode,
      error instanceof EvidenceBundleError ? error.details : undefined,
    );
    return 1;
  }
}

function parseEvidenceBundleArgs(args: string[]): {
  reviewRecordPath: string;
  error?: string;
  errorCode?: string;
  details?: Array<{ field: string; issue: string }>;
} {
  let reviewRecordPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json" || arg === "--save-evidence-bundle") {
      continue;
    }

    if (arg === "--evidence-bundle") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return evidenceBundleArgError("review_record_path", "--evidence-bundle requires a review record path.");
      }
      reviewRecordPath = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return evidenceBundleArgError(
        "mode",
        `--evidence-bundle cannot be combined with ${arg}.`,
      );
    }

    return evidenceBundleArgError(
      "argument",
      "--evidence-bundle does not accept a separate action file argument.",
    );
  }

  if (reviewRecordPath === undefined || reviewRecordPath.trim().length === 0) {
    return evidenceBundleArgError("review_record_path", "--evidence-bundle requires a review record path.");
  }

  return { reviewRecordPath };
}

function evidenceBundleArgError(field: string, issue: string) {
  return {
    reviewRecordPath: "",
    error: issue,
    errorCode: "INVALID_EVIDENCE_BUNDLE_INPUT",
    details: [{ field, issue }],
  };
}

function reviewAuditConflict(args: string[]): string | undefined {
  if (args.includes("--review-approval-pack")) {
    return "Review audit/list modes cannot be combined with --review-approval-pack.";
  }
  if (args.includes("--batch")) {
    return "Review audit/list modes cannot be combined with --batch.";
  }

  for (const arg of args) {
    if (!arg.startsWith("--")) {
      return "Review audit/list modes do not accept an action file argument.";
    }
  }

  return undefined;
}

function formatReviewAuditForConsole(audit: ReturnType<typeof auditReviewRecords>): string {
  return [
    `Human review audit: ${audit.review_records_directory}`,
    `contract_version: ${audit.contract_version}`,
    "",
    "Summary:",
    `- total_files: ${audit.summary.total_files}`,
    `- valid_review_records: ${audit.summary.valid_review_records}`,
    `- approved_count: ${audit.summary.approved_count}`,
    `- rejected_count: ${audit.summary.rejected_count}`,
    `- needs_more_info_count: ${audit.summary.needs_more_info_count}`,
    `- invalid_review_records_count: ${audit.summary.invalid_review_records_count}`,
    `- malformed_review_records_count: ${audit.summary.malformed_review_records_count}`,
    `- approval_pack_hash_match_count: ${audit.summary.approval_pack_hash_match_count}`,
    `- approval_pack_hash_mismatch_count: ${audit.summary.approval_pack_hash_mismatch_count}`,
    `- approval_pack_missing_count: ${audit.summary.approval_pack_missing_count}`,
    "",
    "Review audit mode inspects local evidence records only.",
  ].join("\n");
}

function formatReviewListForConsole(records: ReturnType<typeof listReviewRecords>): string {
  if (records.length === 0) {
    return "No human review records found.";
  }

  return [
    "Human review records:",
    ...records.map((record) => {
      if (record.status !== "valid") {
        return `- ${record.filename}: ${record.status} (${record.error ?? "error"})`;
      }

      return `- ${record.filename}: ${record.human_decision} by ${record.human_reviewer} | risk=${record.original_risk_level} | policy=${record.original_policy_profile} | integrity=${record.approval_pack_integrity_status}`;
    }),
  ].join("\n");
}

function parseHumanReviewArgs(args: string[]): {
  approvalPackPath: string;
  decision: string;
  reviewer: string;
  reviewNote?: string;
  error?: string;
  errorCode?: string;
  details?: Array<{ field: string; issue: string }>;
} {
  let approvalPackPath: string | undefined;
  let decision: string | undefined;
  let reviewer: string | undefined;
  let reviewNote: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json" || arg === "--save-review-record") {
      continue;
    }

    if (arg === "--review-approval-pack") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return humanReviewArgError("approval_pack_path", "--review-approval-pack is required.");
      }
      approvalPackPath = value;
      index += 1;
      continue;
    }

    if (arg === "--decision") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return humanReviewArgError("decision", "--decision is required.");
      }
      decision = value;
      index += 1;
      continue;
    }

    if (arg === "--reviewer") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return humanReviewArgError("reviewer", "--reviewer is required.");
      }
      reviewer = value;
      index += 1;
      continue;
    }

    if (arg === "--review-note") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return humanReviewArgError("review_note", "--review-note requires a value.");
      }
      reviewNote = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return humanReviewArgError("argument", `Unknown option "${arg}".`);
    }

    return humanReviewArgError("argument", `Unexpected extra argument "${arg}".`);
  }

  const details: Array<{ field: string; issue: string }> = [];
  if (approvalPackPath === undefined || approvalPackPath.trim().length === 0) {
    details.push({
      field: "approval_pack_path",
      issue: "--review-approval-pack is required.",
    });
  }
  if (decision === undefined || decision.trim().length === 0) {
    details.push({ field: "decision", issue: "--decision is required." });
  }
  if (reviewer === undefined || reviewer.trim().length === 0) {
    details.push({ field: "reviewer", issue: "--reviewer is required and must be non-empty." });
  }

  if (details.length > 0) {
    return {
      approvalPackPath: "",
      decision: "",
      reviewer: "",
      error: "Invalid human review input.",
      errorCode: "INVALID_HUMAN_REVIEW",
      details,
    };
  }

  const validApprovalPackPath = approvalPackPath!;
  const validDecision = decision!;
  const validReviewer = reviewer!;

  return reviewNote === undefined
    ? {
        approvalPackPath: validApprovalPackPath,
        decision: validDecision,
        reviewer: validReviewer,
      }
    : {
        approvalPackPath: validApprovalPackPath,
        decision: validDecision,
        reviewer: validReviewer,
        reviewNote,
      };
}

function humanReviewArgError(field: string, issue: string) {
  return {
    approvalPackPath: "",
    decision: "",
    reviewer: "",
    error: issue,
    errorCode: "INVALID_HUMAN_REVIEW",
    details: [{ field, issue }],
  };
}

function parseBatchArgs(args: string[]): {
  batchDirectory: string;
  policyProfile?: string;
  error?: string;
  errorCode?: string;
} {
  let batchDirectory: string | undefined;
  let policyProfile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (
      arg === "--json" ||
      arg === "--fail-on-block" ||
      arg === "--save" ||
      arg === "--approval-pack"
    ) {
      continue;
    }

    if (arg === "--batch") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          batchDirectory: "",
          error: "Missing batch directory after --batch.",
          errorCode: "MISSING_BATCH_DIRECTORY",
        };
      }
      batchDirectory = value;
      index += 1;
      continue;
    }

    if (arg === "--policy") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          batchDirectory: "",
          error: "Missing policy profile after --policy.",
          errorCode: "MISSING_POLICY_PROFILE",
        };
      }
      policyProfile = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return {
        batchDirectory: "",
        error: `Unknown option "${arg}".`,
        errorCode: "UNKNOWN_CLI_OPTION",
      };
    }

    return {
      batchDirectory: "",
      error: `Unexpected extra argument "${arg}".`,
      errorCode: "UNEXPECTED_ARGUMENT",
    };
  }

  if (batchDirectory === undefined) {
    return {
      batchDirectory: "",
      error: "Missing batch directory after --batch.",
      errorCode: "MISSING_BATCH_DIRECTORY",
    };
  }

  return policyProfile === undefined
    ? { batchDirectory }
    : { batchDirectory, policyProfile };
}

function toApprovalPackResult(
  approvalPack: ReturnType<typeof createApprovalPack>,
  approvalPackPath?: string,
) {
  const result: ReturnType<typeof createApprovalPack> & {
    approval_pack_saved: boolean;
    approval_pack_path?: string;
  } = {
    ...approvalPack,
    approval_pack_saved: approvalPackPath !== undefined,
  };

  if (approvalPackPath !== undefined) {
    result.approval_pack_path = approvalPackPath;
  }

  return result;
}

function formatBatchForConsole(result: ReturnType<typeof reviewBatch>): string {
  return [
    `Batch preflight review: ${result.batch_directory}`,
    `contract_version: ${result.contract_version}`,
    "",
    "Summary:",
    `- total_files: ${result.summary.total_files}`,
    `- valid_actions: ${result.summary.valid_actions}`,
    `- invalid_actions: ${result.summary.invalid_actions}`,
    `- malformed_json_count: ${result.summary.malformed_json_count}`,
    `- allowed_count: ${result.summary.allowed_count}`,
    `- blocked_count: ${result.summary.blocked_count}`,
    `- approval_required_count: ${result.summary.approval_required_count}`,
    `- high_risk_count: ${result.summary.high_risk_count}`,
    `- medium_risk_count: ${result.summary.medium_risk_count}`,
    `- low_risk_count: ${result.summary.low_risk_count}`,
    "",
    "Results:",
    ...result.results.map((entry) => {
      if (entry.status === "valid") {
        return `- ${entry.filename}: ${entry.allowed ? "allowed" : "blocked"} (${entry.risk_level}, policy=${entry.policy_profile})`;
      }

      return `- ${entry.filename}: ${entry.status} (${entry.error?.code ?? "ERROR"})`;
    }),
    "",
    "Batch review does not execute actions.",
  ].join("\n");
}

function formatGatewayUsageForConsole(usage: GatewayUsageSummary): string {
  return [
    `Gateway usage: ${usage.gateway_logs_path}`,
    `contract_version: ${CONTRACT_VERSION}`,
    "",
    "Summary:",
    `- total_requests: ${usage.total_requests}`,
    `- successful_requests: ${usage.successful_requests}`,
    `- error_requests: ${usage.error_requests}`,
    `- malformed_log_lines_count: ${usage.malformed_log_lines_count}`,
    "",
    "Endpoint counts:",
    ...formatCounts(usage.endpoint_counts),
    "",
    "Decision counts:",
    `- allowed_count: ${usage.allowed_count}`,
    `- blocked_count: ${usage.blocked_count}`,
    `- approval_required_count: ${usage.approval_required_count}`,
    "",
    "Risk counts:",
    `- high_risk_count: ${usage.high_risk_count}`,
    `- medium_risk_count: ${usage.medium_risk_count}`,
    `- low_risk_count: ${usage.low_risk_count}`,
    "",
    "Policy profile counts:",
    ...formatCounts(usage.policy_profile_counts),
    `- regulated_policy_count: ${usage.regulated_policy_count}`,
    "",
    "Client counts:",
    ...formatCounts(usage.client_id_counts),
    `- authenticated_requests: ${usage.authenticated_requests}`,
    `- unauthenticated_requests: ${usage.unauthenticated_requests}`,
    `- unauthorized_requests: ${usage.unauthorized_requests}`,
    `- over_limit_requests: ${usage.over_limit_requests}`,
    "",
    "Usage-limited client counts:",
    ...formatCounts(usage.usage_limited_client_counts),
    "",
    "Error counts:",
    ...formatCounts(usage.error_code_counts),
    "",
    `first_request_at: ${usage.first_request_at ?? "none"}`,
    `last_request_at: ${usage.last_request_at ?? "none"}`,
    "",
    "Gateway request logs are local usage records only.",
  ].join("\n");
}

function formatGatewayRequestListForConsole(requests: GatewayRequestListEntry[]): string {
  if (requests.length === 0) {
    return "No gateway request log entries found.";
  }

  return [
    "Gateway request log entries:",
    ...requests.map((entry) => {
      if (entry.status === "malformed") {
        return `- line ${entry.line_number}: malformed (${entry.error})`;
      }

      return `- ${entry.timestamp} ${entry.method} ${entry.endpoint} request_id=${entry.request_id} client=${entry.client_id} auth_required=${entry.auth_required} auth_ok=${entry.auth_ok ?? "none"} usage_checked=${entry.usage_checked} over_limit=${entry.over_limit} remaining=${entry.remaining_decisions ?? "none"} ok=${entry.ok} status=${entry.status_code} policy=${entry.policy_profile ?? "none"} action=${entry.action_type ?? "none"} allowed=${entry.allowed ?? "none"} risk=${entry.risk_level ?? "none"} approval_required=${entry.human_approval_required ?? "none"} error=${entry.error_code ?? "none"}`;
    }),
  ].join("\n");
}

function formatClientUsageForConsole(usage: GatewayClientUsageAudit): string {
  if (usage.clients.length === 0) {
    return [
      `Client gateway usage: ${usage.gateway_logs_path}`,
      "No gateway client usage found.",
    ].join("\n");
  }

  return [
    `Client gateway usage: ${usage.gateway_logs_path}`,
    ...usage.clients.map((client) => (
      `- ${client.client_id}: total=${client.total_requests} protected=${client.protected_requests} decisions=${client.decision_requests} approval_packs=${client.approval_pack_requests} evidence_bundles=${client.evidence_bundle_requests} successful=${client.successful_requests} errors=${client.error_requests} unauthorized=${client.unauthorized_requests} over_limit=${client.over_limit_requests} allowed=${client.allowed_count} blocked=${client.blocked_count} approval_required=${client.approval_required_count} first=${client.first_request_at ?? "none"} last=${client.last_request_at ?? "none"}`
    )),
  ].join("\n");
}

function formatCounts(counts: Record<string, number>): string[] {
  const entries = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));
  if (entries.length === 0) {
    return ["- none: 0"];
  }

  return entries.map(([key, count]) => `- ${key}: ${count}`);
}

function batchErrorCode(error: unknown): string {
  const message = errorMessage(error);
  if (error instanceof BatchDirectoryError) {
    return error.code;
  }
  if (message.includes("Unknown policy profile")) {
    return "UNKNOWN_POLICY_PROFILE";
  }
  return "BATCH_REVIEW_ERROR";
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}
