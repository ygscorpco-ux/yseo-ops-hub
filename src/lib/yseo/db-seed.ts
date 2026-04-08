import { getDb } from "../db/client";
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
  channelConnections,
  channelInsights,
  customers,
  externalReferences,
  internalMemos,
  issues,
  performanceSnapshots,
  reportDrafts,
  suggestions,
  taskExecutions,
} from "./data";

type SeedRow = {
  id: string;
  [key: string]: unknown;
};

function toDate(value?: string) {
  return value ? new Date(value) : null;
}

async function upsertById(table: { id: unknown }, rows: SeedRow[]) {
  const db = getDb();

  for (const row of rows) {
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
}

export async function seedYseoData() {
  await upsertById(
    customersTable,
    customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      segment: customer.segment,
      primaryManager: customer.primaryManager,
      statusTag: customer.statusTag,
      onboardingStatus: customer.onboardingStatus,
      reportingProfile: customer.reportingProfile,
      memoSummary: customer.memoSummary,
      focus: customer.focus,
      priorityRank: customer.priorityRank,
      nextReviewAt: toDate(customer.nextReviewAt),
      lastActionAt: toDate(customer.lastActionAt),
      updatedAt: new Date(),
    })),
  );

  await upsertById(
    channelConnectionsTable,
    channelConnections.map((connection) => ({
      id: connection.id,
      customerId: connection.customerId,
      channelType: connection.channelType,
      connectionStatus: connection.connectionStatus,
      authMethod: connection.authMethod,
      externalAccountRef: connection.externalAccountRef,
      externalPropertyRef: connection.externalPropertyRef ?? null,
      tokenStatus: connection.tokenStatus,
      lastSyncAt: toDate(connection.lastSyncAt),
      lastErrorCode: connection.lastErrorCode ?? null,
      syncStatus: connection.syncStatus,
      syncHeadline: connection.syncHeadline,
    })),
  );

  await upsertById(
    externalReferencesTable,
    externalReferences.map((reference) => ({
      id: reference.id,
      channelConnectionId: reference.channelConnectionId,
      externalType: reference.externalType,
      externalId: reference.externalId,
      externalName: reference.externalName,
      parentExternalId: reference.parentExternalId ?? null,
    })),
  );

  await upsertById(
    performanceSnapshotsTable,
    performanceSnapshots.map((snapshot) => ({
      id: snapshot.id,
      customerId: snapshot.customerId,
      channelType: snapshot.channelType,
      entityType: snapshot.entityType,
      entityId: snapshot.entityId,
      dateBucket: snapshot.dateBucket,
      metricSetJson: snapshot.metricSetJson,
      completenessState: snapshot.completenessState,
      capturedAt: toDate(snapshot.capturedAt),
    })),
  );

  await upsertById(
    issuesTable,
    issues.map((issue) => ({
      id: issue.id,
      customerId: issue.customerId,
      channelType: issue.channelType,
      issueType: issue.issueType,
      severity: issue.severity,
      detectedAt: toDate(issue.detectedAt),
      sourceSnapshotIds: issue.sourceSnapshotIds,
      title: issue.title,
      summary: issue.summary,
      recommendedAction: issue.recommendedAction,
      status: issue.status,
      dedupeKey: issue.dedupeKey,
    })),
  );

  await upsertById(
    suggestionsTable,
    suggestions.map((suggestion) => ({
      id: suggestion.id,
      issueId: suggestion.issueId,
      customerId: suggestion.customerId,
      channelType: suggestion.channelType,
      suggestionType: suggestion.suggestionType,
      title: suggestion.title,
      summary: suggestion.summary,
      payloadPreview: suggestion.payloadPreview,
      rationaleText: suggestion.rationaleText,
      approvalStatus: suggestion.approvalStatus,
      riskLevel: suggestion.riskLevel,
      approvedBy: suggestion.approvedBy ?? null,
      executedAt: toDate(suggestion.executedAt),
    })),
  );

  await upsertById(
    reportDraftsTable,
    reportDrafts.map((report) => ({
      id: report.id,
      customerId: report.customerId,
      title: report.title,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      summary: report.summary,
      highlights: report.highlights,
      nextActions: report.nextActions,
      sourceSummaryJson: report.sourceSummaryJson,
      finalizedAt: toDate(report.finalizedAt),
      updatedAt: toDate(report.updatedAt),
    })),
  );

  await upsertById(
    internalMemosTable,
    internalMemos.map((memo) => ({
      id: memo.id,
      customerId: memo.customerId,
      body: memo.body,
      memoType: memo.memoType,
      createdBy: memo.createdBy,
      createdAt: toDate(memo.createdAt),
    })),
  );

  await upsertById(
    channelInsightsTable,
    channelInsights.map((insight) => ({
      id: insight.id,
      customerId: insight.customerId,
      channelType: insight.channelType,
      freshnessLabel: insight.freshnessLabel,
      headline: insight.headline,
      note: insight.note,
      metrics: insight.metrics,
    })),
  );

  await upsertById(
    taskExecutionsTable,
    taskExecutions.map((log) => ({
      id: log.id,
      customerId: log.customerId,
      suggestionId: log.suggestionId ?? null,
      actionType: log.actionType,
      actorType: log.actorType,
      actorName: log.actorName,
      resultStatus: log.resultStatus,
      externalRequestRef: log.externalRequestRef ?? null,
      beforeJson: log.beforeJson ?? null,
      afterJson: log.afterJson ?? null,
      summary: log.summary,
      executedAt: toDate(log.executedAt),
    })),
  );

  return {
    customers: customers.length,
    channelConnections: channelConnections.length,
    externalReferences: externalReferences.length,
    performanceSnapshots: performanceSnapshots.length,
    issues: issues.length,
    suggestions: suggestions.length,
    reportDrafts: reportDrafts.length,
    internalMemos: internalMemos.length,
    channelInsights: channelInsights.length,
    taskExecutions: taskExecutions.length,
  };
}
