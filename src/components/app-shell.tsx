import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/budget", label: "Budget" },
  { href: "/import/csv", label: "Import" },
  { href: "/trials", label: "Trials" },
  { href: "/notifications", label: "Notifications" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7f4] text-[#16201d]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dbe3dc] bg-[#fbfcf8] px-5 py-6 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#16362f] text-sm font-semibold text-white">
            SH
          </span>
          <span>
            <span className="block text-base font-semibold">Subscription Hub</span>
            <span className="block text-xs text-[#68766f]">Demo workspace</span>
          </span>
        </Link>

        <nav className="mt-10 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-[#34443f] transition hover:bg-[#edf2ed] hover:text-[#16201d]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-[#dbe3dc] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Current phase
          </p>
          <p className="mt-2 text-sm font-medium text-[#16201d]">
            Budgets and insights
          </p>
          <p className="mt-1 text-xs leading-5 text-[#68766f]">
            Targets, charge forecasts, and spending insights.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-[#dbe3dc] bg-[#fbfcf8]/95 px-4 py-3 backdrop-blur md:px-8 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="text-base font-semibold">
              Subscription Hub
            </Link>
            <Link
              href="/subscriptions/new"
              className="rounded-md bg-[#16362f] px-3 py-2 text-sm font-semibold text-white"
            >
              Add
            </Link>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md border border-[#dbe3dc] px-3 py-2 text-xs font-medium text-[#34443f]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
