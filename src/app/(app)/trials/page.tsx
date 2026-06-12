import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatDate } from "@/lib/format";
import { daysUntil } from "@/lib/subscriptions/dates";
import { requireUserId } from "@/lib/auth/session";
import { listSubscriptions } from "@/lib/subscriptions/repository";
import { getTrialDeadline } from "@/lib/subscriptions/selectors";
import { recordTrialVerdictAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TrialsPage() {
  const userId = await requireUserId();
  const today = new Date().toISOString().slice(0, 10);
  const trials = (await listSubscriptions(userId))
    .filter((subscription) => subscription.status === "Trial")
    .sort((left, right) =>
      String(getTrialDeadline(left)).localeCompare(String(getTrialDeadline(right))),
    );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Trial protection
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">
            Stop free trials becoming surprise charges.
          </h1>
        </div>
        <Link
          href="/subscriptions/new"
          className="w-fit rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
        >
          Add trial
        </Link>
      </section>

      <section className="rounded-lg border border-[#e8d69a] bg-[#fff9df]">
        <div className="border-b border-[#f1df9d] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#3e2f00]">
            Active trials
          </h2>
          <p className="text-sm text-[#7a640f]">
            Cancel-by dates are shown before trial-end dates when available.
          </p>
        </div>
        <div className="divide-y divide-[#f1df9d]">
          {trials.length > 0 ? (
            trials.map((subscription) => {
              const deadline = getTrialDeadline(subscription);
              const daysAway = deadline ? daysUntil(deadline, today) : null;
              const keepAction = recordTrialVerdictAction.bind(
                null,
                subscription.id,
                "Keep" as const,
              );
              const cancelAction = recordTrialVerdictAction.bind(
                null,
                subscription.id,
                "Cancel" as const,
              );

              return (
                <div
                  key={subscription.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"
                >
                  <div>
                    <Link
                      href={`/subscriptions/${subscription.id}`}
                      className="font-semibold text-[#3e2f00] hover:underline"
                    >
                      {subscription.providerName}
                    </Link>
                    <p className="mt-1 text-sm text-[#7a640f]">
                      Converts to{" "}
                      {formatCurrency(
                        subscription.postTrialPriceAmount ??
                          subscription.priceAmount,
                        subscription.currency,
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7a640f]">
                        Worth keeping?
                      </span>
                      <form action={keepAction}>
                        <button
                          type="submit"
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                            subscription.trialValueVerdict === "Keep"
                              ? "border-[#176143] bg-[#eaf5ec] text-[#176143]"
                              : "border-[#c9b66b] bg-white text-[#604400] hover:bg-[#fff4c7]"
                          }`}
                        >
                          Yes, keep it
                        </button>
                      </form>
                      <form action={cancelAction}>
                        <button
                          type="submit"
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                            subscription.trialValueVerdict === "Cancel"
                              ? "border-[#8f332b] bg-[#fff7f6] text-[#8f332b]"
                              : "border-[#c9b66b] bg-white text-[#604400] hover:bg-[#fff4c7]"
                          }`}
                        >
                          No, plan to cancel
                        </button>
                      </form>
                    </div>
                  </div>
                  <StatusPill status={subscription.status} />
                  <div className="text-left md:text-right">
                    <p className="text-sm font-semibold text-[#3e2f00]">
                      {formatDate(deadline)}
                    </p>
                    <p className="mt-1 text-sm text-[#7a640f]">
                      {daysAway === null ? "No deadline" : `${daysAway} days left`}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-10 text-sm text-[#7a640f]">
              No active trials yet. Add a trial with a cancel-by date to turn on protection.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
