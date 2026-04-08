export type ChannelType =
  | "naver-searchad"
  | "search-console"
  | "business-profile";

export type CustomerStatusTag = "긴급 조치" | "오늘 확인" | "관찰" | "정상";

export type ConnectionStatus = "connected" | "attention" | "blocked";

export type ConnectionAuthMethod = "api-key" | "oauth";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type IssueStatus = "open" | "snoozed" | "closed";

export type SuggestionStatus =
  | "pending"
  | "approved"
  | "executed"
  | "paused";

export type SyncStatus = "idle" | "running" | "succeeded" | "failed";

export type CompletenessState = "complete" | "partial" | "estimated";

export interface Customer {
  id: string;
  name: string;
  segment: string;
  primaryManager: string;
  statusTag: CustomerStatusTag;
  onboardingStatus: "active" | "setup" | "paused";
  reportingProfile: "주간" | "격주" | "월간";
  memoSummary: string;
  focus: string;
  priorityRank: number;
  nextReviewAt: string;
  lastActionAt: string;
  channels: ChannelType[];
}

export interface ChannelConnection {
  id: string;
  customerId: string;
  channelType: ChannelType;
  connectionStatus: ConnectionStatus;
  authMethod: ConnectionAuthMethod;
  externalAccountRef: string;
  externalPropertyRef?: string;
  tokenStatus: "valid" | "expiring" | "invalid" | "not-applicable";
  lastSyncAt: string;
  lastErrorCode?: string;
  syncStatus: SyncStatus;
  syncHeadline: string;
}

export interface ExternalReference {
  id: string;
  channelConnectionId: string;
  externalType: "customer" | "property" | "account" | "location";
  externalId: string;
  externalName: string;
  parentExternalId?: string;
}

export interface PerformanceSnapshot {
  id: string;
  customerId: string;
  channelType: ChannelType;
  entityType: "customer" | "campaign" | "adgroup" | "keyword" | "location";
  entityId: string;
  dateBucket: "7d" | "30d" | "monthly";
  metricSetJson: Record<string, number | string>;
  completenessState: CompletenessState;
  capturedAt: string;
}

export interface Issue {
  id: string;
  customerId: string;
  channelType: ChannelType;
  issueType: string;
  severity: IssueSeverity;
  detectedAt: string;
  sourceSnapshotIds: string[];
  title: string;
  summary: string;
  recommendedAction: string;
  status: IssueStatus;
  dedupeKey: string;
}

export interface Suggestion {
  id: string;
  issueId: string;
  customerId: string;
  channelType: ChannelType;
  suggestionType: string;
  title: string;
  summary: string;
  payloadPreview: string[];
  rationaleText: string;
  approvalStatus: SuggestionStatus;
  riskLevel: "safe" | "guarded" | "manual";
  approvedBy?: string;
  executedAt?: string;
}

export interface TaskExecution {
  id: string;
  customerId: string;
  suggestionId?: string;
  actionType: string;
  actorType: "operator" | "system";
  actorName: string;
  resultStatus: "done" | "queued" | "failed";
  externalRequestRef?: string;
  beforeJson?: Record<string, unknown>;
  afterJson?: Record<string, unknown>;
  summary: string;
  executedAt: string;
}

export interface ReportDraft {
  id: string;
  customerId: string;
  periodStart: string;
  periodEnd: string;
  title: string;
  summary: string;
  highlights: string[];
  nextActions: string[];
  sourceSummaryJson: Record<string, unknown>;
  finalizedAt?: string;
  updatedAt: string;
}

export interface InternalMemo {
  id: string;
  customerId: string;
  body: string;
  memoType: "context" | "handoff" | "risk";
  createdBy: string;
  createdAt: string;
}

export interface ChannelInsight {
  id: string;
  customerId: string;
  channelType: ChannelType;
  freshnessLabel: string;
  headline: string;
  note: string;
  metrics: Array<{
    label: string;
    value: string;
    delta?: string;
    tone?: "up" | "down" | "flat";
  }>;
}

export const channelLabels: Record<ChannelType, string> = {
  "naver-searchad": "네이버 검색광고",
  "search-console": "Search Console",
  "business-profile": "Business Profile",
};

export const customerStatusOrder: Record<CustomerStatusTag, number> = {
  "긴급 조치": 0,
  "오늘 확인": 1,
  관찰: 2,
  정상: 3,
};

export const severityOrder: Record<IssueSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
