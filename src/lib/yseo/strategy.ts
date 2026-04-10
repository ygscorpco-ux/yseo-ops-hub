import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  alertRulesTable,
  customersTable,
  strategyPacksTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import { makeStableId } from "@/lib/yseo/core";
import type {
  AlertRule,
  ResearchSummary,
  StrategyBootstrapInput,
  StrategyPack,
} from "@/lib/yseo/strategy-types";

function asTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeList(values: string[] | undefined, fallback: string[] = []) {
  return Array.from(new Set((values ?? fallback).map((value) => value.trim()).filter(Boolean)));
}

function normalizeResearchSummary(researchSummary: ResearchSummary): ResearchSummary {
  return {
    businessSummary: researchSummary.businessSummary.trim(),
    keywordClusters: normalizeList(researchSummary.keywordClusters),
    negativeKeywords: normalizeList(researchSummary.negativeKeywords),
    copyAngles: normalizeList(researchSummary.copyAngles),
    landingRisks: normalizeList(researchSummary.landingRisks),
    searchConsoleWatchpoints: normalizeList(researchSummary.searchConsoleWatchpoints),
    alertRules: (researchSummary.alertRules ?? []).map((rule) => ({
      severity: rule.severity,
      condition: rule.condition.trim(),
      recommendedAction: rule.recommendedAction.trim(),
    })),
    twoWeekPlan: normalizeList(researchSummary.twoWeekPlan),
    fourWeekPlan: normalizeList(researchSummary.fourWeekPlan),
    rawNotes: researchSummary.rawNotes?.trim(),
  };
}

function toStrategyPack(row: typeof strategyPacksTable.$inferSelect): StrategyPack {
  return {
    id: row.id,
    customerId: row.customerId,
    masterCustomerId: row.masterCustomerId ?? undefined,
    status: row.status as StrategyPack["status"],
    sourceType: row.sourceType as StrategyPack["sourceType"],
    goalProfile: row.goalProfile as StrategyPack["goalProfile"],
    strategyProfile: row.strategyProfile as StrategyPack["strategyProfile"],
    researchSummary: row.researchSummary as StrategyPack["researchSummary"],
    packSummary: row.packSummary,
    keywordClusters: row.keywordClusters ?? [],
    negativeKeywords: row.negativeKeywords ?? [],
    copyAngles: row.copyAngles ?? [],
    landingRisks: row.landingRisks ?? [],
    searchConsoleWatchpoints: row.searchConsoleWatchpoints ?? [],
    twoWeekPlan: row.twoWeekPlan ?? [],
    fourWeekPlan: row.fourWeekPlan ?? [],
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

function buildDefaultAlertRules(input: StrategyBootstrapInput) {
  const targetCtr = input.goalProfile.targetCtr ?? 1.5;
  const targetCpc = input.goalProfile.targetCpc ?? 2500;
  const targetCpa = input.goalProfile.targetCpa ?? Math.max(Math.round(input.goalProfile.monthlyBudget / 10), 10000);

  return [
    {
      id: makeStableId("alert-rule", input.customerId, "naver-sync-blocked"),
      customerId: input.customerId,
      channelType: "naver-searchad" as const,
      severity: "critical" as const,
      name: "NAVER sync blocked",
      conditionKey: "naver-sync-blocked",
      configJson: { retries: 1 },
      recommendedAction: "Review NAVER credential status, account access, and retry sync.",
    },
    {
      id: makeStableId("alert-rule", input.customerId, "naver-zero-conversion"),
      customerId: input.customerId,
      channelType: "naver-searchad" as const,
      severity: "critical" as const,
      name: "Spend without conversion",
      conditionKey: "naver-zero-conversion",
      configJson: {
        minSpend: Math.max(Math.round(input.goalProfile.monthlyBudget * 0.1), 30000),
        minClicks: 20,
      },
      recommendedAction: "Check keyword intent, landing friction, and conversion tracking before more spend accumulates.",
    },
    {
      id: makeStableId("alert-rule", input.customerId, "naver-cpc-spike"),
      customerId: input.customerId,
      channelType: "naver-searchad" as const,
      severity: "high" as const,
      name: "CPC spike",
      conditionKey: "naver-cpc-spike",
      configJson: {
        deltaPercent: 20,
        floorCpc: targetCpc,
      },
      recommendedAction: "Review bid inflation, auction competition, and poor-fit keyword coverage.",
    },
    {
      id: makeStableId("alert-rule", input.customerId, "naver-ctr-drop"),
      customerId: input.customerId,
      channelType: "naver-searchad" as const,
      severity: "medium" as const,
      name: "CTR drop",
      conditionKey: "naver-ctr-drop",
      configJson: {
        targetCtr,
        deltaPercent: -20,
      },
      recommendedAction: "Refresh copy angles and check whether the current offer still matches search intent.",
    },
    {
      id: makeStableId("alert-rule", input.customerId, "naver-cpa-breach"),
      customerId: input.customerId,
      channelType: "naver-searchad" as const,
      severity: "high" as const,
      name: "CPA above target",
      conditionKey: "naver-cpa-breach",
      configJson: {
        targetCpa,
        tolerancePercent: 20,
      },
      recommendedAction: "Review keyword segmentation and landing conversion friction before scaling spend.",
    },
    {
      id: makeStableId("alert-rule", input.customerId, "search-console-click-drop"),
      customerId: input.customerId,
      channelType: "search-console" as const,
      severity: "high" as const,
      name: "Search Console click drop",
      conditionKey: "search-console-click-drop",
      configJson: {
        deltaPercent: -30,
        minClicks: 20,
      },
      recommendedAction: "Check query mix, page-level drops, and whether the issue is organic or landing-related.",
    },
    {
      id: makeStableId("alert-rule", input.customerId, "search-console-incomplete"),
      customerId: input.customerId,
      channelType: "search-console" as const,
      severity: "low" as const,
      name: "Search Console incomplete data watch",
      conditionKey: "search-console-incomplete",
      configJson: {
        repeatDays: 2,
      },
      recommendedAction: "Keep the property under watch until Google completes the latest dataset refresh.",
    },
  ];
}

export async function getStrategyPack(customerId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(strategyPacksTable)
    .where(eq(strategyPacksTable.customerId, customerId))
    .limit(1);

  if (!row) {
    return null;
  }

  return toStrategyPack(row);
}

export async function getAlertRules(customerId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(alertRulesTable)
    .where(and(eq(alertRulesTable.customerId, customerId), eq(alertRulesTable.isActive, true)));

  return rows.map(toAlertRule);
}

export async function bootstrapStrategyPack(input: StrategyBootstrapInput) {
  const db = getDb();
  const now = new Date();
  const normalizedResearch = normalizeResearchSummary(input.researchSummary);
  const strategyPackId = makeStableId("strategy-pack", input.customerId);
  const nextReviewAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const sourceType = input.sourceType ?? "manual";
  const packSummary =
    normalizedResearch.businessSummary ||
    `${input.strategyProfile.primaryService} in ${input.strategyProfile.region} focused on ${input.goalProfile.conversionGoal}.`;

  const [customer] = await db
    .select({ id: customersTable.id, name: customersTable.name })
    .from(customersTable)
    .where(eq(customersTable.id, input.customerId))
    .limit(1);

  if (!customer) {
    throw new Error("Customer not found.");
  }

  await db
    .insert(strategyPacksTable)
    .values({
      id: strategyPackId,
      customerId: input.customerId,
      masterCustomerId: input.masterCustomerId ?? null,
      status: "active",
      sourceType,
      goalProfile: input.goalProfile,
      strategyProfile: input.strategyProfile,
      researchSummary: normalizedResearch,
      packSummary,
      keywordClusters: normalizedResearch.keywordClusters,
      negativeKeywords: normalizedResearch.negativeKeywords,
      copyAngles: normalizedResearch.copyAngles,
      landingRisks: normalizedResearch.landingRisks,
      searchConsoleWatchpoints: normalizedResearch.searchConsoleWatchpoints,
      twoWeekPlan: normalizedResearch.twoWeekPlan,
      fourWeekPlan: normalizedResearch.fourWeekPlan,
      lastBootstrappedAt: now,
      nextReviewAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: strategyPacksTable.id,
      set: {
        masterCustomerId: input.masterCustomerId ?? null,
        status: "active",
        sourceType,
        goalProfile: input.goalProfile,
        strategyProfile: input.strategyProfile,
        researchSummary: normalizedResearch,
        packSummary,
        keywordClusters: normalizedResearch.keywordClusters,
        negativeKeywords: normalizedResearch.negativeKeywords,
        copyAngles: normalizedResearch.copyAngles,
        landingRisks: normalizedResearch.landingRisks,
        searchConsoleWatchpoints: normalizedResearch.searchConsoleWatchpoints,
        twoWeekPlan: normalizedResearch.twoWeekPlan,
        fourWeekPlan: normalizedResearch.fourWeekPlan,
        lastBootstrappedAt: now,
        nextReviewAt,
        updatedAt: now,
      },
    });

  const rules = buildDefaultAlertRules({
    ...input,
    sourceType,
    researchSummary: normalizedResearch,
  });

  for (const rule of rules) {
    await db
      .insert(alertRulesTable)
      .values({
        id: rule.id,
        customerId: rule.customerId,
        channelType: rule.channelType,
        severity: rule.severity,
        name: rule.name,
        conditionKey: rule.conditionKey,
        configJson: rule.configJson,
        recommendedAction: rule.recommendedAction,
        isActive: true,
        lastTriggeredAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: alertRulesTable.id,
        set: {
          severity: rule.severity,
          name: rule.name,
          conditionKey: rule.conditionKey,
          configJson: rule.configJson,
          recommendedAction: rule.recommendedAction,
          isActive: true,
          updatedAt: now,
        },
      });
  }

  await db.insert(taskExecutionsTable).values({
    id: makeStableId("strategy-bootstrap", input.customerId, now.getTime()),
    customerId: input.customerId,
    suggestionId: null,
    actionType: "strategy-bootstrap",
    actorType: "operator",
    actorName: "YSEO Strategy",
    resultStatus: "done",
    externalRequestRef: sourceType,
    beforeJson: null,
    afterJson: {
      customerName: customer.name,
      keywordClusters: normalizedResearch.keywordClusters.length,
      alertRules: rules.length,
      nextReviewAt: nextReviewAt.toISOString(),
    },
    summary: `Strategy pack bootstrapped for ${customer.name}.`,
    executedAt: now,
  });

  await db
    .update(customersTable)
    .set({
      lastActionAt: now,
      updatedAt: now,
    })
    .where(eq(customersTable.id, input.customerId));

  return {
    strategyPack: await getStrategyPack(input.customerId),
    alertRules: await getAlertRules(input.customerId),
  };
}
