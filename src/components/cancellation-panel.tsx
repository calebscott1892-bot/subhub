import { formatDate } from "@/lib/format";
import { buildSupportEmailDraft } from "@/lib/subscriptions/support-email";
import type { Subscription } from "@/lib/subscriptions/types";

export function CancellationPanel({
  subscription,
  requestAction,
  confirmAction,
}: {
  subscription: Subscription;
  requestAction: (formData: FormData) => void | Promise<void>;
  confirmAction: () => void | Promise<void>;
}) {
  const draft = buildSupportEmailDraft(subscription);
  const isCanceled =
    subscription.status === "Canceled" || subscription.status === "Expired";
  const requestedAt = subscription.cancellationRequestedAt ?? null;

  return (
    <section className="rounded-lg border border-[#dbe3dc] bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e5ebe6] px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">Cancellation</h2>
          <p className="text-sm text-[#68766f]">
            Track the cancellation from first request to written confirmation.
          </p>
        </div>
        <p
          className={`text-sm font-semibold ${
            isCanceled
              ? "text-[#176143]"
              : requestedAt
                ? "text-[#a16207]"
                : "text-[#68766f]"
          }`}
        >
          {isCanceled
            ? "Confirmed canceled"
            : requestedAt
              ? `Requested ${formatDate(requestedAt)}`
              : "Not requested"}
        </p>
      </div>

      <div className="grid gap-5 px-5 py-5 lg:grid-cols-2">
        <div className="space-y-4">
          {subscription.cancellationNotes ? (
            <div className="rounded-md bg-[#f8faf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
                Cancellation notes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#34443f]">
                {subscription.cancellationNotes}
              </p>
            </div>
          ) : null}

          {!isCanceled ? (
            <>
              <form action={requestAction} className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-[#34443f]">
                    {requestedAt
                      ? "Update the request notes"
                      : "Record that you asked the provider to cancel"}
                  </span>
                  <textarea
                    name="cancellationNotes"
                    rows={2}
                    defaultValue={subscription.cancellationNotes ?? ""}
                    placeholder="e.g. Submitted the online cancellation form, ref #12345"
                    className="mt-1 w-full rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-md border border-[#c9b66b] bg-[#fff4c7] px-4 py-2 text-sm font-semibold text-[#604400] transition hover:bg-[#ffefad]"
                >
                  {requestedAt
                    ? "Update cancellation request"
                    : "Mark cancellation requested"}
                </button>
              </form>
              <form action={confirmAction}>
                <button
                  type="submit"
                  className="rounded-md bg-[#16362f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214d43]"
                >
                  Provider confirmed - mark as canceled
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm leading-6 text-[#68766f]">
              This subscription is canceled. Future reminders were stopped; the
              history below keeps the paper trail.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
              Support email draft
            </p>
            <a
              href={draft.mailtoHref}
              className="text-sm font-semibold text-[#176143] hover:text-[#0d3d2a]"
            >
              Open in email app
            </a>
          </div>
          <pre className="mt-2 whitespace-pre-wrap rounded-md border border-[#e5ebe6] bg-[#f8faf7] p-4 font-sans text-sm leading-6 text-[#34443f]">
            {`Subject: ${draft.subject}\n\n${draft.body}`}
          </pre>
        </div>
      </div>
    </section>
  );
}
