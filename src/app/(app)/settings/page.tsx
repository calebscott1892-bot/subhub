export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
          Reminder preferences
        </h1>
      </div>

      <section className="rounded-lg border border-[#dbe3dc] bg-white p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Timezone</span>
            <select className="h-11 w-full rounded-md border border-[#cbd8d0] bg-white px-3 text-sm outline-none focus:border-[#176143]" defaultValue="Australia/Perth">
              <option>Australia/Perth</option>
              <option>Australia/Brisbane</option>
              <option>America/New_York</option>
              <option>America/Los_Angeles</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Reminder hour</span>
            <select className="h-11 w-full rounded-md border border-[#cbd8d0] bg-white px-3 text-sm outline-none focus:border-[#176143]" defaultValue="09:00">
              <option value="08:00">8:00 AM</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-3">
          <label className="flex items-center gap-3 rounded-md border border-[#e5ebe6] p-3">
            <input type="checkbox" defaultChecked className="h-4 w-4" />
            <span className="text-sm font-medium">Trial reminders at 7 days, 2 days, and same day</span>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-[#e5ebe6] p-3">
            <input type="checkbox" defaultChecked className="h-4 w-4" />
            <span className="text-sm font-medium">Renewal reminders at 7 days and 1 day</span>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-[#e5ebe6] p-3">
            <input type="checkbox" className="h-4 w-4" />
            <span className="text-sm font-medium">Monthly review reminder</span>
          </label>
        </div>

        <button
          type="button"
          className="mt-6 rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Save settings
        </button>
      </section>
    </div>
  );
}
