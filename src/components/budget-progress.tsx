import type { BudgetStatus } from "@/lib/budget/calculate-budget";

const STATUS_STYLES: Record<
  BudgetStatus,
  { bar: string; text: string; label: string }
> = {
  "no-target": {
    bar: "bg-[#9aa8a0]",
    text: "text-[#68766f]",
    label: "No target set",
  },
  "on-track": {
    bar: "bg-[#2e7d5b]",
    text: "text-[#176143]",
    label: "On track",
  },
  approaching: {
    bar: "bg-[#d97706]",
    text: "text-[#a16207]",
    label: "Approaching limit",
  },
  over: {
    bar: "bg-[#dc2626]",
    text: "text-[#b91c1c]",
    label: "Over budget",
  },
};

export function budgetStatusLabel(status: BudgetStatus): string {
  return STATUS_STYLES[status].label;
}

export function budgetStatusTextClass(status: BudgetStatus): string {
  return STATUS_STYLES[status].text;
}

export function BudgetProgressBar({
  utilization,
  status,
}: {
  utilization: number | null;
  status: BudgetStatus;
}) {
  const widthPercent =
    utilization === null ? 0 : Math.min(Math.max(utilization, 0), 1) * 100;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#e3eae3]">
      <div
        className={`h-full rounded-full ${STATUS_STYLES[status].bar}`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}
