CREATE TABLE "yseo_channel_connections" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"channel_type" varchar(32) NOT NULL,
	"connection_status" varchar(24) NOT NULL,
	"auth_method" varchar(24) NOT NULL,
	"external_account_ref" text NOT NULL,
	"external_property_ref" text,
	"token_status" varchar(24) NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_error_code" text,
	"sync_status" varchar(16) NOT NULL,
	"sync_headline" text
);
--> statement-breakpoint
CREATE TABLE "yseo_customers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"segment" text NOT NULL,
	"primary_manager" text NOT NULL,
	"status_tag" varchar(32) NOT NULL,
	"onboarding_status" varchar(24) NOT NULL,
	"reporting_profile" varchar(24) NOT NULL,
	"memo_summary" text,
	"focus" text,
	"priority_rank" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_internal_memos" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"body" text NOT NULL,
	"memo_type" varchar(16) NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_issues" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"channel_type" varchar(32) NOT NULL,
	"issue_type" varchar(64) NOT NULL,
	"severity" varchar(16) NOT NULL,
	"detected_at" timestamp with time zone NOT NULL,
	"source_snapshot_ids" jsonb NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"recommended_action" text NOT NULL,
	"status" varchar(16) NOT NULL,
	"dedupe_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_performance_snapshots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"channel_type" varchar(32) NOT NULL,
	"entity_type" varchar(24) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"date_bucket" varchar(16) NOT NULL,
	"metric_set_json" jsonb NOT NULL,
	"completeness_state" varchar(16) NOT NULL,
	"captured_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_report_drafts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"summary" text NOT NULL,
	"highlights" jsonb NOT NULL,
	"next_actions" jsonb NOT NULL,
	"source_summary_json" jsonb NOT NULL,
	"finalized_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_suggestions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"issue_id" varchar(64) NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"channel_type" varchar(32) NOT NULL,
	"suggestion_type" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"payload_preview" jsonb NOT NULL,
	"rationale_text" text NOT NULL,
	"approval_status" varchar(16) NOT NULL,
	"risk_level" varchar(16) NOT NULL,
	"approved_by" text,
	"executed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "yseo_sync_runs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"channel_connection_id" varchar(64) NOT NULL,
	"sync_type" varchar(32) NOT NULL,
	"status" varchar(16) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"cursor" text,
	"error_summary" text,
	"requires_operator_review" boolean DEFAULT false NOT NULL
);
