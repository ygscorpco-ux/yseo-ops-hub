import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import {
  channelConnectionsTable,
  channelInsightsTable,
  customersTable,
  issuesTable,
  reportDraftsTable,
  suggestionsTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import { loadYseoData } from "@/lib/yseo/repository";
import type { CustomerStatusTag } from "@/lib/yseo/types";

function makeId(...parts: Array<string | number>) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function getCurrentPeriod(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDate = new Date(Date.UTC(year, month, 1));
  const lastDate = new Date(Date.UTC(year, month + 1, 0));
  const key = `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    key,
    titleLabel: `${year}년 ${month + 1}월`,
    periodStart: firstDate.toISOString().slice(0, 10),
    periodEnd: lastDate.toISOString().slice(0, 10),
  };
}

export interface MonthlyReportQueueEntry {
  customerId: string;
  customerName: string;
  statusTag: CustomerStatusTag;
  hasDraft: boolean;
  finalized: boolean;
  openIssueCount: number;
  pendingSuggestionCount: number;
  blockedConnectionCount: number;
  updatedAt?: string;
}

export interface MonthlyReportBatchStatus {
  targetPeriod: string;
  totalCustomers: number;
  readyDrafts: number;
  finalizedDrafts: number;
  missingDrafts: number;
  blockedCustomers: number;
  queue: MonthlyReportQueueEntry[];
}

function buildBatchSummary(queue: MonthlyReportQueueEntry[], targetPeriod: string) {
  return {
    targetPeriod,
    totalCustomers: queue.length,
    readyDrafts: queue.filter((item) => item.hasDraft).length,
    finalizedDrafts: queue.filter((item) => item.finalized).length,
    missingDrafts: queue.filter((item) => !item.hasDraft).length,
    blockedCustomers: queue.filter((item) => item.blockedConnectionCount > 0).length,
    queue: queue.sort((left, right) => {
      if (left.finalized !== right.finalized) {
        return left.finalized ? 1 : -1;
      }

      if (left.hasDraft !== right.hasDraft) {
        return left.hasDraft ? 1 : -1;
      }

      if (left.blockedConnectionCount !== right.blockedConnectionCount) {
        return right.blockedConnectionCount - left.blockedConnectionCount;
      }

      if (left.openIssueCount !== right.openIssueCount) {
        return right.openIssueCount - left.openIssueCount;
      }

      if (left.pendingSuggestionCount !== right.pendingSuggestionCount) {
        return right.pendingSuggestionCount - left.pendingSuggestionCount;
      }

      return left.customerName.localeCompare(right.customerName, "ko-KR");
    }),
  };
}

export async function getMonthlyReportBatchStatus(): Promise<MonthlyReportBatchStatus> {
  const period = getCurrentPeriod();
  const data = await loadYseoData();
  const draftMap = new Map(
    data.reportDrafts
      .filter(
        (draft) =>
          draft.periodStart === period.periodStart && draft.periodEnd === period.periodEnd,
      )
      .map((draft) => [draft.customerId, draft]),
  );

  const queue = data.customers.map((customer) => {
    const draft = draftMap.get(customer.id);
    const openIssueCount = data.issues.filter(
      (issue) => issue.customerId === customer.id && issue.status === "open",
    ).length;
    const pendingSuggestionCount = data.suggestions.filter(
      (suggestion) =>
        suggestion.customerId === customer.id && suggestion.approvalStatus === "pending",
    ).length;
    const blockedConnectionCount = data.channelConnections.filter(
      (connection) =>
        connection.customerId === customer.id && connection.connectionStatus === "blocked",
    ).length;

    return {
      customerId: customer.id,
      customerName: customer.name,
      statusTag: customer.statusTag,
      hasDraft: Boolean(draft),
      finalized: Boolean(draft?.finalizedAt),
      openIssueCount,
      pendingSuggestionCount,
      blockedConnectionCount,
      updatedAt: draft?.updatedAt,
    };
  });

  return buildBatchSummary(queue, period.titleLabel);
}

function formatInsightLine(metrics: Array<{ label: string; value: string; delta?: string }>) {
  return metrics
    .slice(0, 3)
    .map((metric) => `${metric.label} ${metric.value}${metric.delta ? ` (${metric.delta})` : ""}`)
    .join(", ");
}

export async function runMonthlyReportBatch() {
  if (!hasDatabaseUrl()) {
    return {
      ok: false,
      message: "DATABASE_URL or NEON_DATABASE_URL must be configured first.",
      generatedCount: 0,
      updatedCount: 0,
      targetPeriod: getCurrentPeriod().titleLabel,
    };
  }

  const db = getDb();
  const period = getCurrentPeriod();

  const [customers, connections, insights, issues, suggestions, existingDrafts] =
    await Promise.all([
      db.select().from(customersTable).orderBy(customersTable.priorityRank),
      db.select().from(channelConnectionsTable),
      db.select().from(channelInsightsTable),
      db.select().from(issuesTable).where(eq(issuesTable.status, "open")),
      db.select().from(suggestionsTable).where(eq(suggestionsTable.approvalStatus, "pending")),
      db.select().from(reportDraftsTable).orderBy(desc(reportDraftsTable.updatedAt)),
    ]);

  const existingByCustomer = new Map(
    existingDrafts
      .filter(
        (draft) =>
          draft.periodStart === period.periodStart && draft.periodEnd === period.periodEnd,
      )
      .map((draft) => [draft.customerId, draft]),
  );

  let generatedCount = 0;
  let updatedCount = 0;

  for (const customer of customers) {
    const customerIssues = issues.filter((issue) => issue.customerId === customer.id);
    const customerSuggestions = suggestions.filter(
      (suggestion) => suggestion.customerId === customer.id,
    );
    const customerInsights = insights.filter((insight) => insight.customerId === customer.id);
    const customerConnections = connections.filter(
      (connection) => connection.customerId === customer.id,
    );
    const existingDraft = existingByCustomer.get(customer.id);

    const topIssue = customerIssues[0];
    const topInsight = customerInsights[0];
    const blockedCount = customerConnections.filter(
      (connection) => connection.connectionStatus === "blocked",
    ).length;
    const pendingCount = customerSuggestions.length;

    const highlights = [
      topInsight
        ? `${topInsight.headline}: ${formatInsightLine(topInsight.metrics)}`
        : `${customer.name}의 이번 달 핵심 지표를 검토하세요.`,
      topIssue ? `주요 이슈: ${topIssue.title}` : "열린 이슈는 현재 없습니다.",
      blockedCount > 0
        ? `연결 점검 필요 채널 ${blockedCount}개`
        : "연결 상태는 현재 정상입니다.",
    ];

    const nextActions = [
      topIssue ? topIssue.recommendedAction : "이번 달 코멘트를 정리하고 핵심 액션을 확정하세요.",
      pendingCount > 0
        ? `승인 대기 제안 ${pendingCount}건을 검토하세요.`
        : "추가 승인 대기 제안은 없습니다.",
      "월말 발행 전 고객별 메모와 보류 사유를 한 줄로 정리하세요.",
    ];

    const summary = [
      `${period.titleLabel} 기준 ${customer.name}의 월간 운영 초안입니다.`,
      topInsight?.note ?? "최근 지표와 이슈를 합쳐 월말 보고용으로 정리했습니다.",
      topIssue ? `가장 큰 이슈는 '${topIssue.title}'입니다.` : "이번 달 기준 열린 이슈는 크지 않습니다.",
    ].join(" ");

    const draftId = existingDraft?.id ?? makeId("monthly-report", customer.id, period.key);

    await db
      .insert(reportDraftsTable)
      .values({
        id: draftId,
        customerId: customer.id,
        title: `${customer.name} ${period.titleLabel} 운영 리포트 초안`,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        summary,
        highlights,
        nextActions,
        sourceSummaryJson: {
          period: period.titleLabel,
          issueCount: customerIssues.length,
          pendingSuggestionCount: pendingCount,
          blockedConnectionCount: blockedCount,
          insightHeadline: topInsight?.headline ?? null,
        },
        finalizedAt: existingDraft?.finalizedAt ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: reportDraftsTable.id,
        set: {
          title: `${customer.name} ${period.titleLabel} 운영 리포트 초안`,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          summary,
          highlights,
          nextActions,
          sourceSummaryJson: {
            period: period.titleLabel,
            issueCount: customerIssues.length,
            pendingSuggestionCount: pendingCount,
            blockedConnectionCount: blockedCount,
            insightHeadline: topInsight?.headline ?? null,
          },
          updatedAt: new Date(),
        },
      });

    await db
      .insert(taskExecutionsTable)
      .values({
        id: makeId("report-batch", customer.id, period.key, Date.now()),
        customerId: customer.id,
        suggestionId: null,
        actionType: "report-batch",
        actorType: "system",
        actorName: "YSEO Report Batch",
        resultStatus: "done",
        externalRequestRef: period.key,
        beforeJson: null,
        afterJson: {
          draftId,
          period: period.titleLabel,
        },
        summary: `${period.titleLabel} 월말 리포트 초안을 갱신했습니다.`,
        executedAt: new Date(),
      })
      .onConflictDoNothing();

    if (existingDraft) {
      updatedCount += 1;
    } else {
      generatedCount += 1;
    }
  }

  return {
    ok: true,
    message: `${period.titleLabel} 리포트 초안 ${customers.length}건을 정리했습니다.`,
    generatedCount,
    updatedCount,
    targetPeriod: period.titleLabel,
  };
}
