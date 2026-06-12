import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  listNotifications,
} from "@/lib/notifications/repository";
import { requireUserId } from "@/lib/auth/session";
import { sendDueNotificationsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ processed?: string; sent?: string; failed?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const notifications = await listNotifications(userId);
  const sendSummary = params.processed
    ? params.processed === "0"
      ? "Nothing was due. Reminders send once their scheduled time passes."
      : `Processed ${params.processed} due reminder${params.processed === "1" ? "" : "s"}: ${params.sent} sent, ${params.failed} failed.`
    : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Notifications
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">
            Scheduled reminders
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68766f]">
            Reminders are scheduled here, then delivered by the send job. Email
            uses the local log transport until a provider key is configured.
          </p>
        </div>
        <form action={sendDueNotificationsAction}>
          <button
            type="submit"
            className="rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Send due reminders now
          </button>
        </form>
      </section>

      {sendSummary ? (
        <p className="rounded-md border border-[#bcd8c3] bg-[#eaf5ec] px-4 py-3 text-sm text-[#176143]">
          {sendSummary}
        </p>
      ) : null}

      <section className="rounded-lg border border-[#dbe3dc] bg-white">
        <div className="grid gap-3 border-b border-[#e5ebe6] px-5 py-4 md:grid-cols-[180px_1fr_180px_120px]">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Type
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f] md:block">
            Message
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f] md:block">
            Scheduled
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f] md:block">
            Status
          </span>
        </div>

        <div className="divide-y divide-[#edf1ed]">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.payload.url ?? "/notifications"}
                className="grid gap-3 px-5 py-4 transition hover:bg-[#f7faf7] md:grid-cols-[180px_1fr_180px_120px] md:items-center"
              >
                <p className="text-sm font-semibold text-[#16201d]">
                  {notification.type}
                </p>
                <div>
                  <p className="text-sm font-semibold text-[#16201d]">
                    {notification.payload.title}
                  </p>
                  <p className="mt-1 text-sm text-[#68766f]">
                    {notification.payload.body}
                  </p>
                </div>
                <p className="text-sm text-[#34443f]">
                  {formatDateTime(notification.scheduledFor)}
                </p>
                <p className="text-sm font-semibold text-[#34443f]">
                  {notification.status}
                </p>
              </Link>
            ))
          ) : (
            <div className="px-5 py-10 text-sm text-[#68766f]">
              No scheduled reminders yet. Add a trial or upcoming renewal to generate reminders.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
