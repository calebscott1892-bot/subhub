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

export function getDefaultTransport(): EmailTransport {
  return createLogTransport();
}
