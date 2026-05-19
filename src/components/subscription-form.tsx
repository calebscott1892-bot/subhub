import type { Subscription } from "@/lib/subscriptions/types";

const categories = [
  "Streaming",
  "Music",
  "Software",
  "Storage",
  "Utilities",
  "Finance",
  "Health",
  "News",
  "Gaming",
  "Membership",
  "Other",
];

const statuses = ["Active", "Trial", "Paused", "Canceled", "Expired"];
const cadences = ["Monthly", "Yearly", "Weekly", "Custom"];

export function SubscriptionForm({
  action,
  subscription,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  subscription?: Subscription;
  submitLabel: string;
}) {
  return (
    <form action={action} className="rounded-lg border border-[#dbe3dc] bg-white p-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Provider name"
          name="providerName"
          placeholder="Netflix Premium"
          defaultValue={subscription?.providerName}
          required
        />
        <Field
          label="Account email"
          name="accountEmailForProvider"
          placeholder="alex@example.com"
          defaultValue={subscription?.accountEmailForProvider}
        />

        <SelectField
          label="Category"
          name="category"
          options={categories}
          defaultValue={subscription?.category ?? "Streaming"}
        />
        <SelectField
          label="Status"
          name="status"
          options={statuses}
          defaultValue={subscription?.status ?? "Active"}
        />
        <SelectField
          label="Billing cadence"
          name="billingCadence"
          options={cadences}
          defaultValue={subscription?.billingCadence ?? "Monthly"}
        />

        <Field
          label="Custom interval days"
          name="intervalDays"
          placeholder="45"
          type="number"
          defaultValue={subscription?.intervalDays}
        />
        <Field
          label="Price"
          name="priceAmount"
          placeholder="19.99"
          type="number"
          step="0.01"
          defaultValue={subscription?.priceAmount ?? 0}
          required
        />
        <Field
          label="Currency"
          name="currency"
          placeholder="USD"
          defaultValue={subscription?.currency ?? "USD"}
          required
        />
        <Field
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={subscription?.startDate}
        />
        <Field
          label="Renewal date"
          name="renewalDate"
          type="date"
          defaultValue={subscription?.renewalDate}
        />
        <Field
          label="Trial start date"
          name="trialStartDate"
          type="date"
          defaultValue={subscription?.trialStartDate}
        />
        <Field
          label="Trial end date"
          name="trialEndDate"
          type="date"
          defaultValue={subscription?.trialEndDate}
        />
        <Field
          label="Cancel-by date"
          name="cancelByDate"
          type="date"
          defaultValue={subscription?.cancelByDate}
        />
        <Field
          label="Post-trial price"
          name="postTrialPriceAmount"
          placeholder="12.00"
          type="number"
          step="0.01"
          defaultValue={subscription?.postTrialPriceAmount}
        />
        <Field
          label="Login URL"
          name="loginUrl"
          placeholder="https://..."
          defaultValue={subscription?.loginUrl}
        />
        <Field
          label="Billing portal URL"
          name="billingUrl"
          placeholder="https://..."
          defaultValue={subscription?.billingUrl}
        />
        <Field
          label="Cancellation URL"
          name="cancelUrl"
          placeholder="https://..."
          defaultValue={subscription?.cancelUrl}
        />
        <Field
          label="Support URL"
          name="supportUrl"
          placeholder="https://..."
          defaultValue={subscription?.supportUrl}
        />
        <Field
          label="Payment label"
          name="paymentMethodLabel"
          placeholder="Visa ending 1234"
          defaultValue={subscription?.paymentMethodLabel}
        />
        <Field
          label="Last usage date"
          name="lastUsageDate"
          type="date"
          defaultValue={subscription?.lastUsageDate}
        />
      </div>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-semibold text-[#34443f]">Notes</span>
        <textarea
          name="notes"
          rows={4}
          className="w-full rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm outline-none focus:border-[#176143]"
          placeholder="Cancellation terms, who uses it, or plan notes"
          defaultValue={subscription?.notes ?? ""}
        />
      </label>

      <button
        type="submit"
        className="mt-6 rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
  required = false,
  step,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-[#34443f]">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        required={required}
        step={step}
        className="h-11 w-full rounded-md border border-[#cbd8d0] bg-white px-3 text-sm outline-none focus:border-[#176143]"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-[#34443f]">{label}</span>
      <select
        name={name}
        className="h-11 w-full rounded-md border border-[#cbd8d0] bg-white px-3 text-sm outline-none focus:border-[#176143]"
        defaultValue={defaultValue}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
