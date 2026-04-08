import {
  channelConnections,
  channelInsights,
  customers,
  internalMemos,
  issues,
  performanceSnapshots,
  reportDrafts,
  suggestions,
  taskExecutions,
} from "@/lib/yseo/data";
import {
  channelLabels,
  customerStatusOrder,
  severityOrder,
  type ChannelConnection,
  type ChannelInsight,
  type Customer,
  type Issue,
  type ReportDraft,
  type Suggestion,
} from "@/lib/yseo/types";
import { sortByMostRecent } from "@/lib/utils";

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
  snapshots: typeof performanceSnapshots;
  openIssues: Issue[];
  suggestionSet: Suggestion[];
  reportDrafts: ReportDraft[];
  logs: typeof taskExecutions;
  memos: typeof internalMemos;
}

function getCustomer(customerId: string) {
  return customers.find((customer) => customer.id === customerId);
}

function getConnections(customerId: string) {
  return channelConnections.filter((connection) => connection.customerId === customerId);
}

function getOpenIssues(customerId: string) {
  return issues.filter(
    (issue) => issue.customerId === customerId && issue.status === "open",
  );
}

function getSuggestions(customerId: string) {
  return suggestions.filter((suggestion) => suggestion.customerId === customerId);
}

function getLatestReport(customerId: string) {
  return reportDrafts
    .filter((report) => report.customerId === customerId)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )[0];
}

export function listCustomerEntries(): CustomerListEntry[] {
  return customers
    .map((customer) => {
      const connections = getConnections(customer.id);
      const openIssues = getOpenIssues(customer.id);
      const pendingSuggestions = getSuggestions(customer.id).filter(
        (suggestion) => suggestion.approvalStatus === "pending",
      );
      const latestReport = getLatestReport(customer.id);
      const snapshotSummary =
        performanceSnapshots.find(
          (snapshot) =>
            snapshot.customerId === customer.id &&
            snapshot.channelType === "naver-searchad" &&
            snapshot.dateBucket === "7d",
        )?.metricSetJson.summary ??
        openIssues[0]?.summary ??
        customer.memoSummary;
      const lastSyncAt = sortByMostRecent(
        connections.map((connection) => connection.lastSyncAt),
      )[0];

      return {
        customer,
        connections,
        openIssues,
        pendingSuggestions,
        latestReport,
        lastSyncAt,
        summaryLine: String(snapshotSummary),
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

export function listIssueQueueEntries(): IssueQueueEntry[] {
  return issues
    .filter((issue) => issue.status === "open")
    .map((issue) => ({
      issue,
      customer: getCustomer(issue.customerId)!,
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

export function listReportEntries(): ReportListEntry[] {
  return reportDrafts
    .map((report) => ({
      report,
      customer: getCustomer(report.customerId)!,
    }))
    .sort(
      (left, right) =>
        new Date(right.report.updatedAt).getTime() -
        new Date(left.report.updatedAt).getTime(),
    );
}

export function getDashboardView(): DashboardView {
  const entries = listCustomerEntries();
  const queueEntries = listIssueQueueEntries();
  const connectionWatchlist = channelConnections
    .filter((connection) => connection.connectionStatus !== "connected")
    .map((connection) => ({
      ...connection,
      customerName: getCustomer(connection.customerId)!.name,
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
      customerName: getCustomer(suggestion.customerId)!.name,
    }))
    .sort((left, right) => {
      const leftIssue = issues.find((issue) => issue.id === left.issueId)!;
      const rightIssue = issues.find((issue) => issue.id === right.issueId)!;
      return severityOrder[leftIssue.severity] - severityOrder[rightIssue.severity];
    });

  return {
    metrics: [
      {
        label: "처리 필요 고객",
        value: String(
          entries.filter((entry) => entry.customer.statusTag !== "정상").length,
        ),
        helper: "정상 고객은 뒤로 밀고 예외만 앞으로 가져옵니다.",
        tone: "critical",
      },
      {
        label: "긴급 이슈",
        value: String(
          queueEntries.filter((entry) => entry.issue.severity === "critical").length,
        ),
        helper: "오늘 먼저 풀어야 할 치명도 기준입니다.",
        tone: "warning",
      },
      {
        label: "연결 이상",
        value: String(connectionWatchlist.length),
        helper: "토큰 만료, 제한, 누락 sync를 함께 셉니다.",
        tone: "info",
      },
      {
        label: "승인 대기 제안",
        value: String(pendingSuggestionList.length),
        helper: "자동 실행 대신 승인 대기만 올립니다.",
        tone: "warning",
      },
      {
        label: "리포트 초안",
        value: String(reportDrafts.length),
        helper: "자동 요약은 초안까지만 만들고 발송은 수동입니다.",
        tone: "success",
      },
    ],
    focusCustomers: entries.filter((entry) => entry.customer.statusTag !== "정상").slice(0, 5),
    queueEntries: queueEntries.slice(0, 6),
    pendingSuggestions: pendingSuggestionList.slice(0, 5),
    connectionWatchlist: connectionWatchlist.slice(0, 5),
    reports: listReportEntries().slice(0, 4),
  };
}

export function getCustomerDetailView(customerId: string): CustomerDetailView | null {
  const customer = getCustomer(customerId);

  if (!customer) {
    return null;
  }

  return {
    customer,
    connections: getConnections(customerId).sort((left, right) =>
      channelLabels[left.channelType].localeCompare(channelLabels[right.channelType]),
    ),
    insights: channelInsights.filter((insight) => insight.customerId === customerId),
    snapshots: performanceSnapshots.filter((snapshot) => snapshot.customerId === customerId),
    openIssues: getOpenIssues(customerId).sort(
      (left, right) => severityOrder[left.severity] - severityOrder[right.severity],
    ),
    suggestionSet: getSuggestions(customerId).sort((left, right) =>
      left.approvalStatus.localeCompare(right.approvalStatus),
    ),
    reportDrafts: reportDrafts.filter((report) => report.customerId === customerId),
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
