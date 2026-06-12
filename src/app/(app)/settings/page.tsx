import { requireUser } from "@/lib/auth/session";
import {
  getUserSettings,
  TIMEZONE_OPTIONS,
} from "@/lib/settings/repository";
import {
  deleteAccountAction,
  saveProfileAction,
  saveReminderSettingsAction,
} from "./actions";

export const dynamic = "force-dynamic";

const SAVED_MESSAGES: Record<string, string> = {
  profile: "Profile saved. New reminders will use this timezone.",
  reminders:
    "Reminder preferences saved. They apply when a subscription's reminders are next rebuilt.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);
  const params = await searchParams;
  const savedMessage = params.saved
    ? (SAVED_MESSAGES[params.saved] ?? null)
    : null;
  const errorMessage =
    params.error === "confirm"
      ? "Tick the confirmation box before deleting the account."
      : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
          Profile, reminders, and your data
        </h1>
      </div>

      {savedMessage ? (
        <p className="rounded-md border border-[#bcd8c3] bg-[#eaf5ec] px-4 py-3 text-sm text-[#176143]">
          {savedMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-[#dfc4c2] bg-[#fff7f6] px-4 py-3 text-sm text-[#8f332b]">
          {errorMessage}
        </p>
      ) : null}

      <section className="rounded-lg border border-[#dbe3dc] bg-white p-5">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-[#68766f]">
          Signed in as {user.email}. Reminders are scheduled in your timezone.
        </p>
        <form action={saveProfileAction} className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Name</span>
            <input
              name="displayName"
              defaultValue={user.displayName ?? ""}
              placeholder="Alex"
              className="h-11 w-full rounded-md border border-[#cbd8d0] bg-white px-3 text-sm outline-none focus:border-[#176143]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Timezone</span>
            <select
              name="timezone"
              defaultValue={settings.timezone}
              className="h-11 w-full rounded-md border border-[#cbd8d0] bg-white px-3 text-sm outline-none focus:border-[#176143]"
            >
              {TIMEZONE_OPTIONS.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="w-fit rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-[#dbe3dc] bg-white p-5">
        <h2 className="text-lg font-semibold">Reminders</h2>
        <p className="mt-1 text-sm text-[#68766f]">
          Choose which reminders are scheduled for you.
        </p>
        <form action={saveReminderSettingsAction} className="mt-5 grid gap-3">
          <label className="flex items-center gap-3 rounded-md border border-[#e5ebe6] p-3">
            <input
              type="checkbox"
              name="trialReminders"
              defaultChecked={settings.trialReminders}
              className="h-4 w-4 accent-[#16362f]"
            />
            <span className="text-sm font-medium">
              Trial reminders at 7 days, 2 days, and the morning of cancel-by
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-[#e5ebe6] p-3">
            <input
              type="checkbox"
              name="renewalReminders"
              defaultChecked={settings.renewalReminders}
              className="h-4 w-4 accent-[#16362f]"
            />
            <span className="text-sm font-medium">
              Renewal reminders at 7 days and 1 day before each charge
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-[#e5ebe6] p-3">
            <input
              type="checkbox"
              name="monthlyReview"
              defaultChecked={settings.monthlyReview}
              className="h-4 w-4 accent-[#16362f]"
            />
            <span className="text-sm font-medium">
              Monthly subscription review reminder
            </span>
          </label>
          <button
            type="submit"
            className="w-fit rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Save reminders
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-[#dbe3dc] bg-white p-5">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-[#68766f]">
          Download everything Subscription Hub stores about you as JSON:
          subscriptions, reminders, budget, household, detection results, and
          the audit trail.
        </p>
        <a
          href="/api/export"
          className="mt-4 inline-block rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d] transition hover:bg-[#edf2ed]"
        >
          Download data export
        </a>
      </section>

      <form
        action={deleteAccountAction}
        className="rounded-lg border border-[#dfc4c2] bg-[#fff7f6] p-5"
      >
        <h2 className="text-lg font-semibold text-[#8f332b]">Delete account</h2>
        <p className="mt-1 text-sm text-[#7f514c]">
          Permanently removes your account and every subscription, reminder,
          budget, household record, and audit event. This cannot be undone.
        </p>
        <label className="mt-4 flex items-center gap-3 text-sm text-[#7f514c]">
          <input
            type="checkbox"
            name="confirmDelete"
            className="h-4 w-4 accent-[#8f332b]"
          />
          I understand this deletes everything permanently.
        </label>
        <button
          type="submit"
          className="mt-4 rounded-md bg-[#8f332b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7a2b24]"
        >
          Delete my account
        </button>
      </form>
    </div>
  );
}
