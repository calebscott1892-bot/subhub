"use client";

import { useActionState } from "react";
import {
  commitCsvImportAction,
  previewCsvImportAction,
} from "@/app/(app)/import/csv/actions";
import type { CsvImportActionState } from "@/app/(app)/import/csv/actions";

const initialCsvImportActionState: CsvImportActionState = {
  csvText: "",
  error: null,
  message: null,
  preview: null,
};

export function CsvImportForm() {
  const [state, formAction, pending] = useActionState(
    previewCsvImportAction,
    initialCsvImportActionState,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
      <form
        action={formAction}
        className="rounded-lg border border-[#dbe3dc] bg-white p-5"
      >
        <div className="space-y-2">
          <label
            htmlFor="csvFile"
            className="text-sm font-semibold text-[#34443f]"
          >
            Upload CSV
          </label>
          <input
            id="csvFile"
            name="csvFile"
            type="file"
            accept=".csv,text/csv"
            className="block w-full rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#edf2ed] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#22312d]"
          />
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-semibold text-[#34443f]">
            Or paste CSV
          </span>
          <textarea
            name="csvText"
            rows={12}
            className="w-full rounded-md border border-[#cbd8d0] bg-white px-3 py-2 font-mono text-sm outline-none focus:border-[#176143]"
            defaultValue={state.csvText}
            placeholder="providerName,category,status,billingCadence,priceAmount,currency,renewalDate..."
          />
        </label>

        {state.error ? (
          <p className="mt-4 rounded-md border border-[#f0c7c2] bg-[#fff4f2] px-3 py-2 text-sm text-[#8f2d20]">
            {state.error}
          </p>
        ) : null}

        {state.message ? (
          <p className="mt-4 rounded-md border border-[#cfe1d4] bg-[#f3faf5] px-3 py-2 text-sm text-[#176143]">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Building preview..." : "Preview import"}
        </button>
      </form>

      <section className="rounded-lg border border-[#dbe3dc] bg-white">
        <div className="border-b border-[#e5ebe6] px-5 py-4">
          <h2 className="text-lg font-semibold">Import preview</h2>
          <p className="mt-1 text-sm text-[#68766f]">
            Valid rows can be committed after review. Invalid rows are skipped.
          </p>
        </div>

        {state.preview ? (
          <div>
            <div className="grid gap-3 border-b border-[#e5ebe6] px-5 py-4 text-sm md:grid-cols-3">
              <SummaryStat label="Valid rows" value={state.preview.validCount} />
              <SummaryStat
                label="Invalid rows"
                value={state.preview.invalidCount}
              />
              <SummaryStat
                label="Parser warnings"
                value={state.preview.parseErrors.length}
              />
            </div>

            {state.preview.parseErrors.length > 0 ? (
              <div className="border-b border-[#e5ebe6] px-5 py-4">
                <p className="text-sm font-semibold text-[#8f5a00]">
                  CSV structure warnings
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[#765100]">
                  {state.preview.parseErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="divide-y divide-[#edf1ed]">
              {state.preview.rows.map((row) => (
                <div
                  key={row.rowNumber}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[80px_1fr_150px]"
                >
                  <p className="text-sm font-semibold text-[#68766f]">
                    Row {row.rowNumber}
                  </p>
                  <div>
                    <p className="font-semibold text-[#16201d]">
                      {row.providerName || "Missing provider"}
                    </p>
                    <div className="mt-2 space-y-1">
                      {row.errors.map((error) => (
                        <p key={error} className="text-sm text-[#8f2d20]">
                          {error}
                        </p>
                      ))}
                      {row.warnings.map((warning) => (
                        <p key={warning} className="text-sm text-[#8f5a00]">
                          {warning}
                        </p>
                      ))}
                      {row.ok &&
                      row.errors.length === 0 &&
                      row.warnings.length === 0 ? (
                        <p className="text-sm text-[#68766f]">
                          Ready to import.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      row.ok
                        ? "bg-[#e8f3ea] text-[#176143]"
                        : "bg-[#fff4f2] text-[#8f2d20]"
                    }`}
                  >
                    {row.ok ? "Valid" : "Invalid"}
                  </span>
                </div>
              ))}
            </div>

            <form action={commitCsvImportAction} className="border-t border-[#e5ebe6] px-5 py-4">
              <textarea name="csvText" readOnly hidden value={state.csvText} />
              <button
                type="submit"
                disabled={state.preview.validCount === 0}
                className="rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Commit {state.preview.validCount} valid row
                {state.preview.validCount === 1 ? "" : "s"}
              </button>
            </form>
          </div>
        ) : (
          <div className="px-5 py-12 text-sm text-[#68766f]">
            Upload or paste a CSV to see row-level validation before anything is
            added to your hub.
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
