'use server';

import { auth } from '@/lib/auth';
import { awsService } from '@/lib/aws/client';
import { mapAWSError } from '@/lib/aws/errors';
import { redirect } from 'next/navigation';

export async function validateAWSRole(roleArn: string, regions: string[]) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!roleArn || !Array.isArray(regions) || regions.length === 0) {
    throw new Error('Role ARN and regions are required');
  }

  try {
    // Validate the role and get permissions
    const validationResult = await awsService.validateRolePermissions(roleArn);

    if (!validationResult.isValid) {
      return {
        isValid: false,
        error: validationResult.error || 'Role validation failed',
        missingPermissions: validationResult.missingPermissions?.map(p => 
          `${p.service}: ${p.permission}`
        ),
      };
    }

    return {
      isValid: true,
      accountId: validationResult.accountId,
      permissions: validationResult.permissions,
    };

  } catch (error) {
    console.error('Role validation error:', error);
    const awsError = mapAWSError(error);
    
    return {
      isValid: false,
      error: awsError.message,
    };
  }
}

export async function listS3Buckets(roleArn: string, regions: string[]) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!roleArn || !Array.isArray(regions) || regions.length === 0) {
    throw new Error('Role ARN and regions are required');
  }

  try {
    // Assume the role and get credentials
    const assumeRoleResult = await awsService.assumeRole(roleArn, undefined, regions);
    
    // Update credentials with selected regions
    const credentials = {
      ...assumeRoleResult.credentials,
      regions: regions,
    };

    // List S3 buckets in the selected regions
    const buckets = await awsService.listS3Buckets(credentials);

    return {
      success: true,
      buckets: buckets.map(bucket => ({
        name: bucket.name,
        region: bucket.region,
        creationDate: bucket.creationDate?.toISOString(),
        estimatedSize: 'Unknown', // TODO: Get actual size from CloudWatch or S3 API
      })),
      accountId: assumeRoleResult.accountId,
    };

  } catch (error) {
    console.error('S3 buckets listing error:', error);
    const awsError = mapAWSError(error);
    
    return {
      success: false,
      error: awsError.message,
    };
  }
}

export async function configureS3Buckets(roleArn: string, regions: string[], buckets: string[]) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!roleArn || !Array.isArray(regions) || !Array.isArray(buckets)) {
    throw new Error('Role ARN, regions, and buckets are required');
  }

  try {
    // Assume the role and get credentials
    const assumeRoleResult = await awsService.assumeRole(roleArn, undefined, regions);
    
    // Update credentials with selected regions
    const credentials = {
      ...assumeRoleResult.credentials,
      regions: regions,
    };

    // Configure each selected bucket
    const configurationResults = [];
    
    for (const bucketName of buckets) {
      try {
        // Enable Storage Class Analytics
        await awsService.enableStorageAnalytics(bucketName, credentials);
        
        // Configure S3 Inventory
        await awsService.configureInventory(bucketName, credentials);
        
        configurationResults.push({
          bucket: bucketName,
          success: true,
          analyticsEnabled: true,
          inventoryEnabled: true,
        });
      } catch (error) {
        console.error(`Failed to configure bucket ${bucketName}:`, error);
        const awsError = mapAWSError(error);
        
        configurationResults.push({
          bucket: bucketName,
          success: false,
          error: awsError.message,
          analyticsEnabled: false,
          inventoryEnabled: false,
        });
      }
    }

    const successCount = configurationResults.filter(r => r.success).length;
    const failureCount = configurationResults.length - successCount;

    return {
      success: failureCount === 0,
      message: failureCount === 0 
        ? `Successfully configured ${successCount} buckets`
        : `Configured ${successCount} buckets, ${failureCount} failed`,
      results: configurationResults,
      accountId: assumeRoleResult.accountId,
    };

  } catch (error) {
    console.error('S3 configuration error:', error);
    const awsError = mapAWSError(error);
    
    return {
      success: false,
      error: awsError.message,
    };
  }
}