import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { sendAlertEmail } from "@/lib/email/resend";
import { getDb } from "@/lib/db/client";
import {
  alertEventsTable,
  alertRulesTable,
  channelConnectionsTable,
  customersTable,
  performanceSnapshotsTable,
  syncRunsTable,
} from "@/lib/db/schema";
import { formatDate, makeStableId, percentDelta } from "@/lib/yseo/core";
import type { AlertEvent, AlertRule } from "@/lib/yseo/strategy-types";
import type { IssueSeverity } from "@/lib/yseo/types";

type SnapshotMetrics = Record<string, unknown>;

interface TriggeredAlert {
  rule: AlertRule;
  title: string;
  summary: string;
  recommendedAction: string;
  payloadJson: Record<string, unknown>;
  sourceRef?: string;
}

function asTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function upsertById<Row extends { id: string }>(table: { id: unknown }, row: Row) {
  const db = getDb();
  const { id, ...rest } = row;
  void id;

  await db
    .insert(table as never)
    .values(row as never)
    .onConflictDoUpdate({
      target: (table as { id: unknown }).id as never,
      set: rest as never,
    });
}

function toAlertRule(row: typeof alertRulesTable.$inferSelect): AlertRule {
  return {
    id: row.id,
    customerId: row.customerId,
    channelType: row.channelType as AlertRule["channelType"],
    severity: row.severity as AlertRule["severity"],
    name: row.name,
    conditionKey: row.conditionKey,
    configJson: (row.configJson ?? {}) as AlertRule["configJson"],
    recommendedAction: row.recommendedAction,
    isActive: row.isActive,
    lastTriggeredAt: asTimestamp(row.lastTriggeredAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAlertEvent(row: typeof alertEventsTable.$inferSelect): AlertEvent {
  return {
    id: row.id,
    customerId: row.customerId,
    channelType: row.channelType as AlertEvent["channelType"],
    severity: row.severity as AlertEvent["severity"],
    eventType: row.eventType,
    title: row.title,
    summary: row.summary,
    recommendedAction: row.recommendedAction,
    sourceRef: row.sourceRef ?? undefined,
    payloadJson: (row.payloadJson ?? {}) as AlertEvent["payloadJson"],
    deliveryStatus: row.deliveryStatus as AlertEvent["deliveryStatus"],
    deliveredTo: row.deliveredTo ?? undefined,
    deliveredAt: asTimestamp(row.deliveredAt),
    dedupeKey: row.dedupeKey,
    createdAt: row.createdAt.toISOString(),
  };
}

function shouldSendImmediateEmail(severity: IssueSeverity) {
  return severity === "critical" || severity === "high" || severity === "medium";
}

function evaluateRule(input: {
  rule: AlertRule;
  customerName: string;
  latestConnection?: typeof channelConnectionsTable.$inferSelect;
  latestRun?: typeof syncRunsTable.$inferSelect;
  currentSnapshot?: typeof performanceSnapshotsTable.$inferSelect;
  previousSnapshot?: typeof performanceSnapshotsTable.$inferSelect;
}): TriggeredAlert | null {
  const config = input.rule.configJson;
  const currentMetrics = (input.currentSnapshot?.metricSetJson ?? {}) as SnapshotMetrics;
  const previousMetrics = (input.previousSnapshot?.metricSetJson ?? {}) as SnapshotMetrics;
  const currentClicks = asNumber(currentMetrics.clicks);
  const currentConversions = asNumber(currentMetrics.conversions);
  const currentSpend = asNumber(currentMetrics.spend) ?? asNumber(currentMetrics.cost);
  const currentCtr = asNumber(currentMetrics.ctr);
  const currentCpc = asNumber(currentMetrics.cpc);
  const previousClicks = asNumber(previousMetrics.clicks);
  const previousCtr = asNumber(previousMetrics.ctr);
  const previousCpc = asNumber(previousMetrics.cpc);

  switch (input.rule.conditionKey) {
    case "naver-sync-blocked": {
      if (
        input.latestConnection?.channelType === "naver-searchad" &&
        (input.latestConnection.connectionStatus === "blocked" ||
          input.latestConnection.syncStatus === "failed" ||
          input.latestRun?.status === "failed")
      ) {
        return {
          rule: input.rule,
          title: `${input.customerName} NAVER sync blocked`,
          summary:
            input.latestConnection.syncHeadline ||
            input.latestRun?.errorSummary ||
            "NAVER sync is blocked and needs operator review.",
          recommendedAction: input.rule.recommendedAction,
          sourceRef: input.latestConnection.externalAccountRef,
          payloadJson: {
            syncStatus: input.latestConnection.syncStatus,
            lastErrorCode: input.latestConnection.lastErrorCode,
            latestRunStatus: input.latestRun?.status,
          },
        };
      }

      return null;
    }

    case "naver-zero-conversion": {
      const minSpend = Number(config.minSpend ?? 30000);
      const minClicks = Number(config.minClicks ?? 20);

      if (
        input.currentSnapshot?.channelType === "naver-searchad" &&
        currentSpend !== null &&
        currentSpend >= minSpend &&
        currentClicks !== null &&
        currentClicks >= minClicks &&
        currentConversions === 0
      ) {
        return {
          rule: input.rule,
          title: `${input.customerName} spend without conversions`,
          summary: `Recent 7-day spend reached ${Math.round(currentSpend).toLocaleString("ko-KR")} KRW with 0 conversions.`,
          recommendedAction: input.rule.recommendedAction,
          sourceRef: input.latestConnection?.externalAccountRef,
          payloadJson: {
            clicks: currentClicks,
            conversions: currentConversions,
            spend: currentSpend,
            dateBucket: input.currentSnapshot.dateBucket,
          },
        };
      }

      return null;
    }

    case "naver-cpc-spike": {
      const deltaPercent = Number(config.deltaPercent ?? 20);
      const floorCpc = Number(config.floorCpc ?? 0);
      const delta = currentCpc !== null && previousCpc !== null ? percentDelta(currentCpc, previousCpc) : null;

      if (
        input.currentSnapshot?.channelType === "naver-searchad" &&
        currentCpc !== null &&
        currentCpc >= floorCpc &&
        delta !== null &&
        delta >= deltaPercent
      ) {
        return {
          rule: input.rule,
          title: `${input.customerName} CPC spike detected`,
          summary: `Recent 7-day CPC is up ${delta}% compared with the prior 7-day window.`,
          recommendedAction: input.rule.recommendedAction,
          sourceRef: input.latestConnection?.externalAccountRef,
          payloadJson: {
            currentCpc,
            previousCpc,
            deltaPercent: delta,
          },
        };
      }

      return null;
    }

    case "naver-ctr-drop": {
      const targetCtr = Number(config.targetCtr ?? 1.5);
      const deltaPercent = Number(config.deltaPercent ?? -20);
      const delta = currentCtr !== null && previousCtr !== null ? percentDelta(currentCtr, previousCtr) : null;

      if (
        input.currentSnapshot?.channelType === "naver-searchad" &&
        currentCtr !== null &&
        (currentCtr < targetCtr || (delta !== null && delta <= deltaPercent))
      ) {
        return {
          rule: input.rule,
          title: `${input.customerName} CTR is under pressure`,
          summary:
            delta !== null
              ? `CTR is ${currentCtr}% and changed ${delta}% versus the previous 7-day window.`
              : `CTR is ${currentCtr}%, below the operating target.`,
          recommendedAction: input.rule.recommendedAction,
          sourceRef: input.latestConnection?.externalAccountRef,
          payloadJson: {
            currentCtr,
            previousCtr,
            targetCtr,
            deltaPercent: delta,
          },
        };
      }

      return null;
    }

    case "naver-cpa-breach": {
      const targetCpa = Number(config.targetCpa ?? 0);
      const tolerancePercent = Number(config.tolerancePercent ?? 20);
      const currentCpa =
        currentSpend !== null && currentConversions !== null && currentConversions > 0
          ? Number((currentSpend / currentConversions).toFixed(2))
          : null;

      if (
        input.currentSnapshot?.channelType === "naver-searchad" &&
        targetCpa > 0 &&
        currentCpa !== null &&
        currentCpa >= targetCpa * (1 + tolerancePercent / 100)
      ) {
        return {
          rule: input.rule,
          title: `${input.customerName} CPA is above target`,
          summary: `Current CPA is ${Math.round(currentCpa).toLocaleString("ko-KR")} KRW, above the agreed target band.`,
          recommendedAction: input.rule.recommendedAction,
          sourceRef: input.latestConnection?.externalAccountRef,
          payloadJson: {
            currentCpa,
            targetCpa,
            tolerancePercent,
          },
        };
      }

      return null;
    }

    case "search-console-click-drop": {
      const deltaPercent = Number(config.deltaPercent ?? -30);
      const minClicks = Number(config.minClicks ?? 20);
      const delta =
        currentClicks !== null && previousClicks !== null
          ? percentDelta(currentClicks, previousClicks)
          : null;

      if (
        input.currentSnapshot?.channelType === "search-console" &&
        previousClicks !== null &&
        previousClicks >= minClicks &&
        delta !== null &&
        delta <= deltaPercent
      ) {
        return {
          rule: input.rule,
          title: `${input.customerName} organic clicks dropped`,
          summary: `Search Console clicks are down ${Math.abs(delta)}% versus the prior 7-day window.`,
          recommendedAction: input.rule.recommendedAction,
          sourceRef: input.latestConnection?.externalPropertyRef ?? undefined,
          payloadJson: {
            currentClicks,
            previousClicks,
            deltaPercent: delta,
          },
        };
      }

      return null;
    }

    case "search-console-incomplete": {
      const syncHeadline = input.latestConnection?.syncHeadline ?? undefined;

      if (
        input.latestConnection?.channelType === "search-console" &&
        syncHeadline?.toLowerCase().includes("incomplete")
      ) {
        return {
          rule: input.rule,
          title: `${input.customerName} Search Console data still looks incomplete`,
          summary: syncHeadline,
          recommendedAction: input.rule.recommendedAction,
          sourceRef: input.latestConnection.externalPropertyRef ?? undefined,
          payloadJson: {
            syncHeadline,
          },
        };
      }

      return null;
    }

    default:
      return null;
  }
}

async function getLatestSnapshots(customerId: string, channelType: AlertRule["channelType"]) {
  const db = getDb();
  const rows = await db
    .select()
    .from(performanceSnapshotsTable)
    .where(
      and(
        eq(performanceSnapshotsTable.customerId, customerId),
        eq(performanceSnapshotsTable.channelType, channelType),
        eq(performanceSnapshotsTable.dateBucket, "7d"),
      ),
    )
    .orderBy(desc(performanceSnapshotsTable.capturedAt))
    .limit(2);

  return {
    currentSnapshot: rows[0],
    previousSnapshot: rows[1],
  };
}

export async function evaluateAlertRules(input?: {
  customerId?: string;
  mode?: "immediate" | "daily-summary";
}) {
  const db = getDb();
  const todayKey = formatDate(new Date());
  const rules = await db
    .select()
    .from(alertRulesTable)
    .where(
      input?.customerId
        ? and(eq(alertRulesTable.customerId, input.customerId), eq(alertRulesTable.isActive, true))
        : eq(alertRulesTable.isActive, true),
    );

  const groupedRules = new Map<string, AlertRule[]>();

  for (const row of rules.map(toAlertRule)) {
    const list = groupedRules.get(row.customerId) ?? [];
    list.push(row);
    groupedRules.set(row.customerId, list);
  }

  const triggeredEvents: AlertEvent[] = [];

  for (const [customerId, customerRules] of groupedRules.entries()) {
    const [customer] = await db
      .select({ id: customersTable.id, name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .limit(1);

    if (!customer) {
      continue;
    }

    const latestConnections = await db
      .select()
      .from(channelConnectionsTable)
      .where(eq(channelConnectionsTable.customerId, customerId))
      .orderBy(desc(channelConnectionsTable.lastSyncAt));
    const latestRuns = await db
      .select()
      .from(syncRunsTable)
      .where(eq(syncRunsTable.channelConnectionId, latestConnections[0]?.id ?? ""))
      .orderBy(desc(syncRunsTable.startedAt))
      .limit(1);

    for (const rule of customerRules) {
      const latestConnection = latestConnections.find((connection) => connection.channelType === rule.channelType);
      const latestRun =
        latestConnection === undefined
          ? undefined
          : (
              await db
                .select()
                .from(syncRunsTable)
                .where(eq(syncRunsTable.channelConnectionId, latestConnection.id))
                .orderBy(desc(syncRunsTable.startedAt))
                .limit(1)
            )[0];
      const { currentSnapshot, previousSnapshot } = await getLatestSnapshots(customerId, rule.channelType);
      const alert = evaluateRule({
        rule,
        customerName: customer.name,
        latestConnection,
        latestRun: latestRun ?? latestRuns[0],
        currentSnapshot,
        previousSnapshot,
      });

      if (!alert) {
        continue;
      }

      const eventId = makeStableId("alert-event", customerId, rule.conditionKey, todayKey);
      const shouldSendNow =
        input?.mode === "daily-summary" ? false : shouldSendImmediateEmail(rule.severity);

      const mailSubject = `[YSEO] ${alert.title}`;
      const mailText = [
        `${customer.name} / ${rule.channelType}`,
        "",
        alert.summary,
        "",
        `Recommended action: ${alert.recommendedAction}`,
        `Dashboard: https://yseo.vercel.app/customers/${customerId}`,
      ].join("\n");

      const sendResult = shouldSendNow
        ? await sendAlertEmail({
            subject: mailSubject,
            text: mailText,
          })
        : {
            ok: true,
            status: "pending",
            deliveredTo: process.env.ALERT_EMAIL_TO,
          };

      await upsertById(alertEventsTable, {
        id: eventId,
        customerId,
        channelType: rule.channelType,
        severity: rule.severity,
        eventType: rule.conditionKey,
        title: alert.title,
        summary: alert.summary,
        recommendedAction: alert.recommendedAction,
        sourceRef: alert.sourceRef ?? null,
        payloadJson: alert.payloadJson,
        deliveryStatus: sendResult.status,
        deliveredTo: sendResult.deliveredTo ?? null,
        deliveredAt: sendResult.status === "delivered" ? new Date() : null,
        dedupeKey: `${customerId}:${rule.conditionKey}:${todayKey}`,
        createdAt: new Date(),
      });

      await db
        .update(alertRulesTable)
        .set({
          lastTriggeredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(alertRulesTable.id, rule.id));

      const [storedRow] = await db
        .select()
        .from(alertEventsTable)
        .where(eq(alertEventsTable.id, eventId))
        .limit(1);

      if (storedRow) {
        triggeredEvents.push(toAlertEvent(storedRow));
      }
    }
  }

  if (input?.mode === "daily-summary" && triggeredEvents.length > 0) {
    const summaryText = triggeredEvents
      .map((event) => `- ${event.title}: ${event.summary}`)
      .join("\n");

    await sendAlertEmail({
      subject: `[YSEO] Daily alert summary (${todayKey})`,
      text: `Triggered alerts\n\n${summaryText}\n\nDashboard: https://yseo.vercel.app`,
    });
  }

  return {
    ok: true,
    triggeredCount: triggeredEvents.length,
    triggeredEvents,
  };
}
