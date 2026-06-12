import type { Subscription } from "./types";

export type SupportEmailDraft = {
  subject: string;
  body: string;
  mailtoHref: string;
};

export function buildSupportEmailDraft(
  subscription: Subscription,
): SupportEmailDraft {
  const subject = `Cancel my ${subscription.providerName} subscription`;
  const accountLine = subscription.accountEmailForProvider
    ? `My account is registered under ${subscription.accountEmailForProvider}.`
    : "My account details are available on request.";
  const body = [
    "Hello,",
    "",
    `Please cancel my ${subscription.providerName} subscription effective at the end of the current billing period.`,
    accountLine,
    "",
    "Please confirm the cancellation and the final billing date in writing.",
    "",
    "Thank you.",
  ].join("\n");

  return {
    subject,
    body,
    mailtoHref: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}
