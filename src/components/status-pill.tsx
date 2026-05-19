import type { SubscriptionStatus } from "@/lib/subscriptions/types";

const statusClasses: Record<SubscriptionStatus, string> = {
  Active: "border-[#b7d6c7] bg-[#e9f5ee] text-[#176143]",
  Trial: "border-[#f0cf7a] bg-[#fff7d8] text-[#7a5200]",
  Paused: "border-[#cbd7e8] bg-[#edf3fb] text-[#2c567d]",
  Canceled: "border-[#dfc4c2] bg-[#faeeee] text-[#8f332b]",
  Expired: "border-[#d5d5d5] bg-[#eeeeee] text-[#565656]",
};

export function StatusPill({ status }: { status: SubscriptionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}
