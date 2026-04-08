CREATE TABLE "yseo_channel_insights" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"channel_type" varchar(32) NOT NULL,
	"freshness_label" text NOT NULL,
	"headline" text NOT NULL,
	"note" text NOT NULL,
	"metrics" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yseo_external_references" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"channel_connection_id" varchar(64) NOT NULL,
	"external_type" varchar(24) NOT NULL,
	"external_id" text NOT NULL,
	"external_name" text NOT NULL,
	"parent_external_id" text
);
--> statement-breakpoint
CREATE TABLE "yseo_task_executions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"suggestion_id" varchar(64),
	"action_type" varchar(64) NOT NULL,
	"actor_type" varchar(16) NOT NULL,
	"actor_name" text NOT NULL,
	"result_status" varchar(16) NOT NULL,
	"external_request_ref" text,
	"before_json" jsonb,
	"after_json" jsonb,
	"summary" text NOT NULL,
	"executed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "yseo_customers" ADD COLUMN "next_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "yseo_customers" ADD COLUMN "last_action_at" timestamp with time zone;