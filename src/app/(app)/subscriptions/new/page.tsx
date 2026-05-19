import Link from "next/link";
import { SubscriptionForm } from "@/components/subscription-form";
import { createSubscriptionAction } from "../actions";

export default function NewSubscriptionPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/subscriptions"
          className="text-sm font-semibold text-[#176143] hover:text-[#0d3d2a]"
        >
          Back to subscriptions
        </Link>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
          Add subscription
        </h1>
      </div>

      <SubscriptionForm action={createSubscriptionAction} submitLabel="Save subscription" />
    </div>
  );
}
