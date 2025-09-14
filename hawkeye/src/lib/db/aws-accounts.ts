import { db } from '../db';
import { awsAccounts, s3BucketConfigs } from '../../../drizzle-db/schema';
import { eq, and } from 'drizzle-orm';

export interface CreateAWSAccountData {
  userId: string;
  accountId: string;
  roleArn: string;
  regions: string[];
}

export interface CreateS3BucketConfigData {
  accountId: string;
  bucketName: string;
  region: string;
  analyticsEnabled?: boolean;
  inventoryEnabled?: boolean;
}

export interface AWSAccountWithBuckets {
  id: string;
  userId: string;
  accountId: string;
  roleArn: string;
  regions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  buckets: S3BucketConfigData[];
}

export interface S3BucketConfigData {
  id: string;
  bucketName: string;
  region: string;
  analyticsEnabled: boolean;
  inventoryEnabled: boolean;
  lastAnalyzed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AWSAccountService {
  /**
   * Create a new AWS account configuration
   */
  async createAWSAccount(data: CreateAWSAccountData) {
    const [account] = await db
      .insert(awsAccounts)
      .values({
        userId: data.userId,
        accountId: data.accountId,
        roleArn: data.roleArn,
        regions: data.regions,
      })
      .returning();

    return account;
  }

  /**
   * Get AWS accounts for a user
   */
  async getAWSAccountsByUserId(userId: string): Promise<AWSAccountWithBuckets[]> {
    const accounts = await db
      .select()
      .from(awsAccounts)
      .where(eq(awsAccounts.userId, userId));

    const accountsWithBuckets: AWSAccountWithBuckets[] = [];

    for (const account of accounts) {
      const buckets = await db
        .select()
        .from(s3BucketConfigs)
        .where(eq(s3BucketConfigs.accountId, account.id));

      accountsWithBuckets.push({
        ...account,
        buckets: buckets.map(bucket => ({
          id: bucket.id,
          bucketName: bucket.bucketName,
          region: bucket.region,
          analyticsEnabled: bucket.analyticsEnabled,
          inventoryEnabled: bucket.inventoryEnabled,
          lastAnalyzed: bucket.lastAnalyzed,
          createdAt: bucket.createdAt,
          updatedAt: bucket.updatedAt,
        })),
      });
    }

    return accountsWithBuckets;
  }

  /**
   * Get a specific AWS account by ID
   */
  async getAWSAccountById(accountId: string, userId: string) {
    const [account] = await db
      .select()
      .from(awsAccounts)
      .where(and(
        eq(awsAccounts.id, accountId),
        eq(awsAccounts.userId, userId)
      ));

    return account;
  }

  /**
   * Update AWS account configuration
   */
  async updateAWSAccount(accountId: string, userId: string, updates: Partial<CreateAWSAccountData>) {
    const [account] = await db
      .update(awsAccounts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(awsAccounts.id, accountId),
        eq(awsAccounts.userId, userId)
      ))
      .returning();

    return account;
  }

  /**
   * Delete AWS account configuration
   */
  async deleteAWSAccount(accountId: string, userId: string) {
    await db
      .delete(awsAccounts)
      .where(and(
        eq(awsAccounts.id, accountId),
        eq(awsAccounts.userId, userId)
      ));
  }

  /**
   * Create S3 bucket configuration
   */
  async createS3BucketConfig(data: CreateS3BucketConfigData) {
    const [bucketConfig] = await db
      .insert(s3BucketConfigs)
      .values({
        accountId: data.accountId,
        bucketName: data.bucketName,
        region: data.region,
        analyticsEnabled: data.analyticsEnabled || false,
        inventoryEnabled: data.inventoryEnabled || false,
      })
      .returning();

    return bucketConfig;
  }

  /**
   * Update S3 bucket configuration
   */
  async updateS3BucketConfig(
    bucketConfigId: string,
    updates: Partial<CreateS3BucketConfigData>
  ) {
    const [bucketConfig] = await db
      .update(s3BucketConfigs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(s3BucketConfigs.id, bucketConfigId))
      .returning();

    return bucketConfig;
  }

  /**
   * Get S3 bucket configurations for an account
   */
  async getS3BucketConfigs(accountId: string) {
    return await db
      .select()
      .from(s3BucketConfigs)
      .where(eq(s3BucketConfigs.accountId, accountId));
  }

  /**
   * Delete S3 bucket configuration
   */
  async deleteS3BucketConfig(bucketConfigId: string) {
    await db
      .delete(s3BucketConfigs)
      .where(eq(s3BucketConfigs.id, bucketConfigId));
  }

  /**
   * Check if user has any AWS accounts configured
   */
  async hasAWSAccounts(userId: string): Promise<boolean> {
    const accounts = await db
      .select({ id: awsAccounts.id })
      .from(awsAccounts)
      .where(eq(awsAccounts.userId, userId))
      .limit(1);

    return accounts.length > 0;
  }
}

export const awsAccountService = new AWSAccountService();