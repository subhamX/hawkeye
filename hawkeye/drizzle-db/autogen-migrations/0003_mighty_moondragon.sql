ALTER TABLE "s3_analysis_result" ADD COLUMN "totalStorageBytes" numeric(20, 0);--> statement-breakpoint
ALTER TABLE "s3_analysis_result" DROP COLUMN "totalStorageGB";