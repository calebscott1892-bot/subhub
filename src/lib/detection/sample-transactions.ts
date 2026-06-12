// Builds a realistic bank-export CSV anchored to "today" so detection always
// produces a useful demo regardless of when it runs.
export function buildSampleTransactionsCsv(today: string): string {
  const rows: Array<[string, string, string]> = [
    // Matches the seeded Netflix Premium subscription -> merge suggestion.
    [monthsAgo(today, 1, -3), "NETFLIX.COM 866-579-7172", "-22.99"],
    [monthsAgo(today, 2, -3), "NETFLIX.COM 866-579-7172", "-22.99"],
    [monthsAgo(today, 3, -3), "NETFLIX.COM 866-579-7172", "-22.99"],
    // New monthly subscription not tracked yet.
    [monthsAgo(today, 1, -10), "DISNEY PLUS SYDNEY", "-13.99"],
    [monthsAgo(today, 2, -10), "DISNEY PLUS SYDNEY", "-13.99"],
    [monthsAgo(today, 3, -10), "DISNEY PLUS SYDNEY", "-13.99"],
    // New monthly subscription with a recent price rise.
    [monthsAgo(today, 1, -6), "AUDIBLE AU MEMBERSHIP", "-16.45"],
    [monthsAgo(today, 2, -6), "AUDIBLE AU MEMBERSHIP", "-16.45"],
    [monthsAgo(today, 3, -6), "AUDIBLE AU MEMBERSHIP", "-14.95"],
    // Weekly charge.
    [daysAgo(today, 4), "ANYTIME FITNESS PERTH", "-14.50"],
    [daysAgo(today, 11), "ANYTIME FITNESS PERTH", "-14.50"],
    [daysAgo(today, 18), "ANYTIME FITNESS PERTH", "-14.50"],
    [daysAgo(today, 25), "ANYTIME FITNESS PERTH", "-14.50"],
    // Irregular one-off purchases that must NOT be detected.
    [daysAgo(today, 2), "AMAZON MKTP AU 123-456", "-58.12"],
    [daysAgo(today, 9), "AMAZON MKTP AU 987-654", "-12.40"],
    [daysAgo(today, 40), "AMAZON MKTP AU 555-222", "-149.00"],
    [daysAgo(today, 13), "CITY OF PERTH PARKING", "-4.50"],
  ];

  return [
    "date,description,amount",
    ...rows.map((row) => row.join(",")),
  ].join("\n");
}

function daysAgo(today: string, days: number): string {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - days));
  return date.toISOString().slice(0, 10);
}

function monthsAgo(today: string, months: number, dayOffset: number): string {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 - months, day + dayOffset));
  return date.toISOString().slice(0, 10);
}
