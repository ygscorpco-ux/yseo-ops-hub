import "server-only";

import { sendAlertEmail, type EmailSendInput } from "@/lib/email/resend";

export type AlertDeliveryStatus =
  | "pending"
  | "skipped-not-configured"
  | "delivered"
  | "failed";

type AlertChannel = "email" | "slack" | "discord";

interface ChannelResult {
  channel: AlertChannel;
  status: Exclude<AlertDeliveryStatus, "pending">;
  target?: string;
  error?: string;
}

export interface AlertNotificationInput extends EmailSendInput {
  fallbackText?: string;
}

export interface AlertNotificationResult {
  ok: boolean;
  status: Exclude<AlertDeliveryStatus, "pending">;
  deliveredTo?: string;
  channels: ChannelResult[];
}

function getWebhookConfig() {
  return {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  };
}

async function postJsonWebhook(input: {
  channel: "slack" | "discord";
  url?: string;
  body: Record<string, unknown>;
}): Promise<ChannelResult> {
  if (!input.url) {
    return {
      channel: input.channel,
      status: "skipped-not-configured",
      error: `${input.channel.toUpperCase()} webhook is not configured.`,
    };
  }

  const response = await fetch(input.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input.body),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");

    return {
      channel: input.channel,
      status: "failed",
      target: input.channel,
      error: payload || `${input.channel.toUpperCase()} webhook request failed.`,
    };
  }

  return {
    channel: input.channel,
    status: "delivered",
    target: input.channel,
  };
}

function toSlackText(input: AlertNotificationInput) {
  return [input.subject, "", input.text].join("\n");
}

function toDiscordContent(input: AlertNotificationInput) {
  const raw = [input.subject, "", input.text].join("\n");
  return raw.length > 1900 ? `${raw.slice(0, 1897)}...` : raw;
}

export function isAlertNotificationConfigured() {
  const webhookConfig = getWebhookConfig();

  return (
    Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.ALERT_EMAIL_TO) ||
    Boolean(webhookConfig.slackWebhookUrl) ||
    Boolean(webhookConfig.discordWebhookUrl)
  );
}

export async function sendAlertNotification(
  input: AlertNotificationInput,
): Promise<AlertNotificationResult> {
  const webhookConfig = getWebhookConfig();
  const results: ChannelResult[] = [];

  const emailResult = await sendAlertEmail(input);
  results.push({
    channel: "email",
    status: emailResult.status,
    target: emailResult.deliveredTo,
    error: emailResult.error,
  });

  results.push(
    await postJsonWebhook({
      channel: "slack",
      url: webhookConfig.slackWebhookUrl,
      body: {
        text: toSlackText(input),
      },
    }),
  );

  results.push(
    await postJsonWebhook({
      channel: "discord",
      url: webhookConfig.discordWebhookUrl,
      body: {
        content: toDiscordContent(input),
      },
    }),
  );

  const successfulTargets = results
    .filter((result) => result.status === "delivered" && result.target)
    .map((result) => result.target as string);
  const hasDelivery = results.some((result) => result.status === "delivered");
  const hasConfiguredChannel = results.some(
    (result) => result.status === "delivered" || result.status === "failed",
  );

  return {
    ok: hasDelivery,
    status: hasDelivery
      ? "delivered"
      : hasConfiguredChannel
        ? "failed"
        : "skipped-not-configured",
    deliveredTo: successfulTargets.length > 0 ? successfulTargets.join(", ") : undefined,
    channels: results,
  };
}
