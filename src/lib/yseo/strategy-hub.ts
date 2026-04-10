import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import {
  alertEventsTable,
  alertRulesTable,
  executionRequestsTable,
  recommendationEvaluationsTable,
  recommendationRunsTable,
  strategyPacksTable,
} from "@/lib/db/schema";
import type {
  AlertEvent,
  AlertRule,
  ExecutionRequest,
  RecommendationEvaluation,
  RecommendationRun,
  StrategyPack,
} from "@/lib/yseo/strategy-types";

function asTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toStrategyPack(
  row: typeof strategyPacksTable.$inferSelect,
): StrategyPack {
  const researchSummary = (row.researchSummary ?? {}) as StrategyPack["researchSummary"];

  return {
    id: row.id,
    customerId: row.customerId,
    masterCustomerId: row.masterCustomerId ?? undefined,
    status: row.status as StrategyPack["status"],
    sourceType: row.sourceType as StrategyPack["sourceType"],
    goalProfile: row.goalProfile as StrategyPack["goalProfile"],
    strategyProfile: row.strategyProfile as StrategyPack["strategyProfile"],
    researchSummary: {
      businessSummary: String(researchSummary.businessSummary ?? ""),
      keywordClusters: toStringArray(researchSummary.keywordClusters),
      negativeKeywords: toStringArray(researchSummary.negativeKeywords),
      copyAngles: toStringArray(researchSummary.copyAngles),
      landingRisks: toStringArray(researchSummary.landingRisks),
      searchConsoleWatchpoints: toStringArray(researchSummary.searchConsoleWatchpoints),
      alertRules: Array.isArray(researchSummary.alertRules)
        ? researchSummary.alertRules.map((rule) => ({
            severity:
              rule && typeof rule === "object" && "severity" in rule
                ? (String(rule.severity) as "critical" | "warning" | "watch")
                : "watch",
            condition:
              rule && typeof rule === "object" && "condition" in rule
                ? String(rule.condition)
                : "",
            recommendedAction:
              rule && typeof rule === "object" && "recommendedAction" in rule
                ? String(rule.recommendedAction)
                : "",
          }))
        : [],
      twoWeekPlan: toStringArray(researchSummary.twoWeekPlan),
      fourWeekPlan: toStringArray(researchSummary.fourWeekPlan),
      rawNotes:
        researchSummary && typeof researchSummary === "object" && "rawNotes" in researchSummary
          ? String(researchSummary.rawNotes ?? "")
          : undefined,
    },
    packSummary: row.packSummary,
    keywordClusters: toStringArray(row.keywordClusters),
    negativeKeywords: toStringArray(row.negativeKeywords),
    copyAngles: toStringArray(row.copyAngles),
    landingRisks: toStringArray(row.landingRisks),
    searchConsoleWatchpoints: toStringArray(row.searchConsoleWatchpoints),
    twoWeekPlan: toStringArray(row.twoWeekPlan),
    fourWeekPlan: toStringArray(row.fourWeekPlan),
    lastBootstrappedAt: row.lastBootstrappedAt.toISOString(),
    nextReviewAt: asTimestamp(row.nextReviewAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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

function toRecommendationRun(
  row: typeof recommendationRunsTable.$inferSelect,
): RecommendationRun {
  return {
    id: row.id,
    customerId: row.customerId,
    source: row.source as RecommendationRun["source"],
    status: row.status as RecommendationRun["status"],
    summary: row.summary,
    generatedCount: row.generatedCount,
    createdAt: row.createdAt.toISOString(),
    completedAt: asTimestamp(row.completedAt),
  };
}

function toRecommendationEvaluation(
  row: typeof recommendationEvaluationsTable.$inferSelect,
): RecommendationEvaluation {
  return {
    id: row.id,
    customerId: row.customerId,
    suggestionId: row.suggestionId,
    evaluationWindowStart: row.evaluationWindowStart,
    evaluationWindowEnd: row.evaluationWindowEnd,
    outcome: row.outcome as RecommendationEvaluation["outcome"],
    metricsBeforeJson: (row.metricsBeforeJson ?? {}) as RecommendationEvaluation["metricsBeforeJson"],
    metricsAfterJson: (row.metricsAfterJson ?? {}) as RecommendationEvaluation["metricsAfterJson"],
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  };
}

function toExecutionRequest(
  row: typeof executionRequestsTable.$inferSelect,
): ExecutionRequest {
  return {
    id: row.id,
    customerId: row.customerId,
    suggestionId: row.suggestionId ?? undefined,
    channelType: row.channelType as ExecutionRequest["channelType"],
    actionType: row.actionType,
    payloadJson: (row.payloadJson ?? {}) as ExecutionRequest["payloadJson"],
    approvalStatus: row.approvalStatus as ExecutionRequest["approvalStatus"],
    approvedBy: row.approvedBy ?? undefined,
    executedAt: asTimestamp(row.executedAt),
    failureReason: row.failureReason ?? undefined,
    externalRequestRef: row.externalRequestRef ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface CustomerStrategyWorkspace {
  strategyPack: StrategyPack | null;
  alertRules: AlertRule[];
  recentAlertEvents: AlertEvent[];
  recommendationRuns: RecommendationRun[];
  evaluations: RecommendationEvaluation[];
  executionRequests: ExecutionRequest[];
}

export async function getCustomerStrategyWorkspace(
  customerId: string,
): Promise<CustomerStrategyWorkspace> {
  if (!hasDatabaseUrl()) {
    return {
      strategyPack: null,
      alertRules: [],
      recentAlertEvents: [],
      recommendationRuns: [],
      evaluations: [],
      executionRequests: [],
    };
  }

  const db = getDb();
  const [strategyPackRow, alertRuleRows, alertEventRows, recommendationRunRows, evaluationRows, executionRows] =
    await Promise.all([
      db
        .select()
        .from(strategyPacksTable)
        .where(eq(strategyPacksTable.customerId, customerId))
        .limit(1),
      db
        .select()
        .from(alertRulesTable)
        .where(eq(alertRulesTable.customerId, customerId))
        .orderBy(alertRulesTable.channelType, alertRulesTable.name),
      db
        .select()
        .from(alertEventsTable)
        .where(eq(alertEventsTable.customerId, customerId))
        .orderBy(desc(alertEventsTable.createdAt))
        .limit(6),
      db
        .select()
        .from(recommendationRunsTable)
        .where(eq(recommendationRunsTable.customerId, customerId))
        .orderBy(desc(recommendationRunsTable.createdAt))
        .limit(5),
      db
        .select()
        .from(recommendationEvaluationsTable)
        .where(eq(recommendationEvaluationsTable.customerId, customerId))
        .orderBy(desc(recommendationEvaluationsTable.createdAt))
        .limit(5),
      db
        .select()
        .from(executionRequestsTable)
        .where(eq(executionRequestsTable.customerId, customerId))
        .orderBy(desc(executionRequestsTable.updatedAt))
        .limit(8),
    ]);

  return {
    strategyPack: strategyPackRow[0] ? toStrategyPack(strategyPackRow[0]) : null,
    alertRules: alertRuleRows.map(toAlertRule),
    recentAlertEvents: alertEventRows.map(toAlertEvent),
    recommendationRuns: recommendationRunRows.map(toRecommendationRun),
    evaluations: evaluationRows.map(toRecommendationEvaluation),
    executionRequests: executionRows.map(toExecutionRequest),
  };
}
