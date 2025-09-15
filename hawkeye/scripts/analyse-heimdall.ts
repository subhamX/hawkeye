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
  EBSRecommendation,
  BucketSummary
} from '../drizzle-db/schema';
import { eq, update } from 'drizzle-orm';

// Analysis services
import { getAWSCredentials, type AWSCredentials } from '../src/lib/analysis/aws-credentials';
import { S3AnalysisService } from '../src/lib/analysis/s3-service';
import { EC2AnalysisService } from '../src/lib/analysis/ec2-service';
import { reportConsistencyService } from '../src/lib/analysis/report-consistency';
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

      // Get last completed report for consistency checking
      console.log('  📊 Retrieving last completed report for consistency...');
      const lastReport = await reportConsistencyService.getLastCompletedReport(job.accountId);

      // Get AWS credentials
      const credentials = await getAWSCredentials(job.account.roleArn, job.account.regions[0]);

      let s3ResultsId: string | null = null;
      let ec2ResultsId: string | null = null;
      let allS3Recommendations: S3Recommendation[] = [];
      let allEC2Recommendations: EC2Recommendation[] = [];
      let allEBSRecommendations: EBSRecommendation[] = [];

      // Run S3 analysis if enabled
      if (job.enabledServices.s3 && job.monitoredBuckets.length > 0) {
        console.log('  📦 Running S3 analysis...');
        const { resultId, recommendations } = await this.runS3Analysis(job, credentials);
        s3ResultsId = resultId;
        allS3Recommendations = recommendations;
      }

      // Run EC2 analysis if enabled
      if (job.enabledServices.ec2 || job.enabledServices.ebs) {
        console.log('  🖥️  Running EC2/EBS analysis...');
        const { resultId, ec2Recommendations, ebsRecommendations } = await this.runEC2Analysis(job, credentials);
        ec2ResultsId = resultId;
        allEC2Recommendations = ec2Recommendations;
        allEBSRecommendations = ebsRecommendations;
      }

      // Apply consistency logic to all recommendations
      console.log('  🔄 Applying consistency logic with last report...');
      const consistentRecommendations = reportConsistencyService.applyConsistencyLogic(
        allS3Recommendations,
        allEC2Recommendations,
        allEBSRecommendations,
        lastReport
      );

      // Update the stored results with consistent recommendations
      await this.updateResultsWithConsistentRecommendations(
        s3ResultsId,
        ec2ResultsId,
        consistentRecommendations
      );

      // Update job with results and mark as completed
      await this.completeJob(job.id, s3ResultsId, ec2ResultsId);

      console.log(`  ✅ Job ${job.id} completed successfully`);
      console.log(`  📊 Consistency report: Stability score ${consistentRecommendations.consistencyReport.stabilityScore.toFixed(2)}, ${consistentRecommendations.consistencyReport.recommendationsChanged} recommendations changed`);
    } catch (error) {
      console.error(`  ❌ Job ${job.id} failed:`, error);
      await this.failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Run S3 analysis for the account
   */
  private async runS3Analysis(job: AnalysisJob, credentials: AWSCredentials): Promise<{ resultId: string; recommendations: S3Recommendation[] }> {
    const s3Service = new S3AnalysisService(credentials);

    // Ensure S3 setup is complete
    await s3Service.ensureS3Setup(job.monitoredBuckets, job.account.accountId);

    const allRecommendations: S3Recommendation[] = [];
    const bucketSummaries: BucketSummary[] = [];
    let totalStorageBytes = 0;
    let totalObjectCount = 0;
    let combinedAgeAnalysis: any = null;
    let combinedParquetAnalysis: any = null;
    let combinedPartitioningAnalysis: any = null;

    // Analyze each monitored bucket
    for (const bucketConfig of job.monitoredBuckets) {
      console.log(`    🔍 Analyzing bucket: ${bucketConfig.bucketName} (region: ${bucketConfig.region})`);

      try {
        const artifactsBucket = `hawkeye-${job.account.accountId}-artifacts`;
        const bucketAnalysis = await s3Service.analyzeBucket(bucketConfig.bucketName, bucketConfig.region, artifactsBucket);

        // Extract actual metrics from bucket analysis
        const bucketObjectCount = bucketAnalysis.statistics.totalObjectsProvidedForAnalysis || 0;
        const bucketSizeBytes = bucketAnalysis.statistics.totalSizeBytes || 0; // Already in bytes
        
        totalObjectCount += bucketObjectCount;
        totalStorageBytes += bucketSizeBytes;

        // Create bucket summary
        const isEmpty = bucketObjectCount === 0;
        
        // Storage class breakdown is already in bytes
        const storageClassesInBytes = bucketAnalysis.statistics.storageClassBreakdown || {};

        bucketSummaries.push({
          bucketName: bucketConfig.bucketName,
          region: bucketConfig.region,
          objectCount: bucketObjectCount,
          totalSizeBytes: bucketSizeBytes,
          isEmpty,
          recommendDeletion: isEmpty,
          lastModified: bucketAnalysis.statistics.lastModified,
          storageClasses: storageClassesInBytes
        });

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
            objectCount: bucketObjectCount,
            currentStorageClass: 'STANDARD', // Default, would need more analysis
            recommendedStorageClass: this.extractRecommendedStorageClass(rec.description),
            potentialSavings,
            confidence: rec.impact === 'High' ? 0.9 : rec.impact === 'Medium' ? 0.7 : 0.5,
            category,
            aiGeneratedReport: `${rec.title}: ${rec.description}`
          });
        }

        // Add empty bucket recommendation
        if (isEmpty) {
          allRecommendations.push({
            bucketName: bucketConfig.bucketName,
            objectCount: 0,
            currentStorageClass: 'EMPTY',
            recommendedStorageClass: 'DELETE',
            potentialSavings: 0.50, // Small monthly cost for empty bucket
            confidence: 0.95,
            category: 'cost',
            aiGeneratedReport: `Empty Bucket Cleanup: This bucket contains no objects and can be safely deleted to eliminate storage costs and reduce management overhead. Consider removing it if it's no longer needed.`
          });
        }

        // Store individual analysis results (for the first bucket, or combine if multiple)
        if (!combinedAgeAnalysis) {
          combinedAgeAnalysis = {
            bucketName: 'Combined Analysis',
            oldObjectsCount: 0,
            oldObjectsTotalSize: 0,
            averageAge: 0,
            recommendedLifecyclePolicy: {
              transitionToIA: 30,
              transitionToGlacier: 90,
              estimatedMonthlySavings: 0
            },
            potentialSavings: 0,
            ageDistribution: {
              lessThan30Days: 0,
              between30And90Days: 0,
              between90And365Days: 0,
              moreThan365Days: 0
            }
          };
        }

        if (!combinedParquetAnalysis) {
          combinedParquetAnalysis = {
            bucketName: 'Combined Analysis',
            parquetFileCount: 0,
            averageFileSize: 0,
            recommendCompaction: false,
            estimatedCompactionSavings: 0,
            suggestedCompactionStrategy: 'No parquet files analyzed',
            directoriesWithSmallFiles: []
          };
        }

        if (!combinedPartitioningAnalysis) {
          combinedPartitioningAnalysis = {
            bucketName: 'Combined Analysis',
            totalFiles: bucketObjectCount,
            directoriesWithTooManyFiles: [],
            recommendPartitioning: false,
            suggestedPartitioningStrategy: 'No partitioning issues detected',
            potentialQueryPerformanceImprovement: 'No improvement needed'
          };
        }

      } catch (error) {
        console.error(`    ❌ Failed to analyze bucket ${bucketConfig.bucketName}:`, error);
        
        // Still create a summary for failed analysis
        bucketSummaries.push({
          bucketName: bucketConfig.bucketName,
          region: bucketConfig.region,
          objectCount: 0,
          totalSizeBytes: 0,
          isEmpty: true,
          recommendDeletion: false, // Don't recommend deletion if we couldn't analyze
          storageClasses: {}
        });
      }
    }

    const totalSavings = allRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);

    const [result] = await db
      .insert(s3AnalysisResults)
      .values({
        analysisRunId: job.id,
        totalStorageBytes: totalStorageBytes.toString(),
        totalObjectCount,
        potentialSavings: totalSavings.toString(),
        recommendations: allRecommendations,
        bucketSummaries,
        ageAnalysis: combinedAgeAnalysis,
        parquetAnalysis: combinedParquetAnalysis,
        partitioningAnalysis: combinedPartitioningAnalysis,
      })
      .returning();

    return { resultId: result.id, recommendations: allRecommendations };
  }

  /**
   * Extract recommended storage class from AI description
   */
  private extractRecommendedStorageClass(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('glacier')) return 'GLACIER';
    if (lowerDesc.includes('deep archive')) return 'DEEP_ARCHIVE';
    if (lowerDesc.includes('infrequent access') || lowerDesc.includes('ia')) return 'STANDARD_IA';
    if (lowerDesc.includes('one zone')) return 'ONEZONE_IA';
    return 'STANDARD';
  }

  /**
   * Run EC2/EBS analysis for the account
   */
  private async runEC2Analysis(job: AnalysisJob, credentials: AWSCredentials): Promise<{ resultId: string; ec2Recommendations: EC2Recommendation[]; ebsRecommendations: EBSRecommendation[] }> {
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

    return { 
      resultId: result.id, 
      ec2Recommendations: analysis.instanceRecommendations,
      ebsRecommendations: analysis.volumeRecommendations
    };
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
   * Update stored results with consistent recommendations
   */
  private async updateResultsWithConsistentRecommendations(
    s3ResultsId: string | null,
    ec2ResultsId: string | null,
    consistentRecommendations: any
  ): Promise<void> {
    // Update S3 results with consistent recommendations
    if (s3ResultsId) {
      const newS3Savings = consistentRecommendations.s3Recommendations.reduce(
        (sum: number, rec: S3Recommendation) => sum + rec.potentialSavings, 0
      );

      await db
        .update(s3AnalysisResults)
        .set({
          potentialSavings: newS3Savings.toString(),
          recommendations: consistentRecommendations.s3Recommendations,
        })
        .where(eq(s3AnalysisResults.id, s3ResultsId));
    }

    // Update EC2 results with consistent recommendations
    if (ec2ResultsId) {
      const newEC2Savings = [
        ...consistentRecommendations.ec2Recommendations,
        ...consistentRecommendations.ebsRecommendations
      ].reduce((sum: number, rec: any) => sum + rec.potentialSavings, 0);

      await db
        .update(ec2AnalysisResults)
        .set({
          potentialSavings: newEC2Savings.toString(),
          unusedEBSVolumes: consistentRecommendations.ebsRecommendations,
          utilizationRecommendations: consistentRecommendations.ec2Recommendations,
        })
        .where(eq(ec2AnalysisResults.id, ec2ResultsId));
    }
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
