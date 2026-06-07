CREATE TABLE "daily_stats" (
	"date" date NOT NULL,
	"path" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"unique_views" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_stats_date_path_pk" PRIMARY KEY("date","path")
);
--> statement-breakpoint
CREATE TABLE "device_stats" (
	"date" date NOT NULL,
	"device_type" text NOT NULL,
	"browser" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "device_stats_date_device_type_browser_pk" PRIMARY KEY("date","device_type","browser")
);
--> statement-breakpoint
CREATE TABLE "geo_stats" (
	"date" date NOT NULL,
	"country" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "geo_stats_date_country_pk" PRIMARY KEY("date","country")
);
--> statement-breakpoint
CREATE TABLE "github_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"ttl" interval NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"user_agent" text,
	"country" text,
	"device_type" text,
	"browser" text,
	"os" text,
	"session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrer_stats" (
	"date" date NOT NULL,
	"referrer" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "referrer_stats_date_referrer_pk" PRIMARY KEY("date","referrer")
);
--> statement-breakpoint
CREATE INDEX "idx_pv_path" ON "page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_pv_created_at" ON "page_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_pv_session" ON "page_views" USING btree ("session_id");