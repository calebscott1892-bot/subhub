import Link from "next/link";

const steps = [
  {
    title: "Add your first subscription",
    detail: "Start with the renewal you remember most clearly.",
    href: "/subscriptions/new",
  },
  {
    title: "Add one active free trial",
    detail: "Set the cancel-by date before the trial converts.",
    href: "/subscriptions/new",
  },
  {
    title: "Upload a CSV",
    detail: "Bulk import from a reviewed CSV preview before anything is saved.",
    href: "/import/csv",
  },
  {
    title: "Set reminder defaults",
    detail: "Trial and renewal lead times will feed notification scheduling.",
    href: "/settings",
  },
];

export default function OnboardingPage() {
  return (
    <div className="space-y-7">
      <section className="rounded-lg border border-[#dbe3dc] bg-white p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
          Onboarding
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold md:text-5xl">
          Get Subscription Hub useful in under five minutes.
        </h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/subscriptions/new"
            className="rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Add manually
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d]"
          >
            Use sample data
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <Link
            key={step.title}
            href={step.href}
            className="rounded-lg border border-[#dbe3dc] bg-white p-5 transition hover:bg-[#f7faf7]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
              Step {index + 1}
            </p>
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
