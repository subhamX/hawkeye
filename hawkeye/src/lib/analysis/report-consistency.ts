import { db } from '../db';
import { analysisRuns, s3AnalysisResults, ec2AnalysisResults } from '../../../drizzle-db/schema';
import type { 
  S3Recommendation, 
  EC2Recommendation, 
  EBSRecommendation,
  BucketSummary,
  AgeAnalysisResult,
  ParquetAnalysisResult,
  PartitioningAnalysisResult
} from '../../../drizzle-db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface LastReportData {
  s3Results?: {
    totalStorageBytes: string;
    totalObjectCount: number;
    potentialSavings: string;
    recommendations: S3Recommendation[];
    bucketSummaries: BucketSummary[];
    ageAnalysis: AgeAnalysisResult;
    parquetAnalysis: ParquetAnalysisResult;
    partitioningAnalysis: PartitioningAnalysisResult;
    createdAt: Date;
  };
  ec2Results?: {
    totalInstances: number;
    potentialSavings: string;
    unusedEBSVolumes: EBSRecommendation[];
    utilizationRecommendations: EC2Recommendation[];
    createdAt: Date;
  };
}

export interface ConsistentRecommendations {
  s3Recommendations: S3Recommendation[];
  ec2Recommendations: EC2Recommendation[];
  ebsRecommendations: EBSRecommendation[];
  totalSavings: number;
  consistencyReport: {
    s3SavingsVariation: number;
    ec2SavingsVariation: number;
    recommendationsChanged: number;
    stabilityScore: number; // 0-1, where 1 is most stable
  };
}

export class ReportConsistencyService {
  /**
   * Get the last completed analysis results for an account
   */
  async getLastCompletedReport(accountId: string): Promise<LastReportData | null> {
    try {
      // Get the last completed analysis run (excluding the current one if it's running)
      const [lastCompletedRun] = await db
        .select()
        .from(analysisRuns)
        .where(and(
          eq(analysisRuns.accountId, accountId),
          eq(analysisRuns.status, 'completed')
        ))
        .orderBy(desc(analysisRuns.completedAt))
        .limit(1);

      if (!lastCompletedRun) {
        console.log('    📊 No previous completed analysis found for consistency check');
        return null;
      }

      console.log(`    📊 Found last completed analysis from ${lastCompletedRun.completedAt?.toISOString()}`);

      const lastReportData: LastReportData = {};

      // Get S3 results if available
      if (lastCompletedRun.s3ResultsId) {
        const [s3Result] = await db
          .select()
          .from(s3AnalysisResults)
          .where(eq(s3AnalysisResults.id, lastCompletedRun.s3ResultsId));

        if (s3Result) {
          lastReportData.s3Results = {
            totalStorageBytes: s3Result.totalStorageBytes || '0',
            totalObjectCount: s3Result.totalObjectCount || 0,
            potentialSavings: s3Result.potentialSavings || '0',
            recommendations: s3Result.recommendations as S3Recommendation[] || [],
            bucketSummaries: s3Result.bucketSummaries as BucketSummary[] || [],
            ageAnalysis: s3Result.ageAnalysis as AgeAnalysisResult,
            parquetAnalysis: s3Result.parquetAnalysis as ParquetAnalysisResult,
            partitioningAnalysis: s3Result.partitioningAnalysis as PartitioningAnalysisResult,
            createdAt: s3Result.createdAt
          };
        }
      }

      // Get EC2 results if available
      if (lastCompletedRun.ec2ResultsId) {
        const [ec2Result] = await db
          .select()
          .from(ec2AnalysisResults)
          .where(eq(ec2AnalysisResults.id, lastCompletedRun.ec2ResultsId));

        if (ec2Result) {
          lastReportData.ec2Results = {
            totalInstances: ec2Result.totalInstances || 0,
            potentialSavings: ec2Result.potentialSavings || '0',
            unusedEBSVolumes: ec2Result.unusedEBSVolumes as EBSRecommendation[] || [],
            utilizationRecommendations: ec2Result.utilizationRecommendations as EC2Recommendation[] || [],
            createdAt: ec2Result.createdAt
          };
        }
      }

      return lastReportData;
    } catch (error) {
      console.error('    ❌ Failed to get last completed report:', error);
      return null;
    }
  }

  /**
   * Apply consistency logic to new recommendations using the last report
   */
  applyConsistencyLogic(
    newS3Recommendations: S3Recommendation[],
    newEC2Recommendations: EC2Recommendation[],
    newEBSRecommendations: EBSRecommendation[],
    lastReport: LastReportData | null
  ): ConsistentRecommendations {
    console.log('    🔄 Applying consistency logic to recommendations...');

    if (!lastReport) {
      // No previous report, return new recommendations as-is
      const totalSavings = [
        ...newS3Recommendations,
        ...newEC2Recommendations,
        ...newEBSRecommendations
      ].reduce((sum, rec) => sum + rec.potentialSavings, 0);

      return {
        s3Recommendations: newS3Recommendations,
        ec2Recommendations: newEC2Recommendations,
        ebsRecommendations: newEBSRecommendations,
        totalSavings,
        consistencyReport: {
          s3SavingsVariation: 0,
          ec2SavingsVariation: 0,
          recommendationsChanged: 0,
          stabilityScore: 1.0
        }
      };
    }

    // Apply consistency logic
    const consistentS3 = this.stabilizeS3Recommendations(newS3Recommendations, lastReport.s3Results);
    const consistentEC2 = this.stabilizeEC2Recommendations(newEC2Recommendations, lastReport.ec2Results);
    const consistentEBS = this.stabilizeEBSRecommendations(newEBSRecommendations, lastReport.ec2Results);

    // Calculate variations and stability metrics
    const s3SavingsVariation = this.calculateSavingsVariation(
      consistentS3.reduce((sum, rec) => sum + rec.potentialSavings, 0),
      Number(lastReport.s3Results?.potentialSavings || 0)
    );

    const ec2SavingsVariation = this.calculateSavingsVariation(
      [...consistentEC2, ...consistentEBS].reduce((sum, rec) => sum + rec.potentialSavings, 0),
      Number(lastReport.ec2Results?.potentialSavings || 0)
    );

    const totalSavings = [
      ...consistentS3,
      ...consistentEC2,
      ...consistentEBS
    ].reduce((sum, rec) => sum + rec.potentialSavings, 0);

    const recommendationsChanged = this.countChangedRecommendations(
      newS3Recommendations,
      newEC2Recommendations,
      newEBSRecommendations,
      lastReport
    );

    const stabilityScore = this.calculateStabilityScore(s3SavingsVariation, ec2SavingsVariation, recommendationsChanged);

    console.log(`    📊 Consistency applied: S3 variation ${s3SavingsVariation.toFixed(1)}%, EC2 variation ${ec2SavingsVariation.toFixed(1)}%, stability score ${stabilityScore.toFixed(2)}`);

    return {
      s3Recommendations: consistentS3,
      ec2Recommendations: consistentEC2,
      ebsRecommendations: consistentEBS,
      totalSavings,
      consistencyReport: {
        s3SavingsVariation,
        ec2SavingsVariation,
        recommendationsChanged,
        stabilityScore
      }
    };
  }

  /**
   * Stabilize S3 recommendations against the last report
   */
  private stabilizeS3Recommendations(
    newRecommendations: S3Recommendation[],
    lastS3Results?: LastReportData['s3Results']
  ): S3Recommendation[] {
    if (!lastS3Results || !lastS3Results.recommendations) {
      return newRecommendations;
    }

    const stabilized: S3Recommendation[] = [];
    const maxVariationThreshold = 0.3; // 30% max variation

    for (const newRec of newRecommendations) {
      // Find corresponding recommendation from last report
      const lastRec = lastS3Results.recommendations.find(
        r => r.bucketName === newRec.bucketName && r.category === newRec.category
      );

      if (lastRec) {
        // Apply smoothing to prevent large fluctuations
        const smoothedSavings = this.smoothSavings(newRec.potentialSavings, lastRec.potentialSavings, maxVariationThreshold);
        const smoothedConfidence = this.smoothConfidence(newRec.confidence, lastRec.confidence);

        stabilized.push({
          ...newRec,
          potentialSavings: smoothedSavings,
          confidence: smoothedConfidence,
          aiGeneratedReport: this.enhanceReportWithConsistency(newRec.aiGeneratedReport, lastRec, smoothedSavings !== newRec.potentialSavings)
        });
      } else {
        // New recommendation, keep as-is but mark as new
        stabilized.push({
          ...newRec,
          aiGeneratedReport: `[NEW] ${newRec.aiGeneratedReport}`
        });
      }
    }

    // Add persistent recommendations from last report that are still relevant
    for (const lastRec of lastS3Results.recommendations) {
      const stillExists = newRecommendations.some(
        r => r.bucketName === lastRec.bucketName && r.category === lastRec.category
      );

      if (!stillExists && lastRec.confidence > 0.6) {
        // Keep medium+ confidence recommendations that might have been missed
        stabilized.push({
          ...lastRec,
          potentialSavings: lastRec.potentialSavings * 0.9, // Slightly reduce savings for persistence
          aiGeneratedReport: `[PERSISTENT] ${lastRec.aiGeneratedReport}`
        });
      }
    }

    return stabilized;
  }

  /**
   * Stabilize EC2 recommendations against the last report
   */
  private stabilizeEC2Recommendations(
    newRecommendations: EC2Recommendation[],
    lastEC2Results?: LastReportData['ec2Results']
  ): EC2Recommendation[] {
    if (!lastEC2Results || !lastEC2Results.utilizationRecommendations) {
      return newRecommendations;
    }

    const stabilized: EC2Recommendation[] = [];
    const maxVariationThreshold = 0.25; // 25% max variation for EC2

    for (const newRec of newRecommendations) {
      const lastRec = lastEC2Results.utilizationRecommendations.find(
        r => r.instanceId === newRec.instanceId && r.recommendationType === newRec.recommendationType
      );

      if (lastRec) {
        const smoothedSavings = this.smoothSavings(newRec.potentialSavings, lastRec.potentialSavings, maxVariationThreshold);
        
        stabilized.push({
          ...newRec,
          potentialSavings: smoothedSavings,
          aiGeneratedReport: this.enhanceReportWithConsistency(newRec.aiGeneratedReport, lastRec, smoothedSavings !== newRec.potentialSavings)
        });
      } else {
        stabilized.push({
          ...newRec,
          aiGeneratedReport: `[NEW] ${newRec.aiGeneratedReport}`
        });
      }
    }

    return stabilized;
  }

  /**
   * Stabilize EBS recommendations against the last report
   */
  private stabilizeEBSRecommendations(
    newRecommendations: EBSRecommendation[],
    lastEC2Results?: LastReportData['ec2Results']
  ): EBSRecommendation[] {
    if (!lastEC2Results || !lastEC2Results.unusedEBSVolumes) {
      return newRecommendations;
    }

    const stabilized: EBSRecommendation[] = [];
    const maxVariationThreshold = 0.2; // 20% max variation for EBS

    for (const newRec of newRecommendations) {
      const lastRec = lastEC2Results.unusedEBSVolumes.find(
        r => r.volumeId === newRec.volumeId
      );

      if (lastRec) {
        const smoothedSavings = this.smoothSavings(newRec.potentialSavings, lastRec.potentialSavings, maxVariationThreshold);
        
        stabilized.push({
          ...newRec,
          potentialSavings: smoothedSavings,
          aiGeneratedReport: this.enhanceReportWithConsistency(newRec.aiGeneratedReport, lastRec, smoothedSavings !== newRec.potentialSavings)
        });
      } else {
        stabilized.push({
          ...newRec,
          aiGeneratedReport: `[NEW] ${newRec.aiGeneratedReport}`
        });
      }
    }

    return stabilized;
  }

  /**
   * Smooth savings values to prevent large fluctuations
   */
  private smoothSavings(newSavings: number, lastSavings: number, maxVariationThreshold: number): number {
    if (lastSavings === 0) return newSavings;

    const variation = Math.abs(newSavings - lastSavings) / lastSavings;
    
    if (variation <= maxVariationThreshold) {
      return newSavings; // Small variation, keep new value
    }

    // Large variation, apply smoothing
    const smoothingFactor = 0.7; // 70% new value, 30% old value
    return newSavings * smoothingFactor + lastSavings * (1 - smoothingFactor);
  }

  /**
   * Smooth confidence values
   */
  private smoothConfidence(newConfidence: number, lastConfidence: number): number {
    // Use weighted average favoring higher confidence for stability
    const maxConfidence = Math.max(newConfidence, lastConfidence);
    const minConfidence = Math.min(newConfidence, lastConfidence);
    return (maxConfidence * 0.7) + (minConfidence * 0.3);
  }

  /**
   * Calculate savings variation percentage
   */
  private calculateSavingsVariation(newSavings: number, lastSavings: number): number {
    if (lastSavings === 0) return 0;
    return Math.abs(newSavings - lastSavings) / lastSavings * 100;
  }

  /**
   * Count how many recommendations changed significantly
   */
  private countChangedRecommendations(
    newS3: S3Recommendation[],
    newEC2: EC2Recommendation[],
    newEBS: EBSRecommendation[],
    lastReport: LastReportData
  ): number {
    let changedCount = 0;

    // Count S3 changes
    if (lastReport.s3Results?.recommendations) {
      for (const newRec of newS3) {
        const lastRec = lastReport.s3Results.recommendations.find(
          r => r.bucketName === newRec.bucketName && r.category === newRec.category
        );
        if (!lastRec || Math.abs(newRec.potentialSavings - lastRec.potentialSavings) > lastRec.potentialSavings * 0.2) {
          changedCount++;
        }
      }
    }

    // Count EC2 changes
    if (lastReport.ec2Results?.utilizationRecommendations) {
      for (const newRec of newEC2) {
        const lastRec = lastReport.ec2Results.utilizationRecommendations.find(
          r => r.instanceId === newRec.instanceId && r.recommendationType === newRec.recommendationType
        );
        if (!lastRec || Math.abs(newRec.potentialSavings - lastRec.potentialSavings) > lastRec.potentialSavings * 0.2) {
          changedCount++;
        }
      }
    }

    return changedCount;
  }

  /**
   * Calculate overall stability score
   */
  private calculateStabilityScore(s3Variation: number, ec2Variation: number, changedRecommendations: number): number {
    // Lower variations and fewer changes = higher stability
    const variationScore = Math.max(0, 1 - (s3Variation + ec2Variation) / 200); // Normalize to 0-1
    const changeScore = Math.max(0, 1 - changedRecommendations / 10); // Normalize to 0-1
    
    return (variationScore + changeScore) / 2;
  }

  /**
   * Enhance AI report with consistency information
   */
  private enhanceReportWithConsistency(
    newReport: string,
    lastRecommendation: any,
    wasSmoothed: boolean
  ): string {
    if (wasSmoothed) {
      return `${newReport} [Note: Savings estimate smoothed for consistency with previous analysis]`;
    }
    return newReport;
  }
}

export const reportConsistencyService = new ReportConsistencyService();