import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { INVITABLE_ROLES } from "@/lib/household/permissions";
import {
  getOrCreateHousehold,
  getSharesForSubscriptions,
  listHouseholdMembers,
} from "@/lib/household/repository";
import {
  memberMonthlyTotals,
  personalMonthlyCost,
  summarizeSharedSpend,
} from "@/lib/sharing/personal-cost";
import { calculateMonthlyCost } from "@/lib/subscriptions/costs";
import { requireUserId } from "@/lib/auth/session";
import { listSubscriptions } from "@/lib/subscriptions/repository";
import {
  addHouseholdMemberAction,
  removeHouseholdMemberAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function HouseholdPage() {
  const userId = await requireUserId();
  const household = await getOrCreateHousehold(userId);
  const members = await listHouseholdMembers(userId);
  const subscriptions = await listSubscriptions(userId);
  const shares = await getSharesForSubscriptions(
    subscriptions.map((subscription) => subscription.id),
  );
  const spend = summarizeSharedSpend(subscriptions, shares);
  const owedByMember = memberMonthlyTotals(subscriptions, shares);
  const sharedSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.isShared && (shares.get(subscription.id)?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Household
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-[#16201d] md:text-5xl">
            {household.name}: share costs, keep your own number honest.
          </h1>
        </div>
        <Link
          href="/subscriptions"
          className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d] transition hover:bg-[#edf2ed]"
        >
          Share a subscription
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Your share"
          value={formatCurrency(spend.personalMonthly, "USD")}
          detail="What you actually pay per month"
        />
        <MetricCard
          label="Gross spend"
          value={formatCurrency(spend.grossMonthly, "USD")}
          detail="Total billed across all subscriptions"
        />
        <MetricCard
          label="Shared subscriptions"
          value={String(spend.sharedCount)}
          detail="Split with household members"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-[#dbe3dc] bg-white">
          <div className="border-b border-[#e5ebe6] px-5 py-4">
            <h2 className="text-lg font-semibold">Members</h2>
            <p className="text-sm text-[#68766f]">
              Invites are recorded locally for now; email delivery arrives with
              the notification provider.
            </p>
          </div>
          <div className="divide-y divide-[#edf1ed]">
            {members.length > 0 ? (
              members.map((member) => {
                const removeAction = removeHouseholdMemberAction.bind(
                  null,
                  member.id,
                );
                const owed = owedByMember.get(member.id) ?? 0;

                return (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold text-[#16201d]">
                        {member.name}
                      </p>
                      <p className="mt-1 text-sm text-[#68766f]">
                        {member.email ?? "No email recorded"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-[#cbd8d0] bg-[#f3f7f2] px-2.5 py-1 text-xs font-semibold text-[#34443f]">
                        {member.role}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          member.status === "Invited"
                            ? "border border-[#e8d69a] bg-[#fff9df] text-[#7a640f]"
                            : "border border-[#bcd8c3] bg-[#eaf5ec] text-[#176143]"
                        }`}
                      >
                        {member.status}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#16201d]">
                          {formatCurrency(owed, "USD")}/mo
                        </p>
                        <p className="text-xs text-[#68766f]">owes you</p>
                      </div>
                      <form action={removeAction}>
                        <button
                          type="submit"
                          className="rounded-md border border-[#dfc4c2] px-3 py-1.5 text-xs font-semibold text-[#8f332b] transition hover:bg-[#fff7f6]"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-sm text-[#68766f]">
                No members yet. Add the people you share subscriptions with.
              </div>
            )}
          </div>
          <form
            action={addHouseholdMemberAction}
            className="border-t border-[#e5ebe6] px-5 py-5"
          >
            <h3 className="text-sm font-semibold text-[#16201d]">Add member</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
              <input
                name="name"
                required
                placeholder="Name"
                className="rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
              />
              <input
                name="email"
                type="email"
                placeholder="Email (optional, records an invite)"
                className="rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
              />
              <select
                name="role"
                defaultValue="Member"
                className="rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
              >
                {INVITABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-[#16362f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214d43]"
              >
                Add
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#68766f]">
              Roles: Adults can add, edit, and manage sharing. Members can view
              and pay their share. Viewers can only view. Only you (the owner)
              can administer the household.
            </p>
          </form>
        </div>

        <div className="rounded-lg border border-[#dbe3dc] bg-white">
          <div className="border-b border-[#e5ebe6] px-5 py-4">
            <h2 className="text-lg font-semibold">Shared subscriptions</h2>
            <p className="text-sm text-[#68766f]">
              Your share next to the full bill for each split subscription.
            </p>
          </div>
          <div className="divide-y divide-[#edf1ed]">
            {sharedSubscriptions.length > 0 ? (
              sharedSubscriptions.map((subscription) => {
                const subscriptionShares =
                  shares.get(subscription.id) ?? [];
                const gross = calculateMonthlyCost(subscription);
                const personal = personalMonthlyCost(
                  subscription,
                  subscriptionShares,
                );

                return (
                  <Link
                    key={subscription.id}
                    href={`/subscriptions/${subscription.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#f7faf7]"
                  >
                    <div>
                      <p className="font-semibold text-[#16201d]">
                        {subscription.providerName}
                      </p>
                      <p className="mt-1 text-sm text-[#68766f]">
                        {subscription.splitType} split with{" "}
                        {subscriptionShares.length} member
                        {subscriptionShares.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#16201d]">
                        {formatCurrency(personal, subscription.currency)}/mo
                      </p>
                      <p className="text-sm text-[#68766f]">
                        of {formatCurrency(gross, subscription.currency)} gross
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-8 text-sm text-[#68766f]">
                Nothing is shared yet. Open a subscription and set a split to
                divide its cost with members.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#dbe3dc] bg-white p-5">
      <p className="text-sm font-medium text-[#68766f]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-[#16201d]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[#68766f]">{detail}</p>
    </div>
  );
}
