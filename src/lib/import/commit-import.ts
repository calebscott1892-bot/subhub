import { parseCsv } from "./parse-csv";
import type { Subscription } from "@/lib/subscriptions/types";
import type { SubscriptionFormInput } from "@/lib/subscriptions/validation";
import { validateImportRow } from "./validate-import-row";

export type CsvImportPreviewRow = {
  rowNumber: number;
  providerName: string;
  ok: boolean;
  data: SubscriptionFormInput | null;
  errors: string[];
  warnings: string[];
};

export type CsvImportPreview = {
  headers: string[];
  rows: CsvImportPreviewRow[];
  parseErrors: string[];
  validCount: number;
  invalidCount: number;
};

export type CsvImportCommitResult = {
  createdCount: number;
  skippedCount: number;
  errors: string[];
  createdSubscriptions: Subscription[];
};

export function buildCsvImportPreview({
  csvText,
  existingSubscriptions,
}: {
  csvText: string;
  existingSubscriptions: Subscription[];
}): CsvImportPreview {
  const parsed = parseCsv(csvText);
  const rows = parsed.rows.map((row) => {
    const validation = validateImportRow(row);

    if (!validation.ok) {
      return {
        rowNumber: row.rowNumber,
        providerName: validation.providerName,
        ok: false,
        data: null,
        errors: validation.errors,
        warnings: [],
      };
    }

    return {
      rowNumber: row.rowNumber,
      providerName: validation.providerName,
      ok: true,
      data: validation.data,
      errors: [],
      warnings: findDuplicateWarnings(validation.data, existingSubscriptions),
    };
  });

  return {
    headers: parsed.headers,
    rows,
    parseErrors: parsed.errors,
    validCount: rows.filter((row) => row.ok).length,
    invalidCount: rows.filter((row) => !row.ok).length,
  };
}

export async function commitCsvImport({
  csvText,
  existingSubscriptions,
  createSubscription,
}: {
  csvText: string;
  existingSubscriptions: Subscription[];
  createSubscription: (input: SubscriptionFormInput) => Promise<Subscription>;
}): Promise<CsvImportCommitResult> {
  const preview = buildCsvImportPreview({ csvText, existingSubscriptions });
  const createdSubscriptions: Subscription[] = [];
  const errors = [...preview.parseErrors];

  for (const row of preview.rows) {
    if (!row.ok || !row.data) {
      errors.push(...row.errors.map((error) => `Row ${row.rowNumber}: ${error}`));
      continue;
    }

    createdSubscriptions.push(await createSubscription(row.data));
  }

  return {
    createdCount: createdSubscriptions.length,
    skippedCount: preview.rows.length - createdSubscriptions.length,
    errors,
    createdSubscriptions,
  };
}

function findDuplicateWarnings(
  input: SubscriptionFormInput,
  existingSubscriptions: Subscription[],
): string[] {
  const duplicate = existingSubscriptions.find((subscription) =>
    isLikelyDuplicate(input, subscription),
  );

  return duplicate
    ? [`Possible duplicate of existing subscription: ${duplicate.providerName}.`]
    : [];
}

function isLikelyDuplicate(
  input: SubscriptionFormInput,
  subscription: Subscription,
): boolean {
  if (normalize(input.providerName) !== normalize(subscription.providerName)) {
    return false;
  }

  if (input.accountEmailForProvider && subscription.accountEmailForProvider) {
    return (
      normalize(input.accountEmailForProvider) ===
      normalize(subscription.accountEmailForProvider)
    );
  }

  return true;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
