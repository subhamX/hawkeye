CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analysis_run" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"errorMessage" text,
	"s3ResultsId" text,
	"ec2ResultsId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aws_account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"roleArn" text NOT NULL,
	"region" text DEFAULT 'us-east-1' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ec2_analysis_result" (
	"id" text PRIMARY KEY NOT NULL,
	"analysisRunId" text NOT NULL,
	"totalInstances" integer,
	"potentialSavings" numeric(10, 2),
	"unusedEBSVolumes" jsonb,
	"utilizationRecommendations" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"maxAttempts" integer DEFAULT 3 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"scheduledFor" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "s3_analysis_result" (
	"id" text PRIMARY KEY NOT NULL,
	"analysisRunId" text NOT NULL,
	"totalStorageGB" numeric(15, 2),
	"potentialSavings" numeric(10, 2),
	"recommendations" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "s3_bucket_config" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"bucketName" text NOT NULL,
	"region" text NOT NULL,
	"analyticsEnabled" boolean DEFAULT false NOT NULL,
	"inventoryEnabled" boolean DEFAULT false NOT NULL,
	"lastAnalyzed" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysis_run" ADD CONSTRAINT "analysis_run_accountId_aws_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "aws_account"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aws_account" ADD CONSTRAINT "aws_account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ec2_analysis_result" ADD CONSTRAINT "ec2_analysis_result_analysisRunId_analysis_run_id_fk" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_run"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "s3_analysis_result" ADD CONSTRAINT "s3_analysis_result_analysisRunId_analysis_run_id_fk" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_run"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "s3_bucket_config" ADD CONSTRAINT "s3_bucket_config_accountId_aws_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "aws_account"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
