import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  listNotifications,
} from "@/lib/notifications/repository";
import { requireUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const userId = await requireUserId();
  const notifications = await listNotifications(userId);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
          Notifications
        </p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">
          Scheduled reminders
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68766f]">
          This pass creates in-app reminder records. Email delivery and background sending come next.
        </p>
      </section>

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
