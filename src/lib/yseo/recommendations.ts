import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  executionRequestsTable,
  issuesTable,
  performanceSnapshotsTable,
  recommendationEvaluationsTable,
  recommendationRunsTable,
  strategyPacksTable,
  suggestionsTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import { makeStableId, percentDelta } from "@/lib/yseo/core";

function asMetricSet(value: unknown) {
  return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
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

function buildSuggestionPayloadPreview(lines: Array<string | null | undefined>) {
  return lines.filter((line): line is string => Boolean(line)).slice(0, 4);
}

export async function generateRecommendations(input?: { customerId?: string; source?: "manual" | "scheduled" | "post-alert" }) {
  const db = getDb();
  const source = input?.source ?? "manual";
  const strategyRows = input?.customerId
    ? await db
        .select()
        .from(strategyPacksTable)
        .where(eq(strategyPacksTable.customerId, input.customerId))
    : await db.select().from(strategyPacksTable);

  let generatedCount = 0;

  for (const strategyRow of strategyRows) {
    const runId = makeStableId("recommendation-run", strategyRow.customerId, Date.now());
    await upsertById(recommendationRunsTable, {
      id: runId,
      customerId: strategyRow.customerId,
      source,
      status: "running",
      summary: "Generating strategy-driven recommendations.",
      generatedCount: 0,
      createdAt: new Date(),
      completedAt: null,
    });

    const latestSnapshots = await db
      .select()
      .from(performanceSnapshotsTable)
      .where(eq(performanceSnapshotsTable.customerId, strategyRow.customerId))
      .orderBy(desc(performanceSnapshotsTable.capturedAt));
    const currentNaver = latestSnapshots.find(
      (snapshot) => snapshot.channelType === "naver-searchad" && snapshot.dateBucket === "7d",
    );
    const previousNaver = latestSnapshots.find(
      (snapshot) =>
        snapshot.channelType === "naver-searchad" &&
        snapshot.dateBucket === "7d" &&
        snapshot.id !== currentNaver?.id,
    );
    const currentSearchConsole = latestSnapshots.find(
      (snapshot) => snapshot.channelType === "search-console" && snapshot.dateBucket === "7d",
    );
    const issues = await db
      .select()
      .from(issuesTable)
      .where(and(eq(issuesTable.customerId, strategyRow.customerId), eq(issuesTable.status, "open")))
      .orderBy(desc(issuesTable.detectedAt));

    const currentNaverMetrics = asMetricSet(currentNaver?.metricSetJson);
    const previousNaverMetrics = asMetricSet(previousNaver?.metricSetJson);
    const currentSearchConsoleMetrics = asMetricSet(currentSearchConsole?.metricSetJson);
    const currentCpc = asNumber(currentNaverMetrics.cpc);
    const previousCpc = asNumber(previousNaverMetrics.cpc);
    const currentCtr = asNumber(currentNaverMetrics.ctr);
    const currentConversions = asNumber(currentNaverMetrics.conversions);
    const currentSpend = asNumber(currentNaverMetrics.spend);
    const currentSearchClicks = asNumber(currentSearchConsoleMetrics.clicks);
    const previousSearchSnapshot = latestSnapshots.find(
      (snapshot) =>
        snapshot.channelType === "search-console" &&
        snapshot.dateBucket === "7d" &&
        snapshot.id !== currentSearchConsole?.id,
    );
    const previousSearchClicks = asNumber(asMetricSet(previousSearchSnapshot?.metricSetJson).clicks);
    const cpcDelta =
      currentCpc !== null && previousCpc !== null ? percentDelta(currentCpc, previousCpc) : null;
    const organicDelta =
      currentSearchClicks !== null && previousSearchClicks !== null
        ? percentDelta(currentSearchClicks, previousSearchClicks)
        : null;

    const packs = strategyRow.researchSummary as {
      keywordClusters?: string[];
      copyAngles?: string[];
      landingRisks?: string[];
    };
    const goalProfile = strategyRow.goalProfile as {
      targetCpa?: number;
      targetCtr?: number;
      targetCpc?: number;
    };
    const suggestionsToCreate: Array<{
      id: string;
      channelType: "naver-searchad" | "search-console";
      suggestionType: string;
      title: string;
      summary: string;
      payloadPreview: string[];
      rationaleText: string;
      riskLevel: "safe" | "guarded" | "manual";
      execution?: {
        actionType: string;
        payloadJson: Record<string, unknown>;
      };
    }> = [];

    if (issues.some((issue) => issue.issueType.includes("sync-blocked"))) {
      suggestionsToCreate.push({
        id: makeStableId("suggestion", strategyRow.customerId, "rerun-sync"),
        channelType: "naver-searchad",
        suggestionType: "rerun-sync",
        title: "Retry NAVER sync after operator review",
        summary: "The latest sync failed, so the safest first action is to retry collection after credentials and access are checked.",
        payloadPreview: buildSuggestionPayloadPreview([
          issues.find((issue) => issue.issueType.includes("sync-blocked"))?.summary,
        ]),
        rationaleText: "This is the safest approval-based action to restore visibility before changing bids or keywords.",
        riskLevel: "safe",
        execution: {
          actionType: "naver-rerun-sync",
          payloadJson: { customerId: strategyRow.customerId },
        },
      });
    }

    if (currentCpc !== null && currentCpc > (goalProfile.targetCpc ?? currentCpc) && cpcDelta !== null && cpcDelta >= 15) {
      suggestionsToCreate.push({
        id: makeStableId("suggestion", strategyRow.customerId, "bid-lower-review"),
        channelType: "naver-searchad",
        suggestionType: "bid-lower-review",
        title: "Review bid pressure and lower CPC candidates",
        summary: "Recent CPC inflation suggests bid pressure is rising faster than expected.",
        payloadPreview: buildSuggestionPayloadPreview([
          `Current CPC: ${currentCpc}`,
          previousCpc !== null ? `Prior CPC: ${previousCpc}` : null,
          cpcDelta !== null ? `Delta: ${cpcDelta}%` : null,
        ]),
        rationaleText: "Lowering or re-segmenting bids can recover efficiency before CPA deteriorates further.",
        riskLevel: "guarded",
      });
    }

    if (currentSpend !== null && currentSpend >= 30000 && currentConversions === 0) {
      suggestionsToCreate.push({
        id: makeStableId("suggestion", strategyRow.customerId, "negative-keyword-review"),
        channelType: "naver-searchad",
        suggestionType: "negative-keyword-review",
        title: "Review negative keywords and landing friction",
        summary: "Spend has accumulated without conversions, so intent quality and landing friction should be checked before more scale.",
        payloadPreview: buildSuggestionPayloadPreview([
          `7d spend: ${Math.round(currentSpend).toLocaleString("ko-KR")} KRW`,
          "7d conversions: 0",
          packs.keywordClusters?.[0] ? `Priority cluster: ${packs.keywordClusters[0]}` : null,
        ]),
        rationaleText: "No-conversion periods are usually intent or landing problems before they are pure bidding problems.",
        riskLevel: "manual",
      });
    }

    if (
      currentCtr !== null &&
      goalProfile.targetCtr !== undefined &&
      currentCtr < goalProfile.targetCtr &&
      packs.copyAngles?.length
    ) {
      suggestionsToCreate.push({
        id: makeStableId("suggestion", strategyRow.customerId, "copy-refresh"),
        channelType: "naver-searchad",
        suggestionType: "copy-refresh",
        title: "Refresh copy angles around the current offer",
        summary: "CTR is below the operating target, so the current ad angle may no longer match search intent strongly enough.",
        payloadPreview: buildSuggestionPayloadPreview(
          packs.copyAngles.slice(0, 3).map((angle, index) => `Angle ${index + 1}: ${angle}`),
        ),
        rationaleText: "Copy refresh is lower-risk than structural account changes and can improve CTR quickly.",
        riskLevel: "guarded",
      });
    }

    if (organicDelta !== null && organicDelta <= -25) {
      suggestionsToCreate.push({
        id: makeStableId("suggestion", strategyRow.customerId, "organic-paid-diagnosis"),
        channelType: "search-console",
        suggestionType: "organic-paid-diagnosis",
        title: "Separate paid issues from organic landing or indexing issues",
        summary: "Organic clicks are also sliding, so the current performance issue may not be solved by bid changes alone.",
        payloadPreview: buildSuggestionPayloadPreview([
          `Current organic clicks: ${currentSearchClicks}`,
          `Prior organic clicks: ${previousSearchClicks}`,
          `Delta: ${organicDelta}%`,
        ]),
        rationaleText: "When paid and organic both soften, isolate landing and search demand before changing account structure.",
        riskLevel: "manual",
      });
    }

    for (const suggestion of suggestionsToCreate) {
      const linkedIssue = issues.find((issue) =>
        suggestion.suggestionType === "rerun-sync"
          ? issue.issueType.includes("sync-blocked")
          : issue.channelType === suggestion.channelType,
      );

      await upsertById(suggestionsTable, {
        id: suggestion.id,
        issueId: linkedIssue?.id ?? makeStableId("synthetic-issue", strategyRow.customerId, suggestion.suggestionType),
        customerId: strategyRow.customerId,
        channelType: suggestion.channelType,
        suggestionType: suggestion.suggestionType,
        title: suggestion.title,
        summary: suggestion.summary,
        payloadPreview: suggestion.payloadPreview,
        rationaleText: suggestion.rationaleText,
        approvalStatus: "pending",
        riskLevel: suggestion.riskLevel,
        approvedBy: null,
        executedAt: null,
      });

      if (suggestion.execution) {
        await upsertById(executionRequestsTable, {
          id: makeStableId("execution-request", strategyRow.customerId, suggestion.suggestionType),
          customerId: strategyRow.customerId,
          suggestionId: suggestion.id,
          channelType: suggestion.channelType,
          actionType: suggestion.execution.actionType,
          payloadJson: suggestion.execution.payloadJson,
          approvalStatus: "pending",
          approvedBy: null,
          executedAt: null,
          failureReason: null,
          externalRequestRef: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    generatedCount += suggestionsToCreate.length;

    await upsertById(recommendationRunsTable, {
      id: runId,
      customerId: strategyRow.customerId,
      source,
      status: "completed",
      summary: `Generated ${suggestionsToCreate.length} recommendations.`,
      generatedCount: suggestionsToCreate.length,
      createdAt: new Date(),
      completedAt: new Date(),
    });

    await db.insert(taskExecutionsTable).values({
      id: makeStableId("recommendation-run", strategyRow.customerId, Date.now()),
      customerId: strategyRow.customerId,
      suggestionId: null,
      actionType: "recommendation-generate",
      actorType: "system",
      actorName: "YSEO Strategy",
      resultStatus: "done",
      externalRequestRef: source,
      beforeJson: null,
      afterJson: {
        generatedCount: suggestionsToCreate.length,
      },
      summary: `Generated ${suggestionsToCreate.length} recommendations.`,
      executedAt: new Date(),
    });
  }

  return {
    ok: true,
    generatedCount,
    customerCount: strategyRows.length,
  };
}

export async function evaluateRecommendationPerformance(customerId: string) {
  const db = getDb();
  const suggestions = await db
    .select()
    .from(suggestionsTable)
    .where(
      and(eq(suggestionsTable.customerId, customerId), eq(suggestionsTable.approvalStatus, "executed")),
    )
    .orderBy(desc(suggestionsTable.executedAt));

  const latestSnapshots = await db
    .select()
    .from(performanceSnapshotsTable)
    .where(eq(performanceSnapshotsTable.customerId, customerId))
    .orderBy(desc(performanceSnapshotsTable.capturedAt));
  const currentNaver = latestSnapshots.find(
    (snapshot) => snapshot.channelType === "naver-searchad" && snapshot.dateBucket === "7d",
  );
  const previousNaver = latestSnapshots.find(
    (snapshot) =>
      snapshot.channelType === "naver-searchad" &&
      snapshot.dateBucket === "7d" &&
      snapshot.id !== currentNaver?.id,
  );

  if (!currentNaver || !previousNaver) {
    return [];
  }

  const currentMetrics = asMetricSet(currentNaver.metricSetJson);
  const previousMetrics = asMetricSet(previousNaver.metricSetJson);
  const currentConversions = asNumber(currentMetrics.conversions) ?? 0;
  const previousConversions = asNumber(previousMetrics.conversions) ?? 0;
  const currentCtr = asNumber(currentMetrics.ctr) ?? 0;
  const previousCtr = asNumber(previousMetrics.ctr) ?? 0;
  const currentCpc = asNumber(currentMetrics.cpc) ?? 0;
  const previousCpc = asNumber(previousMetrics.cpc) ?? 0;
  const conversionDelta = percentDelta(currentConversions, previousConversions);
  const ctrDelta = percentDelta(currentCtr, previousCtr);
  const cpcDelta = percentDelta(currentCpc, previousCpc);
  const outcome =
    conversionDelta !== null && conversionDelta >= 10
      ? "improved"
      : conversionDelta !== null && conversionDelta <= -10
        ? "degraded"
        : "steady";
  const summary =
    outcome === "improved"
      ? "Recent 7-day conversion performance improved against the previous comparison window."
      : outcome === "degraded"
        ? "Recent 7-day conversion performance softened and needs another review cycle."
        : "The current data does not show a decisive change yet.";

  const evaluations = [];

  for (const suggestion of suggestions) {
    const evaluationId = makeStableId("recommendation-eval", customerId, suggestion.id);
    await upsertById(recommendationEvaluationsTable, {
      id: evaluationId,
      customerId,
      suggestionId: suggestion.id,
      evaluationWindowStart: previousNaver.capturedAt.toISOString(),
      evaluationWindowEnd: currentNaver.capturedAt.toISOString(),
      outcome,
      metricsBeforeJson: {
        conversions: previousConversions,
        ctr: previousCtr,
        cpc: previousCpc,
      },
      metricsAfterJson: {
        conversions: currentConversions,
        ctr: currentCtr,
        cpc: currentCpc,
      },
      summary: `${summary} CTR delta ${ctrDelta ?? 0}% / CPC delta ${cpcDelta ?? 0}%.`,
      createdAt: new Date(),
    });

    const [row] = await db
      .select()
      .from(recommendationEvaluationsTable)
      .where(eq(recommendationEvaluationsTable.id, evaluationId))
      .limit(1);

    if (row) {
      evaluations.push(row);
    }
  }

  return evaluations;
}
