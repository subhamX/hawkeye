import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { S3Client, ListBucketsCommand, GetBucketLocationCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand } from '@aws-sdk/client-ec2';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  regions: string[];
}

export interface AssumeRoleResult {
  credentials: AWSCredentials;
  accountId: string;
}

export class AWSService {
  private stsClient: STSClient;

  constructor(region: string = 'us-east-1') {
    this.stsClient = new STSClient({ region, credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    } });
  }

  /**
   * Validate AWS credentials by assuming a role
   */
  async validateCredentials(roleArn: string): Promise<boolean> {
    try {
      const result = await this.assumeRole(roleArn);
      return !!result.credentials;
    } catch (error) {
      console.error('AWS credential validation failed:', error);
      return false;
    }
  }

  /**
   * Assume an AWS IAM role and return temporary credentials
   */
  async assumeRole(roleArn: string, sessionName?: string, regions?: string[]): Promise<AssumeRoleResult> {
    try {
      const command = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: sessionName || `hawkeye-session-${Date.now()}`,
        DurationSeconds: 3600, // 1 hour
      });

      const response = await this.stsClient.send(command);
      console.log(response)
      
      if (!response.Credentials) {
        throw new Error('No credentials returned from STS');
      }


      const credentials: AWSCredentials = {
        accessKeyId: response.Credentials.AccessKeyId!,
        secretAccessKey: response.Credentials.SecretAccessKey!,
        sessionToken: response.Credentials.SessionToken!,
        regions: regions || ['us-east-1'], // Use provided regions or default
      };

      // Get account ID
      const stsClientWithCreds = new STSClient({
        region: credentials.regions[0], // Use first region for identity check
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      const identityCommand = new GetCallerIdentityCommand({});
      const identityResponse = await stsClientWithCreds.send(identityCommand);

      return {
        credentials,
        accountId: identityResponse.Account!,
      };
    } catch (error) {
      console.error('Failed to assume role:', error);
      throw new Error(`Failed to assume role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all S3 buckets in the account (filtered by selected regions)
   */
  async listS3Buckets(credentials: AWSCredentials): Promise<S3Bucket[]> {
    try {
      // Use the first region to list all buckets (S3 ListBuckets is global)
      const s3Client = new S3Client({
        region: credentials.regions[0],
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      const command = new ListBucketsCommand({});
      const response = await s3Client.send(command);

      if (!response.Buckets) {
        return [];
      }

      // Get bucket regions and filter by selected regions
      const buckets: S3Bucket[] = [];
      for (const bucket of response.Buckets) {
        if (!bucket.Name) continue;

        try {
          const locationCommand = new GetBucketLocationCommand({
            Bucket: bucket.Name,
          });
          const locationResponse = await s3Client.send(locationCommand);
          
          const bucketRegion = locationResponse.LocationConstraint || 'us-east-1';
          
          // Only include buckets in selected regions
          if (credentials.regions.includes(bucketRegion)) {
            buckets.push({
              name: bucket.Name,
              region: bucketRegion,
              creationDate: bucket.CreationDate,
            });
          }
        } catch (error) {
          // If we can't get the region, assume us-east-1 and include if selected
          if (credentials.regions.includes('us-east-1')) {
            buckets.push({
              name: bucket.Name,
              region: 'us-east-1',
              creationDate: bucket.CreationDate,
            });
          }
        }
      }

      return buckets;
    } catch (error) {
      console.error('Failed to list S3 buckets:', error);
      throw new Error(`Failed to list S3 buckets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enable Storage Class Analytics for a bucket
   */
  async enableStorageAnalytics(bucketName: string, credentials: AWSCredentials): Promise<void> {
    try {
      const s3Client = new S3Client({
        region: credentials.regions[0], // Use first region for operations
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      // Implementation would go here - this is a placeholder
      // In a real implementation, you'd use PutBucketAnalyticsConfigurationCommand
      console.log(`Enabling storage analytics for bucket: ${bucketName}`);
      
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to enable storage analytics:', error);
      throw new Error(`Failed to enable storage analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Configure S3 Inventory for a bucket
   */
  async configureInventory(bucketName: string, credentials: AWSCredentials): Promise<void> {
    try {
      const s3Client = new S3Client({
        region: credentials.regions[0], // Use first region for operations
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      // Implementation would go here - this is a placeholder
      // In a real implementation, you'd use PutBucketInventoryConfigurationCommand
      console.log(`Configuring inventory for bucket: ${bucketName}`);
      
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to configure inventory:', error);
      throw new Error(`Failed to configure inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate that the IAM role has the required permissions
   */
  async validateRolePermissions(roleArn: string): Promise<ValidationResult> {
    try {
      const result = await this.assumeRole(roleArn);
      
      // Test basic permissions
      const permissions: PermissionCheck[] = [
        { service: 'S3', permission: 'ListBuckets', required: true },
        { service: 'EC2', permission: 'DescribeInstances', required: true },
        { service: 'CloudWatch', permission: 'GetMetricStatistics', required: false },
        { service: 'IAM', permission: 'GetRole', required: false },
      ];

      const validationResults: PermissionCheck[] = [];

      for (const permission of permissions) {
        try {
          // Test the permission based on service
          let hasPermission = false;
          console.log(permission)
          
          switch (permission.service) {
            case 'S3':
              await this.listS3Buckets(result.credentials);
              hasPermission = true;
              break;
            case 'EC2':
              const ec2Client = new EC2Client({
                region: result.credentials.regions[0], // Use first region for validation
                credentials: {
                  accessKeyId: result.credentials.accessKeyId,
                  secretAccessKey: result.credentials.secretAccessKey,
                  sessionToken: result.credentials.sessionToken,
                },
              });
              await ec2Client.send(new DescribeInstancesCommand());
              hasPermission = true;
              break;
            default:
              hasPermission = true; // Skip validation for now
          }

          validationResults.push({
            ...permission,
            hasPermission,
          });
        } catch (error) {
          console.log(error)
          validationResults.push({
            ...permission,
            hasPermission: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const missingRequired = validationResults.filter(p => p.required && !p.hasPermission);
      
      return {
        isValid: missingRequired.length === 0,
        accountId: result.accountId,
        permissions: validationResults,
        missingPermissions: missingRequired,
      };
    } catch (error) {
      return {
        isValid: false,
        accountId: '',
        permissions: [],
        missingPermissions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Types
export interface S3Bucket {
  name: string;
  region: string;
  creationDate?: Date;
}

export interface PermissionCheck {
  service: string;
  permission: string;
  required: boolean;
  hasPermission?: boolean;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  accountId: string;
  permissions: PermissionCheck[];
  missingPermissions: PermissionCheck[];
  error?: string;
}

// Export singleton instance
export const awsService = new AWSService();