import {
  timestamp,
  pgTable,
  text,
  boolean,
  integer,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const awsAccounts = pgTable('aws_account', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('accountId').notNull(),
  roleArn: text('roleArn').notNull(),
  regions: jsonb('regions').$type<string[]>().notNull().default(['us-east-1']),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const serviceConfigurations = pgTable('service_configuration', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountId: text('accountId')
    .notNull()
    .references(() => awsAccounts.id, { onDelete: 'cascade' }),
  serviceType: text('serviceType', { 
    enum: ['s3', 'ec2', 'ebs', 'cloudformation', 'iam', 'lambda'] 
  }).notNull(),
  isEnabled: boolean('isEnabled').notNull().default(true),
  configuration: jsonb('configuration').$type<ServiceConfig>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const s3BucketConfigs = pgTable('s3_bucket_config', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountId: text('accountId')
    .notNull()
    .references(() => awsAccounts.id, { onDelete: 'cascade' }),
  bucketName: text('bucketName').notNull(),
  region: text('region').notNull(),
  analyticsEnabled: boolean('analyticsEnabled').notNull().default(false),
  inventoryEnabled: boolean('inventoryEnabled').notNull().default(false),
  lastAnalyzed: timestamp('lastAnalyzed', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const analysisRuns = pgTable('analysis_run', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountId: text('accountId')
    .notNull()
    .references(() => awsAccounts.id, { onDelete: 'cascade' }),
  status: text('status', { 
    enum: ['pending', 'running', 'completed', 'failed'] 
  }).notNull().default('pending'),
  startedAt: timestamp('startedAt', { mode: 'date' }).notNull().defaultNow(),
  completedAt: timestamp('completedAt', { mode: 'date' }),
  errorMessage: text('errorMessage'),
  s3ResultsId: text('s3ResultsId'),
  ec2ResultsId: text('ec2ResultsId'),
});

export const s3AnalysisResults = pgTable('s3_analysis_result', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  analysisRunId: text('analysisRunId')
    .notNull()
    .references(() => analysisRuns.id, { onDelete: 'cascade' }),
  totalStorageGB: decimal('totalStorageGB', { precision: 15, scale: 2 }),
  totalObjectCount: integer('totalObjectCount'),
  potentialSavings: decimal('potentialSavings', { precision: 10, scale: 2 }),
  recommendations: jsonb('recommendations').$type<S3Recommendation[]>(),
  bucketSummaries: jsonb('bucketSummaries').$type<BucketSummary[]>(),
  ageAnalysis: jsonb('ageAnalysis').$type<AgeAnalysisResult>(),
  parquetAnalysis: jsonb('parquetAnalysis').$type<ParquetAnalysisResult>(),
  partitioningAnalysis: jsonb('partitioningAnalysis').$type<PartitioningAnalysisResult>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

export const ec2AnalysisResults = pgTable('ec2_analysis_result', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  analysisRunId: text('analysisRunId')
    .notNull()
    .references(() => analysisRuns.id, { onDelete: 'cascade' }),
  totalInstances: integer('totalInstances'),
  potentialSavings: decimal('potentialSavings', { precision: 10, scale: 2 }),
  unusedEBSVolumes: jsonb('unusedEBSVolumes').$type<EBSRecommendation[]>(),
  utilizationRecommendations: jsonb('utilizationRecommendations').$type<EC2Recommendation[]>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

export const jobQueue = pgTable('job_queue', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text('type').notNull(), // 's3_analysis', 'ec2_analysis', etc.
  status: text('status', { 
    enum: ['pending', 'running', 'completed', 'failed'] 
  }).notNull().default('pending'),
  payload: jsonb('payload'),
  result: jsonb('result'),
  error: text('error'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('maxAttempts').notNull().default(3),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  scheduledFor: timestamp('scheduledFor', { mode: 'date' }),
});

// Type definitions for JSON fields
export type S3Recommendation = {
  bucketName: string;
  objectCount: number;
  currentStorageClass: string;
  recommendedStorageClass: string;
  potentialSavings: number;
  confidence: number;
  category: 'cost' | 'security' | 'general';
  aiGeneratedReport: string;
};

export type BucketSummary = {
  bucketName: string;
  region: string;
  objectCount: number;
  totalSizeGB: number;
  isEmpty: boolean;
  recommendDeletion: boolean;
  lastModified?: Date;
  storageClasses: {
    [key: string]: {
      objectCount: number;
      sizeGB: number;
    };
  };
};

export type AgeAnalysisResult = {
  bucketName: string;
  oldObjectsCount: number;
  oldObjectsTotalSize: number;
  averageAge: number;
  recommendedLifecyclePolicy: LifecyclePolicyRecommendation;
  potentialSavings: number;
  ageDistribution: {
    lessThan30Days: number;
    between30And90Days: number;
    between90And365Days: number;
    moreThan365Days: number;
  };
};

export type ParquetAnalysisResult = {
  bucketName: string;
  parquetFileCount: number;
  averageFileSize: number;
  recommendCompaction: boolean;
  estimatedCompactionSavings: number;
  suggestedCompactionStrategy: string;
  directoriesWithSmallFiles: DirectoryAnalysis[];
};

export type PartitioningAnalysisResult = {
  bucketName: string;
  totalFiles: number;
  directoriesWithTooManyFiles: DirectoryAnalysis[];
  recommendPartitioning: boolean;
  suggestedPartitioningStrategy: string;
  potentialQueryPerformanceImprovement: string;
};

export type DirectoryAnalysis = {
  path: string;
  fileCount: number;
  averageFileSize: number;
  recommendedPartitionScheme: string;
  totalSize: number;
};

export type LifecyclePolicyRecommendation = {
  transitionToIA: number; // days
  transitionToGlacier: number; // days
  deleteAfter?: number; // days
  estimatedMonthlySavings: number;
};

export type EC2Recommendation = {
  instanceId: string;
  instanceType: string;
  recommendationType: string;
  category: 'cost' | 'security' | 'general';
  potentialSavings: number;
  aiGeneratedReport: string;
};

export type EBSRecommendation = {
  volumeId: string;
  size: number;
  volumeType: string;
  category: 'cost' | 'security' | 'general';
  potentialSavings: number;
  aiGeneratedReport: string;
};

// Service Configuration Types
export type ServiceConfig = 
  | S3ServiceConfig 
  | EC2ServiceConfig 
  | EBSServiceConfig 
  | CloudFormationServiceConfig 
  | IAMServiceConfig 
  | LambdaServiceConfig;

export type S3ServiceConfig = {
  monitoredBuckets: string[];
  enableStorageAnalytics: boolean;
  enableInventory: boolean;
  lifecyclePolicyRecommendations: boolean;
};

export type EC2ServiceConfig = {
  rightsizingEnabled: boolean;
  reservedInstanceRecommendations: boolean;
  spotInstanceRecommendations: boolean;
};

export type EBSServiceConfig = {
  unusedVolumeDetection: boolean;
  volumeTypeOptimization: boolean;
  snapshotCleanup: boolean;
  minimumVolumeSize: number; // GB
};

export type CloudFormationServiceConfig = {
  monitoredStacks: string[];
  templateAnalysis: boolean;
  resourceOptimization: boolean;
  costEstimation: boolean;
};

export type IAMServiceConfig = {
  unusedRoleDetection: boolean;
  permissionOptimization: boolean;
  accessKeyRotation: boolean;
  mfaRecommendations: boolean;
};

export type LambdaServiceConfig = {
  monitoredFunctions: string[];
  memoryOptimization: boolean;
  timeoutOptimization: boolean;
  coldStartAnalysis: boolean;
  costPerInvocationAnalysis: boolean;
};