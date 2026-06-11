import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { HouseholdMember } from "@/lib/household/repository";
import { computeSplit, type ShareAllocation } from "@/lib/sharing/split-rules";
import { shareFieldName } from "@/lib/sharing/validation";
import { calculateMonthlyCost } from "@/lib/subscriptions/costs";
import type { Subscription } from "@/lib/subscriptions/types";

export function SharingEditor({
  subscription,
  members,
  shares,
  action,
}: {
  subscription: Subscription;
  members: HouseholdMember[];
  shares: ShareAllocation[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const monthlyCost = calculateMonthlyCost(subscription);
  const shareByMember = new Map(shares.map((share) => [share.memberId, share]));
  const currentSplit =
    subscription.isShared && subscription.splitType && shares.length > 0
      ? computeSplit(monthlyCost, subscription.splitType, shares)
      : null;

  return (
    <section className="rounded-lg border border-[#dbe3dc] bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e5ebe6] px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">Sharing</h2>
          <p className="text-sm text-[#68766f]">
            Split the monthly cost with household members. You pay the
            remainder.
          </p>
        </div>
        {currentSplit?.ok ? (
          <p className="text-sm font-semibold text-[#176143]">
            Your share: {formatCurrency(currentSplit.ownerAmount, subscription.currency)}
            /mo of {formatCurrency(monthlyCost, subscription.currency)}
          </p>
        ) : (
          <p className="text-sm font-semibold text-[#68766f]">
            Not shared - you pay the full{" "}
            {formatCurrency(monthlyCost, subscription.currency)}/mo
          </p>
        )}
      </div>

      {members.length === 0 ? (
        <div className="px-5 py-6 text-sm text-[#68766f]">
          Add household members first, then split this subscription with them.{" "}
          <Link
            href="/household"
            className="font-semibold text-[#176143] hover:text-[#0d3d2a]"
          >
            Open household
          </Link>
        </div>
      ) : (
        <form action={action} className="px-5 py-5">
          <label className="block max-w-xs">
            <span className="text-sm font-medium text-[#34443f]">
              Split type
            </span>
            <select
              name="splitType"
              defaultValue={subscription.splitType ?? "None"}
              className="mt-1 block w-full rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
            >
              <option value="None">None - you pay everything</option>
              <option value="Equal">Equal - everyone pays the same</option>
              <option value="Fixed">Fixed - set each member&apos;s amount</option>
              <option value="Percentage">Percentage - set each member&apos;s share</option>
            </select>
          </label>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5ebe6] text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
                  <th className="pb-2 pr-4">Member</th>
                  <th className="pb-2 pr-4">Include (equal)</th>
                  <th className="pb-2 pr-4">Amount (fixed)</th>
                  <th className="pb-2">Share % (percentage)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ed]">
                {members.map((member) => {
                  const share = shareByMember.get(member.id);

                  return (
                    <tr key={member.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-[#16201d]">
                          {member.name}
                        </p>
                        <p className="text-xs text-[#68766f]">{member.role}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="checkbox"
                          name={shareFieldName("include", member.id)}
                          defaultChecked={Boolean(share)}
                          className="h-4 w-4 accent-[#16362f]"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          name={shareFieldName("amount", member.id)}
                          min="0"
                          step="0.01"
                          defaultValue={share?.fixedAmount ?? ""}
                          placeholder="-"
                          className="w-28 rounded-md border border-[#cbd8d0] bg-white px-3 py-1.5 text-sm focus:border-[#176143] focus:outline-none"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          name={shareFieldName("percentage", member.id)}
                          min="0"
                          max="100"
                          step="0.1"
                          defaultValue={share?.percentage ?? ""}
                          placeholder="-"
                          className="w-24 rounded-md border border-[#cbd8d0] bg-white px-3 py-1.5 text-sm focus:border-[#176143] focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs leading-5 text-[#68766f]">
            Only the column matching the chosen split type applies: tick members
            for an equal split, or fill amounts / percentages for the others.
            Leave a member blank to exclude them.
          </p>

          <button
            type="submit"
            className="mt-4 rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Save sharing
          </button>
        </form>
      )}
    </section>
  );
}
