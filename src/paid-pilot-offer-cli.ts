import {
  PAID_PILOT_OFFER_SAFETY_FLAGS,
  getPaidPilotOffer,
  getPaidPilotSafetyBoundary,
  summarisePaidPilotOffer,
  type PaidPilotOffer,
} from "./paid-pilot-offer.js";

export type PaidPilotOfferCliErrorCode =
  | "UNKNOWN_OPTION"
  | "UNEXPECTED_ARGUMENT"
  | "PAID_PILOT_OFFER_ERROR";

export interface PaidPilotOfferCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class PaidPilotOfferCliError extends Error {
  constructor(readonly code: PaidPilotOfferCliErrorCode, message: string) {
    super(message);
    this.name = "PaidPilotOfferCliError";
  }
}

const defaultIo: PaidPilotOfferCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runPaidPilotOfferCli(
  args: readonly string[],
  io: PaidPilotOfferCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const offer = getPaidPilotOffer();
    if (options.json) {
      io.stdout(JSON.stringify(options.summaryOnly ? summarisePaidPilotOffer(offer) : offer));
      return 0;
    }
    io.stdout(renderPaidPilotOffer(offer, options.summaryOnly));
    return 0;
  } catch (error) {
    const known = error instanceof PaidPilotOfferCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "PAID_PILOT_OFFER_ERROR",
        message: known ? error.message : "The paid pilot offer demo could not complete safely.",
      },
      note: "No checkout, payment link, payment integration, live API, network call, production signing, settlement execution, real tool execution, or action execution occurred.",
      ...PAID_PILOT_OFFER_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): { summaryOnly: boolean; json: boolean } {
  let summaryOnly = false;
  let json = false;
  for (const arg of args) {
    if (arg === "--summary-only") {
      summaryOnly = true;
      continue;
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The paid pilot offer command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The paid pilot offer command does not accept positional input files.");
  }
  return { summaryOnly, json };
}

function renderPaidPilotOffer(offer: PaidPilotOffer, summaryOnly: boolean): string {
  const lines = [
    "Agent Trust Gate Paid Evaluation Pilot",
    `offer: ${offer.offerIdentifier}`,
    `status: ${offer.status}`,
    `recommended first run: ${offer.recommendedFirstCommand}`,
    "",
    "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
    "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
    "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.",
    "",
    `indicative starting price: ${offer.startingCurrency} ${offer.indicativeStartingPrice}`,
    `price boundary: ${offer.priceQualifier}`,
    `contact: ${offer.publicContact}`,
    "",
    "buyer journey:",
    ...offer.buyerJourney.map((step) => `- ${step}`),
    "",
    "evaluated controls:",
    ...offer.evaluatedControls.map((item) => `- ${item}`),
    "",
    "safety boundary:",
    `- ${getPaidPilotSafetyBoundary()}`,
    "- local, manual-input only, human-approved, non-production, non-custodial, non-autonomous, advisory and demonstrative",
    "- no checkout, payment links, PayPal API integration, Stripe integration, real payment processing, settlement execution, production signing, network calls, real tool execution, or action execution",
  ];

  if (!summaryOnly) {
    lines.push(
      "",
      "included deliverables:",
      ...offer.includedDeliverables.map((item) => `- ${item}`),
      "",
      "buyer inputs required:",
      ...offer.buyerInputsRequired.map((item) => `- ${item}`),
      "",
      "approval requirements:",
      ...offer.approvalRequirements.map((item) => `- ${item}`),
      "",
      "exclusions:",
      ...offer.exclusions.map((item) => `- ${item}`),
    );
  }

  lines.push("", JSON.stringify(summaryOnly ? summarisePaidPilotOffer(offer) : offer, null, 2));
  return lines.join("\n");
}

function cliError(
  code: PaidPilotOfferCliErrorCode,
  message: string,
): PaidPilotOfferCliError {
  return new PaidPilotOfferCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runPaidPilotOfferCli(process.argv.slice(2));
}
