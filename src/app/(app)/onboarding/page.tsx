import Link from "next/link";
import { requireUserId } from "@/lib/auth/session";
import { getBudgetSettings } from "@/lib/budget/repository";
import { listHouseholdMembers } from "@/lib/household/repository";
import { getUserSettings } from "@/lib/settings/repository";
import { listSubscriptions } from "@/lib/subscriptions/repository";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const userId = await requireUserId();
  const subscriptions = await listSubscriptions(userId);
  const budget = await getBudgetSettings(userId);
  const members = await listHouseholdMembers(userId);
  const settings = await getUserSettings(userId);

  const checklist = [
    {
      title: "Add your first subscription",
      detail: "Start with the renewal you remember most clearly.",
      href: "/subscriptions/new",
      done: subscriptions.length > 0,
    },
    {
      title: "Track a free trial",
      detail: "Set the cancel-by date before the trial converts.",
      href: "/subscriptions/new",
      done: subscriptions.some(
        (subscription) => subscription.status === "Trial",
      ),
    },
    {
      title: "Find the rest with import or detection",
      detail:
        "Upload a CSV or scan a bank export to surface forgotten charges.",
      href: "/detected",
      done: subscriptions.length >= 3,
    },
    {
      title: "Set a monthly budget target",
      detail: "Get warned before recurring spend drifts past your plan.",
      href: "/budget",
      done: budget.monthlyTarget !== null,
    },
    {
      title: "Add a household member",
      detail: "Split shared subscriptions and track your real share.",
      href: "/household",
      done: members.length > 0,
    },
    {
      title: "Pick your timezone and reminders",
      detail: "Reminders arrive at 9am in your timezone, not the server's.",
      href: "/settings",
      done: settings.timezoneSet,
    },
  ];
  const doneCount = checklist.filter((step) => step.done).length;

  return (
    <div className="space-y-7">
      <section className="rounded-lg border border-[#dbe3dc] bg-white p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
          Onboarding
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold md:text-5xl">
          Get Subscription Hub useful in under five minutes.
        </h1>
        <p className="mt-4 text-sm font-semibold text-[#176143]">
          {doneCount} of {checklist.length} steps done
        </p>
        <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#e3eae3]">
          <div
            className="h-full rounded-full bg-[#2e7d5b]"
            style={{ width: `${(doneCount / checklist.length) * 100}%` }}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/subscriptions/new"
            className="rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Add manually
          </Link>
          <Link
            href="/import/csv"
            className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d]"
          >
            Import CSV
          </Link>
          <Link
            href="/detected"
            className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d]"
          >
            Scan a bank export
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {checklist.map((step, index) => (
          <Link
            key={step.title}
            href={step.href}
            className={`rounded-lg border p-5 transition ${
              step.done
                ? "border-[#bcd8c3] bg-[#f3faf5]"
                : "border-[#dbe3dc] bg-white hover:bg-[#f7faf7]"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
                Step {index + 1}
              </p>
              {step.done ? (
                <span className="rounded-full border border-[#bcd8c3] bg-white px-2.5 py-1 text-xs font-semibold text-[#176143]">
                  Done
                </span>
              ) : (
                <span className="text-sm font-semibold text-[#176143]">
                  {"->"}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#68766f]">
              {step.detail}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
