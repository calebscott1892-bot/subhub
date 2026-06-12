import { parseCsv } from "@/lib/import/parse-csv";

export type BankTransaction = {
  date: string;
  description: string;
  amount: number;
};

export type TransactionParseResult = {
  transactions: BankTransaction[];
  errors: string[];
};

const DATE_HEADERS = new Set([
  "date",
  "transaction date",
  "posted date",
  "posted",
  "value date",
]);

const DESCRIPTION_HEADERS = new Set([
  "description",
  "merchant",
  "details",
  "narrative",
  "payee",
  "memo",
]);

const AMOUNT_HEADERS = new Set([
  "amount",
  "debit",
  "value",
  "transaction amount",
]);

export function parseTransactionsCsv(csvText: string): TransactionParseResult {
  const parsed = parseCsv(csvText);
  const errors = [...parsed.errors];

  if (parsed.headers.length === 0) {
    return { transactions: [], errors };
  }

  const dateHeader = findHeader(parsed.headers, DATE_HEADERS);
  const descriptionHeader = findHeader(parsed.headers, DESCRIPTION_HEADERS);
  const amountHeader = findHeader(parsed.headers, AMOUNT_HEADERS);

  if (!dateHeader || !descriptionHeader || !amountHeader) {
    errors.push(
      "CSV needs date, description, and amount columns (headers like date/description/amount, merchant/details, or debit).",
    );
    return { transactions: [], errors };
  }

  const transactions: BankTransaction[] = [];

  for (const row of parsed.rows) {
    const date = normalizeTransactionDate(row.values[dateHeader] ?? "");
    const description = (row.values[descriptionHeader] ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const amount = parseAmount(row.values[amountHeader] ?? "");

    if (!date) {
      errors.push(
        `Row ${row.rowNumber}: unrecognized date "${row.values[dateHeader]}". Use YYYY-MM-DD or DD/MM/YYYY.`,
      );
      continue;
    }

    if (!description) {
      errors.push(`Row ${row.rowNumber}: missing description.`);
      continue;
    }

    if (amount === null || amount === 0) {
      errors.push(
        `Row ${row.rowNumber}: unrecognized amount "${row.values[amountHeader]}".`,
      );
      continue;
    }

    // Charges may be exported as negatives; recurring detection only cares
    // about magnitude.
    transactions.push({ date, description, amount: Math.abs(amount) });
  }

  return { transactions, errors };
}

function findHeader(
  headers: string[],
  candidates: Set<string>,
): string | null {
  return (
    headers.find((header) => candidates.has(header.toLowerCase().trim())) ??
    null
  );
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.()-]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  // Accounting style: (12.34) means a debit of 12.34.
  const accounting = /^\((.*)\)$/.exec(cleaned);
  const value = Number(accounting ? `-${accounting[1]}` : cleaned);

  return Number.isFinite(value) ? value : null;
}

export function normalizeTransactionDate(raw: string): string | null {
  const value = raw.trim();
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);

  if (isoMatch) {
    return buildDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );
  }

  const slashMatch = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value);

  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);

    // Day-first by default; fall back to month-first when day-first is
    // impossible (e.g. 03/25/2026).
    if (first > 12 && second <= 12) {
      return buildDate(year, second, first);
    }

    if (second > 12 && first <= 12) {
      return buildDate(year, first, second);
    }

    return buildDate(year, second, first);
  }

  return null;
}

function buildDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}
