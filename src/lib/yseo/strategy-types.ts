import type { ChannelType, IssueSeverity } from "@/lib/yseo/types";

export interface GoalProfile {
  conversionGoal: string;
  monthlyBudget: number;
  weeklyPrimaryKpi: string;
  targetCpa?: number;
  targetCpc?: number;
  targetCtr?: number;
}

export interface StrategyProfile {
  industry: string;
  region: string;
  primaryService: string;
  competitors: string[];
  landingUrl?: string;
  brandTone?: string;
}

export interface ResearchSummary {
  businessSummary: string;
  keywordClusters: string[];
  negativeKeywords: string[];
  copyAngles: string[];
  landingRisks: string[];
  searchConsoleWatchpoints: string[];
  alertRules: Array<{
    severity: "critical" | "warning" | "watch";
    condition: string;
    recommendedAction: string;
  }>;
  twoWeekPlan: string[];
  fourWeekPlan: string[];
  rawNotes?: string;
}

export interface StrategyPack {
  id: string;
  customerId: string;
  masterCustomerId?: string;
  status: "draft" | "active" | "needs-review";
  sourceType: "manual" | "gpt-pro";
  goalProfile: GoalProfile;
  strategyProfile: StrategyProfile;
  researchSummary: ResearchSummary;
  packSummary: string;
  keywordClusters: string[];
  negativeKeywords: string[];
  copyAngles: string[];
  landingRisks: string[];
  searchConsoleWatchpoints: string[];
  twoWeekPlan: string[];
  fourWeekPlan: string[];
  lastBootstrappedAt: string;
  nextReviewAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  id: string;
  customerId: string;
  channelType: ChannelType;
  severity: IssueSeverity;
  name: string;
  conditionKey: string;
  configJson: Record<string, number | string | boolean | null>;
  recommendedAction: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  customerId: string;
  channelType: ChannelType;
  severity: IssueSeverity;
  eventType: string;
  title: string;
  summary: string;
  recommendedAction: string;
  sourceRef?: string;
  payloadJson: Record<string, unknown>;
  deliveryStatus:
    | "pending"
    | "skipped-not-configured"
    | "delivered"
    | "failed";
  deliveredTo?: string;
  deliveredAt?: string;
  dedupeKey: string;
  createdAt: string;
}

export interface RecommendationRun {
  id: string;
  customerId: string;
  source: "manual" | "scheduled" | "post-alert";
  status: "running" | "completed" | "failed";
  summary: string;
  generatedCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface RecommendationEvaluation {
  id: string;
  customerId: string;
  suggestionId: string;
  evaluationWindowStart: string;
  evaluationWindowEnd: string;
  outcome: "improved" | "degraded" | "steady" | "needs-more-time";
  metricsBeforeJson: Record<string, number | string>;
  metricsAfterJson: Record<string, number | string>;
  summary: string;
  createdAt: string;
}

export interface ExecutionRequest {
  id: string;
  customerId: string;
  suggestionId?: string;
  channelType: ChannelType;
  actionType: string;
  payloadJson: Record<string, unknown>;
  approvalStatus: "pending" | "approved" | "executed" | "failed";
  approvedBy?: string;
  executedAt?: string;
  failureReason?: string;
  externalRequestRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyBootstrapInput {
  customerId: string;
  masterCustomerId?: string;
  sourceType?: "manual" | "gpt-pro";
  goalProfile: GoalProfile;
  strategyProfile: StrategyProfile;
  researchSummary: ResearchSummary;
}
