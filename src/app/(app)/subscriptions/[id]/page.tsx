import Link from "next/link";
import { CancellationPanel } from "@/components/cancellation-panel";
import { SharingEditor } from "@/components/sharing-editor";
import { StatusPill } from "@/components/status-pill";
import { SubscriptionForm } from "@/components/subscription-form";
import { listAuditEventsForEntity } from "@/lib/audit/repository";
import { formatCadence, formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  getSharesForSubscriptions,
  listHouseholdMembers,
} from "@/lib/household/repository";
import { calculateAnnualCost, calculateMonthlyCost } from "@/lib/subscriptions/costs";
import { requireUserId } from "@/lib/auth/session";
import { getSubscriptionById } from "@/lib/subscriptions/repository";
import {
  deleteSubscriptionAction,
  markCancellationRequestedAction,
  markCanceledAction,
  saveSubscriptionSharingAction,
  scheduleMaintenanceReminderAction,
  updateSubscriptionAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;
  const subscription = await getSubscriptionById(userId, id);

  if (!subscription) {
    return (
      <div className="rounded-lg border border-[#dbe3dc] bg-white p-6">
        <h1 className="text-2xl font-semibold">Subscription not found</h1>
        <Link
          href="/subscriptions"
          className="mt-4 inline-block text-sm font-semibold text-[#176143]"
        >
          Back to subscriptions
        </Link>
      </div>
    );
  }

  const members = await listHouseholdMembers(userId);
  const shares =
    (await getSharesForSubscriptions([subscription.id])).get(subscription.id) ??
    [];
  const history = await listAuditEventsForEntity(userId, subscription.id);
  const updateAction = updateSubscriptionAction.bind(null, subscription.id);
  const deleteAction = deleteSubscriptionAction.bind(null, subscription.id);
  const sharingAction = saveSubscriptionSharingAction.bind(
    null,
    subscription.id,
  );
  const cancellationRequestAction = markCancellationRequestedAction.bind(
    null,
    subscription.id,
  );
  const markCanceled = markCanceledAction.bind(null, subscription.id);
  const maintenanceAction = scheduleMaintenanceReminderAction.bind(
    null,
    subscription.id,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href="/subscriptions"
            className="text-sm font-semibold text-[#176143] hover:text-[#0d3d2a]"
          >
            Back to subscriptions
          </Link>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
            {subscription.providerName}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusPill status={subscription.status} />
            <span className="text-sm font-medium text-[#68766f]">
              {subscription.category}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {subscription.cancelUrl ? (
            <a
              href={subscription.cancelUrl}
              className="rounded-md border border-[#c9b66b] bg-[#fff4c7] px-4 py-2.5 text-sm font-semibold text-[#604400]"
            >
              Cancel link
            </a>
          ) : null}
          {subscription.billingUrl ? (
            <a
              href={subscription.billingUrl}
              className="rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Billing portal
            </a>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryTile
          label="Monthly equivalent"
          value={formatCurrency(
            calculateMonthlyCost(subscription),
            subscription.currency,
          )}
        />
        <SummaryTile
          label="Annual equivalent"
          value={formatCurrency(
            calculateAnnualCost(subscription),
            subscription.currency,
          )}
        />
        <SummaryTile
          label="Next renewal"
          value={formatDate(subscription.renewalDate)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-[#dbe3dc] bg-white p-5">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="mt-5 grid gap-4 md:grid-cols-2">
            <Detail label="Billing cadence" value={formatCadence(subscription.billingCadence)} />
            <Detail label="Account email" value={subscription.accountEmailForProvider ?? "Not set"} />
            <Detail label="Payment method" value={subscription.paymentMethodLabel ?? "Not set"} />
            <Detail label="Last usage" value={formatDate(subscription.lastUsageDate)} />
            <Detail label="Trial end" value={formatDate(subscription.trialEndDate)} />
            <Detail label="Cancel by" value={formatDate(subscription.cancelByDate)} />
          </dl>
          {subscription.notes ? (
            <div className="mt-6 rounded-md bg-[#f8faf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
                Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#34443f]">
                {subscription.notes}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="rounded-lg border border-[#dbe3dc] bg-white p-5">
          <h2 className="text-lg font-semibold">Action links</h2>
          <div className="mt-5 space-y-3">
            <ActionLink label="Login" href={subscription.loginUrl} />
            <ActionLink label="Manage billing" href={subscription.billingUrl} />
            <ActionLink label="Cancel or unsubscribe" href={subscription.cancelUrl} />
            <ActionLink label="Support" href={subscription.supportUrl} />
          </div>
          <div className="mt-6 rounded-md border border-[#e5ebe6] bg-[#f8faf7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
              Maintenance reminder
            </p>
            <p className="mt-2 text-xs leading-5 text-[#68766f]">
              Get nudged to update the account email or rotate the password.
              Passwords are never stored here.
            </p>
            <form action={maintenanceAction} className="mt-3 space-y-2">
              <select
                name="kind"
                defaultValue="password"
                className="w-full rounded-md border border-[#cbd8d0] bg-white px-2.5 py-1.5 text-sm focus:border-[#176143] focus:outline-none"
              >
                <option value="password">Rotate provider password</option>
                <option value="account-email">Review account email</option>
              </select>
              <input
                type="date"
                name="date"
                required
                className="w-full rounded-md border border-[#cbd8d0] bg-white px-2.5 py-1.5 text-sm focus:border-[#176143] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-md border border-[#cbd8d0] bg-white px-3 py-1.5 text-sm font-semibold text-[#34443f] transition hover:bg-[#edf2ed]"
              >
                Schedule reminder
              </button>
            </form>
          </div>
        </aside>
      </section>

      <CancellationPanel
        subscription={subscription}
        requestAction={cancellationRequestAction}
        confirmAction={markCanceled}
      />

      <SharingEditor
        subscription={subscription}
        members={members}
        shares={shares}
        action={sharingAction}
      />

      <section className="rounded-lg border border-[#dbe3dc] bg-white">
        <div className="border-b border-[#e5ebe6] px-5 py-4">
          <h2 className="text-lg font-semibold">History</h2>
          <p className="text-sm text-[#68766f]">
            Every change to this subscription, including price moves and
            cancellation steps.
          </p>
        </div>
        <div className="divide-y divide-[#edf1ed]">
          {history.length > 0 ? (
            history.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[#cbd8d0] bg-[#f3f7f2] px-2.5 py-1 text-xs font-semibold text-[#34443f]">
                    {event.action}
                  </span>
                  <p className="text-sm text-[#16201d]">{event.summary}</p>
                </div>
                <p className="text-xs text-[#68766f]">
                  {formatDateTime(event.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm text-[#68766f]">
              No recorded changes yet. Edits, price changes, sharing, and
              cancellation steps will appear here.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Edit subscription</h2>
          <p className="mt-1 text-sm text-[#68766f]">
            Changes save to the local database and refresh dashboard totals.
          </p>
        </div>
        <SubscriptionForm
          action={updateAction}
          subscription={subscription}
          submitLabel="Save changes"
        />
        <form action={deleteAction} className="rounded-lg border border-[#dfc4c2] bg-[#fff7f6] p-5">
          <h3 className="text-base font-semibold text-[#8f332b]">
            Delete subscription
          </h3>
          <p className="mt-2 text-sm text-[#7f514c]">
            Remove this record from the local workspace.
          </p>
          <button
            type="submit"
            className="mt-4 rounded-md bg-[#8f332b] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Delete subscription
          </button>
        </form>
      </section>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dbe3dc] bg-white p-5">
      <p className="text-sm font-medium text-[#68766f]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[#16201d]">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[#16201d]">{value}</dd>
    </div>
  );
}

function ActionLink({
  label,
  href,
}: {
  label: string;
  href: string | null | undefined;
}) {
  if (!href) {
    return (
      <div className="rounded-md border border-[#e5ebe6] px-3 py-2.5 text-sm text-[#87918b]">
        {label}: not set
      </div>
    );
  }

  return (
    <a
      href={href}
      className="block rounded-md border border-[#dbe3dc] px-3 py-2.5 text-sm font-semibold text-[#176143] transition hover:bg-[#f7faf7]"
    >
      {label}
    </a>
  );
}
