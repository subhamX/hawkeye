import { z } from 'zod';

// S3 Analysis Schemas
export const S3RecommendationSchema = z.object({
  category: z.enum(['Storage', 'Security', 'Cost', 'Performance', 'Other']),
  impact: z.enum(['High', 'Medium', 'Low']),
  title: z.string(),
  description: z.string(),
  currentCostImpact: z.string(),
  estimatedSavingsImpact: z.string(),
  objectCount: z.number().optional(),
  totalSize: z.string().optional()
});

export const S3AnalysisSummarySchema = z.object({
  overallAssessment: z.string(),
  findingsByPriority: z.object({
    High: z.number(),
    Medium: z.number(),
    Low: z.number()
  }),
  findingsByCategory: z.object({
    Storage: z.number(),
    Security: z.number(),
    Cost: z.number(),
    Performance: z.number(),
    Other: z.number()
  }),
  securityVulnerabilitiesCount: z.number(),
  costOptimizationOpportunitiesCount: z.number()
});

export const S3AnalysisStatisticsSchema = z.object({
  totalObjectsProvidedForAnalysis: z.number(),
  totalSizeBytes: z.number(),
  storageClassBreakdown: z.record(z.string(), z.object({
    objectCount: z.number(),
    sizeBytes: z.number()
  })).optional(),
  lastModified: z.string().optional()
});

export const S3BucketAnalysisSchema = z.object({
  bucketName: z.string(),
  analysisDate: z.string(),
  recommendations: z.array(S3RecommendationSchema),
  summary: S3AnalysisSummarySchema,
  statistics: S3AnalysisStatisticsSchema
});

// EC2 Analysis Schemas
export const EC2FindingsByPrioritySchema = z.object({
  High: z.number(),
  Medium: z.number(),
  Low: z.number()
});

export const EC2FindingsByCategorySchema = z.object({
  Security: z.number(),
  Cost: z.number(),
  Performance: z.number()
});

export const EC2OverallStatisticsSchema = z.object({
  totalInstances: z.number(),
  totalVolumes: z.number(),
  findingsByPriority: EC2FindingsByPrioritySchema,
  findingsByCategory: EC2FindingsByCategorySchema
});

export const EC2StrategicRecommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.enum(['High', 'Medium', 'Low']),
  category: z.enum(['Security', 'Cost', 'Performance'])
});

export const EC2InstanceRecommendationSchema = z.object({
  instanceId: z.string(),
  instanceType: z.string(),
  recommendationType: z.string(),
  category: z.enum(['cost', 'security', 'general']),
  potentialSavings: z.number(),
  confidence: z.number().min(0).max(1).default(0.85),
  aiGeneratedReport: z.string()
});

export const EBSVolumeRecommendationSchema = z.object({
  volumeId: z.string(),
  size: z.number(),
  volumeType: z.string(),
  category: z.enum(['cost', 'security', 'general']),
  potentialSavings: z.number(),
  confidence: z.number().min(0).max(1).default(0.9),
  aiGeneratedReport: z.string()
});

export const EC2InstanceAnalysisSchema = z.object({
  executiveSummary: z.string(),
  overallStatistics: EC2OverallStatisticsSchema,
  strategicRecommendations: z.array(EC2StrategicRecommendationSchema),
  instanceRecommendations: z.array(EC2InstanceRecommendationSchema),
  volumeRecommendations: z.array(EBSVolumeRecommendationSchema)
});

// Type exports
export type S3Recommendation = z.infer<typeof S3RecommendationSchema>;
export type S3BucketAnalysis = z.infer<typeof S3BucketAnalysisSchema>;
export type EC2InstanceAnalysis = z.infer<typeof EC2InstanceAnalysisSchema>;
export type EC2InstanceRecommendation = z.infer<typeof EC2InstanceRecommendationSchema>;
export type EBSVolumeRecommendation = z.infer<typeof EBSVolumeRecommendationSchema>;