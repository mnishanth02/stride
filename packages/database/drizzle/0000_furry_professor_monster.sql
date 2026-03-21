CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"badge_url" text,
	"year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"story" text,
	"image_url" text,
	"distance_text" text,
	"duration_text" text,
	"highlight_date" date,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"distance_label" text NOT NULL,
	"distance_km" numeric(10, 2),
	"time_seconds" integer NOT NULL,
	"time_display" text NOT NULL,
	"achieved_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"username" text,
	"primary_email" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"full_name" text,
	"avatar_url" text,
	"bio" text,
	"tagline" text,
	"athlete_types" text[],
	"story" text,
	"location" text,
	"total_km" numeric(10, 2),
	"longest_run_km" numeric(10, 2),
	"years_active_since" integer,
	"fav_run_time" text,
	"running_personality" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"onboarding_completed" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_user_id_idx" ON "achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "highlights_user_id_idx" ON "highlights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "personal_records_user_id_idx" ON "personal_records" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "users_public_discovery_idx" ON "users" USING btree ("is_public","is_deleted","email_verified","updated_at");--> statement-breakpoint
CREATE INDEX "users_fts_idx" ON "users" USING gin (to_tsvector('english', coalesce("username", '') || ' ' || coalesce("full_name", '') || ' ' || coalesce("tagline", '') || ' ' || coalesce("location", '')));