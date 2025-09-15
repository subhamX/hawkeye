import {
  S3Client,
  ListObjectsV2Command,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketTaggingCommand,
  CreateBucketCommand,
  PutBucketAnalyticsConfigurationCommand,
  GetBucketAnalyticsConfigurationCommand,
  PutBucketInventoryConfigurationCommand,
  GetBucketInventoryConfigurationCommand,
  type BucketLocationConstraint
} from '@aws-sdk/client-s3';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import type { AWSCredentials } from './aws-credentials';
import { S3BucketAnalysisSchema, type S3BucketAnalysis } from './schemas';
import type { MonitoredBucket, S3Object, S3BucketConfig } from './types';

export class S3AnalysisService {
  private credentials: AWSCredentials;
  private s3Clients: Map<string, S3Client> = new Map();
  private defaultRegion: string;

  constructor(credentials: AWSCredentials) {
    this.credentials = credentials;
    this.defaultRegion = credentials.region;
    
    // Create default client
    this.s3Clients.set(credentials.region, new S3Client({
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
    const defaultClient = this.s3Clients.get(this.defaultRegion)!;

    try {
      await defaultClient.send(new ListObjectsV2Command({
        Bucket: artifactsBucketName,
        MaxKeys: 1
      }));
      console.log(`    📦 Artifacts bucket exists: ${artifactsBucketName}`);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchBucket') {
        console.log(`    📦 Creating artifacts bucket: ${artifactsBucketName}`);
        await defaultClient.send(new CreateBucketCommand({
          Bucket: artifactsBucketName,
          CreateBucketConfiguration: this.defaultRegion !== 'us-east-1' ? {
            LocationConstraint: this.defaultRegion as BucketLocationConstraint
          } : undefined
        }));
      }
    }

    // Setup analytics and inventory for each monitored bucket
    for (const bucket of monitoredBuckets) {
      console.log(`    🔧 Setting up bucket: ${bucket.bucketName} (stored region: ${bucket.region})`);
      
      try {
        await this.setupBucketAnalytics(bucket.bucketName, artifactsBucketName, bucket.region);
        await this.setupBucketInventory(bucket.bucketName, artifactsBucketName, bucket.region);
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
  private async setupBucketAnalytics(bucketName: string, artifactsBucket: string, bucketRegion: string): Promise<void> {
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
  private async setupBucketInventory(bucketName: string, artifactsBucket: string, bucketRegion: string): Promise<void> {
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
   * Analyze a single S3 bucket using AI
   */
  async analyzeBucket(bucketName: string, bucketRegion: string): Promise<S3BucketAnalysis> {
    // Get bucket configuration
    const bucketConfig = await this.getBucketConfiguration(bucketName, bucketRegion);

    // Get sample objects for pattern analysis
    const objects = await this.getSampleObjects(bucketName, bucketRegion);

    const currentDate = new Date().toISOString().split('T')[0];
    const objectsCount = objects.length;
    const objectsPreview = objects.slice(0, 30).map(obj => obj.Key).join(', ');

    const prompt = `You are an expert AWS S3 optimization and security analyst.
Analyze the S3 bucket '${bucketName}' and provide a comprehensive analysis as a JSON object strictly adhering to the S3BucketAnalysisSchema.
The 'bucketName' will be '${bucketName}' and 'analysisDate' will be '${currentDate}'.
A list of ${objectsCount} object keys/prefixes was provided for pattern analysis. Preview (up to 30): ${objectsPreview}.
Current Bucket Configuration Status (Note: Full policy/ACL content is not provided, analyze based on status and general best practices):
${JSON.stringify(bucketConfig, null, 2)}

Your Task:
Generate a JSON object matching the S3BucketAnalysisSchema.
- **recommendations**: Provide detailed, actionable findings. For each recommendation:
- Assign 'category' from: 'Storage', 'Security', 'Cost', 'Performance', 'Other'.
- 'currentCostImpact' and 'estimatedSavingsImpact' should be qualitative (e.g., "High", "Moderate", "Low", "User to quantify") as precise figures are not derivable from input.
- **summary**:
- 'overallAssessment': A brief text summary.
- 'findingsByPriority': Count your recommendations by their 'impact' field.
- 'findingsByCategory': Count your recommendations by their 'category' field.
- 'securityVulnerabilitiesCount': Should match 'findingsByCategory.security'.
- 'costOptimizationOpportunitiesCount': Should match 'findingsByCategory.cost'.
- **statistics**:
- 'totalObjectsProvidedForAnalysis': ${objectsCount}.

Key Analysis Areas:
1. **Storage & Cost Optimization**: Based on object names/patterns (e.g., 'archive/', 'logs/', '.bak', '.tmp', extensions like .parquet, .csv) and lifecycle status, suggest storage class optimizations, small object compaction considerations (if patterns suggest many small files), temporary file cleanup. Evaluate lifecycle rules for optimality (e.g., incomplete multipart upload cleanup, transitions, expirations). If no tags, recommend tagging.
2. **Security**: Analyze policy/ACL status (recommend configuration if "Not configured" or if ACLs seem overly permissive from summary), versioning (recommend enabling), logging (recommend enabling), public access block (strongly recommend full block if not configured or if permissive), encryption (recommend default encryption). If object names suggest public web content and PAB isn't fully restrictive, recommend CloudFront.

Important Instructions:
- Adhere STRICTLY to the S3BucketAnalysisSchema for the output.
- Focus on actionable recommendations for improvement. Do not praise good configurations.
- Ensure all recommendation fields are populated appropriately.
- The 'objectCount' in a recommendation can refer to relevant items observed in the *provided* object list/patterns.
- The 'totalSize' in a recommendation should usually be "User to determine based on full scan".
- No "TODOs" in the output.
- Keep the recommendations short and concise.
- Don't give generic recommendations. Give specific recommendations backed by data. Like X%/Y of objects should be done ZZ etc.`;

    const result = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: S3BucketAnalysisSchema,
      prompt,
    });

    return result.object;
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
   * Get sample objects from bucket for pattern analysis
   */
  private async getSampleObjects(bucketName: string, bucketRegion: string): Promise<S3Object[]> {
    const s3Client = this.getS3Client(bucketRegion);
    
    try {
      const response = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1000
      }));
      
      return response.Contents || [];
    } catch (error) {
      console.error(`Failed to list objects in bucket ${bucketName}:`, error);
      return [];
    }
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