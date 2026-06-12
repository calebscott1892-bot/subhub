import type { BillingCadence } from "@/lib/subscriptions/types";
import { normalizeTransactionDate } from "./parse-transactions";

export type EmailReceiptParse = {
  providerGuess: string;
  amount: number;
  chargeDate: string | null;
  cadenceGuess: BillingCadence | null;
  mentionsTrial: boolean;
  matchedLines: string[];
  confidence: number;
};

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// Heuristic extraction from a pasted receipt/renewal email. Returns null when
// there is not enough signal (no provider or no amount) to make a candidate.
export function parseEmailReceipt(text: string): EmailReceiptParse | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const matchedLines: string[] = [];
  const provider = extractProvider(lines, matchedLines);
  const amount = extractAmount(lines, matchedLines);

  if (!provider || amount === null) {
    return null;
  }

  const chargeDate = extractDate(lines, matchedLines);
  const cadenceGuess = extractCadence(lines, matchedLines);
  const mentionsTrial = /\btrial\b/i.test(text);
  const confidence =
    Math.round(
      (0.3 +
        0.25 +
        0.2 +
        (chargeDate ? 0.15 : 0) +
        (cadenceGuess ? 0.1 : 0)) *
        100,
    ) / 100;

  return {
    providerGuess: provider,
    amount,
    chargeDate,
    cadenceGuess,
    mentionsTrial,
    matchedLines: [...new Set(matchedLines)].slice(0, 6),
    confidence,
  };
}

function extractProvider(
  lines: string[],
  matchedLines: string[],
): string | null {
  for (const line of lines) {
    const fromHeader = /^from:\s*"?([^"<]+?)"?\s*<[^@\s]+@([a-z0-9.-]+)>/i.exec(
      line,
    );

    if (fromHeader) {
      matchedLines.push(line);
      const name = fromHeader[1].trim();
      return name || domainToName(fromHeader[2]);
    }

    const fromAddress = /^from:\s*[^@\s]+@([a-z0-9.-]+)/i.exec(line);

    if (fromAddress) {
      matchedLines.push(line);
      return domainToName(fromAddress[1]);
    }
  }

  for (const line of lines) {
    const subject =
      /(?:receipt|invoice|payment|renewal|subscription|membership)[^a-z0-9]{0,8}(?:from|for|to)\s+([A-Z][\w .&+-]{2,40})/i.exec(
        line,
      );

    if (subject) {
      matchedLines.push(line);
      return subject[1].trim().replace(/[.,;:]$/, "");
    }
  }

  for (const line of lines) {
    const anyAddress = /[^@\s]+@([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i.exec(line);

    if (anyAddress) {
      matchedLines.push(line);
      return domainToName(anyAddress[1]);
    }
  }

  return null;
}

function domainToName(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  const core =
    parts.length > 2 && ["mail", "email", "no-reply", "noreply", "billing"].includes(parts[0])
      ? parts[1]
      : parts[0];

  return core.charAt(0).toUpperCase() + core.slice(1);
}

function extractAmount(
  lines: string[],
  matchedLines: string[],
): number | null {
  const amountPattern = /(?:\$|usd|aud|eur|gbp|£|€)\s?(\d{1,5}(?:,\d{3})*\.\d{2})/i;
  let fallback: { line: string; value: number } | null = null;

  for (const line of lines) {
    const match = amountPattern.exec(line);

    if (!match) {
      continue;
    }

    const value = Number(match[1].replaceAll(",", ""));

    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }

    if (/\b(total|amount|charged|paid|billed|payment)\b/i.test(line)) {
      matchedLines.push(line);
      return value;
    }

    fallback = fallback ?? { line, value };
  }

  if (fallback) {
    matchedLines.push(fallback.line);
    return fallback.value;
  }

  return null;
}

function extractDate(lines: string[], matchedLines: string[]): string | null {
  for (const line of lines) {
    const iso = /\b(\d{4}-\d{1,2}-\d{1,2})\b/.exec(line);

    if (iso) {
      const normalized = normalizeTransactionDate(iso[1]);

      if (normalized) {
        matchedLines.push(line);
        return normalized;
      }
    }

    const longDate =
      /\b(?:(\d{1,2})\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})?,?\s*(\d{4})\b/i.exec(
        line,
      );

    if (longDate) {
      const day = Number(longDate[1] ?? longDate[3]);
      const month = MONTHS.indexOf(longDate[2].toLowerCase()) + 1;
      const year = Number(longDate[4]);

      if (day >= 1 && day <= 31) {
        const normalized = normalizeTransactionDate(
          `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        );

        if (normalized) {
          matchedLines.push(line);
          return normalized;
        }
      }
    }
  }

  return null;
}

function extractCadence(
  lines: string[],
  matchedLines: string[],
): BillingCadence | null {
  for (const line of lines) {
    if (/(per month|\/\s?mo(nth)?\b|monthly)/i.test(line)) {
      matchedLines.push(line);
      return "Monthly";
    }

    if (/(per year|\/\s?yr\b|\/\s?year\b|annual|yearly)/i.test(line)) {
      matchedLines.push(line);
      return "Yearly";
    }

    if (/(per week|weekly)/i.test(line)) {
      matchedLines.push(line);
      return "Weekly";
    }
  }

  return null;
}
