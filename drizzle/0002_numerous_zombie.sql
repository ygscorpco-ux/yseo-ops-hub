CREATE TABLE "yseo_alert_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"channel_type" varchar(32) NOT NULL,
	"severity" varchar(16) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"recommended_action" text NOT NULL,
	"source_ref" text,
	"payload_json" jsonb NOT NULL,
	"delivery_status" varchar(24) NOT NULL,
	"delivered_to" text,
	"delivered_at" timestamp with time zone,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_alert_rules" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"channel_type" varchar(32) NOT NULL,
	"severity" varchar(16) NOT NULL,
	"name" text NOT NULL,
	"condition_key" varchar(64) NOT NULL,
	"config_json" jsonb NOT NULL,
	"recommended_action" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_channel_credentials" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"channel_connection_id" varchar(64) NOT NULL,
	"credential_type" varchar(32) NOT NULL,
	"encrypted_payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_execution_requests" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"suggestion_id" varchar(64),
	"channel_type" varchar(32) NOT NULL,
	"action_type" varchar(64) NOT NULL,
	"payload_json" jsonb NOT NULL,
	"approval_status" varchar(16) NOT NULL,
	"approved_by" text,
	"executed_at" timestamp with time zone,
	"failure_reason" text,
	"external_request_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_oauth_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"provider" varchar(32) NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"status" varchar(16) NOT NULL,
	"encrypted_payload" text,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_recommendation_evaluations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"suggestion_id" varchar(64) NOT NULL,
	"evaluation_window_start" text NOT NULL,
	"evaluation_window_end" text NOT NULL,
	"outcome" varchar(24) NOT NULL,
	"metrics_before_json" jsonb NOT NULL,
	"metrics_after_json" jsonb NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_recommendation_runs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"source" varchar(24) NOT NULL,
	"status" varchar(16) NOT NULL,
	"summary" text NOT NULL,
	"generated_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "yseo_strategy_packs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"master_customer_id" text,
	"status" varchar(16) NOT NULL,
	"source_type" varchar(24) NOT NULL,
	"goal_profile" jsonb NOT NULL,
	"strategy_profile" jsonb NOT NULL,
	"research_summary" jsonb NOT NULL,
	"pack_summary" text NOT NULL,
	"keyword_clusters" jsonb NOT NULL,
	"negative_keywords" jsonb NOT NULL,
	"copy_angles" jsonb NOT NULL,
	"landing_risks" jsonb NOT NULL,
	"search_console_watchpoints" jsonb NOT NULL,
	"two_week_plan" jsonb NOT NULL,
	"four_week_plan" jsonb NOT NULL,
	"last_bootstrapped_at" timestamp with time zone NOT NULL,
	"next_review_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
