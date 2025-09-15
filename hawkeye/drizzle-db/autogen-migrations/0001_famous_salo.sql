ALTER TABLE "s3_analysis_result" ADD COLUMN "ageAnalysis" jsonb;--> statement-breakpoint
ALTER TABLE "s3_analysis_result" ADD COLUMN "parquetAnalysis" jsonb;--> statement-breakpoint
ALTER TABLE "s3_analysis_result" ADD COLUMN "partitioningAnalysis" jsonb;