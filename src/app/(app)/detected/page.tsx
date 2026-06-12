import Link from "next/link";
import { requireUserId } from "@/lib/auth/session";
import {
  listDetectedCandidates,
  type DetectedCandidate,
} from "@/lib/detection/repository";
import { formatCadence, formatCurrency, formatDate } from "@/lib/format";
import { listSubscriptions } from "@/lib/subscriptions/repository";
import {
  acceptCandidateAction,
  dismissCandidateAction,
  mergeCandidateAction,
  scanSampleTransactionsAction,
  scanTransactionsAction,
} from "./actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  empty: "Paste CSV text or choose a file before scanning.",
  unparseable:
    "No usable transactions found. The CSV needs date, description, and amount columns.",
};

export default async function DetectedPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    scanned?: string;
    found?: string;
    rowErrors?: string;
  }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const candidates = await listDetectedCandidates(userId);
  const subscriptions = await listSubscriptions(userId);
  const subscriptionNameById = new Map(
    subscriptions.map((subscription) => [
      subscription.id,
      subscription.providerName,
    ]),
  );
  const queue = candidates.filter((candidate) => candidate.status === "New");
  const reviewed = candidates.filter(
    (candidate) => candidate.status !== "New",
  );
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? null)
    : null;
  const scanSummary =
    params.scanned && params.found
      ? `Scanned ${params.scanned} transactions and found ${params.found} recurring pattern${
          params.found === "1" ? "" : "s"
        }${
          params.rowErrors && params.rowErrors !== "0"
            ? ` (${params.rowErrors} row${params.rowErrors === "1" ? "" : "s"} skipped)`
            : ""
        }.`
      : null;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
          Detected subscriptions
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-[#16201d] md:text-5xl">
          Find recurring charges hiding in your bank statement.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68766f]">
          Export transactions from your bank as CSV and scan them here.
          Detection runs locally, shows its evidence, and never adds anything
          without your approval.
        </p>
      </section>

      {errorMessage ? (
        <p className="rounded-md border border-[#dfc4c2] bg-[#fff7f6] px-4 py-3 text-sm text-[#8f332b]">
          {errorMessage}
        </p>
      ) : null}
      {scanSummary ? (
        <p className="rounded-md border border-[#bcd8c3] bg-[#eaf5ec] px-4 py-3 text-sm text-[#176143]">
          {scanSummary}
        </p>
      ) : null}

      <section className="rounded-lg border border-[#dbe3dc] bg-white">
        <div className="border-b border-[#e5ebe6] px-5 py-4">
          <h2 className="text-lg font-semibold">Scan transactions</h2>
          <p className="text-sm text-[#68766f]">
            Columns: date (YYYY-MM-DD or DD/MM/YYYY), description, amount.
            Charges may be negative; credits are ignored by magnitude.
          </p>
        </div>
        <form action={scanTransactionsAction} className="px-5 py-5">
          <textarea
            name="csvText"
            rows={6}
            placeholder={"date,description,amount\n2026-05-09,DISNEY PLUS,-13.99\n..."}
            className="w-full rounded-md border border-[#cbd8d0] bg-white px-3 py-2 font-mono text-xs text-[#16201d] focus:border-[#176143] focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              name="csvFile"
              accept=".csv,text/csv"
              className="text-sm text-[#34443f]"
            />
            <button
              type="submit"
              className="rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
            >
              Scan for subscriptions
            </button>
          </div>
        </form>
        <form
          action={scanSampleTransactionsAction}
          className="border-t border-[#e5ebe6] px-5 py-4"
        >
          <button
            type="submit"
            className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22312d] transition hover:bg-[#edf2ed]"
          >
            Try it with sample bank data
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Review queue</h2>
          <p className="text-sm font-semibold text-[#176143]">
            {queue.length} awaiting review
          </p>
        </div>
        {queue.length > 0 ? (
          <div className="space-y-4">
            {queue.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                matchedName={
                  candidate.matchedSubscriptionId
                    ? (subscriptionNameById.get(
                        candidate.matchedSubscriptionId,
                      ) ?? null)
                    : null
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-[#dbe3dc] bg-white px-5 py-8 text-sm text-[#68766f]">
            Nothing waiting for review. Scan a bank export above to find
            recurring charges.
          </div>
        )}
      </section>

      {reviewed.length > 0 ? (
        <section className="rounded-lg border border-[#dbe3dc] bg-white">
          <div className="border-b border-[#e5ebe6] px-5 py-4">
            <h2 className="text-lg font-semibold">Previously reviewed</h2>
            <p className="text-sm text-[#68766f]">
              These stay out of the queue on future scans.
            </p>
          </div>
          <div className="divide-y divide-[#edf1ed]">
            {reviewed.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <p className="text-sm font-semibold text-[#16201d]">
                  {candidate.merchantLabel}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reviewedBadgeClass(candidate.status)}`}
                >
                  {candidate.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CandidateCard({
  candidate,
  matchedName,
}: {
  candidate: DetectedCandidate;
  matchedName: string | null;
}) {
  const acceptAction = acceptCandidateAction.bind(null, candidate.id);
  const mergeAction = mergeCandidateAction.bind(null, candidate.id);
  const dismissAction = dismissCandidateAction.bind(null, candidate.id);
  const confidencePercent = Math.round(candidate.confidence * 100);

  return (
    <div className="rounded-lg border border-[#dbe3dc] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-[#16201d]">
            {candidate.merchantLabel}
          </p>
          <p className="mt-1 text-sm text-[#68766f]">
            {formatCurrency(candidate.lastAmount, "USD")}{" "}
            {formatCadence(candidate.billingCadence).toLowerCase()}
            {candidate.intervalDays
              ? ` (every ${candidate.intervalDays} days)`
              : ""}{" "}
            - {candidate.categoryGuess} - seen {candidate.occurrenceCount} times
            between {formatDate(candidate.firstChargeDate)} and{" "}
            {formatDate(candidate.lastChargeDate)}
          </p>
          {candidate.nextEstimatedCharge ? (
            <p className="mt-1 text-sm text-[#68766f]">
              Next charge estimated {formatDate(candidate.nextEstimatedCharge)}
            </p>
          ) : null}
          {matchedName ? (
            <p className="mt-2 inline-block rounded-full border border-[#e8d69a] bg-[#fff9df] px-2.5 py-1 text-xs font-semibold text-[#7a640f]">
              Looks like your existing &quot;{matchedName}&quot; subscription
            </p>
          ) : null}
        </div>
        <div className="w-40">
          <p className="text-right text-sm font-semibold text-[#176143]">
            {confidencePercent}% confidence
          </p>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#e3eae3]">
            <div
              className="h-full rounded-full bg-[#2e7d5b]"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#176143]">
          Evidence ({candidate.evidence.length} transactions)
        </summary>
        <table className="mt-2 w-full text-left text-sm">
          <tbody className="divide-y divide-[#edf1ed]">
            {candidate.evidence.map((item, index) => (
              <tr key={`${item.date}-${index}`}>
                <td className="py-1.5 pr-4 text-[#68766f]">
                  {formatDate(item.date)}
                </td>
                <td className="py-1.5 pr-4 font-mono text-xs text-[#34443f]">
                  {item.description}
                </td>
                <td className="py-1.5 text-right font-semibold text-[#16201d]">
                  {formatCurrency(item.amount, "USD")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <div className="mt-4 flex flex-wrap gap-3">
        {matchedName ? (
          <>
            <form action={mergeAction}>
              <button
                type="submit"
                className="rounded-md bg-[#16362f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214d43]"
              >
                Already tracked - merge
              </button>
            </form>
            {candidate.matchedSubscriptionId ? (
              <Link
                href={`/subscriptions/${candidate.matchedSubscriptionId}`}
                className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22312d] transition hover:bg-[#edf2ed]"
              >
                View subscription
              </Link>
            ) : null}
          </>
        ) : (
          <form action={acceptAction}>
            <button
              type="submit"
              className="rounded-md bg-[#16362f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214d43]"
            >
              Add as subscription
            </button>
          </form>
        )}
        <form action={dismissAction}>
          <button
            type="submit"
            className="rounded-md border border-[#dfc4c2] px-4 py-2 text-sm font-semibold text-[#8f332b] transition hover:bg-[#fff7f6]"
          >
            Dismiss
          </button>
        </form>
      </div>
    </div>
  );
}

function reviewedBadgeClass(status: DetectedCandidate["status"]): string {
  if (status === "Accepted") {
    return "border border-[#bcd8c3] bg-[#eaf5ec] text-[#176143]";
  }

  if (status === "Merged") {
    return "border border-[#cbd8d0] bg-[#f3f7f2] text-[#34443f]";
  }

  return "border border-[#dfc4c2] bg-[#fff7f6] text-[#8f332b]";
}
