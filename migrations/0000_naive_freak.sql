CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"session_token" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"last_activity" timestamp DEFAULT now(),
	CONSTRAINT "client_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"birth_date" date,
	"gender" text NOT NULL,
	"height" numeric(5, 2),
	"occupation" text,
	"medical_conditions" text,
	"allergies" text,
	"medications" text,
	"notes" text,
	"client_visible_notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" date DEFAULT now() NOT NULL,
	"end_date" date,
	"access_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "diet_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"calorie_goal" integer NOT NULL,
	"protein_percentage" integer NOT NULL,
	"carbs_percentage" integer NOT NULL,
	"fat_percentage" integer NOT NULL,
	"meals" integer NOT NULL,
	"include_dessert" boolean DEFAULT false,
	"include_snacks" boolean DEFAULT true,
	"status" text DEFAULT 'draft',
	"duration_days" integer DEFAULT 7,
	"tags" text,
	"diet_type" text,
	"content" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "food_nutrients" (
	"id" serial PRIMARY KEY NOT NULL,
	"fdc_id" text,
	"nutrient_id" integer,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"unit" text NOT NULL,
	"percent_daily_value" integer
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"fdc_id" text PRIMARY KEY NOT NULL,
	"data_type" text,
	"description" text NOT NULL,
	"brand_name" text,
	"ingredients" text,
	"serving_size" integer,
	"serving_size_unit" text,
	"food_category" text,
	"published_date" timestamp,
	"food_attributes" jsonb,
	"food_nutrients" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"height" numeric(5, 2) NOT NULL,
	"bmi" numeric(5, 2) NOT NULL,
	"body_fat_percentage" numeric(5, 2),
	"waist_circumference" numeric(5, 2),
	"hip_circumference" numeric(5, 2),
	"chest_circumference" numeric(5, 2),
	"arm_circumference" numeric(5, 2),
	"thigh_circumference" numeric(5, 2),
	"calf_circumference" numeric(5, 2),
	"basal_metabolic_rate" integer,
	"total_daily_energy_expenditure" integer,
	"activity_level" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"from_client" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"client_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" text NOT NULL,
	"related_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"scheduled_for" timestamp
);
--> statement-breakpoint
CREATE TABLE "saved_foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"fdc_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"full_name" text,
	"role" text DEFAULT 'user',
	"subscription_status" text DEFAULT 'free' NOT NULL,
	"subscription_plan" text,
	"subscription_start_date" timestamp with time zone,
	"subscription_end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_sessions" ADD CONSTRAINT "client_sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_fdc_id_foods_fdc_id_fk" FOREIGN KEY ("fdc_id") REFERENCES "public"."foods"("fdc_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_foods" ADD CONSTRAINT "saved_foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_foods" ADD CONSTRAINT "saved_foods_fdc_id_foods_fdc_id_fk" FOREIGN KEY ("fdc_id") REFERENCES "public"."foods"("fdc_id") ON DELETE no action ON UPDATE no action;