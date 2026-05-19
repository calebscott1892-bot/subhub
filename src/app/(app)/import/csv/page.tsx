import Link from "next/link";
import { CsvImportForm } from "@/components/csv-import-form";

export default function CsvImportPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            CSV import
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold md:text-4xl">
            Bring existing subscriptions into the hub quickly.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68766f]">
            Review every detected row before it is saved. Duplicates are flagged
            so importing never becomes a blind bulk action.
          </p>
        </div>
        <Link
          href="/templates/subscription-hub-import-template.csv"
          className="w-fit rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d]"
        >
          Download template
        </Link>
      </section>

      <section className="rounded-lg border border-[#dbe3dc] bg-[#fbfcf8] p-4 text-sm leading-6 text-[#34443f]">
        Required columns are <span className="font-semibold">providerName</span>{" "}
        and <span className="font-semibold">priceAmount</span>. Missing category,
        status, billing cadence, and currency default to Other, Active, Monthly,
        and USD.
      </section>

      <CsvImportForm />
    </div>
  );
}
