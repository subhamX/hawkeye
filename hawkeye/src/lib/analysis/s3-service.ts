import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketTaggingCommand,
  CreateBucketCommand,
  PutBucketAnalyticsConfigurationCommand,
  GetBucketAnalyticsConfigurationCommand,
  PutBucketInventoryConfigurationCommand,
  GetBucketInventoryConfigurationCommand,
  GetBucketLocationCommand,
  type BucketLocationConstraint
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  type Datapoint
} from '@aws-sdk/client-cloudwatch';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import type { AWSCredentials } from './aws-credentials';
import { S3BucketAnalysisSchema, type S3BucketAnalysis } from './schemas';
import type {
  MonitoredBucket,
  S3BucketConfig,
  InventoryReport,
  AgeAnalysisResult,
  ParquetAnalysisResult,
  PartitioningAnalysisResult,
  InventoryObject
} from './types';
import { DirectoryAnalysis, LifecyclePolicyRecommendation } from '../../../drizzle-db/schema/app';

export class S3AnalysisService {
  private credentials: AWSCredentials;
  private s3Clients: Map<string, S3Client> = new Map();
  private cloudWatchClients: Map<string, CloudWatchClient> = new Map();
  private defaultRegion: string;

  constructor(credentials: AWSCredentials) {
    this.credentials = credentials;
    this.defaultRegion = credentials.region;

    // Create default clients
    this.s3Clients.set(credentials.region, new S3Client({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    }));

    this.cloudWatchClients.set(credentials.region, new CloudWatchClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    }));
  }

  /**
   * Get S3 client for a specific region
   */
  private getS3Client(region: string): S3Client {
    if (!this.s3Clients.has(region)) {
      this.s3Clients.set(region, new S3Client({
        region,
        credentials: {
          accessKeyId: this.credentials.accessKeyId,
          secretAccessKey: this.credentials.secretAccessKey,
          sessionToken: this.credentials.sessionToken,
        },
      }));
    }
    return this.s3Clients.get(region)!;
  }

  /**
   * Get CloudWatch client for a specific region
   */
  private getCloudWatchClient(region: string): CloudWatchClient {
    if (!this.cloudWatchClients.has(region)) {
      this.cloudWatchClients.set(region, new CloudWatchClient({
        region,
        credentials: {
          accessKeyId: this.credentials.accessKeyId,
          secretAccessKey: this.credentials.secretAccessKey,
          sessionToken: this.credentials.sessionToken,
        },
      }));
    }
    return this.cloudWatchClients.get(region)!;
  }

  /**
   * Get the actual region of a bucket using GetBucketLocation
   */
  private async getActualBucketRegion(bucketName: string, assumedRegion: string): Promise<string> {
    try {
      // Try the assumed region first
      const s3Client = this.getS3Client(assumedRegion);
      const locationResponse = await s3Client.send(new GetBucketLocationCommand({
        Bucket: bucketName
      }));

      // Handle the special case where us-east-1 returns null/undefined
      const actualRegion = locationResponse.LocationConstraint || 'us-east-1';

      if (actualRegion !== assumedRegion) {
        console.log(`    📍 Bucket ${bucketName} actual region: ${actualRegion} (was assuming: ${assumedRegion})`);
      }

      return actualRegion;
    } catch (error) {
      console.warn(`    ⚠️  Could not determine bucket region for ${bucketName}, using assumed region: ${assumedRegion}`);
      return assumedRegion;
    }
  }

  /**
   * Get bucket metrics from CloudWatch
   */
  private async getBucketMetrics(bucketName: string, bucketRegion: string): Promise<{
    sizeBytes: number;
    objectCount: number;
  }> {
    // First, get the actual bucket region
    const actualRegion = await this.getActualBucketRegion(bucketName, bucketRegion);
    const cloudWatchClient = this.getCloudWatchClient(actualRegion);

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    console.log(`    📊 Querying CloudWatch metrics for ${bucketName} in region ${actualRegion}...`);
    console.log(`    🕐 Time range: ${startTime.toISOString()} to ${endTime.toISOString()}`);

    try {
      let sizeBytes = 0;
      let objectCount = 0;

      // Get bucket size in bytes
      try {
        console.log(`    🔍 Querying BucketSizeBytes for ${bucketName}...`);
        const sizeResponse = await cloudWatchClient.send(new GetMetricStatisticsCommand({
          Namespace: 'AWS/S3',
          MetricName: 'BucketSizeBytes',
          Dimensions: [
            { Name: 'BucketName', Value: bucketName },
            { Name: 'StorageType', Value: 'StandardStorage' }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 86400, // 1 day
          Statistics: ['Average']
        }));

        console.log(`    🔍 BucketSizeBytes response: ${sizeResponse.Datapoints?.length || 0} datapoints`);
        if (sizeResponse.Datapoints && sizeResponse.Datapoints.length > 0) {
          const latestSizeDatapoint = sizeResponse.Datapoints.sort((a, b) => 
            (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0)
          )[0];
          
          sizeBytes = Math.round(latestSizeDatapoint?.Average || 0);
          if (sizeBytes > 0) {
            console.log(`    📊 Total size: ${(sizeBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`);
          }
        } else {
          console.log(`    ⚠️  No size data available for ${bucketName}`);
        }
      } catch (error) {
        console.warn(`    ❌ Failed to get bucket size for ${bucketName}:`, error);
      }

      // Get object count
      try {

        console.log({
          Namespace: 'AWS/S3',
          MetricName: 'NumberOfObjects',
          Dimensions: [
            { Name: 'BucketName', Value: bucketName },
            { Name: 'StorageType', Value: 'AllStorageTypes' }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 86400, // 1 day
          Statistics: ['Average'] // Use Average as per AWS CLI example
        })
        console.log(`    🔍 Querying NumberOfObjects for ${bucketName}...`);
        const countResponse = await cloudWatchClient.send(new GetMetricStatisticsCommand({
          Namespace: 'AWS/S3',
          MetricName: 'NumberOfObjects',
          Dimensions: [
            { Name: 'BucketName', Value: bucketName },
            { Name: 'StorageType', Value: 'AllStorageTypes' }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 86400, // 1 day
          Statistics: ['Average'] // Use Average as per AWS CLI example
        }));

        console.log(countResponse)
        console.log(`    🔍 NumberOfObjects response: ${countResponse.Datapoints?.length || 0} datapoints`);
        if (countResponse.Datapoints && countResponse.Datapoints.length > 0) {
          console.log(`    📊 Latest object count datapoint:`, countResponse.Datapoints[0]);

          const latestCountDatapoint = countResponse.Datapoints.sort((a, b) =>
            (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0)
          )[0];

          objectCount = Math.round(latestCountDatapoint?.Average || 0);
          if (objectCount > 0) {
            console.log(`    📊 Total objects: ${objectCount.toLocaleString()}`);
          }
        } else {
          console.log(`    ⚠️  No object count data available for ${bucketName}`);
        }
      } catch (error) {
        console.warn(`    ❌ Failed to get object count for ${bucketName}:`, error);
      }

      // If we still have no data, the bucket might be empty or metrics might not be available yet
      if (sizeBytes === 0 && objectCount === 0) {
        console.log(`    ℹ️  No CloudWatch metrics available for ${bucketName}. This could mean:`);
        console.log(`        - The bucket is empty`);
        console.log(`        - The bucket was recently created (metrics take 24-48 hours to appear)`);
        console.log(`        - CloudWatch metrics are not enabled for this bucket`);
      }

      const totalSizeGB = sizeBytes / (1024 * 1024 * 1024);
      console.log(`    📊 Final metrics for ${bucketName}: ${totalSizeGB.toFixed(3)} GB, ${objectCount.toLocaleString()} objects`);

      return { sizeBytes, objectCount };

    } catch (error) {
      console.warn(`    ❌ Failed to get CloudWatch metrics for ${bucketName}:`, error);
      console.log(`    ℹ️  Falling back to basic analysis without size/count metrics`);
      return { sizeBytes: 0, objectCount: 0 };
    }
  }

  /**
   * Detect the actual region of a bucket when we get PermanentRedirect errors
   */
  private async detectBucketRegion(bucketName: string, errorMessage?: string): Promise<string | null> {
    // First, try to extract region from error message if available
    if (errorMessage) {
      const regionMatch = errorMessage.match(/\.s3\.([a-z0-9-]+)\.amazonaws\.com/);
      if (regionMatch) {
        const extractedRegion = regionMatch[1];
        console.log(`    📍 Extracted region from error: ${extractedRegion}`);

        // Verify this region works
        try {
          const client = this.getS3Client(extractedRegion);
          await client.send(new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 1
          }));
          console.log(`    ✅ Confirmed bucket ${bucketName} is in region ${extractedRegion}`);
          return extractedRegion;
        } catch (error) {
          console.warn(`    ⚠️  Extracted region ${extractedRegion} didn't work, trying other regions...`);
        }
      }
    }

    // Fallback: try common AWS regions
    const commonRegions = [
      'eu-central-1', 'eu-west-1', 'us-east-1', 'us-west-2',
      'eu-west-2', 'eu-west-3', 'eu-north-1', 'us-east-2', 'us-west-1',
      'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1',
      'ca-central-1', 'sa-east-1'
    ];

    for (const region of commonRegions) {
      try {
        const client = this.getS3Client(region);
        await client.send(new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 1
        }));
        console.log(`    ✅ Found bucket ${bucketName} in region ${region}`);
        return region;
      } catch (error) {
        // Continue trying other regions
        continue;
      }
    }

    console.warn(`    ⚠️  Could not detect region for bucket ${bucketName}`);
    return null;
  }

  /**
   * Ensure S3 setup is complete for analysis
   */
  async ensureS3Setup(monitoredBuckets: MonitoredBucket[], accountId: string): Promise<void> {
    console.log('    🔧 Ensuring S3 setup is complete...');

    // Create artifacts bucket if it doesn't exist
    const artifactsBucketName = `hawkeye-${accountId}-artifacts`;
    
    // Try to determine if artifacts bucket already exists and get its region
    let artifactsBucketRegion = this.defaultRegion;
    try {
      artifactsBucketRegion = await this.getActualBucketRegion(artifactsBucketName, this.defaultRegion);
      console.log(`    📦 Artifacts bucket exists in region: ${artifactsBucketRegion}`);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchBucket') {
        console.log(`    📦 Creating artifacts bucket: ${artifactsBucketName} in region: ${this.defaultRegion}`);
        const defaultClient = this.s3Clients.get(this.defaultRegion)!;
        await defaultClient.send(new CreateBucketCommand({
          Bucket: artifactsBucketName,
          CreateBucketConfiguration: this.defaultRegion !== 'us-east-1' ? {
            LocationConstraint: this.defaultRegion as BucketLocationConstraint
          } : undefined
        }));
        artifactsBucketRegion = this.defaultRegion;
      } else {
        console.warn(`    ⚠️  Could not determine artifacts bucket region, using default: ${this.defaultRegion}`);
      }
    }

    // Setup analytics and inventory for each monitored bucket
    for (const bucket of monitoredBuckets) {
      console.log(`    🔧 Setting up bucket: ${bucket.bucketName} (stored region: ${bucket.region})`);

      try {
        await this.setupBucketAnalytics(bucket.bucketName, artifactsBucketName, bucket.region, artifactsBucketRegion);
        await this.setupBucketInventory(bucket.bucketName, artifactsBucketName, bucket.region, artifactsBucketRegion);
        console.log(`    ✅ Successfully set up bucket ${bucket.bucketName}`);
      } catch (error) {
        console.error(`    ❌ Failed to setup bucket ${bucket.bucketName}:`, error);
        throw error;
      }
    }
  }

  /**
   * Setup Storage Class Analytics for a bucket
   */
  private async setupBucketAnalytics(bucketName: string, artifactsBucket: string, bucketRegion: string, artifactsBucketRegion?: string): Promise<void> {
    const configId = 'hawkeye-sca-v1';

    // Get the correct S3 client for this bucket's region
    let s3Client = this.getS3Client(bucketRegion);
    let actualRegion = bucketRegion;

    try {
      console.log(`    📊 Checking analytics configuration for ${bucketName}`);
      await s3Client.send(new GetBucketAnalyticsConfigurationCommand({
        Bucket: bucketName,
        Id: configId
      }));
      console.log(`    ✅ Analytics already configured for ${bucketName}`);
      return;
    } catch (error: unknown) {
      // Handle PermanentRedirect by detecting actual region
      if (error instanceof Error && (
        error.message.includes('PermanentRedirect') ||
        error.name === 'PermanentRedirect' ||
        (error as any).Code === 'PermanentRedirect'
      )) {
        console.log(`    🔄 PermanentRedirect detected, finding actual region for ${bucketName}...`);
        const detectedRegion = await this.detectBucketRegion(bucketName, error.message);
        if (detectedRegion && detectedRegion !== bucketRegion) {
          console.log(`    📍 Using detected region: ${detectedRegion}`);
          actualRegion = detectedRegion;
          s3Client = this.getS3Client(actualRegion);

          // Retry the check with correct region
          try {
            await s3Client.send(new GetBucketAnalyticsConfigurationCommand({
              Bucket: bucketName,
              Id: configId
            }));
            console.log(`    ✅ Analytics already configured for ${bucketName} in region ${actualRegion}`);
            return;
          } catch (retryError: unknown) {
            if (retryError instanceof Error && retryError.name !== 'NoSuchConfiguration') {
              throw retryError;
            }
            // Continue to setup if NoSuchConfiguration
          }
        } else {
          throw error;
        }
      } else if (error instanceof Error && error.name !== 'NoSuchConfiguration') {
        throw error;
      }
      // Continue to setup if NoSuchConfiguration
    }

    // Setup analytics configuration
    console.log(`    📊 Setting up analytics for ${bucketName} in region ${actualRegion}`);
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
    console.log(`    ✅ Analytics configuration created for ${bucketName} in region ${actualRegion}`);
  }

  /**
   * Setup S3 Inventory for a bucket
   */
  private async setupBucketInventory(bucketName: string, artifactsBucket: string, bucketRegion: string, artifactsBucketRegion?: string): Promise<void> {
    const configId = 'hawkeye-inventory-v1';

    // Get the correct S3 client for this bucket's region
    let s3Client = this.getS3Client(bucketRegion);
    let actualRegion = bucketRegion;

    try {
      console.log(`    📋 Checking inventory configuration for ${bucketName}`);
      await s3Client.send(new GetBucketInventoryConfigurationCommand({
        Bucket: bucketName,
        Id: configId
      }));
      console.log(`    ✅ Inventory already configured for ${bucketName}`);
      return;
    } catch (error: unknown) {
      // Handle PermanentRedirect by detecting actual region
      if (error instanceof Error && (
        error.message.includes('PermanentRedirect') ||
        error.name === 'PermanentRedirect' ||
        (error as any).Code === 'PermanentRedirect'
      )) {
        console.log(`    🔄 PermanentRedirect detected, finding actual region for ${bucketName}...`);
        const detectedRegion = await this.detectBucketRegion(bucketName, error.message);
        if (detectedRegion && detectedRegion !== bucketRegion) {
          console.log(`    📍 Using detected region: ${detectedRegion}`);
          actualRegion = detectedRegion;
          s3Client = this.getS3Client(actualRegion);

          // Retry the check with correct region
          try {
            await s3Client.send(new GetBucketInventoryConfigurationCommand({
              Bucket: bucketName,
              Id: configId
            }));
            console.log(`    ✅ Inventory already configured for ${bucketName} in region ${actualRegion}`);
            return;
          } catch (retryError: unknown) {
            if (retryError instanceof Error && retryError.name !== 'NoSuchConfiguration') {
              throw retryError;
            }
            // Continue to setup if NoSuchConfiguration
          }
        } else {
          throw error;
        }
      } else if (error instanceof Error && error.name !== 'NoSuchConfiguration') {
        throw error;
      }
      // Continue to setup if NoSuchConfiguration
    }

    // Setup inventory configuration
    console.log(`    📋 Setting up inventory for ${bucketName} in region ${actualRegion}`);
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
    console.log(`    ✅ Inventory configuration created for ${bucketName} in region ${actualRegion}`);
  }

  /**
   * Analyze a single S3 bucket using inventory-based approach
   */
  async analyzeBucket(bucketName: string, bucketRegion: string, artifactsBucket: string): Promise<S3BucketAnalysis> {
    console.log(`    📊 Starting inventory-based analysis for bucket: ${bucketName}`);

    try {
      // Get the actual bucket region first
      const actualRegion = await this.getActualBucketRegion(bucketName, bucketRegion);

      // Get inventory data instead of direct object listing
      const inventoryData = await this.getInventoryData(bucketName, artifactsBucket, actualRegion);

      // Perform the three specific analyses
      const ageAnalysis = await this.analyzeObjectAge(inventoryData);
      const parquetAnalysis = await this.detectParquetFileIssues(inventoryData);
      const partitioningAnalysis = await this.analyzePartitioningNeeds(inventoryData);

      // Get bucket configuration for security analysis
      const bucketConfig = await this.getBucketConfiguration(bucketName, actualRegion);

      // Generate comprehensive analysis using AI with inventory insights
      const analysis = await this.generateComprehensiveAnalysis(
        bucketName,
        inventoryData,
        ageAnalysis,
        parquetAnalysis,
        partitioningAnalysis,
        bucketConfig
      );

      console.log(`    ✅ Completed analysis for bucket: ${bucketName}`);
      return analysis;

    } catch (error) {
      console.log(`    📋 Inventory reports not available for ${bucketName} - performing basic analysis`);
      console.log(`    ℹ️  Advanced analysis (object age, parquet compaction, partitioning) will be available once inventory reports are generated`);

      // Fallback to basic analysis when inventory is not available
      return this.performBasicAnalysis(bucketName, bucketRegion);
    }
  }

  /**
   * Get inventory data from S3 inventory reports
   */
  private async getInventoryData(bucketName: string, artifactsBucket: string, bucketRegion: string): Promise<InventoryReport> {
    // First try to get the artifacts bucket region
    let artifactsBucketRegion = bucketRegion;
    try {
      const artifactsBucketLocation = await this.getActualBucketRegion(artifactsBucket, bucketRegion);
      artifactsBucketRegion = artifactsBucketLocation;
    } catch (error) {
      console.warn(`    ⚠️  Could not determine artifacts bucket region, using default: ${bucketRegion}`);
    }

    const s3Client = this.getS3Client(artifactsBucketRegion);
    const inventoryPrefix = `inventory/${bucketName}/`;

    console.log(`    📋 Fetching inventory data from ${artifactsBucket}/${inventoryPrefix} in region ${artifactsBucketRegion}`);

    try {
      // List inventory files
      const listResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: artifactsBucket,
        Prefix: inventoryPrefix,
        MaxKeys: 100
      }));

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        throw new Error(`No inventory reports found for bucket ${bucketName}. Inventory reports are generated daily after being enabled.`);
      }

      // Find the most recent inventory report
      const inventoryFiles = listResponse.Contents
        .filter(obj => obj.Key?.endsWith('.csv') || obj.Key?.endsWith('.parquet'))
        .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

      if (inventoryFiles.length === 0) {
        throw new Error(`No valid inventory files found for bucket ${bucketName}. Inventory reports may still be generating.`);
      }

      const latestInventoryFile = inventoryFiles[0];
      console.log(`    📄 Processing inventory file: ${latestInventoryFile.Key}`);

      // Download and parse the inventory file
      const inventoryObjects = await this.parseInventoryFile(artifactsBucket, latestInventoryFile.Key!, artifactsBucketRegion);

      return {
        bucketName,
        reportDate: latestInventoryFile.LastModified || new Date(),
        objects: inventoryObjects,
        totalObjects: inventoryObjects.length,
        totalSize: inventoryObjects.reduce((sum, obj) => sum + obj.size, 0)
      };

    } catch (error) {
      console.error(`    ❌ Failed to get inventory data for ${bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Parse inventory file (CSV format)
   */
  private async parseInventoryFile(artifactsBucket: string, inventoryKey: string, bucketRegion: string): Promise<InventoryObject[]> {
    const s3Client = this.getS3Client(bucketRegion);

    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: artifactsBucket,
        Key: inventoryKey
      }));

      if (!response.Body) {
        throw new Error('Empty inventory file');
      }

      const csvContent = await response.Body.transformToString();
      const lines = csvContent.split('\n').filter(line => line.trim());

      // Skip header line if present
      const dataLines = lines.slice(1);
      const objects: InventoryObject[] = [];

      for (const line of dataLines) {
        const columns = line.split(',');
        if (columns.length >= 4) {
          objects.push({
            key: columns[1]?.replace(/"/g, '') || '',
            lastModified: new Date(columns[2]?.replace(/"/g, '') || ''),
            size: parseInt(columns[3]?.replace(/"/g, '') || '0'),
            storageClass: columns[4]?.replace(/"/g, '') || 'STANDARD',
            etag: columns[5]?.replace(/"/g, ''),
            isMultipartUploaded: columns[6]?.replace(/"/g, '') === 'true',
            replicationStatus: columns[7]?.replace(/"/g, ''),
            encryptionStatus: columns[8]?.replace(/"/g, '')
          });
        }
      }

      console.log(`    📊 Parsed ${objects.length} objects from inventory`);
      return objects;

    } catch (error) {
      console.error(`    ❌ Failed to parse inventory file ${inventoryKey}:`, error);
      throw error;
    }
  }

  /**
   * Algorithm 1: Analyze object age and recommend lifecycle policies
   */
  private async analyzeObjectAge(inventoryData: InventoryReport): Promise<AgeAnalysisResult> {
    console.log(`    ⏰ Analyzing object age for ${inventoryData.objects.length} objects`);

    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;

    let oldObjectsCount = 0;
    let oldObjectsTotalSize = 0;
    let totalAge = 0;

    const ageDistribution = {
      lessThan30Days: 0,
      between30And90Days: 0,
      between90And365Days: 0,
      moreThan365Days: 0
    };

    for (const obj of inventoryData.objects) {
      const ageInDays = (now.getTime() - obj.lastModified.getTime()) / msPerDay;
      totalAge += ageInDays;

      if (ageInDays < 30) {
        ageDistribution.lessThan30Days++;
      } else if (ageInDays < 90) {
        ageDistribution.between30And90Days++;
      } else if (ageInDays < 365) {
        ageDistribution.between90And365Days++;
      } else {
        ageDistribution.moreThan365Days++;
        oldObjectsCount++;
        oldObjectsTotalSize += obj.size;
      }
    }

    const averageAge = inventoryData.objects.length > 0 ? totalAge / inventoryData.objects.length : 0;

    // Calculate potential savings (rough estimate)
    const standardCostPerGB = 0.023; // $0.023 per GB/month for Standard
    const glacierCostPerGB = 0.004; // $0.004 per GB/month for Glacier
    const oldObjectsGB = oldObjectsTotalSize / (1024 * 1024 * 1024);
    const potentialSavings = oldObjectsGB * (standardCostPerGB - glacierCostPerGB) * 12; // Annual savings

    const recommendedLifecyclePolicy: LifecyclePolicyRecommendation = {
      transitionToIA: 30,
      transitionToGlacier: 90,
      deleteAfter: ageDistribution.moreThan365Days > inventoryData.objects.length * 0.1 ? 2555 : undefined, // 7 years
      estimatedMonthlySavings: potentialSavings / 12
    };

    console.log(`    📊 Age analysis: ${oldObjectsCount} old objects (${(oldObjectsGB).toFixed(2)} GB), potential savings: $${potentialSavings.toFixed(2)}/year`);

    return {
      bucketName: inventoryData.bucketName,
      oldObjectsCount,
      oldObjectsTotalSize,
      averageAge,
      recommendedLifecyclePolicy,
      potentialSavings,
      ageDistribution
    };
  }

  /**
   * Algorithm 2: Detect parquet file compaction needs
   */
  private async detectParquetFileIssues(inventoryData: InventoryReport): Promise<ParquetAnalysisResult> {
    console.log(`    📦 Analyzing parquet files for compaction opportunities`);

    const parquetFiles = inventoryData.objects.filter(obj =>
      obj.key.toLowerCase().endsWith('.parquet')
    );

    if (parquetFiles.length === 0) {
      return {
        bucketName: inventoryData.bucketName,
        parquetFileCount: 0,
        averageFileSize: 0,
        recommendCompaction: false,
        estimatedCompactionSavings: 0,
        suggestedCompactionStrategy: 'No parquet files found',
        directoriesWithSmallFiles: []
      };
    }

    const totalSize = parquetFiles.reduce((sum, file) => sum + file.size, 0);
    const averageFileSize = totalSize / parquetFiles.length;
    const smallFileThreshold = 128 * 1024 * 1024; // 128MB

    // Group by directory
    const directoriesMap = new Map<string, InventoryObject[]>();

    for (const file of parquetFiles) {
      const directory = file.key.substring(0, file.key.lastIndexOf('/')) || '/';
      if (!directoriesMap.has(directory)) {
        directoriesMap.set(directory, []);
      }
      directoriesMap.get(directory)!.push(file);
    }

    const directoriesWithSmallFiles: DirectoryAnalysis[] = [];
    let totalSmallFiles = 0;

    // Use Array.from to iterate over Map entries
    for (const [directory, files] of Array.from(directoriesMap.entries())) {
      const smallFiles = files.filter(f => f.size < smallFileThreshold);
      if (smallFiles.length > 10) { // More than 10 small files in a directory
        const dirTotalSize = files.reduce((sum, f) => sum + f.size, 0);
        const dirAvgSize = dirTotalSize / files.length;

        directoriesWithSmallFiles.push({
          path: directory,
          fileCount: files.length,
          averageFileSize: dirAvgSize,
          recommendedPartitionScheme: 'Compact small files into larger files (target: 256MB-1GB per file)',
          totalSize: dirTotalSize
        });

        totalSmallFiles += smallFiles.length;
      }
    }

    const recommendCompaction = totalSmallFiles > parquetFiles.length * 0.3; // More than 30% are small files

    // Estimate compaction savings (reduced metadata overhead, better query performance)
    const estimatedCompactionSavings = recommendCompaction ? totalSmallFiles * 0.1 : 0; // $0.10 per small file eliminated

    const suggestedCompactionStrategy = recommendCompaction
      ? `Compact ${totalSmallFiles} small parquet files across ${directoriesWithSmallFiles.length} directories. Target 256MB-1GB per file for optimal query performance.`
      : 'Parquet files are appropriately sized';

    console.log(`    📦 Parquet analysis: ${parquetFiles.length} files, ${totalSmallFiles} small files, compaction recommended: ${recommendCompaction}`);

    return {
      bucketName: inventoryData.bucketName,
      parquetFileCount: parquetFiles.length,
      averageFileSize,
      recommendCompaction,
      estimatedCompactionSavings,
      suggestedCompactionStrategy,
      directoriesWithSmallFiles
    };
  }

  /**
   * Algorithm 3: Analyze partitioning needs
   */
  private async analyzePartitioningNeeds(inventoryData: InventoryReport): Promise<PartitioningAnalysisResult> {
    console.log(`    🗂️  Analyzing directory structure for partitioning opportunities`);

    // Group files by directory
    const directoriesMap = new Map<string, InventoryObject[]>();

    for (const obj of inventoryData.objects) {
      const directory = obj.key.substring(0, obj.key.lastIndexOf('/')) || '/';
      if (!directoriesMap.has(directory)) {
        directoriesMap.set(directory, []);
      }
      directoriesMap.get(directory)!.push(obj);
    }

    const directoriesWithTooManyFiles: DirectoryAnalysis[] = [];
    const fileCountThreshold = 1000; // More than 1000 files in a directory

    // Use Array.from to iterate over Map entries
    for (const [directory, files] of Array.from(directoriesMap.entries())) {
      if (files.length > fileCountThreshold) {
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const averageFileSize = totalSize / files.length;

        // Analyze file naming patterns for potential partition keys
        let recommendedPartitionScheme = 'Consider partitioning by date, size, or file type';

        // Check for date patterns in file names
        const datePatterns = files.filter(f =>
          /\d{4}[-/]\d{2}[-/]\d{2}/.test(f.key) || // YYYY-MM-DD or YYYY/MM/DD
          /year=\d{4}/.test(f.key) || // Hive-style partitioning
          /month=\d{2}/.test(f.key) ||
          /day=\d{2}/.test(f.key)
        );

        if (datePatterns.length > files.length * 0.5) {
          recommendedPartitionScheme = 'Partition by date (year/month/day) - detected date patterns in file names';
        } else {
          // Check for file type patterns
          const extensions = new Set(files.map(f => {
            const ext = f.key.split('.').pop()?.toLowerCase();
            return ext || 'unknown';
          }));

          if (extensions.size > 1) {
            recommendedPartitionScheme = `Partition by file type - detected ${extensions.size} different file types: ${Array.from(extensions).join(', ')}`;
          }
        }

        directoriesWithTooManyFiles.push({
          path: directory,
          fileCount: files.length,
          averageFileSize,
          recommendedPartitionScheme,
          totalSize
        });
      }
    }

    const recommendPartitioning = directoriesWithTooManyFiles.length > 0;

    const suggestedPartitioningStrategy = recommendPartitioning
      ? `Implement partitioning for ${directoriesWithTooManyFiles.length} directories with excessive file counts. This will improve query performance and reduce listing costs.`
      : 'Current directory structure is well-organized';

    const potentialQueryPerformanceImprovement = recommendPartitioning
      ? `Query performance could improve by 50-90% with proper partitioning, especially for time-based queries`
      : 'No significant performance improvement expected from partitioning';

    console.log(`    🗂️  Partitioning analysis: ${directoriesWithTooManyFiles.length} directories need partitioning`);

    return {
      bucketName: inventoryData.bucketName,
      totalFiles: inventoryData.objects.length,
      directoriesWithTooManyFiles,
      recommendPartitioning,
      suggestedPartitioningStrategy,
      potentialQueryPerformanceImprovement
    };
  }

  /**
   * Generate comprehensive analysis using AI with inventory insights
   */
  private async generateComprehensiveAnalysis(
    bucketName: string,
    inventoryData: InventoryReport,
    ageAnalysis: AgeAnalysisResult,
    parquetAnalysis: ParquetAnalysisResult,
    partitioningAnalysis: PartitioningAnalysisResult,
    bucketConfig: S3BucketConfig
  ): Promise<S3BucketAnalysis> {
    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `You are an expert AWS S3 optimization analyst. Analyze bucket '${bucketName}' using inventory-based insights and provide recommendations.

INVENTORY DATA SUMMARY:
- Total Objects: ${inventoryData.totalObjects}
- Total Size: ${(inventoryData.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB
- Report Date: ${inventoryData.reportDate.toISOString()}

AGE ANALYSIS RESULTS:
- Objects older than 1 year: ${ageAnalysis.oldObjectsCount} (${(ageAnalysis.oldObjectsTotalSize / (1024 * 1024 * 1024)).toFixed(2)} GB)
- Average object age: ${ageAnalysis.averageAge.toFixed(0)} days
- Potential annual savings from lifecycle policies: $${ageAnalysis.potentialSavings.toFixed(2)}
- Age distribution: <30 days: ${ageAnalysis.ageDistribution.lessThan30Days}, 30-90 days: ${ageAnalysis.ageDistribution.between30And90Days}, 90-365 days: ${ageAnalysis.ageDistribution.between90And365Days}, >365 days: ${ageAnalysis.ageDistribution.moreThan365Days}

PARQUET ANALYSIS RESULTS:
- Total parquet files: ${parquetAnalysis.parquetFileCount}
- Average parquet file size: ${(parquetAnalysis.averageFileSize / (1024 * 1024)).toFixed(2)} MB
- Compaction recommended: ${parquetAnalysis.recommendCompaction}
- Directories with small files: ${parquetAnalysis.directoriesWithSmallFiles.length}
- Strategy: ${parquetAnalysis.suggestedCompactionStrategy}

PARTITIONING ANALYSIS RESULTS:
- Directories needing partitioning: ${partitioningAnalysis.directoriesWithTooManyFiles.length}
- Partitioning recommended: ${partitioningAnalysis.recommendPartitioning}
- Strategy: ${partitioningAnalysis.suggestedPartitioningStrategy}
- Performance improvement: ${partitioningAnalysis.potentialQueryPerformanceImprovement}

BUCKET CONFIGURATION:
${JSON.stringify(bucketConfig, null, 2)}

Generate a JSON response following the S3BucketAnalysisSchema with specific, data-driven recommendations based on the analysis results above. Focus on:
1. Lifecycle policy recommendations based on age analysis
2. Parquet compaction recommendations if applicable
3. Partitioning recommendations if applicable
4. Security and configuration improvements
5. Cost optimization opportunities

Make recommendations specific and actionable with quantified benefits where possible.`;

    try {
      const jsonPrompt = prompt + `

Please respond with a valid JSON object that matches this structure:
{
  "bucketName": "string",
  "analysisDate": "YYYY-MM-DD",
  "recommendations": [
    {
      "category": "Storage|Security|Cost|Performance|Other",
      "impact": "High|Medium|Low",
      "title": "string",
      "description": "string",
      "currentCostImpact": "string",
      "estimatedSavingsImpact": "string",
      "objectCount": number,
      "totalSize": "string"
    }
  ],
  "summary": {
    "overallAssessment": "string",
    "findingsByPriority": {"High": 0, "Medium": 0, "Low": 0},
    "findingsByCategory": {"Storage": 0, "Security": 0, "Cost": 0, "Performance": 0, "Other": 0},
    "securityVulnerabilitiesCount": 0,
    "costOptimizationOpportunitiesCount": 0
  },
  "statistics": {
    "totalObjectsProvidedForAnalysis": ${inventoryData.totalObjects}
  }
}

Respond only with valid JSON, no additional text.`;

      const result = await generateText({
        model: google('gemini-1.5-pro'),
        prompt: jsonPrompt,
      });

      const analysisResult = this.parseAIJsonResponse(result.text);

      // Add the actual statistics from inventory data
      const analysisWithStats = {
        ...analysisResult,
        statistics: {
          ...analysisResult.statistics,
          totalSizeBytes: inventoryData.totalSize,
          storageClassBreakdown: this.buildStorageClassBreakdown(inventoryData),
          lastModified: inventoryData.reportDate.toISOString()
        }
      };

      return analysisWithStats;
    } catch (error) {
      console.warn(`    ⚠️  Schema validation failed, using fallback analysis:`, error);
      
      // Fallback analysis without schema validation
      return {
        bucketName,
        analysisDate: new Date().toISOString().split('T')[0],
        recommendations: [
          {
            category: 'Cost' as const,
            impact: 'Medium' as const,
            title: 'Lifecycle Policy Optimization',
            description: `Based on inventory analysis, ${ageAnalysis.oldObjectsCount} objects are older than 1 year. Consider implementing lifecycle policies to transition old objects to cheaper storage classes.`,
            currentCostImpact: `${(ageAnalysis.oldObjectsTotalSize / (1024 * 1024 * 1024)).toFixed(2)} GB in standard storage`,
            estimatedSavingsImpact: `$${ageAnalysis.potentialSavings.toFixed(2)} annually`,
            objectCount: ageAnalysis.oldObjectsCount,
            totalSize: `${(ageAnalysis.oldObjectsTotalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`
          }
        ],
        summary: {
          overallAssessment: `Bucket contains ${inventoryData.totalObjects} objects with ${(inventoryData.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB total storage. Analysis shows potential for cost optimization through lifecycle policies.`,
          findingsByPriority: { High: 0, Medium: 1, Low: 0 },
          findingsByCategory: { Storage: 1, Security: 0, Cost: 1, Performance: 0, Other: 0 },
          securityVulnerabilitiesCount: 0,
          costOptimizationOpportunitiesCount: 1
        },
        statistics: {
          totalObjectsProvidedForAnalysis: inventoryData.totalObjects,
          totalSizeBytes: inventoryData.totalSize,
          storageClassBreakdown: this.buildStorageClassBreakdown(inventoryData),
          lastModified: inventoryData.reportDate.toISOString()
        }
      };
    }
  }

  /**
   * Fallback to basic analysis when inventory is not available
   */
  private async performBasicAnalysis(bucketName: string, bucketRegion: string): Promise<S3BucketAnalysis> {
    console.log(`    🔄 Performing basic analysis for ${bucketName} (inventory reports not available)`);

    // Get bucket configuration
    const bucketConfig = await this.getBucketConfiguration(bucketName, bucketRegion);

    // Get bucket metrics from CloudWatch
    const bucketMetrics = await this.getBucketMetrics(bucketName, bucketRegion);

    const currentDate = new Date().toISOString().split('T')[0];
    const sizeGB = bucketMetrics.sizeBytes / (1024 * 1024 * 1024);

    // Determine if we have meaningful metrics data
    const hasMetricsData = bucketMetrics.sizeBytes > 0 || bucketMetrics.objectCount > 0;
    const metricsStatus = hasMetricsData
      ? `Available - ${sizeGB.toFixed(2)} GB, ${bucketMetrics.objectCount} objects`
      : 'Not available - bucket may be empty or recently created';

    const prompt = `You are an expert AWS S3 optimization analyst. Analyze bucket '${bucketName}' with limited data due to inventory reports not being available yet.

AVAILABLE DATA:
- Bucket name: ${bucketName}
- Bucket region: ${bucketRegion}
- CloudWatch metrics: ${metricsStatus}
- Bucket configuration: ${JSON.stringify(bucketConfig, null, 2)}

IMPORTANT LIMITATIONS:
- S3 Inventory reports are not yet available for this bucket
- Advanced analysis (object age, parquet compaction, partitioning) cannot be performed
- Cost optimization recommendations are limited without object-level data
${!hasMetricsData ? '- CloudWatch metrics show no data (bucket may be empty or recently created)' : ''}

Generate a JSON response following the S3BucketAnalysisSchema. Focus on:
1. Security improvements based on bucket configuration
2. General lifecycle policy setup recommendations  
3. Configuration best practices (encryption, versioning, logging)
4. Inventory setup recommendations for future advanced analysis
${!hasMetricsData ? '5. Note that the bucket appears to be empty or recently created' : ''}

For recommendations that require inventory data, use titles like:
- "Enable S3 Inventory for Advanced Analysis"
- "Awaiting Inventory Reports for Object Age Analysis"
- "Parquet Compaction Analysis - Requires Inventory Data"

Mark cost estimates as "Awaiting inventory reports for detailed analysis" where object-level data is needed.
${!hasMetricsData ? 'If the bucket appears empty, focus on setup and configuration recommendations.' : ''}`;

    try {
      const jsonPrompt = prompt + `

Please respond with a valid JSON object that matches this structure:
{
  "bucketName": "${bucketName}",
  "analysisDate": "${new Date().toISOString().split('T')[0]}",
  "recommendations": [
    {
      "category": "Storage|Security|Cost|Performance|Other",
      "impact": "High|Medium|Low",
      "title": "string",
      "description": "string",
      "currentCostImpact": "string",
      "estimatedSavingsImpact": "string",
      "objectCount": ${bucketMetrics.objectCount},
      "totalSize": "${(bucketMetrics.sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB"
    }
  ],
  "summary": {
    "overallAssessment": "string",
    "findingsByPriority": {"High": 0, "Medium": 0, "Low": 0},
    "findingsByCategory": {"Storage": 0, "Security": 0, "Cost": 0, "Performance": 0, "Other": 0},
    "securityVulnerabilitiesCount": 0,
    "costOptimizationOpportunitiesCount": 0
  },
  "statistics": {
    "totalObjectsProvidedForAnalysis": ${bucketMetrics.objectCount}
  }
}

Respond only with valid JSON, no additional text.`;

      const result = await generateText({
        model: google('gemini-1.5-pro'),
        prompt: jsonPrompt,
      });

      const analysisResult = this.parseAIJsonResponse(result.text);

      // Add the actual statistics from CloudWatch metrics
      const analysisWithStats = {
        ...analysisResult,
        statistics: {
          ...analysisResult.statistics,
          totalSizeBytes: bucketMetrics.sizeBytes,
          lastModified: new Date().toISOString()
        }
      };

      return analysisWithStats;
    } catch (error) {
      console.warn(`    ⚠️  Schema validation failed, using fallback analysis:`, error);
      
      // Fallback analysis without schema validation
      const isEmpty = bucketMetrics.sizeBytes === 0 && bucketMetrics.objectCount === 0;
      
      return {
        bucketName,
        analysisDate: new Date().toISOString().split('T')[0],
        recommendations: isEmpty ? [
          {
            category: 'Cost' as const,
            impact: 'Low' as const,
            title: 'Empty Bucket Cleanup',
            description: 'This bucket appears to be empty. Consider deleting it if no longer needed to reduce management overhead.',
            currentCostImpact: 'Minimal storage costs',
            estimatedSavingsImpact: '$0.50 monthly',
            objectCount: 0,
            totalSize: '0 GB'
          }
        ] : [
          {
            category: 'Storage' as const,
            impact: 'Medium' as const,
            title: 'Enable S3 Inventory for Advanced Analysis',
            description: 'S3 Inventory reports are not available yet. Enable inventory reporting for detailed object-level analysis and optimization recommendations.',
            currentCostImpact: 'Limited optimization without inventory data',
            estimatedSavingsImpact: 'Awaiting inventory reports for detailed analysis',
            objectCount: bucketMetrics.objectCount,
            totalSize: `${(bucketMetrics.sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
          }
        ],
        summary: {
          overallAssessment: isEmpty 
            ? 'Bucket appears to be empty and may be a candidate for deletion.'
            : `Bucket contains ${bucketMetrics.objectCount} objects with ${(bucketMetrics.sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB storage. Advanced analysis requires inventory reports.`,
          findingsByPriority: { High: 0, Medium: isEmpty ? 0 : 1, Low: isEmpty ? 1 : 0 },
          findingsByCategory: { Storage: isEmpty ? 0 : 1, Security: 0, Cost: isEmpty ? 1 : 0, Performance: 0, Other: 0 },
          securityVulnerabilitiesCount: 0,
          costOptimizationOpportunitiesCount: 1
        },
        statistics: {
          totalObjectsProvidedForAnalysis: bucketMetrics.objectCount,
          totalSizeBytes: bucketMetrics.sizeBytes,
          lastModified: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Clean AI response text to handle markdown code blocks and parse JSON
   */
  private parseAIJsonResponse(responseText: string): any {
    let cleanedText = responseText.trim();
    
    // Remove markdown code block markers
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing whitespace
    cleanedText = cleanedText.trim();
    
    return JSON.parse(cleanedText);
  }

  /**
   * Build storage class breakdown from inventory data
   */
  private buildStorageClassBreakdown(inventoryData: InventoryReport): { [key: string]: { objectCount: number; sizeBytes: number } } {
    const breakdown: { [key: string]: { objectCount: number; sizeBytes: number } } = {};

    inventoryData.objects.forEach(obj => {
      const storageClass = obj.storageClass || 'STANDARD';
      if (!breakdown[storageClass]) {
        breakdown[storageClass] = { objectCount: 0, sizeBytes: 0 };
      }
      breakdown[storageClass].objectCount++;
      breakdown[storageClass].sizeBytes += obj.size;
    });

    return breakdown;
  }

  /**
   * Get bucket configuration for analysis
   */
  private async getBucketConfiguration(bucketName: string, bucketRegion: string): Promise<S3BucketConfig> {
    const config = {
      bucketName,
      versioning: 'Not configured',
      encryption: 'Not configured',
      publicAccessBlock: 'Not configured',
      lifecycle: 'Not configured',
      logging: 'Not configured',
      tagging: 'Not configured'
    };

    const s3Client = this.getS3Client(bucketRegion);

    try {
      const versioning = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      config.versioning = versioning.Status || 'Suspended';
    } catch (error) {
      // Ignore errors for optional configurations
    }

    try {
      const encryption = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      config.encryption = encryption.ServerSideEncryptionConfiguration ? 'Enabled' : 'Not configured';
    } catch (error) {
      // Ignore errors for optional configurations
    }

    try {
      const lifecycle = await s3Client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName }));
      config.lifecycle = lifecycle.Rules && lifecycle.Rules.length > 0 ? 'Configured' : 'Not configured';
    } catch (error) {
      // Ignore errors for optional configurations
    }

    try {
      const tagging = await s3Client.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
      config.tagging = tagging.TagSet && tagging.TagSet.length > 0 ? 'Configured' : 'Not configured';
    } catch (error) {
      // Ignore errors for optional configurations
    }

    return config;
  }



  /**
   * Extract recommended storage class from AI description
   */
  extractRecommendedStorageClass(description: string): string {
    const storageClasses = ['STANDARD_IA', 'ONEZONE_IA', 'GLACIER', 'GLACIER_IR', 'DEEP_ARCHIVE'];

    for (const storageClass of storageClasses) {
      if (description.toUpperCase().includes(storageClass)) {
        return storageClass;
      }
    }

    // Default recommendations based on common patterns
    if (description.toLowerCase().includes('archive') || description.toLowerCase().includes('backup')) {
      return 'GLACIER';
    }
    if (description.toLowerCase().includes('infrequent') || description.toLowerCase().includes('30 days')) {
      return 'STANDARD_IA';
    }

    return 'STANDARD_IA'; // Default fallback
  }
}