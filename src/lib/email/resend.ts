import "server-only";

export interface EmailSendInput {
  subject: string;
  text: string;
  html?: string;
  to?: string;
}

export interface EmailSendResult {
  ok: boolean;
  status: "delivered" | "skipped-not-configured" | "failed";
  deliveredTo?: string;
  providerId?: string;
  error?: string;
}

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL,
    to: process.env.ALERT_EMAIL_TO,
  };
}

export function isEmailAlertConfigured() {
  const config = getEmailConfig();
  return Boolean(config.apiKey && config.from && config.to);
}

export async function sendAlertEmail(input: EmailSendInput): Promise<EmailSendResult> {
  const config = getEmailConfig();
  const to = input.to ?? config.to;

  if (!config.apiKey || !config.from || !to) {
    return {
      ok: false,
      status: "skipped-not-configured",
      deliveredTo: to ?? undefined,
      error: "RESEND_API_KEY, RESEND_FROM_EMAIL, ALERT_EMAIL_TO must be configured.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string }
    | null;

  if (!response.ok) {
    return {
      ok: false,
      status: "failed",
      deliveredTo: to,
      error: payload?.message ?? "Resend request failed.",
    };
  }

  return {
    ok: true,
    status: "delivered",
    deliveredTo: to,
    providerId: payload?.id,
  };
}
