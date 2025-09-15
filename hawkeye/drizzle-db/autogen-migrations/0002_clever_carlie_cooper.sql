ALTER TABLE "s3_analysis_result" ADD COLUMN "totalObjectCount" integer;--> statement-breakpoint
ALTER TABLE "s3_analysis_result" ADD COLUMN "bucketSummaries" jsonb;