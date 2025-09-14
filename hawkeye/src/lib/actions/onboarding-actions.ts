'use server';

import { auth } from '@/lib/auth';
import { awsAccountService } from '@/lib/db/aws-accounts';
import { serviceConfigurationService } from '@/lib/db/service-configurations';
import type { 
  S3ServiceConfig, 
  EC2ServiceConfig, 
  EBSServiceConfig, 
  CloudFormationServiceConfig 
} from '../../../drizzle-db/schema/app';

interface OnboardingData {
  awsAccount?: {
    accountId: string;
    roleArn: string;
    regions: string[];
  };
  s3Config?: {
    enabled: boolean;
    selectedBuckets: string[];
    enableStorageAnalytics: boolean;
    enableInventory: boolean;
    lifecyclePolicyRecommendations: boolean;
  };
  ec2Config?: {
    enabled: boolean;
    rightsizingEnabled: boolean;
    reservedInstanceRecommendations: boolean;
    spotInstanceRecommendations: boolean;
  };
  ebsConfig?: {
    enabled: boolean;
    unusedVolumeDetection: boolean;
    volumeTypeOptimization: boolean;
    snapshotCleanup: boolean;
    minimumVolumeSize: number;
  };
  cloudformationConfig?: {
    enabled: boolean;
    monitoredStacks: string[];
    templateAnalysis: boolean;
    resourceOptimization: boolean;
    costEstimation: boolean;
  };
}

export async function completeOnboarding(onboardingData: OnboardingData) {
  console.log('onboardingDataxxx');
  const session = await auth();
  console.log('session', session);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const { awsAccount, s3Config, ec2Config, ebsConfig, cloudformationConfig } = onboardingData;

  if (!awsAccount) {
    throw new Error('AWS account data is required');
  }

  try {
    // Create AWS account record (user should already exist from sign-in callback)
    const account = await awsAccountService.createAWSAccount({
      userId: session.user.id,
      accountId: awsAccount.accountId,
      roleArn: awsAccount.roleArn,
      regions: awsAccount.regions,
    });

    // Create service configurations
    const serviceConfigs = [];

    // S3 Configuration
    if (s3Config) {
      const s3ServiceConfig: S3ServiceConfig = {
        monitoredBuckets: s3Config.selectedBuckets,
        enableStorageAnalytics: s3Config.enableStorageAnalytics,
        enableInventory: s3Config.enableInventory,
        lifecyclePolicyRecommendations: s3Config.lifecyclePolicyRecommendations,
      };

      const s3ConfigRecord = await serviceConfigurationService.createServiceConfiguration({
        accountId: account.id,
        serviceType: 's3',
        isEnabled: s3Config.enabled,
        configuration: s3ServiceConfig,
      });
      serviceConfigs.push(s3ConfigRecord);

      // Create S3 bucket configurations if enabled and buckets selected
      if (s3Config.enabled && s3Config.selectedBuckets.length > 0) {
        for (const bucketName of s3Config.selectedBuckets) {
          try {
            // Determine bucket region (simplified approach)
            const bucketRegion = awsAccount.regions[0]; // Default to first region
            
            await awsAccountService.createS3BucketConfig({
              accountId: account.id,
              bucketName: bucketName,
              region: bucketRegion,
              analyticsEnabled: s3Config.enableStorageAnalytics,
              inventoryEnabled: s3Config.enableInventory,
            });
          } catch (error) {
            console.error(`Failed to create bucket config for ${bucketName}:`, error);
            // Continue with other buckets even if one fails
          }
        }
      }
    }

    // EC2 Configuration
    if (ec2Config) {
      const ec2ServiceConfig: EC2ServiceConfig = {
        rightsizingEnabled: ec2Config.rightsizingEnabled,
        reservedInstanceRecommendations: ec2Config.reservedInstanceRecommendations,
        spotInstanceRecommendations: ec2Config.spotInstanceRecommendations,
      };

      const ec2ConfigRecord = await serviceConfigurationService.createServiceConfiguration({
        accountId: account.id,
        serviceType: 'ec2',
        isEnabled: ec2Config.enabled,
        configuration: ec2ServiceConfig,
      });
      serviceConfigs.push(ec2ConfigRecord);
    }

    // EBS Configuration
    if (ebsConfig) {
      const ebsServiceConfig: EBSServiceConfig = {
        unusedVolumeDetection: ebsConfig.unusedVolumeDetection,
        volumeTypeOptimization: ebsConfig.volumeTypeOptimization,
        snapshotCleanup: ebsConfig.snapshotCleanup,
        minimumVolumeSize: ebsConfig.minimumVolumeSize,
      };

      const ebsConfigRecord = await serviceConfigurationService.createServiceConfiguration({
        accountId: account.id,
        serviceType: 'ebs',
        isEnabled: ebsConfig.enabled,
        configuration: ebsServiceConfig,
      });
      serviceConfigs.push(ebsConfigRecord);
    }

    // CloudFormation Configuration
    if (cloudformationConfig) {
      const cfnServiceConfig: CloudFormationServiceConfig = {
        monitoredStacks: cloudformationConfig.monitoredStacks,
        templateAnalysis: cloudformationConfig.templateAnalysis,
        resourceOptimization: cloudformationConfig.resourceOptimization,
        costEstimation: cloudformationConfig.costEstimation,
      };

      const cfnConfigRecord = await serviceConfigurationService.createServiceConfiguration({
        accountId: account.id,
        serviceType: 'cloudformation',
        isEnabled: cloudformationConfig.enabled,
        configuration: cfnServiceConfig,
      });
      serviceConfigs.push(cfnConfigRecord);
    }
    
    return {
      success: true,
      message: 'Onboarding completed successfully',
      account: {
        id: account.id,
        accountId: account.accountId,
        regions: account.regions,
      },
      serviceConfigurations: serviceConfigs.length,
      enabledServices: serviceConfigs.filter(c => c.isEnabled).length,
    };

  } catch (error) {
    console.error('Onboarding completion error:', error);
    
    throw new Error(
      error instanceof Error ? error.message : 'Failed to complete onboarding'
    );
  }
}