// Server-only email provider abstraction.
// Swap the implementation here to change provider (Resend / SendGrid / Mailgun)
// without touching the application or UI code.

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type EmailProvider = {
  name: string;
  send: (message: EmailMessage) => Promise<void>;
};

function resendProvider(apiKey: string, from: string): EmailProvider {
  return {
    name: "resend",
    async send(message) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend request failed [${response.status}]: ${body}`);
      }
    },
  };
}

const noopProvider: EmailProvider = {
  name: "noop",
  async send(message) {
    console.warn(
      `[email] No email provider configured — skipped sending "${message.subject}" to ${message.to}`,
    );
  },
};

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"] ?? "Skill Path Finder <onboarding@resend.dev>";
  if (!apiKey) return noopProvider;
  return resendProvider(apiKey, from);
}

// Never throws: email delivery must not fail an already-saved application.
export async function sendEmailSafely(message: EmailMessage): Promise<boolean> {
  try {
    await getEmailProvider().send(message);
    return true;
  } catch (error) {
    console.error("[email] send failed", error);
    return false;
  }
}