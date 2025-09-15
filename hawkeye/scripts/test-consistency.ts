#!/usr/bin/env bun

/**
 * Test script for the report consistency service
 * 
 * Usage:
 *   bun run scripts/test-consistency.ts
 */

import { reportConsistencyService } from '../src/lib/analysis/report-consistency';
import type { 
  S3Recommendation, 
  EC2Recommendation, 
  EBSRecommendation,
  AgeAnalysisResult,
  ParquetAnalysisResult,
  PartitioningAnalysisResult
} from '../drizzle-db/schema';

// Mock data for testing
const mockS3Recommendations: S3Recommendation[] = [
  {
    bucketName: 'test-bucket-1',
    objectCount: 1000,
    currentStorageClass: 'STANDARD',
    recommendedStorageClass: 'STANDARD_IA',
    potentialSavings: 150.50,
    confidence: 0.85,
    category: 'cost' as const,
    aiGeneratedReport: 'This bucket has objects older than 30 days that could benefit from Infrequent Access storage class.'
  },
  {
    bucketName: 'test-bucket-2',
    objectCount: 0,
    currentStorageClass: 'EMPTY',
    recommendedStorageClass: 'DELETE',
    potentialSavings: 0.50,
    confidence: 0.95,
    category: 'cost' as const,
    aiGeneratedReport: 'Empty bucket that can be safely deleted.'
  }
];

const mockEC2Recommendations: EC2Recommendation[] = [
  {
    instanceId: 'i-1234567890abcdef0',
    instanceType: 't3.large',
    recommendationType: 'downsize',
    category: 'cost' as const,
    potentialSavings: 45.20,
    aiGeneratedReport: 'Instance shows low CPU utilization and could be downsized to t3.medium.'
  }
];

const mockEBSRecommendations: EBSRecommendation[] = [
  {
    volumeId: 'vol-1234567890abcdef0',
    size: 100,
    volumeType: 'gp2',
    category: 'cost' as const,
    potentialSavings: 8.00,
    aiGeneratedReport: 'Unused EBS volume that can be deleted.'
  }
];

const mockLastReport = {
  s3Results: {
    totalStorageBytes: '1000000000',
    totalObjectCount: 1000,
    potentialSavings: '140.00',
    recommendations: [
      {
        bucketName: 'test-bucket-1',
        objectCount: 1000,
        currentStorageClass: 'STANDARD',
        recommendedStorageClass: 'STANDARD_IA',
        potentialSavings: 140.00, // Slightly different from new recommendation
        confidence: 0.80,
        category: 'cost' as const,
        aiGeneratedReport: 'Previous analysis of this bucket.'
      }
    ],
    bucketSummaries: [],
    ageAnalysis: {
      bucketName: 'test-bucket-1',
      oldObjectsCount: 500,
      oldObjectsTotalSize: 500000000,
      averageAge: 180,
      recommendedLifecyclePolicy: {
        transitionToIA: 30,
        transitionToGlacier: 90,
        estimatedMonthlySavings: 10
      },
      potentialSavings: 120,
      ageDistribution: {
        lessThan30Days: 200,
        between30And90Days: 300,
        between90And365Days: 300,
        moreThan365Days: 200
      }
    } as AgeAnalysisResult,
    parquetAnalysis: {
      bucketName: 'test-bucket-1',
      parquetFileCount: 0,
      averageFileSize: 0,
      recommendCompaction: false,
      estimatedCompactionSavings: 0,
      suggestedCompactionStrategy: 'No parquet files found',
      directoriesWithSmallFiles: []
    } as ParquetAnalysisResult,
    partitioningAnalysis: {
      bucketName: 'test-bucket-1',
      totalFiles: 1000,
      directoriesWithTooManyFiles: [],
      recommendPartitioning: false,
      suggestedPartitioningStrategy: 'No partitioning needed',
      potentialQueryPerformanceImprovement: 'No improvement needed'
    } as PartitioningAnalysisResult,
    createdAt: new Date('2024-01-01')
  },
  ec2Results: {
    totalInstances: 1,
    potentialSavings: '50.00',
    unusedEBSVolumes: [
      {
        volumeId: 'vol-1234567890abcdef0',
        size: 100,
        volumeType: 'gp2',
        category: 'cost' as const,
        potentialSavings: 10.00, // Different from new recommendation
        aiGeneratedReport: 'Previous analysis of this volume.'
      }
    ],
    utilizationRecommendations: [
      {
        instanceId: 'i-1234567890abcdef0',
        instanceType: 't3.large',
        recommendationType: 'downsize',
        category: 'cost' as const,
        potentialSavings: 40.00, // Different from new recommendation
        aiGeneratedReport: 'Previous analysis of this instance.'
      }
    ],
    createdAt: new Date('2024-01-01')
  }
};

async function testConsistencyService() {
  console.log('🧪 Testing Report Consistency Service...\n');

  // Test 1: No previous report (first analysis)
  console.log('Test 1: First analysis (no previous report)');
  const firstAnalysis = reportConsistencyService.applyConsistencyLogic(
    mockS3Recommendations,
    mockEC2Recommendations,
    mockEBSRecommendations,
    null
  );

  console.log('Results:');
  console.log(`- Total savings: $${firstAnalysis.totalSavings.toFixed(2)}`);
  console.log(`- S3 recommendations: ${firstAnalysis.s3Recommendations.length}`);
  console.log(`- EC2 recommendations: ${firstAnalysis.ec2Recommendations.length}`);
  console.log(`- EBS recommendations: ${firstAnalysis.ebsRecommendations.length}`);
  console.log(`- Stability score: ${firstAnalysis.consistencyReport.stabilityScore.toFixed(2)}`);
  console.log('');

  // Test 2: With previous report (consistency applied)
  console.log('Test 2: Analysis with previous report (consistency applied)');
  const consistentAnalysis = reportConsistencyService.applyConsistencyLogic(
    mockS3Recommendations,
    mockEC2Recommendations,
    mockEBSRecommendations,
    mockLastReport
  );

  console.log('Results:');
  console.log(`- Total savings: $${consistentAnalysis.totalSavings.toFixed(2)}`);
  console.log(`- S3 savings variation: ${consistentAnalysis.consistencyReport.s3SavingsVariation.toFixed(1)}%`);
  console.log(`- EC2 savings variation: ${consistentAnalysis.consistencyReport.ec2SavingsVariation.toFixed(1)}%`);
  console.log(`- Recommendations changed: ${consistentAnalysis.consistencyReport.recommendationsChanged}`);
  console.log(`- Stability score: ${consistentAnalysis.consistencyReport.stabilityScore.toFixed(2)}`);
  console.log('');

  // Show detailed comparison
  console.log('Detailed S3 Recommendation Comparison:');
  console.log('Original vs Consistent:');
  mockS3Recommendations.forEach((original) => {
    const consistent = consistentAnalysis.s3Recommendations.find(r => r.bucketName === original.bucketName);
    if (consistent) {
      console.log(`- ${original.bucketName}:`);
      console.log(`  Original savings: $${original.potentialSavings.toFixed(2)}`);
      console.log(`  Consistent savings: $${consistent.potentialSavings.toFixed(2)}`);
      console.log(`  Smoothed: ${original.potentialSavings !== consistent.potentialSavings ? 'Yes' : 'No'}`);
    }
  });

  console.log('\n✅ Consistency service test completed!');
}

// Run the test
testConsistencyService().catch(console.error);