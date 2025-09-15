#!/usr/bin/env bun

/**
 * HawkEye Analysis Engine - Heimdall
 * 
 * This script processes pending analysis jobs from the database queue.
 * It looks for jobs with status 'pending' and processes them one by one.
 * 
 * Usage:
 *   bun run scripts/analyse-heimdall.ts
 */

import { db } from '../src/lib/db';
import {
  analysisRuns,
  awsAccounts,
  s3AnalysisResults,
  ec2AnalysisResults,
  serviceConfigurations,
  s3BucketConfigs
} from '../drizzle-db/schema';
import type {
  S3Recommendation,
  EC2Recommendation,
  EBSRecommendation
} from '../drizzle-db/schema';
import { eq } from 'drizzle-orm';

// Analysis services
import { getAWSCredentials, type AWSCredentials } from '../src/lib/analysis/aws-credentials';
import { S3AnalysisService } from '../src/lib/analysis/s3-service';
import { EC2AnalysisService } from '../src/lib/analysis/ec2-service';
import type { AnalysisJob } from '../src/lib/analysis/types';

class HeimdallAnalysisEngine {
  private isProcessing = false;

  /**
   * Main function to process all pending analysis jobs
   */
  async processAllPendingJobs(): Promise<void> {
    if (this.isProcessing) {
      console.log('⚠️  Analysis engine is already running');
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Starting Heimdall Analysis Engine...');

    try {
      const pendingJobs = await this.getPendingJobs();

      if (pendingJobs.length === 0) {
        console.log('✅ No pending analysis jobs found');
        return;
      }

      console.log(`📋 Found ${pendingJobs.length} pending analysis job(s)`);

      for (const job of pendingJobs) {
        await this.processJob(job);
      }

      console.log('🎉 All pending jobs processed successfully');
    } catch (error) {
      console.error('❌ Error processing jobs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get all pending analysis jobs from the database
   */
  private async getPendingJobs(): Promise<AnalysisJob[]> {
    const jobs = await db
      .select({
        id: analysisRuns.id,
        accountId: analysisRuns.accountId,
        status: analysisRuns.status,
        startedAt: analysisRuns.startedAt,
        account: {
          id: awsAccounts.id,
          accountId: awsAccounts.accountId,
          roleArn: awsAccounts.roleArn,
          regions: awsAccounts.regions,
          userId: awsAccounts.userId,
        }
      })
      .from(analysisRuns)
      .innerJoin(awsAccounts, eq(analysisRuns.accountId, awsAccounts.id))
      .where(eq(analysisRuns.status, 'pending'));

    // Get enabled services and monitored buckets for each job
    const jobsWithServices: AnalysisJob[] = [];
    for (const job of jobs) {
      const services = await db
        .select()
        .from(serviceConfigurations)
        .where(eq(serviceConfigurations.accountId, job.accountId));

      const buckets = await db
        .select()
        .from(s3BucketConfigs)
        .where(eq(s3BucketConfigs.accountId, job.accountId));

      const enabledServices = {
        s3: services.find(s => s.serviceType === 's3')?.isEnabled || false,
        ec2: services.find(s => s.serviceType === 'ec2')?.isEnabled || false,
        ebs: services.find(s => s.serviceType === 'ebs')?.isEnabled || false,
        cloudformation: services.find(s => s.serviceType === 'cloudformation')?.isEnabled || false,
      };

      const monitoredBuckets = buckets.map(bucket => ({
        id: bucket.id,
        bucketName: bucket.bucketName,
        region: bucket.region,
        analyticsEnabled: bucket.analyticsEnabled,
        inventoryEnabled: bucket.inventoryEnabled,
      }));

      jobsWithServices.push({
        ...job,
        enabledServices,
        monitoredBuckets
      });
    }

    return jobsWithServices;
  }

  /**
   * Process a single analysis job
   */
  private async processJob(job: AnalysisJob): Promise<void> {
    console.log(`\n🔍 Processing job ${job.id} for account ${job.account.accountId}`);

    try {
      // Update job status to running
      await this.updateJobStatus(job.id, 'running');

      // Get AWS credentials
      const credentials = await getAWSCredentials(job.account.roleArn, job.account.regions[0]);

      let s3ResultsId: string | null = null;
      let ec2ResultsId: string | null = null;

      // Run S3 analysis if enabled
      if (job.enabledServices.s3 && job.monitoredBuckets.length > 0) {
        console.log('  📦 Running S3 analysis...');
        s3ResultsId = await this.runS3Analysis(job, credentials);
      }

      // Run EC2 analysis if enabled
      if (job.enabledServices.ec2 || job.enabledServices.ebs) {
        console.log('  🖥️  Running EC2/EBS analysis...');
        ec2ResultsId = await this.runEC2Analysis(job, credentials);
      }

      // Update job with results and mark as completed
      await this.completeJob(job.id, s3ResultsId, ec2ResultsId);

      console.log(`  ✅ Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`  ❌ Job ${job.id} failed:`, error);
      await this.failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Run S3 analysis for the account
   */
  private async runS3Analysis(job: AnalysisJob, credentials: AWSCredentials): Promise<string> {
    const s3Service = new S3AnalysisService(credentials);

    // Ensure S3 setup is complete
    await s3Service.ensureS3Setup(job.monitoredBuckets, job.account.accountId);

    const allRecommendations: S3Recommendation[] = [];
    let totalStorageGB = 0;

    // Analyze each monitored bucket
    for (const bucketConfig of job.monitoredBuckets) {
      console.log(`    🔍 Analyzing bucket: ${bucketConfig.bucketName} (region: ${bucketConfig.region})`);

      try {
        const bucketAnalysis = await s3Service.analyzeBucket(bucketConfig.bucketName, bucketConfig.region);

        // Convert AI analysis to our recommendation format
        for (const rec of bucketAnalysis.recommendations) {
          const category = rec.category.toLowerCase() === 'cost' ? 'cost' :
            rec.category.toLowerCase() === 'security' ? 'security' : 'general';

          // Extract potential savings from description or use qualitative assessment
          let potentialSavings = 0;
          if (rec.estimatedSavingsImpact.includes('$')) {
            const match = rec.estimatedSavingsImpact.match(/\$(\d+(?:\.\d+)?)/);
            if (match) potentialSavings = parseFloat(match[1]);
          }

          allRecommendations.push({
            bucketName: bucketConfig.bucketName,
            objectCount: rec.objectCount || 0,
            currentStorageClass: 'STANDARD', // Default, would need more analysis
            recommendedStorageClass: s3Service.extractRecommendedStorageClass(rec.description),
            potentialSavings,
            confidence: rec.impact === 'High' ? 0.9 : rec.impact === 'Medium' ? 0.7 : 0.5,
            category,
            aiGeneratedReport: `${rec.title}: ${rec.description}`
          });
        }

        // Estimate storage size (would be more accurate with inventory data)
        totalStorageGB += bucketAnalysis.statistics.totalObjectsProvidedForAnalysis * 0.1; // Rough estimate

      } catch (error) {
        console.error(`    ❌ Failed to analyze bucket ${bucketConfig.bucketName}:`, error);
      }
    }

    const totalSavings = allRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);

    const [result] = await db
      .insert(s3AnalysisResults)
      .values({
        analysisRunId: job.id,
        potentialSavings: totalSavings.toString(),
        recommendations: allRecommendations,
      })
      .returning();

    return result.id;
  }

  /**
   * Run EC2/EBS analysis for the account
   */
  private async runEC2Analysis(job: AnalysisJob, credentials: AWSCredentials): Promise<string> {
    const ec2Service = new EC2AnalysisService(credentials);

    // Run the analysis
    const analysis = await ec2Service.analyzeInfrastructure();

    const totalSavings = [
      ...analysis.instanceRecommendations,
      ...analysis.volumeRecommendations
    ].reduce((sum, rec) => sum + rec.potentialSavings, 0);

    const [result] = await db
      .insert(ec2AnalysisResults)
      .values({
        analysisRunId: job.id,
        potentialSavings: totalSavings.toString(),
        unusedEBSVolumes: analysis.volumeRecommendations,
        utilizationRecommendations: analysis.instanceRecommendations,
      })
      .returning();

    return result.id;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: 'pending' | 'running' | 'completed' | 'failed'): Promise<void> {
    await db
      .update(analysisRuns)
      .set({
        status,
        ...(status === 'running' ? { startedAt: new Date() } : {})
      })
      .where(eq(analysisRuns.id, jobId));
  }

  /**
   * Mark job as completed with results
   */
  private async completeJob(jobId: string, s3ResultsId: string | null, ec2ResultsId: string | null): Promise<void> {
    await db
      .update(analysisRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        s3ResultsId,
        ec2ResultsId,
      })
      .where(eq(analysisRuns.id, jobId));
  }

  /**
   * Mark job as failed with error message
   */
  private async failJob(jobId: string, errorMessage: string): Promise<void> {
    await db
      .update(analysisRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage,
      })
      .where(eq(analysisRuns.id, jobId));
  }
}

// Main execution
async function main() {
  const engine = new HeimdallAnalysisEngine();
  await engine.processAllPendingJobs();
  process.exit(0);
}

// Run if this file is executed directly
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
