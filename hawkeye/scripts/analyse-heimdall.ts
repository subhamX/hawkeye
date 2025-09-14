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

// AWS SDK imports
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { S3Client, ListBucketsCommand, GetBucketLocationCommand, PutBucketAnalyticsConfigurationCommand, PutBucketInventoryConfigurationCommand, GetBucketAnalyticsConfigurationCommand, GetBucketInventoryConfigurationCommand, ListObjectsV2Command, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand, GetBucketAclCommand, GetBucketLifecycleConfigurationCommand, CreateBucketCommand, GetBucketTaggingCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

// AI SDK for generating reports
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

interface AnalysisJob {
  id: string;
  accountId: string;
  status: string;
  startedAt: Date;
  account: {
    id: string;
    accountId: string;
    roleArn: string;
    regions: string[];
    userId: string;
  };
  enabledServices: {
    s3: boolean;
    ec2: boolean;
    ebs: boolean;
    cloudformation: boolean;
  };
  monitoredBuckets: {
    id: string;
    bucketName: string;
    region: string;
    analyticsEnabled: boolean;
    inventoryEnabled: boolean;
  }[];
}

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

// Analysis schemas for AI generation
const S3BucketAnalysisSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string' },
    analysisDate: { type: 'string' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['Storage', 'Security', 'Cost', 'Performance', 'Other'] },
          impact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          title: { type: 'string' },
          description: { type: 'string' },
          currentCostImpact: { type: 'string' },
          estimatedSavingsImpact: { type: 'string' },
          objectCount: { type: 'number' },
          totalSize: { type: 'string' }
        },
        required: ['category', 'impact', 'title', 'description', 'currentCostImpact', 'estimatedSavingsImpact']
      }
    },
    summary: {
      type: 'object',
      properties: {
        overallAssessment: { type: 'string' },
        findingsByPriority: {
          type: 'object',
          properties: {
            High: { type: 'number' },
            Medium: { type: 'number' },
            Low: { type: 'number' }
          }
        },
        findingsByCategory: {
          type: 'object',
          properties: {
            Storage: { type: 'number' },
            Security: { type: 'number' },
            Cost: { type: 'number' },
            Performance: { type: 'number' },
            Other: { type: 'number' }
          }
        },
        securityVulnerabilitiesCount: { type: 'number' },
        costOptimizationOpportunitiesCount: { type: 'number' }
      }
    },
    statistics: {
      type: 'object',
      properties: {
        totalObjectsProvidedForAnalysis: { type: 'number' }
      }
    }
  },
  required: ['bucketName', 'analysisDate', 'recommendations', 'summary', 'statistics']
};

const EC2InstanceAnalysisSchema = {
  type: 'object',
  properties: {
    executiveSummary: { type: 'string' },
    overallStatistics: {
      type: 'object',
      properties: {
        totalInstances: { type: 'number' },
        totalVolumes: { type: 'number' },
        findingsByPriority: {
          type: 'object',
          properties: {
            High: { type: 'number' },
            Medium: { type: 'number' },
            Low: { type: 'number' }
          }
        },
        findingsByCategory: {
          type: 'object',
          properties: {
            Security: { type: 'number' },
            Cost: { type: 'number' },
            Performance: { type: 'number' }
          }
        }
      }
    },
    strategicRecommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          impact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          category: { type: 'string', enum: ['Security', 'Cost', 'Performance'] }
        }
      }
    },
    instanceRecommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          instanceId: { type: 'string' },
          instanceType: { type: 'string' },
          recommendationType: { type: 'string' },
          category: { type: 'string', enum: ['cost', 'security', 'general'] },
          potentialSavings: { type: 'number' },
          aiGeneratedReport: { type: 'string' }
        }
      }
    },
    volumeRecommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          volumeId: { type: 'string' },
          size: { type: 'number' },
          volumeType: { type: 'string' },
          category: { type: 'string', enum: ['cost', 'security', 'general'] },
          potentialSavings: { type: 'number' },
          aiGeneratedReport: { type: 'string' }
        }
      }
    }
  },
  required: ['executiveSummary', 'overallStatistics', 'strategicRecommendations', 'instanceRecommendations', 'volumeRecommendations']
};

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
   * Assume AWS role and get credentials
   */
  private async getAWSCredentials(roleArn: string, region: string): Promise<AWSCredentials> {
    const stsClient = new STSClient({ region });
    
    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: `hawkeye-analysis-${Date.now()}`,
      DurationSeconds: 3600, // 1 hour
    });

    const response = await stsClient.send(command);
    
    if (!response.Credentials) {
      throw new Error('Failed to assume AWS role');
    }

    return {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken!,
      region,
    };
  }

  /**
   * Ensure S3 setup is complete for analysis
   */
  private async ensureS3Setup(job: AnalysisJob, credentials: AWSCredentials): Promise<void> {
    console.log('    🔧 Ensuring S3 setup is complete...');
    
    const s3Client = new S3Client({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    // Create artifacts bucket if it doesn't exist
    const artifactsBucketName = `hawkeye-${job.account.accountId}-artifacts`;
    
    try {
      await s3Client.send(new ListObjectsV2Command({ 
        Bucket: artifactsBucketName, 
        MaxKeys: 1 
      }));
    } catch (error: any) {
      if (error.name === 'NoSuchBucket') {
        console.log(`    📦 Creating artifacts bucket: ${artifactsBucketName}`);
        await s3Client.send(new CreateBucketCommand({
          Bucket: artifactsBucketName,
          CreateBucketConfiguration: credentials.region !== 'us-east-1' ? {
            LocationConstraint: credentials.region as any
          } : undefined
        }));
      }
    }

    // Setup analytics and inventory for each monitored bucket
    for (const bucket of job.monitoredBuckets) {
      await this.setupBucketAnalytics(s3Client, bucket.bucketName, artifactsBucketName);
      await this.setupBucketInventory(s3Client, bucket.bucketName, artifactsBucketName);
    }
  }

  /**
   * Setup Storage Class Analytics for a bucket
   */
  private async setupBucketAnalytics(s3Client: S3Client, bucketName: string, artifactsBucket: string): Promise<void> {
    const configId = 'hawkeye-sca-v1';
    
    try {
      await s3Client.send(new GetBucketAnalyticsConfigurationCommand({
        Bucket: bucketName,
        Id: configId
      }));
      console.log(`    ✅ Analytics already configured for ${bucketName}`);
    } catch (error: any) {
      if (error.name === 'NoSuchConfiguration') {
        console.log(`    📊 Setting up analytics for ${bucketName}`);
        await s3Client.send(new PutBucketAnalyticsConfigurationCommand({
          Bucket: bucketName,
          Id: configId,
          AnalyticsConfiguration: {
            Id: configId,
            StorageClassAnalysis: {
              DataExport: {
                OutputSchemaVersion: 'V_1',
                Destination: {
                  S3BucketDestination: {
                    Bucket: `arn:aws:s3:::${artifactsBucket}`,
                    Prefix: `analytics/${bucketName}/`,
                    Format: 'CSV'
                  }
                }
              }
            }
          }
        }));
      }
    }
  }

  /**
   * Setup S3 Inventory for a bucket
   */
  private async setupBucketInventory(s3Client: S3Client, bucketName: string, artifactsBucket: string): Promise<void> {
    const configId = 'hawkeye-inventory-v1';
    
    try {
      await s3Client.send(new GetBucketInventoryConfigurationCommand({
        Bucket: bucketName,
        Id: configId
      }));
      console.log(`    ✅ Inventory already configured for ${bucketName}`);
    } catch (error: any) {
      if (error.name === 'NoSuchConfiguration') {
        console.log(`    📋 Setting up inventory for ${bucketName}`);
        await s3Client.send(new PutBucketInventoryConfigurationCommand({
          Bucket: bucketName,
          Id: configId,
          InventoryConfiguration: {
            Id: configId,
            IsEnabled: true,
            Destination: {
              S3BucketDestination: {
                Bucket: `arn:aws:s3:::${artifactsBucket}`,
                Prefix: `inventory/${bucketName}/`,
                Format: 'CSV'
              }
            },
            Schedule: {
              Frequency: 'Daily'
            },
            IncludedObjectVersions: 'Current',
            OptionalFields: [
              'Size',
              'LastModifiedDate',
              'StorageClass',
              'ETag',
              'IsMultipartUploaded',
              'ReplicationStatus',
              'EncryptionStatus'
            ]
          }
        }));
      }
    }
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
      const credentials = await this.getAWSCredentials(job.account.roleArn, job.account.regions[0]);
      
      let s3ResultsId: string | null = null;
      let ec2ResultsId: string | null = null;

      // Run S3 analysis if enabled
      if (job.enabledServices.s3 && job.monitoredBuckets.length > 0) {
        console.log('  📦 Running S3 analysis...');
        await this.ensureS3Setup(job, credentials);
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
  private async runS3Analysis(job: AnalysisJob): Promise<string> {
    // Simulate S3 analysis - in real implementation, this would:
    // 1. Use AWS SDK to get S3 inventory data
    // 2. Analyze storage class analytics
    // 3. Generate recommendations using AI
    
    const mockRecommendations: S3Recommendation[] = [
      {
        bucketName: `example-bucket-${job.account.accountId}`,
        objectCount: 15420,
        currentStorageClass: 'STANDARD',
        recommendedStorageClass: 'STANDARD_IA',
        potentialSavings: 127.50,
        confidence: 0.85,
        category: 'cost',
        aiGeneratedReport: 'Based on access patterns, 15,420 objects in this bucket have not been accessed in the last 30 days. Moving them to Standard-IA storage class could save approximately $127.50 per month while maintaining the same durability and availability.'
      },
      {
        bucketName: `logs-bucket-${job.account.accountId}`,
        objectCount: 8930,
        currentStorageClass: 'STANDARD',
        recommendedStorageClass: 'GLACIER',
        potentialSavings: 89.30,
        confidence: 0.92,
        category: 'cost',
        aiGeneratedReport: 'Log files older than 90 days are rarely accessed. Moving 8,930 log objects to Glacier storage could reduce costs by $89.30 monthly with minimal impact on operations.'
      }
    ];

    const totalSavings = mockRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);

    const [result] = await db
      .insert(s3AnalysisResults)
      .values({
        totalStorageGB: 2847.5,
        potentialSavings: totalSavings,
        recommendations: mockRecommendations,
      })
      .returning();

    return result.id;
  }

  /**
   * Run EC2/EBS analysis for the account
   */
  private async runEC2Analysis(job: AnalysisJob): Promise<string> {
    // Simulate EC2/EBS analysis - in real implementation, this would:
    // 1. Use AWS SDK to get EC2 instances and EBS volumes
    // 2. Analyze CloudWatch metrics for utilization
    // 3. Identify unused resources
    // 4. Generate recommendations using AI

    const mockEC2Recommendations: EC2Recommendation[] = [
      {
        instanceId: `i-${Math.random().toString(36).substr(2, 9)}`,
        instanceType: 't3.large',
        recommendationType: 'Downsize to t3.medium',
        category: 'cost',
        potentialSavings: 45.60,
        aiGeneratedReport: 'This t3.large instance shows consistently low CPU utilization (avg 15%) and memory usage (avg 25%) over the past 30 days. Downsizing to t3.medium could save $45.60 monthly while maintaining adequate performance for the current workload.'
      }
    ];

    const mockEBSRecommendations: EBSRecommendation[] = [
      {
        volumeId: `vol-${Math.random().toString(36).substr(2, 9)}`,
        size: 100,
        volumeType: 'gp3',
        category: 'cost',
        potentialSavings: 8.00,
        aiGeneratedReport: 'This 100GB gp3 volume has been unattached for 14 days. If no longer needed, deleting this volume would save $8.00 per month. Consider creating a snapshot before deletion if data recovery might be needed.'
      },
      {
        volumeId: `vol-${Math.random().toString(36).substr(2, 9)}`,
        size: 50,
        volumeType: 'gp2',
        category: 'cost',
        potentialSavings: 4.00,
        aiGeneratedReport: 'Unattached 50GB gp2 volume detected. This volume could be safely deleted to save $4.00 monthly, or converted to gp3 for better performance at similar cost if reattachment is planned.'
      }
    ];

    const totalEC2Savings = mockEC2Recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);
    const totalEBSSavings = mockEBSRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);
    const totalSavings = totalEC2Savings + totalEBSSavings;

    const [result] = await db
      .insert(ec2AnalysisResults)
      .values({
        totalInstances: mockEC2Recommendations.length,
        potentialSavings: totalSavings,
        unusedEBSVolumes: mockEBSRecommendations,
        utilizationRecommendations: mockEC2Recommendations,
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

  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

// export { HeimdallAnalysisEngine };