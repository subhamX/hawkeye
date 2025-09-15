// Export all auth tables (required for NextAuth)
export {
  users,
  accounts,
  sessions,
  verificationTokens,
} from './auth';

// Export all application tables
export {
  awsAccounts,
  serviceConfigurations,
  s3BucketConfigs,
  analysisRuns,
  s3AnalysisResults,
  ec2AnalysisResults,
  jobQueue,
  type S3Recommendation,
  type EC2Recommendation,
  type EBSRecommendation,
  type BucketSummary,
  type AgeAnalysisResult,
  type ParquetAnalysisResult,
  type PartitioningAnalysisResult,
  type ServiceConfig,
  type S3ServiceConfig,
  type EC2ServiceConfig,
  type EBSServiceConfig,
  type CloudFormationServiceConfig,
  type IAMServiceConfig,
  type LambdaServiceConfig,
} from './app';