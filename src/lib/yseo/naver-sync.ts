import "server-only";

import { desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  channelConnectionsTable,
  channelInsightsTable,
  customersTable,
  externalReferencesTable,
  issuesTable,
  performanceSnapshotsTable,
  reportDraftsTable,
  suggestionsTable,
  syncRunsTable,
  taskExecutionsTable,
} from "@/lib/db/schema";
import {
  NaverSearchAdAdapter,
  getNaverSearchAdCredentials,
  type NaverManagedCustomer,
  type NaverStatsSummary,
} from "@/lib/yseo/adapters";
import type { IssueSeverity, Suggestion } from "@/lib/yseo/types";

const NAVER_SYNC_TOKEN_ENV = "SYNC_API_TOKEN";
const MANAGED_NAVER_ISSUE_TYPES = [
  "conversion-drop",
  "click-drop",
  "sync-blocked",
  "no-conversion",
] as const;

function makeId(...parts: Array<string | number>) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function getRangeWindow(days: number) {
  const end = subtractDays(new Date(), 1);
  const start = subtractDays(end, days - 1);

  return {
    since: formatDate(start),
    until: formatDate(end),
  };
}

function getPreviousRangeWindow(days: number) {
  const current = getRangeWindow(days);
  const currentStart = new Date(`${current.since}T00:00:00.000Z`);
  const end = subtractDays(currentStart, 1);
  const start = subtractDays(end, days - 1);

  return {
    since: formatDate(start),
    until: formatDate(end),
  };
}

function percentDelta(current: number, previous: number) {
  if (previous <= 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function mergeStats(summaries: NaverStatsSummary[]) {
  const merged = summaries.reduce(
    (accumulator, current) => ({
      clicks: accumulator.clicks + current.clicks,
      impressions: accumulator.impressions + current.impressions,
      cost: accumulator.cost + current.cost,
      conversions: accumulator.conversions + current.conversions,
      averageRank:
        accumulator.averageRank === null && current.averageRank === null
          ? null
          : Number(
              (
                ((accumulator.averageRank ?? 0) * accumulator.rowCount +
                  (current.averageRank ?? 0) * current.rowCount) /
                Math.max(accumulator.rowCount + current.rowCount, 1)
              ).toFixed(2),
            ),
      rowCount: accumulator.rowCount + current.rowCount,
    }),
    {
      clicks: 0,
      impressions: 0,
      cost: 0,
      conversions: 0,
      averageRank: null as number | null,
      rowCount: 0,
    },
  );

  return {
    ...merged,
    ctr:
      merged.impressions > 0
        ? Number(((merged.clicks / merged.impressions) * 100).toFixed(2))
        : 0,
    cpc: merged.clicks > 0 ? Number((merged.cost / merged.clicks).toFixed(2)) : 0,
  };
}

async function upsertById<Row extends { id: string }>(
  table: { id: unknown },
  row: Row,
) {
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

function makeSuggestion(input: {
  customerId: string;
  issueId: string;
  channelType: Suggestion["channelType"];
  suggestionType: string;
  title: string;
  summary: string;
  payloadPreview: string[];
  rationaleText: string;
  riskLevel: Suggestion["riskLevel"];
}) {
  return {
    id: makeId("naver-suggestion", input.customerId, input.suggestionType),
    issueId: input.issueId,
    customerId: input.customerId,
    channelType: input.channelType,
    suggestionType: input.suggestionType,
    title: input.title,
    summary: input.summary,
    payloadPreview: input.payloadPreview,
    rationaleText: input.rationaleText,
    approvalStatus: "pending" as const,
    riskLevel: input.riskLevel,
    approvedBy: null,
    executedAt: null,
  };
}

function buildSignals(input: {
  customerId: string;
  customerName: string;
  current7d: NaverStatsSummary;
  previous7d: NaverStatsSummary;
  adgroupCount: number;
}) {
  const conversionDelta = percentDelta(
    input.current7d.conversions,
    input.previous7d.conversions,
  );
  const clickDelta = percentDelta(input.current7d.clicks, input.previous7d.clicks);
  const issues: Array<{
    id: string;
    issueType: (typeof MANAGED_NAVER_ISSUE_TYPES)[number];
    severity: IssueSeverity;
    title: string;
    summary: string;
    recommendedAction: string;
    suggestion: ReturnType<typeof makeSuggestion>;
  }> = [];

  if (
    input.previous7d.conversions >= 5 &&
    conversionDelta !== null &&
    conversionDelta <= -20
  ) {
    const issueId = makeId("naver-issue", input.customerId, "conversion-drop");

    issues.push({
      id: issueId,
      issueType: "conversion-drop",
      severity: "critical",
      title: "전환이 최근 7일 기준 크게 하락했습니다.",
      summary: `이전 7일 대비 전환이 ${Math.abs(conversionDelta)}% 감소했습니다.`,
      recommendedAction: "입찰 방어와 랜딩 영향 분리를 우선 검토하세요.",
      suggestion: makeSuggestion({
        customerId: input.customerId,
        issueId,
        channelType: "naver-searchad",
        suggestionType: "bid-guardrail",
        title: "전환 하락 구간 bid 방어안을 검토하세요.",
        summary: "전체 계정을 일괄 조정하지 말고 하락 구간만 분리 대응합니다.",
        payloadPreview: [
          `최근 7일 전환 ${input.current7d.conversions}`,
          `직전 7일 전환 ${input.previous7d.conversions}`,
          "고비용 adgroup 우선 검토",
        ],
        rationaleText:
          "전환 하락이 확인된 경우 전체 중단보다 구간별 방어안이 더 안전합니다.",
        riskLevel: "guarded",
      }),
    });
  }

  if (
    input.previous7d.clicks >= 100 &&
    clickDelta !== null &&
    clickDelta <= -25
  ) {
    const issueId = makeId("naver-issue", input.customerId, "click-drop");

    issues.push({
      id: issueId,
      issueType: "click-drop",
      severity: "high",
      title: "클릭 볼륨이 최근 7일 기준 크게 줄었습니다.",
      summary: `이전 7일 대비 클릭이 ${Math.abs(clickDelta)}% 감소했습니다.`,
      recommendedAction: "노출 하락 구간과 입찰 변화 구간을 먼저 분리하세요.",
      suggestion: makeSuggestion({
        customerId: input.customerId,
        issueId,
        channelType: "naver-searchad",
        suggestionType: "traffic-recovery",
        title: "클릭 하락 구간 복구 초안을 생성합니다.",
        summary: "노출 급감 구간과 CPC 상승 구간을 나눠 점검합니다.",
        payloadPreview: [
          `최근 7일 클릭 ${input.current7d.clicks}`,
          `직전 7일 클릭 ${input.previous7d.clicks}`,
          `운영 adgroup ${input.adgroupCount}개`,
        ],
        rationaleText:
          "클릭 하락은 예산, 입찰, 노출 급감 중 어디가 원인인지 빠르게 분리해야 합니다.",
        riskLevel: "guarded",
      }),
    });
  }

  if (input.current7d.cost > 0 && input.current7d.conversions === 0) {
    const issueId = makeId("naver-issue", input.customerId, "no-conversion");

    issues.push({
      id: issueId,
      issueType: "no-conversion",
      severity: "high",
      title: "최근 7일 비용은 발생했지만 전환이 없습니다.",
      summary: `최근 7일 비용 ${Math.round(input.current7d.cost).toLocaleString("ko-KR")}원, 전환 0건입니다.`,
      recommendedAction: "고비용 무전환 구간을 먼저 분리해 보류 후보를 만드세요.",
      suggestion: makeSuggestion({
        customerId: input.customerId,
        issueId,
        channelType: "naver-searchad",
        suggestionType: "pause-candidates",
        title: "고비용 무전환 구간 보류 후보를 생성합니다.",
        summary: "자동 실행 없이 검토용 후보만 만듭니다.",
        payloadPreview: [
          `최근 7일 비용 ${Math.round(input.current7d.cost).toLocaleString("ko-KR")}원`,
          "무전환 구간 후보 추출",
          "자동 실행 없음",
        ],
        rationaleText:
          "운영 허브에서는 바로 중단하지 않고 검토 가능한 후보를 먼저 제공하는 편이 안전합니다.",
        riskLevel: "manual",
      }),
    });
  }

  return issues;
}

async function closeInactiveIssues(customerId: string, activeIssueTypes: string[]) {
  const db = getDb();

  for (const issueType of MANAGED_NAVER_ISSUE_TYPES) {
    if (activeIssueTypes.includes(issueType)) {
      continue;
    }

    const issueId = makeId("naver-issue", customerId, issueType);

    await db
      .insert(issuesTable)
      .values({
        id: issueId,
        customerId,
        channelType: "naver-searchad",
        issueType,
        severity: "low",
        detectedAt: new Date(),
        sourceSnapshotIds: [],
        title: `${issueType} resolved`,
        summary: "Issue resolved or not currently active.",
        recommendedAction: "No action required.",
        status: "closed",
        dedupeKey: `naver:${customerId}:${issueType}`,
      })
      .onConflictDoUpdate({
        target: issuesTable.id,
        set: {
          status: "closed",
          detectedAt: new Date(),
          summary: "Issue resolved or not currently active.",
        },
      });
  }
}

async function upsertManagedCustomer(
  managedCustomer: NaverManagedCustomer,
  existingConnectionMap: Map<string, { id: string; customerId: string }>,
) {
  const existing = existingConnectionMap.get(managedCustomer.customerId);
  const customerId = existing?.customerId ?? makeId("naver", managedCustomer.customerId);
  const connectionId =
    existing?.id ?? makeId("naver-connection", managedCustomer.customerId);

  await upsertById(customersTable, {
    id: customerId,
    name: managedCustomer.customerName,
    segment: "자동 등록",
    primaryManager: "YSEO",
    statusTag: "관찰",
    onboardingStatus: "setup",
    reportingProfile: "주간",
    memoSummary: "네이버 검색광고 API에서 자동 등록된 고객입니다.",
    focus: "연결 후 기준선과 KPI를 확인하세요.",
    priorityRank: 99,
    nextReviewAt: new Date(),
    lastActionAt: new Date(),
    updatedAt: new Date(),
  });

  await upsertById(channelConnectionsTable, {
    id: connectionId,
    customerId,
    channelType: "naver-searchad",
    connectionStatus: "connected",
    authMethod: "api-key",
    externalAccountRef: managedCustomer.customerId,
    externalPropertyRef: managedCustomer.customerName,
    tokenStatus: "not-applicable",
    lastSyncAt: new Date(),
    lastErrorCode: null,
    syncStatus: "running",
    syncHeadline: "NAVER sync is running.",
  });

  await upsertById(externalReferencesTable, {
    id: makeId("naver-external", managedCustomer.customerId),
    channelConnectionId: connectionId,
    externalType: "customer",
    externalId: managedCustomer.customerId,
    externalName: managedCustomer.customerName,
    parentExternalId: managedCustomer.customerId,
  });

  return {
    customerId,
    connectionId,
  };
}

async function fetchAggregatedStats(
  adapter: NaverSearchAdAdapter,
  customerId: string,
  adgroupIds: string[],
  range: { since: string; until: string },
) {
  const summaries: NaverStatsSummary[] = [];

  for (const ids of chunkArray(adgroupIds, 50)) {
    const summary = await adapter.getStatsSummary({
      customerId,
      ids,
      since: range.since,
      until: range.until,
    });
    summaries.push(summary);
  }

  return mergeStats(summaries);
}

function makeInsightMetrics(current7d: NaverStatsSummary, previous7d: NaverStatsSummary) {
  const clickDelta = percentDelta(current7d.clicks, previous7d.clicks);
  const conversionDelta = percentDelta(current7d.conversions, previous7d.conversions);
  const costDelta = percentDelta(current7d.cost, previous7d.cost);

  return [
    {
      label: "7d Clicks",
      value: current7d.clicks.toLocaleString("en-US"),
      delta: clickDelta === null ? undefined : `${clickDelta}%`,
      tone:
        clickDelta === null ? "flat" : clickDelta > 0 ? "up" : clickDelta < 0 ? "down" : "flat",
    },
    {
      label: "7d Conversions",
      value: current7d.conversions.toLocaleString("en-US"),
      delta:
        conversionDelta === null ? undefined : `${conversionDelta}%`,
      tone:
        conversionDelta === null
          ? "flat"
          : conversionDelta > 0
            ? "up"
            : conversionDelta < 0
              ? "down"
              : "flat",
    },
    {
      label: "7d Cost",
      value: Math.round(current7d.cost).toLocaleString("ko-KR"),
      delta: costDelta === null ? undefined : `${costDelta}%`,
      tone:
        costDelta === null ? "flat" : costDelta > 0 ? "down" : costDelta < 0 ? "up" : "flat",
    },
  ] as const;
}

async function upsertPerformanceArtifacts(input: {
  customerId: string;
  customerName: string;
  connectionId: string;
  accountRef: string;
  adgroupCount: number;
  current7d: NaverStatsSummary;
  previous7d: NaverStatsSummary;
  current30d: NaverStatsSummary;
}) {
  const now = new Date();
  const endDate = formatDate(subtractDays(now, 1));

  await upsertById(performanceSnapshotsTable, {
    id: makeId("naver-snapshot", input.customerId, "7d", endDate),
    customerId: input.customerId,
    channelType: "naver-searchad",
    entityType: "customer",
    entityId: input.accountRef,
    dateBucket: "7d",
    metricSetJson: {
      clicks: input.current7d.clicks,
      impressions: input.current7d.impressions,
      conversions: input.current7d.conversions,
      spend: Math.round(input.current7d.cost),
      ctr: input.current7d.ctr,
      cpc: input.current7d.cpc,
      avgPosition: input.current7d.averageRank ?? "n/a",
      adgroupCount: input.adgroupCount,
      summary: `NAVER 7d sync on ${endDate}`,
    },
    completenessState: "complete",
    capturedAt: now,
  });

  await upsertById(performanceSnapshotsTable, {
    id: makeId("naver-snapshot", input.customerId, "30d", endDate),
    customerId: input.customerId,
    channelType: "naver-searchad",
    entityType: "customer",
    entityId: input.accountRef,
    dateBucket: "30d",
    metricSetJson: {
      clicks: input.current30d.clicks,
      impressions: input.current30d.impressions,
      conversions: input.current30d.conversions,
      spend: Math.round(input.current30d.cost),
      ctr: input.current30d.ctr,
      cpc: input.current30d.cpc,
      avgPosition: input.current30d.averageRank ?? "n/a",
      adgroupCount: input.adgroupCount,
      summary: `NAVER 30d sync on ${endDate}`,
    },
    completenessState: "complete",
    capturedAt: now,
  });

  await upsertById(channelInsightsTable, {
    id: makeId("naver-insight", input.customerId),
    customerId: input.customerId,
    channelType: "naver-searchad",
    freshnessLabel: `${endDate} sync`,
    headline: `${input.customerName} NAVER SearchAd latest 7d summary`,
    note: `Synced ${input.adgroupCount} adgroups from NAVER SearchAd.`,
    metrics: makeInsightMetrics(input.current7d, input.previous7d),
  });

  await upsertById(reportDraftsTable, {
    id: makeId("naver-report", input.customerId, endDate),
    customerId: input.customerId,
    title: `${input.customerName} NAVER weekly draft`,
    periodStart: getRangeWindow(7).since,
    periodEnd: getRangeWindow(7).until,
    summary: `최근 7일 클릭 ${input.current7d.clicks.toLocaleString("ko-KR")}건, 전환 ${input.current7d.conversions.toLocaleString("ko-KR")}건입니다.`,
    highlights: [
      `최근 7일 클릭 ${input.current7d.clicks.toLocaleString("ko-KR")}건`,
      `최근 7일 전환 ${input.current7d.conversions.toLocaleString("ko-KR")}건`,
      `운영 adgroup ${input.adgroupCount.toLocaleString("ko-KR")}개`,
    ],
    nextActions: [
      "전환 하락 또는 클릭 하락 구간을 우선 검토",
      "고비용 구간의 방어안 여부 확인",
    ],
    sourceSummaryJson: {
      channel: "naver-searchad",
      current7d: input.current7d,
      previous7d: input.previous7d,
      current30d: input.current30d,
    },
    finalizedAt: null,
    updatedAt: now,
  });
}

async function upsertOpenIssue(input: {
  id: string;
  customerId: string;
  issueType: string;
  severity: IssueSeverity;
  title: string;
  summary: string;
  recommendedAction: string;
}) {
  await upsertById(issuesTable, {
    id: input.id,
    customerId: input.customerId,
    channelType: "naver-searchad",
    issueType: input.issueType,
    severity: input.severity,
    detectedAt: new Date(),
    sourceSnapshotIds: [],
    title: input.title,
    summary: input.summary,
    recommendedAction: input.recommendedAction,
    status: "open",
    dedupeKey: `naver:${input.customerId}:${input.issueType}`,
  });
}

async function upsertSuggestion(
  suggestion: ReturnType<typeof makeSuggestion>,
) {
  await upsertById(suggestionsTable, suggestion);
}

async function recordTaskLog(input: {
  customerId: string;
  resultStatus: "done" | "queued" | "failed";
  summary: string;
  externalRequestRef?: string | null;
}) {
  await upsertById(taskExecutionsTable, {
    id: makeId("naver-task", input.customerId, Date.now()),
    customerId: input.customerId,
    suggestionId: null,
    actionType: "naver-sync",
    actorType: "system",
    actorName: "YSEO Sync",
    resultStatus: input.resultStatus,
    externalRequestRef: input.externalRequestRef ?? null,
    beforeJson: null,
    afterJson: null,
    summary: input.summary,
    executedAt: new Date(),
  });
}

async function markConnectionState(input: {
  connectionId: string;
  connectionStatus: "connected" | "attention" | "blocked";
  syncStatus: "succeeded" | "failed" | "running";
  syncHeadline: string;
  lastErrorCode?: string | null;
}) {
  const db = getDb();

  await db
    .update(channelConnectionsTable)
    .set({
      connectionStatus: input.connectionStatus,
      syncStatus: input.syncStatus,
      syncHeadline: input.syncHeadline,
      lastSyncAt: new Date(),
      lastErrorCode: input.lastErrorCode ?? null,
    })
    .where(eq(channelConnectionsTable.id, input.connectionId));
}

function getSyncAdminToken() {
  return process.env[NAVER_SYNC_TOKEN_ENV] ?? process.env.AUTH_SECRET ?? null;
}

export function isAuthorizedSyncRequest(request: Request) {
  const expected = getSyncAdminToken();

  if (!expected) {
    return {
      ok: false as const,
      status: 503,
      message: "SYNC_API_TOKEN or AUTH_SECRET must be configured first.",
    };
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${expected}`) {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized sync request.",
    };
  }

  return {
    ok: true as const,
  };
}

export async function runNaverSearchAdSync() {
  const credentials = getNaverSearchAdCredentials();

  if (!credentials) {
    return {
      ok: false,
      message: "NAVER SearchAd credentials are missing.",
      accountsProcessed: 0,
      issuesOpened: 0,
    };
  }

  const adapter = new NaverSearchAdAdapter();
  const discovery = await adapter.validateConnection();

  if (!discovery.ok) {
    return {
      ok: false,
      message: discovery.message,
      accountsProcessed: 0,
      issuesOpened: 0,
    };
  }

  const db = getDb();
  const existingConnections = await db
    .select({
      id: channelConnectionsTable.id,
      customerId: channelConnectionsTable.customerId,
      externalAccountRef: channelConnectionsTable.externalAccountRef,
    })
    .from(channelConnectionsTable)
    .where(eq(channelConnectionsTable.channelType, "naver-searchad"));

  const existingConnectionMap = new Map(
    existingConnections.map((connection) => [
      connection.externalAccountRef,
      { id: connection.id, customerId: connection.customerId },
    ]),
  );

  const managedCustomers = await adapter.listManagedCustomers();
  const current7dRange = getRangeWindow(7);
  const previous7dRange = getPreviousRangeWindow(7);
  const current30dRange = getRangeWindow(30);

  let accountsProcessed = 0;
  let issuesOpened = 0;

  for (const managedCustomer of managedCustomers) {
    const { customerId, connectionId } = await upsertManagedCustomer(
      managedCustomer,
      existingConnectionMap,
    );
    const syncRunId = makeId("naver-sync-run", managedCustomer.customerId, Date.now());

    await upsertById(syncRunsTable, {
      id: syncRunId,
      channelConnectionId: connectionId,
      syncType: "naver-searchad-manual",
      status: "running",
      startedAt: new Date(),
      finishedAt: null,
      cursor: managedCustomer.customerId,
      errorSummary: null,
      requiresOperatorReview: false,
    });

    try {
      const adgroups = await adapter.listAdgroups(managedCustomer.customerId);
      const adgroupIds = adgroups
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const row = item as Record<string, unknown>;
          const id = row.nccAdgroupId ?? row.id;
          return id ? String(id) : null;
        })
        .filter((id): id is string => Boolean(id));

      const current7d = await fetchAggregatedStats(
        adapter,
        managedCustomer.customerId,
        adgroupIds,
        current7dRange,
      );
      const previous7d = await fetchAggregatedStats(
        adapter,
        managedCustomer.customerId,
        adgroupIds,
        previous7dRange,
      );
      const current30d = await fetchAggregatedStats(
        adapter,
        managedCustomer.customerId,
        adgroupIds,
        current30dRange,
      );

      await upsertPerformanceArtifacts({
        customerId,
        customerName: managedCustomer.customerName,
        connectionId,
        accountRef: managedCustomer.customerId,
        adgroupCount: adgroupIds.length,
        current7d,
        previous7d,
        current30d,
      });

      const signalSet = buildSignals({
        customerId,
        customerName: managedCustomer.customerName,
        current7d,
        previous7d,
        adgroupCount: adgroupIds.length,
      });

      for (const signal of signalSet) {
        await upsertOpenIssue({
          id: signal.id,
          customerId,
          issueType: signal.issueType,
          severity: signal.severity,
          title: signal.title,
          summary: signal.summary,
          recommendedAction: signal.recommendedAction,
        });
        await upsertSuggestion(signal.suggestion);
      }

      await closeInactiveIssues(
        customerId,
        signalSet.map((signal) => signal.issueType),
      );

      await markConnectionState({
        connectionId,
        connectionStatus: signalSet.length > 0 ? "attention" : "connected",
        syncStatus: "succeeded",
        syncHeadline: `Synced ${adgroupIds.length} adgroups from NAVER SearchAd.`,
      });

      await db
        .update(syncRunsTable)
        .set({
          status: "succeeded",
          finishedAt: new Date(),
          errorSummary: null,
          requiresOperatorReview: false,
        })
        .where(eq(syncRunsTable.id, syncRunId));

      await recordTaskLog({
        customerId,
        resultStatus: "done",
        summary: `NAVER sync completed for ${managedCustomer.customerName}.`,
        externalRequestRef: managedCustomer.customerId,
      });

      accountsProcessed += 1;
      issuesOpened += signalSet.length;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown NAVER sync error.";

      await upsertOpenIssue({
        id: makeId("naver-issue", customerId, "sync-blocked"),
        customerId,
        issueType: "sync-blocked",
        severity: "critical",
        title: "NAVER sync failed and operator review is required.",
        summary: message,
        recommendedAction: "Validate credentials, rate limits, and managed account access.",
      });

      await upsertSuggestion(
        makeSuggestion({
          customerId,
          issueId: makeId("naver-issue", customerId, "sync-blocked"),
          channelType: "naver-searchad",
          suggestionType: "sync-recovery",
          title: "Review sync failure and retry manually.",
          summary: "The sync failed and needs operator review before retry.",
          payloadPreview: [message],
          rationaleText:
            "When the NAVER sync fails, YSEO should stop and request manual review instead of retrying blindly.",
          riskLevel: "manual",
        }),
      );

      await markConnectionState({
        connectionId,
        connectionStatus: "blocked",
        syncStatus: "failed",
        syncHeadline: message,
        lastErrorCode: "NAVER_SYNC_FAILED",
      });

      await db
        .update(syncRunsTable)
        .set({
          status: "failed",
          finishedAt: new Date(),
          errorSummary: message,
          requiresOperatorReview: true,
        })
        .where(eq(syncRunsTable.id, syncRunId));

      await recordTaskLog({
        customerId,
        resultStatus: "failed",
        summary: `NAVER sync failed for ${managedCustomer.customerName}.`,
        externalRequestRef: managedCustomer.customerId,
      });
    }
  }

  return {
    ok: true,
    message: `Processed ${accountsProcessed} NAVER SearchAd accounts.`,
    accountsProcessed,
    issuesOpened,
    discoveredAccounts: managedCustomers.length,
  };
}

export async function getNaverSyncStatus() {
  const adapter = new NaverSearchAdAdapter();
  const validation = await adapter.validateConnection();
  const credentialsConfigured = Boolean(getNaverSearchAdCredentials());
  const db = getDb();
  const connections = await db
    .select({
      id: channelConnectionsTable.id,
      customerId: channelConnectionsTable.customerId,
      externalAccountRef: channelConnectionsTable.externalAccountRef,
      connectionStatus: channelConnectionsTable.connectionStatus,
      syncStatus: channelConnectionsTable.syncStatus,
      syncHeadline: channelConnectionsTable.syncHeadline,
      lastSyncAt: channelConnectionsTable.lastSyncAt,
    })
    .from(channelConnectionsTable)
    .where(eq(channelConnectionsTable.channelType, "naver-searchad"));

  const recentRuns =
    connections.length === 0
      ? []
      : await db
          .select({
            id: syncRunsTable.id,
            channelConnectionId: syncRunsTable.channelConnectionId,
            syncType: syncRunsTable.syncType,
            status: syncRunsTable.status,
            startedAt: syncRunsTable.startedAt,
            finishedAt: syncRunsTable.finishedAt,
            errorSummary: syncRunsTable.errorSummary,
            requiresOperatorReview: syncRunsTable.requiresOperatorReview,
          })
          .from(syncRunsTable)
          .where(
            inArray(
              syncRunsTable.channelConnectionId,
              connections.map((connection) => connection.id),
            ),
          )
          .orderBy(desc(syncRunsTable.startedAt))
          .limit(5);

  return {
    channel: "naver-searchad",
    credentialsConfigured,
    validation,
    connectionSummary: {
      total: connections.length,
      blocked: connections.filter(
        (connection) => connection.connectionStatus === "blocked",
      ).length,
      attention: connections.filter(
        (connection) => connection.connectionStatus === "attention",
      ).length,
      connected: connections.filter(
        (connection) => connection.connectionStatus === "connected",
      ).length,
    },
    recentConnections: connections.slice(0, 10),
    recentRuns,
    expectedAuthHeader: `Authorization: Bearer <${NAVER_SYNC_TOKEN_ENV}|AUTH_SECRET>`,
  };
}
