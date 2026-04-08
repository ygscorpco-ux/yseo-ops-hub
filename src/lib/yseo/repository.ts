import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { desc } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "../db/client";
import {
  channelConnectionsTable,
  channelInsightsTable,
  customersTable,
  externalReferencesTable,
  internalMemosTable,
  issuesTable,
  performanceSnapshotsTable,
  reportDraftsTable,
  suggestionsTable,
  taskExecutionsTable,
} from "../db/schema";
import {
  channelConnections as fallbackChannelConnections,
  channelInsights as fallbackChannelInsights,
  customers as fallbackCustomers,
  externalReferences as fallbackExternalReferences,
  internalMemos as fallbackInternalMemos,
  issues as fallbackIssues,
  performanceSnapshots as fallbackPerformanceSnapshots,
  reportDrafts as fallbackReportDrafts,
  suggestions as fallbackSuggestions,
  taskExecutions as fallbackTaskExecutions,
} from "./data";
import type {
  ChannelConnection,
  ChannelInsight,
  Customer,
  ExternalReference,
  InternalMemo,
  Issue,
  PerformanceSnapshot,
  ReportDraft,
  Suggestion,
  TaskExecution,
} from "./types";

interface YseoDataBundle {
  customers: Customer[];
  channelConnections: ChannelConnection[];
  externalReferences: ExternalReference[];
  performanceSnapshots: PerformanceSnapshot[];
  issues: Issue[];
  suggestions: Suggestion[];
  reportDrafts: ReportDraft[];
  internalMemos: InternalMemo[];
  channelInsights: ChannelInsight[];
  taskExecutions: TaskExecution[];
}

function serializeTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function getFallbackData(): YseoDataBundle {
  return {
    customers: fallbackCustomers,
    channelConnections: fallbackChannelConnections,
    externalReferences: fallbackExternalReferences,
    performanceSnapshots: fallbackPerformanceSnapshots,
    issues: fallbackIssues,
    suggestions: fallbackSuggestions,
    reportDrafts: fallbackReportDrafts,
    internalMemos: fallbackInternalMemos,
    channelInsights: fallbackChannelInsights,
    taskExecutions: fallbackTaskExecutions,
  };
}

export const loadYseoData = cache(async (): Promise<YseoDataBundle> => {
  noStore();

  if (!hasDatabaseUrl()) {
    return getFallbackData();
  }

  try {
    const db = getDb();
    const [
      customerRows,
      connectionRows,
      referenceRows,
      snapshotRows,
      issueRows,
      suggestionRows,
      reportRows,
      memoRows,
      insightRows,
      taskRows,
    ] = await Promise.all([
      db.select().from(customersTable).orderBy(customersTable.priorityRank),
      db
        .select()
        .from(channelConnectionsTable)
        .orderBy(desc(channelConnectionsTable.lastSyncAt)),
      db.select().from(externalReferencesTable),
      db
        .select()
        .from(performanceSnapshotsTable)
        .orderBy(desc(performanceSnapshotsTable.capturedAt)),
      db.select().from(issuesTable).orderBy(desc(issuesTable.detectedAt)),
      db.select().from(suggestionsTable).orderBy(desc(suggestionsTable.executedAt)),
      db.select().from(reportDraftsTable).orderBy(desc(reportDraftsTable.updatedAt)),
      db.select().from(internalMemosTable).orderBy(desc(internalMemosTable.createdAt)),
      db.select().from(channelInsightsTable),
      db.select().from(taskExecutionsTable).orderBy(desc(taskExecutionsTable.executedAt)),
    ]);

    if (customerRows.length === 0) {
      return getFallbackData();
    }

    const channelConnections: ChannelConnection[] = connectionRows.map((row) => ({
      id: row.id,
      customerId: row.customerId,
      channelType: row.channelType as ChannelConnection["channelType"],
      connectionStatus: row.connectionStatus as ChannelConnection["connectionStatus"],
      authMethod: row.authMethod as ChannelConnection["authMethod"],
      externalAccountRef: row.externalAccountRef,
      externalPropertyRef: row.externalPropertyRef ?? undefined,
      tokenStatus: row.tokenStatus as ChannelConnection["tokenStatus"],
      lastSyncAt: serializeTimestamp(row.lastSyncAt),
      lastErrorCode: row.lastErrorCode ?? undefined,
      syncStatus: row.syncStatus as ChannelConnection["syncStatus"],
      syncHeadline: row.syncHeadline ?? "",
    }));

    const channelsByCustomer = new Map<string, Customer["channels"]>();

    for (const connection of channelConnections) {
      const channels = channelsByCustomer.get(connection.customerId) ?? [];

      if (!channels.includes(connection.channelType)) {
        channels.push(connection.channelType);
      }

      channelsByCustomer.set(connection.customerId, channels);
    }

    return {
      customers: customerRows.map((row) => ({
        id: row.id,
        name: row.name,
        segment: row.segment,
        primaryManager: row.primaryManager,
        statusTag: row.statusTag as Customer["statusTag"],
        onboardingStatus: row.onboardingStatus as Customer["onboardingStatus"],
        reportingProfile: row.reportingProfile as Customer["reportingProfile"],
        memoSummary: row.memoSummary ?? "",
        focus: row.focus ?? "",
        priorityRank: row.priorityRank,
        nextReviewAt: serializeTimestamp(row.nextReviewAt ?? row.updatedAt),
        lastActionAt: serializeTimestamp(row.lastActionAt ?? row.updatedAt),
        channels: channelsByCustomer.get(row.id) ?? [],
      })),
      channelConnections,
      externalReferences: referenceRows.map((row) => ({
        id: row.id,
        channelConnectionId: row.channelConnectionId,
        externalType: row.externalType as ExternalReference["externalType"],
        externalId: row.externalId,
        externalName: row.externalName,
        parentExternalId: row.parentExternalId ?? undefined,
      })),
      performanceSnapshots: snapshotRows.map((row) => ({
        id: row.id,
        customerId: row.customerId,
        channelType: row.channelType as PerformanceSnapshot["channelType"],
        entityType: row.entityType as PerformanceSnapshot["entityType"],
        entityId: row.entityId,
        dateBucket: row.dateBucket as PerformanceSnapshot["dateBucket"],
        metricSetJson: (row.metricSetJson ?? {}) as Record<string, number | string>,
        completenessState: row.completenessState as PerformanceSnapshot["completenessState"],
        capturedAt: serializeTimestamp(row.capturedAt),
      })),
      issues: issueRows.map((row) => ({
        id: row.id,
        customerId: row.customerId,
        channelType: row.channelType as Issue["channelType"],
        issueType: row.issueType,
        severity: row.severity as Issue["severity"],
        detectedAt: serializeTimestamp(row.detectedAt),
        sourceSnapshotIds: (row.sourceSnapshotIds ?? []) as string[],
        title: row.title,
        summary: row.summary,
        recommendedAction: row.recommendedAction,
        status: row.status as Issue["status"],
        dedupeKey: row.dedupeKey,
      })),
      suggestions: suggestionRows.map((row) => ({
        id: row.id,
        issueId: row.issueId,
        customerId: row.customerId,
        channelType: row.channelType as Suggestion["channelType"],
        suggestionType: row.suggestionType,
        title: row.title,
        summary: row.summary,
        payloadPreview: (row.payloadPreview ?? []) as string[],
        rationaleText: row.rationaleText,
        approvalStatus: row.approvalStatus as Suggestion["approvalStatus"],
        riskLevel: row.riskLevel as Suggestion["riskLevel"],
        approvedBy: row.approvedBy ?? undefined,
        executedAt: row.executedAt ? serializeTimestamp(row.executedAt) : undefined,
      })),
      reportDrafts: reportRows.map((row) => ({
        id: row.id,
        customerId: row.customerId,
        title: row.title,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        summary: row.summary,
        highlights: (row.highlights ?? []) as string[],
        nextActions: (row.nextActions ?? []) as string[],
        sourceSummaryJson: (row.sourceSummaryJson ?? {}) as Record<string, unknown>,
        finalizedAt: row.finalizedAt ? serializeTimestamp(row.finalizedAt) : undefined,
        updatedAt: serializeTimestamp(row.updatedAt),
      })),
      internalMemos: memoRows.map((row) => ({
        id: row.id,
        customerId: row.customerId,
        body: row.body,
        memoType: row.memoType as InternalMemo["memoType"],
        createdBy: row.createdBy,
        createdAt: serializeTimestamp(row.createdAt),
      })),
      channelInsights: insightRows.map((row) => ({
        id: row.id,
        customerId: row.customerId,
        channelType: row.channelType as ChannelInsight["channelType"],
        freshnessLabel: row.freshnessLabel,
        headline: row.headline,
        note: row.note,
        metrics: (row.metrics ?? []) as ChannelInsight["metrics"],
      })),
      taskExecutions: taskRows.map((row) => ({
        id: row.id,
        customerId: row.customerId,
        suggestionId: row.suggestionId ?? undefined,
        actionType: row.actionType,
        actorType: row.actorType as TaskExecution["actorType"],
        actorName: row.actorName,
        resultStatus: row.resultStatus as TaskExecution["resultStatus"],
        externalRequestRef: row.externalRequestRef ?? undefined,
        beforeJson: (row.beforeJson ?? undefined) as Record<string, unknown> | undefined,
        afterJson: (row.afterJson ?? undefined) as Record<string, unknown> | undefined,
        summary: row.summary,
        executedAt: serializeTimestamp(row.executedAt),
      })),
    };
  } catch {
    return getFallbackData();
  }
});
