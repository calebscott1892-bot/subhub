import { describe, expect, test } from "vitest";
import { parseEmailReceipt } from "@/lib/detection/parse-email";
import { createResendTransport } from "@/lib/email/provider";

describe("email receipt parsing", () => {
  test("extracts provider, amount, date, and cadence from a receipt", () => {
    const parsed = parseEmailReceipt(
      [
        "From: Disney+ <billing@disneyplus.com>",
        "Subject: Your Disney+ receipt",
        "Thanks for subscribing!",
        "Total: $13.99 per month",
        "Billed on June 9, 2026",
      ].join("\n"),
    );

    expect(parsed).toMatchObject({
      providerGuess: "Disney+",
      amount: 13.99,
      chargeDate: "2026-06-09",
      cadenceGuess: "Monthly",
      mentionsTrial: false,
    });
    expect(parsed?.confidence).toBeGreaterThan(0.9);
    expect(parsed?.matchedLines.length).toBeGreaterThan(0);
  });

  test("falls back to the sender domain and detects trials and yearly cadence", () => {
    const parsed = parseEmailReceipt(
      [
        "From: no-reply@audible.com.au",
        "Your free trial converts to a paid membership.",
        "Amount charged: AUD 16.45",
        "Renews annually on 2026-07-01",
      ].join("\n"),
    );

    expect(parsed).toMatchObject({
      providerGuess: "Audible",
      amount: 16.45,
      chargeDate: "2026-07-01",
      cadenceGuess: "Yearly",
      mentionsTrial: true,
    });
  });

  test("returns null when there is no provider or no amount", () => {
    expect(parseEmailReceipt("hello there, see you tomorrow")).toBeNull();
    expect(parseEmailReceipt("From: a@b.com\nno money mentioned")).toBeNull();
    expect(parseEmailReceipt("")).toBeNull();
  });
});

describe("resend transport", () => {
  test("posts the message and reports API failures", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const okTransport = createResendTransport({
      apiKey: "key",
      from: "Subscription Hub <hub@example.com>",
      fetchFn: (async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), body: String(init?.body) });
        return new Response("{}", { status: 200 });
      }) as typeof fetch,
    });

    await expect(
      okTransport.send({ to: "demo@subhub.local", subject: "Hi", body: "Body" }),
    ).resolves.toEqual({ ok: true });
    expect(calls[0].url).toBe("https://api.resend.com/emails");
    expect(calls[0].body).toContain("demo@subhub.local");

    const failingTransport = createResendTransport({
      apiKey: "key",
      from: "hub@example.com",
      fetchFn: (async () =>
        new Response("invalid key", { status: 401 })) as typeof fetch,
    });

    const failure = await failingTransport.send({
      to: "demo@subhub.local",
      subject: "Hi",
      body: "Body",
    });

    expect(failure.ok).toBe(false);
    expect(failure.ok ? "" : failure.error).toContain("401");
  });
});
