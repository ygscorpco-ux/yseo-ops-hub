import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const customersTable = pgTable("yseo_customers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  segment: text("segment").notNull(),
  primaryManager: text("primary_manager").notNull(),
  statusTag: varchar("status_tag", { length: 32 }).notNull(),
  onboardingStatus: varchar("onboarding_status", { length: 24 }).notNull(),
  reportingProfile: varchar("reporting_profile", { length: 24 }).notNull(),
  memoSummary: text("memo_summary"),
  focus: text("focus"),
  priorityRank: integer("priority_rank").default(0).notNull(),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  lastActionAt: timestamp("last_action_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const channelConnectionsTable = pgTable("yseo_channel_connections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  channelType: varchar("channel_type", { length: 32 }).notNull(),
  connectionStatus: varchar("connection_status", { length: 24 }).notNull(),
  authMethod: varchar("auth_method", { length: 24 }).notNull(),
  externalAccountRef: text("external_account_ref").notNull(),
  externalPropertyRef: text("external_property_ref"),
  tokenStatus: varchar("token_status", { length: 24 }).notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastErrorCode: text("last_error_code"),
  syncStatus: varchar("sync_status", { length: 16 }).notNull(),
  syncHeadline: text("sync_headline"),
});

export const performanceSnapshotsTable = pgTable("yseo_performance_snapshots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  channelType: varchar("channel_type", { length: 32 }).notNull(),
  entityType: varchar("entity_type", { length: 24 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  dateBucket: varchar("date_bucket", { length: 16 }).notNull(),
  metricSetJson: jsonb("metric_set_json").notNull(),
  completenessState: varchar("completeness_state", { length: 16 }).notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
});

export const externalReferencesTable = pgTable("yseo_external_references", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelConnectionId: varchar("channel_connection_id", { length: 64 }).notNull(),
  externalType: varchar("external_type", { length: 24 }).notNull(),
  externalId: text("external_id").notNull(),
  externalName: text("external_name").notNull(),
  parentExternalId: text("parent_external_id"),
});

export const channelInsightsTable = pgTable("yseo_channel_insights", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  channelType: varchar("channel_type", { length: 32 }).notNull(),
  freshnessLabel: text("freshness_label").notNull(),
  headline: text("headline").notNull(),
  note: text("note").notNull(),
  metrics: jsonb("metrics")
    .$type<
      Array<{
        label: string;
        value: string;
        delta?: string;
        tone?: "up" | "down" | "flat";
      }>
    >()
    .notNull(),
});

export const issuesTable = pgTable("yseo_issues", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  channelType: varchar("channel_type", { length: 32 }).notNull(),
  issueType: varchar("issue_type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
  sourceSnapshotIds: jsonb("source_snapshot_ids").$type<string[]>().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  status: varchar("status", { length: 16 }).notNull(),
  dedupeKey: text("dedupe_key").notNull(),
});

export const suggestionsTable = pgTable("yseo_suggestions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  issueId: varchar("issue_id", { length: 64 }).notNull(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  channelType: varchar("channel_type", { length: 32 }).notNull(),
  suggestionType: varchar("suggestion_type", { length: 64 }).notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  payloadPreview: jsonb("payload_preview").$type<string[]>().notNull(),
  rationaleText: text("rationale_text").notNull(),
  approvalStatus: varchar("approval_status", { length: 16 }).notNull(),
  riskLevel: varchar("risk_level", { length: 16 }).notNull(),
  approvedBy: text("approved_by"),
  executedAt: timestamp("executed_at", { withTimezone: true }),
});

export const reportDraftsTable = pgTable("yseo_report_drafts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  title: text("title").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  summary: text("summary").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  nextActions: jsonb("next_actions").$type<string[]>().notNull(),
  sourceSummaryJson: jsonb("source_summary_json").notNull(),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const internalMemosTable = pgTable("yseo_internal_memos", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  body: text("body").notNull(),
  memoType: varchar("memo_type", { length: 16 }).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const taskExecutionsTable = pgTable("yseo_task_executions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  suggestionId: varchar("suggestion_id", { length: 64 }),
  actionType: varchar("action_type", { length: 64 }).notNull(),
  actorType: varchar("actor_type", { length: 16 }).notNull(),
  actorName: text("actor_name").notNull(),
  resultStatus: varchar("result_status", { length: 16 }).notNull(),
  externalRequestRef: text("external_request_ref"),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  summary: text("summary").notNull(),
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
});

export const syncRunsTable = pgTable("yseo_sync_runs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelConnectionId: varchar("channel_connection_id", { length: 64 }).notNull(),
  syncType: varchar("sync_type", { length: 32 }).notNull(),
  status: varchar("status", { length: 16 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  cursor: text("cursor"),
  errorSummary: text("error_summary"),
  requiresOperatorReview: boolean("requires_operator_review").default(false).notNull(),
});

export const channelCredentialsTable = pgTable("yseo_channel_credentials", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelConnectionId: varchar("channel_connection_id", { length: 64 }).notNull(),
  credentialType: varchar("credential_type", { length: 32 }).notNull(),
  encryptedPayload: text("encrypted_payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const oauthSessionsTable = pgTable("yseo_oauth_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  status: varchar("status", { length: 16 }).notNull(),
  encryptedPayload: text("encrypted_payload"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const strategyPacksTable = pgTable("yseo_strategy_packs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  masterCustomerId: text("master_customer_id"),
  status: varchar("status", { length: 16 }).notNull(),
  sourceType: varchar("source_type", { length: 24 }).notNull(),
  goalProfile: jsonb("goal_profile").notNull(),
  strategyProfile: jsonb("strategy_profile").notNull(),
  researchSummary: jsonb("research_summary").notNull(),
  packSummary: text("pack_summary").notNull(),
  keywordClusters: jsonb("keyword_clusters").$type<string[]>().notNull(),
  negativeKeywords: jsonb("negative_keywords").$type<string[]>().notNull(),
  copyAngles: jsonb("copy_angles").$type<string[]>().notNull(),
  landingRisks: jsonb("landing_risks").$type<string[]>().notNull(),
  searchConsoleWatchpoints: jsonb("search_console_watchpoints").$type<string[]>().notNull(),
  twoWeekPlan: jsonb("two_week_plan").$type<string[]>().notNull(),
  fourWeekPlan: jsonb("four_week_plan").$type<string[]>().notNull(),
  lastBootstrappedAt: timestamp("last_bootstrapped_at", { withTimezone: true }).notNull(),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alertRulesTable = pgTable("yseo_alert_rules", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  channelType: varchar("channel_type", { length: 32 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  name: text("name").notNull(),
  conditionKey: varchar("condition_key", { length: 64 }).notNull(),
  configJson: jsonb("config_json").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alertEventsTable = pgTable("yseo_alert_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  channelType: varchar("channel_type", { length: 32 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  sourceRef: text("source_ref"),
  payloadJson: jsonb("payload_json").notNull(),
  deliveryStatus: varchar("delivery_status", { length: 24 }).notNull(),
  deliveredTo: text("delivered_to"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  dedupeKey: text("dedupe_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recommendationRunsTable = pgTable("yseo_recommendation_runs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  source: varchar("source", { length: 24 }).notNull(),
  status: varchar("status", { length: 16 }).notNull(),
  summary: text("summary").notNull(),
  generatedCount: integer("generated_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const recommendationEvaluationsTable = pgTable("yseo_recommendation_evaluations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  suggestionId: varchar("suggestion_id", { length: 64 }).notNull(),
  evaluationWindowStart: text("evaluation_window_start").notNull(),
  evaluationWindowEnd: text("evaluation_window_end").notNull(),
  outcome: varchar("outcome", { length: 24 }).notNull(),
  metricsBeforeJson: jsonb("metrics_before_json").notNull(),
  metricsAfterJson: jsonb("metrics_after_json").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const executionRequestsTable = pgTable("yseo_execution_requests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  suggestionId: varchar("suggestion_id", { length: 64 }),
  channelType: varchar("channel_type", { length: 32 }).notNull(),
  actionType: varchar("action_type", { length: 64 }).notNull(),
  payloadJson: jsonb("payload_json").notNull(),
  approvalStatus: varchar("approval_status", { length: 16 }).notNull(),
  approvedBy: text("approved_by"),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  externalRequestRef: text("external_request_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
