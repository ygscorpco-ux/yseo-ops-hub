import { sortByMostRecent } from "@/lib/utils";
import { loadYseoData } from "@/lib/yseo/repository";
import {
  channelLabels,
  customerStatusOrder,
  severityOrder,
  type ChannelConnection,
  type ChannelInsight,
  type Customer,
  type InternalMemo,
  type Issue,
  type PerformanceSnapshot,
  type ReportDraft,
  type Suggestion,
  type TaskExecution,
} from "@/lib/yseo/types";

export interface CustomerListEntry {
  customer: Customer;
  connections: ChannelConnection[];
  openIssues: Issue[];
  pendingSuggestions: Suggestion[];
  latestReport?: ReportDraft;
  lastSyncAt: string;
  summaryLine: string;
}

export interface IssueQueueEntry {
  issue: Issue;
  customer: Customer;
  suggestionSet: Suggestion[];
}

export interface ReportListEntry {
  report: ReportDraft;
  customer: Customer;
}

export interface DashboardView {
  metrics: Array<{
    label: string;
    value: string;
    helper: string;
    tone: "critical" | "warning" | "info" | "success";
  }>;
  focusCustomers: CustomerListEntry[];
  queueEntries: IssueQueueEntry[];
  pendingSuggestions: Array<Suggestion & { customerName: string }>;
  connectionWatchlist: Array<ChannelConnection & { customerName: string }>;
  reports: ReportListEntry[];
}

export interface CustomerDetailView {
  customer: Customer;
  connections: ChannelConnection[];
  insights: ChannelInsight[];
  snapshots: PerformanceSnapshot[];
  openIssues: Issue[];
  suggestionSet: Suggestion[];
  reportDrafts: ReportDraft[];
  logs: TaskExecution[];
  memos: InternalMemo[];
}

function getCustomerMap(customers: Customer[]) {
  return new Map(customers.map((customer) => [customer.id, customer]));
}

export async function listCustomerEntries(): Promise<CustomerListEntry[]> {
  const {
    customers,
    channelConnections,
    issues,
    performanceSnapshots,
    reportDrafts,
    suggestions,
  } = await loadYseoData();

  return customers
    .map((customer) => {
      const connections = channelConnections.filter(
        (connection) => connection.customerId === customer.id,
      );
      const openIssues = issues.filter(
        (issue) => issue.customerId === customer.id && issue.status === "open",
      );
      const pendingSuggestions = suggestions.filter(
        (suggestion) =>
          suggestion.customerId === customer.id &&
          suggestion.approvalStatus === "pending",
      );
      const latestReport = reportDrafts
        .filter((report) => report.customerId === customer.id)
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )[0];
      const snapshotSummary =
        performanceSnapshots.find(
          (snapshot) =>
            snapshot.customerId === customer.id &&
            snapshot.channelType === "naver-searchad" &&
            snapshot.dateBucket === "7d",
        )?.metricSetJson.summary ??
        openIssues[0]?.summary ??
        customer.memoSummary;
      const lastSyncCandidates = connections
        .map((connection) => connection.lastSyncAt)
        .filter(Boolean);
      const lastSyncAt =
        sortByMostRecent(lastSyncCandidates)[0] ?? customer.lastActionAt;

      return {
        customer,
        connections,
        openIssues,
        pendingSuggestions,
        latestReport,
        lastSyncAt,
        summaryLine: String(snapshotSummary ?? customer.memoSummary),
      };
    })
    .sort((left, right) => {
      const statusGap =
        customerStatusOrder[left.customer.statusTag] -
        customerStatusOrder[right.customer.statusTag];

      if (statusGap !== 0) {
        return statusGap;
      }

      const severityGap =
        severityOrder[left.openIssues[0]?.severity ?? "low"] -
        severityOrder[right.openIssues[0]?.severity ?? "low"];

      if (severityGap !== 0) {
        return severityGap;
      }

      return left.customer.priorityRank - right.customer.priorityRank;
    });
}

export async function listIssueQueueEntries(): Promise<IssueQueueEntry[]> {
  const { customers, issues, suggestions } = await loadYseoData();
  const customerMap = getCustomerMap(customers);

  return issues
    .filter((issue) => issue.status === "open")
    .map((issue) => ({
      issue,
      customer: customerMap.get(issue.customerId)!,
      suggestionSet: suggestions.filter((suggestion) => suggestion.issueId === issue.id),
    }))
    .sort((left, right) => {
      const severityGap =
        severityOrder[left.issue.severity] - severityOrder[right.issue.severity];

      if (severityGap !== 0) {
        return severityGap;
      }

      return (
        new Date(right.issue.detectedAt).getTime() -
        new Date(left.issue.detectedAt).getTime()
      );
    });
}

export async function listReportEntries(): Promise<ReportListEntry[]> {
  const { customers, reportDrafts } = await loadYseoData();
  const customerMap = getCustomerMap(customers);

  return reportDrafts
    .map((report) => ({
      report,
      customer: customerMap.get(report.customerId)!,
    }))
    .sort(
      (left, right) =>
        new Date(right.report.updatedAt).getTime() -
        new Date(left.report.updatedAt).getTime(),
    );
}

export async function getDashboardView(): Promise<DashboardView> {
  const [{ channelConnections, issues, reportDrafts, suggestions, customers }, entries, queueEntries] =
    await Promise.all([loadYseoData(), listCustomerEntries(), listIssueQueueEntries()]);

  const customerMap = getCustomerMap(customers);

  const connectionWatchlist = channelConnections
    .filter((connection) => connection.connectionStatus !== "connected")
    .map((connection) => ({
      ...connection,
      customerName: customerMap.get(connection.customerId)?.name ?? connection.customerId,
    }))
    .sort((left, right) =>
      left.connectionStatus === right.connectionStatus
        ? new Date(right.lastSyncAt).getTime() - new Date(left.lastSyncAt).getTime()
        : left.connectionStatus === "blocked"
          ? -1
          : 1,
    );

  const pendingSuggestionList = suggestions
    .filter((suggestion) => suggestion.approvalStatus === "pending")
    .map((suggestion) => ({
      ...suggestion,
      customerName: customerMap.get(suggestion.customerId)?.name ?? suggestion.customerId,
    }))
    .sort((left, right) => {
      const leftIssue = issues.find((issue) => issue.id === left.issueId);
      const rightIssue = issues.find((issue) => issue.id === right.issueId);

      return (
        severityOrder[leftIssue?.severity ?? "low"] -
        severityOrder[rightIssue?.severity ?? "low"]
      );
    });

  return {
    metrics: [
      {
        label: "처리 필요 고객",
        value: String(
          entries.filter((entry) => entry.customer.statusTag !== "정상").length,
        ),
        helper: "정상 고객보다 예외 고객이 먼저 보이도록 정렬합니다.",
        tone: "critical",
      },
      {
        label: "긴급 이슈",
        value: String(
          queueEntries.filter((entry) => entry.issue.severity === "critical").length,
        ),
        helper: "오늘 바로 확인할 치명 이슈 기준입니다.",
        tone: "warning",
      },
      {
        label: "연결 이상",
        value: String(connectionWatchlist.length),
        helper: "토큰 만료, 권한 문제, 실패 sync를 모아 봅니다.",
        tone: "info",
      },
      {
        label: "승인 대기 제안",
        value: String(pendingSuggestionList.length),
        helper: "자동 실행 없이 승인 대기 상태만 앞으로 올립니다.",
        tone: "warning",
      },
      {
        label: "리포트 초안",
        value: String(reportDrafts.length),
        helper: "초안까지만 자동화하고 발송은 검수 후 진행합니다.",
        tone: "success",
      },
    ],
    focusCustomers: entries.filter((entry) => entry.customer.statusTag !== "정상").slice(0, 5),
    queueEntries: queueEntries.slice(0, 6),
    pendingSuggestions: pendingSuggestionList.slice(0, 5),
    connectionWatchlist: connectionWatchlist.slice(0, 5),
    reports: (await listReportEntries()).slice(0, 4),
  };
}

export async function getCustomerDetailView(
  customerId: string,
): Promise<CustomerDetailView | null> {
  const {
    channelConnections,
    channelInsights,
    customers,
    internalMemos,
    issues,
    performanceSnapshots,
    reportDrafts,
    suggestions,
    taskExecutions,
  } = await loadYseoData();

  const customer = customers.find((item) => item.id === customerId);

  if (!customer) {
    return null;
  }

  return {
    customer,
    connections: channelConnections
      .filter((connection) => connection.customerId === customerId)
      .sort((left, right) =>
        channelLabels[left.channelType].localeCompare(channelLabels[right.channelType]),
      ),
    insights: channelInsights.filter((insight) => insight.customerId === customerId),
    snapshots: performanceSnapshots.filter((snapshot) => snapshot.customerId === customerId),
    openIssues: issues
      .filter((issue) => issue.customerId === customerId && issue.status === "open")
      .sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity]),
    suggestionSet: suggestions
      .filter((suggestion) => suggestion.customerId === customerId)
      .sort((left, right) => left.approvalStatus.localeCompare(right.approvalStatus)),
    reportDrafts: reportDrafts
      .filter((report) => report.customerId === customerId)
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    logs: taskExecutions
      .filter((log) => log.customerId === customerId)
      .sort(
        (left, right) =>
          new Date(right.executedAt).getTime() - new Date(left.executedAt).getTime(),
      ),
    memos: internalMemos
      .filter((memo) => memo.customerId === customerId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
  };
}
