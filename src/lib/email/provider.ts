export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

export type EmailSendResult = { ok: true } | { ok: false; error: string };

export type EmailTransport = {
  name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
};

// Local development transport: writes the message to the server log and
// reports success. Production swaps in a Resend adapter once RESEND_API_KEY
// exists (see docs/product/decisions.md).
export function createLogTransport(
  log: (line: string) => void = console.log,
): EmailTransport {
  return {
    name: "log",
    async send(message) {
      log(
        [
          "[email:log-transport]",
          `to=${message.to}`,
          `subject=${message.subject}`,
          message.body,
        ].join(" | "),
      );

      return { ok: true };
    },
  };
}

// Real delivery via Resend's REST API - no SDK dependency. Used automatically
// once RESEND_API_KEY exists; EMAIL_FROM overrides the default test sender.
export function createResendTransport(options: {
  apiKey: string;
  from: string;
  fetchFn?: typeof fetch;
}): EmailTransport {
  const fetchFn = options.fetchFn ?? fetch;

  return {
    name: "resend",
    async send(message) {
      try {
        const response = await fetchFn("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: options.from,
            to: [message.to],
            subject: message.subject,
            text: message.body,
          }),
        });

        if (!response.ok) {
          const detail = (await response.text()).slice(0, 200);
          return { ok: false, error: `Resend ${response.status}: ${detail}` };
        }

        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Resend request failed",
        };
      }
    },
  };
}

export function getDefaultTransport(): EmailTransport {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    return createResendTransport({
      apiKey,
      from: process.env.EMAIL_FROM ?? "Subscription Hub <onboarding@resend.dev>",
    });
  }

  return createLogTransport();
}
