import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  channelConnectionsTable,
  channelInsightsTable,
  issuesTable,
  performanceSnapshotsTable,
  suggestionsTable,
  syncRunsTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import { formatDate, makeStableId, percentDelta, subtractDays } from "@/lib/yseo/core";
import { runSearchConsoleValidationSync } from "@/lib/yseo/google-search-console";

function getSevenDayWindow() {
  const end = subtractDays(new Date(), 1);
  const start = subtractDays(end, 6);

  return {
    since: formatDate(start),
    until: formatDate(end),
  };
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

export async function runSearchConsoleAutoSync(input?: { customerId?: string }) {
  const db = getDb();
  const now = new Date();
  const connections = await db
    .select()
    .from(channelConnectionsTable)
    .where(
      input?.customerId
        ? and(
            eq(channelConnectionsTable.channelType, "search-console"),
            eq(channelConnectionsTable.customerId, input.customerId),
          )
        : eq(channelConnectionsTable.channelType, "search-console"),
    );

  let syncedCustomers = 0;
  let issuesOpened = 0;

  for (const connection of connections) {
    const syncRunId = makeStableId("search-console-sync-run", connection.customerId, now.getTime());

    await upsertById(syncRunsTable, {
      id: syncRunId,
      channelConnectionId: connection.id,
      syncType: "search-console-auto",
      status: "running",
      startedAt: now,
      finishedAt: null,
      cursor: connection.externalPropertyRef ?? connection.externalAccountRef,
      errorSummary: null,
      requiresOperatorReview: false,
    });

    try {
      const previousSnapshots = await db
        .select()
        .from(performanceSnapshotsTable)
        .where(
          and(
            eq(performanceSnapshotsTable.customerId, connection.customerId),
            eq(performanceSnapshotsTable.channelType, "search-console"),
            eq(performanceSnapshotsTable.dateBucket, "7d"),
          ),
        )
        .orderBy(desc(performanceSnapshotsTable.capturedAt))
        .limit(2);

      const summary = await runSearchConsoleValidationSync(connection.customerId);
      const window = getSevenDayWindow();
      const currentMetrics = {
        clicks: summary.clicks,
        impressions: summary.impressions,
        ctr: Number((summary.ctr * 100).toFixed(2)),
        avgPosition: Number(summary.position.toFixed(2)),
      };

      await upsertById(performanceSnapshotsTable, {
        id: makeStableId("search-console-snapshot", connection.customerId, window.until),
        customerId: connection.customerId,
        channelType: "search-console",
        entityType: "customer",
        entityId: connection.id,
        dateBucket: "7d",
        metricSetJson: currentMetrics,
        completenessState: "complete",
        capturedAt: now,
      });

      await upsertById(channelInsightsTable, {
        id: makeStableId("search-console-insight", connection.customerId),
        customerId: connection.customerId,
        channelType: "search-console",
        freshnessLabel: `${window.until} sync`,
        headline: "Search Console 7d summary",
        note: "Latest 7-day organic performance was refreshed automatically.",
        metrics: [
          { label: "7d Clicks", value: summary.clicks.toLocaleString("en-US") },
          { label: "7d Impressions", value: summary.impressions.toLocaleString("en-US") },
          { label: "CTR", value: `${(summary.ctr * 100).toFixed(2)}%` },
        ],
      });

      const previousSnapshot = previousSnapshots[0];
      const previousClicks =
        typeof previousSnapshot?.metricSetJson === "object" &&
        previousSnapshot.metricSetJson &&
        typeof (previousSnapshot.metricSetJson as Record<string, unknown>).clicks === "number"
          ? ((previousSnapshot.metricSetJson as Record<string, unknown>).clicks as number)
          : null;
      const clickDelta =
        previousClicks === null ? null : percentDelta(summary.clicks, previousClicks);

      if (previousClicks !== null && previousClicks >= 20 && clickDelta !== null && clickDelta <= -30) {
        const issueId = makeStableId("search-console-issue", connection.customerId, "click-drop");
        await upsertById(issuesTable, {
          id: issueId,
          customerId: connection.customerId,
          channelType: "search-console",
          issueType: "search-console-click-drop",
          severity: "high",
          detectedAt: now,
          sourceSnapshotIds: [previousSnapshot.id, makeStableId("search-console-snapshot", connection.customerId, window.until)],
          title: "Search Console clicks dropped",
          summary: `Organic clicks are down ${Math.abs(clickDelta)}% versus the prior 7-day window.`,
          recommendedAction: "Check top page/query losses and compare against paid landing performance before changing bids.",
          status: "open",
          dedupeKey: `search-console:${connection.customerId}:click-drop`,
        });
        await upsertById(suggestionsTable, {
          id: makeStableId("search-console-suggestion", connection.customerId, "click-drop"),
          issueId,
          customerId: connection.customerId,
          channelType: "search-console",
          suggestionType: "organic-diagnosis",
          title: "Investigate the organic drop before changing paid coverage.",
          summary: "The organic drop may be query mix, page indexing, or landing relevance rather than a paid media problem.",
          payloadPreview: [
            `Current 7d clicks: ${summary.clicks}`,
            `Prior 7d clicks: ${previousClicks}`,
            `Delta: ${clickDelta}%`,
          ],
          rationaleText: "Paid and organic issues often get mixed together. This suggestion keeps the diagnosis separate before action.",
          approvalStatus: "pending",
          riskLevel: "manual",
          approvedBy: null,
          executedAt: null,
        });
        issuesOpened += 1;
      }

      await db
        .update(channelConnectionsTable)
        .set({
          connectionStatus: "connected",
          tokenStatus: "valid",
          lastSyncAt: now,
          lastErrorCode: null,
          syncStatus: "succeeded",
          syncHeadline: "Search Console auto sync completed.",
        })
        .where(eq(channelConnectionsTable.id, connection.id));

      await db
        .update(syncRunsTable)
        .set({
          status: "succeeded",
          finishedAt: now,
          errorSummary: null,
          requiresOperatorReview: false,
        })
        .where(eq(syncRunsTable.id, syncRunId));

      await db.insert(taskExecutionsTable).values({
        id: makeStableId("search-console-sync", connection.customerId, now.getTime()),
        customerId: connection.customerId,
        suggestionId: null,
        actionType: "search-console-sync",
        actorType: "system",
        actorName: "YSEO Auto Sync",
        resultStatus: "done",
        externalRequestRef: connection.externalPropertyRef ?? connection.externalAccountRef,
        beforeJson: previousSnapshot?.metricSetJson ?? null,
        afterJson: currentMetrics,
        summary: "Search Console auto sync completed.",
        executedAt: now,
      });

      syncedCustomers += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Search Console sync error.";
      const issueId = makeStableId("search-console-issue", connection.customerId, "sync-blocked");

      await upsertById(issuesTable, {
        id: issueId,
        customerId: connection.customerId,
        channelType: "search-console",
        issueType: "search-console-sync-blocked",
        severity: "critical",
        detectedAt: now,
        sourceSnapshotIds: [],
        title: "Search Console sync blocked",
        summary: message,
        recommendedAction: "Reconnect the property or review the stored Google credential before retrying.",
        status: "open",
        dedupeKey: `search-console:${connection.customerId}:sync-blocked`,
      });

      await db
        .update(channelConnectionsTable)
        .set({
          connectionStatus: "blocked",
          tokenStatus: "invalid",
          lastSyncAt: now,
          lastErrorCode: "SEARCH_CONSOLE_SYNC_FAILED",
          syncStatus: "failed",
          syncHeadline: message,
        })
        .where(eq(channelConnectionsTable.id, connection.id));

      await db
        .update(syncRunsTable)
        .set({
          status: "failed",
          finishedAt: now,
          errorSummary: message,
          requiresOperatorReview: true,
        })
        .where(eq(syncRunsTable.id, syncRunId));

      await db.insert(taskExecutionsTable).values({
        id: makeStableId("search-console-sync-failed", connection.customerId, now.getTime()),
        customerId: connection.customerId,
        suggestionId: null,
        actionType: "search-console-sync",
        actorType: "system",
        actorName: "YSEO Auto Sync",
        resultStatus: "failed",
        externalRequestRef: connection.externalPropertyRef ?? connection.externalAccountRef,
        beforeJson: null,
        afterJson: { error: message },
        summary: "Search Console auto sync failed.",
        executedAt: now,
      });

      issuesOpened += 1;
    }
  }

  return {
    ok: true,
    syncedCustomers,
    issuesOpened,
    discoveredCustomers: connections.length,
    message: `Processed ${syncedCustomers} Search Console connections.`,
  };
}
