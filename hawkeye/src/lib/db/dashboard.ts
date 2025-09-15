import { db } from '../db';
import { awsAccounts, analysisRuns, s3AnalysisResults, ec2AnalysisResults, serviceConfigurations } from '../../../drizzle-db/schema';
import type { S3Recommendation, EC2Recommendation, EBSRecommendation } from '../../../drizzle-db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface DashboardAccount {
  id: string;
  accountId: string;
  roleArn: string;
  regions: string[];
  isActive: boolean;
  createdAt: Date;
  lastAnalysisRun?: {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    s3Savings?: number;
    ec2Savings?: number;
    totalSavings?: number;
  };
  enabledServices: {
    s3: boolean;
    ec2: boolean;
    ebs: boolean;
    cloudformation: boolean;
  };
}

export interface AccountDashboardData {
  account: DashboardAccount;
  analysisHistory: AnalysisRunSummary[];
  totalPotentialSavings: number;
  lastRunDate?: Date;
  servicesBreakdown: {
    s3: { enabled: boolean; lastSavings?: number };
    ec2: { enabled: boolean; lastSavings?: number };
    ebs: { enabled: boolean; lastSavings?: number };
    cloudformation: { enabled: boolean; lastSavings?: number };
  };
  recommendations?: {
    s3: S3Recommendation[];
    ec2: EC2Recommendation[];
    ebs: EBSRecommendation[];
  };
}

export interface AnalysisRunSummary {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  s3Savings?: number;
  ec2Savings?: number;
  totalSavings?: number;
  errorMessage?: string;
}

export class DashboardService {
  /**
   * Get all AWS accounts for a user with their latest analysis data
   */
  async getUserDashboardAccounts(userId: string): Promise<DashboardAccount[]> {
    // Get all AWS accounts for the user
    const accounts = await db
      .select()
      .from(awsAccounts)
      .where(eq(awsAccounts.userId, userId));

    const dashboardAccounts: DashboardAccount[] = [];

    for (const account of accounts) {
      // Get the latest analysis run for this account
      const [latestRun] = await db
        .select()
        .from(analysisRuns)
        .where(eq(analysisRuns.accountId, account.id))
        .orderBy(desc(analysisRuns.startedAt))
        .limit(1);

      // Get enabled services for this account
      const services = await db
        .select()
        .from(serviceConfigurations)
        .where(eq(serviceConfigurations.accountId, account.id));

      const enabledServices = {
        s3: services.find(s => s.serviceType === 's3')?.isEnabled || false,
        ec2: services.find(s => s.serviceType === 'ec2')?.isEnabled || false,
        ebs: services.find(s => s.serviceType === 'ebs')?.isEnabled || false,
        cloudformation: services.find(s => s.serviceType === 'cloudformation')?.isEnabled || false,
      };

      let lastAnalysisRun;
      if (latestRun) {
        // Get savings data from analysis results
        let s3Savings = 0;
        let ec2Savings = 0;

        if (latestRun.s3ResultsId) {
          const [s3Result] = await db
            .select()
            .from(s3AnalysisResults)
            .where(eq(s3AnalysisResults.id, latestRun.s3ResultsId));
          s3Savings = Number(s3Result?.potentialSavings || 0);
        }

        if (latestRun.ec2ResultsId) {
          const [ec2Result] = await db
            .select()
            .from(ec2AnalysisResults)
            .where(eq(ec2AnalysisResults.id, latestRun.ec2ResultsId));
          ec2Savings = Number(ec2Result?.potentialSavings || 0);
        }

        lastAnalysisRun = {
          id: latestRun.id,
          status: latestRun.status as any,
          startedAt: latestRun.startedAt,
          completedAt: latestRun.completedAt || undefined,
          s3Savings,
          ec2Savings,
          totalSavings: s3Savings + ec2Savings,
        };
      }

      dashboardAccounts.push({
        id: account.id,
        accountId: account.accountId,
        roleArn: account.roleArn,
        regions: account.regions as string[],
        isActive: account.isActive,
        createdAt: account.createdAt,
        lastAnalysisRun,
        enabledServices,
      });
    }

    return dashboardAccounts;
  }

  /**
   * Get detailed dashboard data for a specific account
   */
  async getAccountDashboard(accountId: string, userId: string): Promise<AccountDashboardData | null> {
    // Get the account (ensure it belongs to the user)
    const [account] = await db
      .select()
      .from(awsAccounts)
      .where(and(
        eq(awsAccounts.id, accountId),
        eq(awsAccounts.userId, userId)
      ));

    if (!account) {
      return null;
    }

    // Get analysis history (last 10 runs)
    const analysisHistory = await db
      .select()
      .from(analysisRuns)
      .where(eq(analysisRuns.accountId, accountId))
      .orderBy(desc(analysisRuns.startedAt))
      .limit(10);

    // Get enabled services
    const services = await db
      .select()
      .from(serviceConfigurations)
      .where(eq(serviceConfigurations.accountId, accountId));

    // Calculate total potential savings and service breakdown
    let totalPotentialSavings = 0;
    let lastRunDate: Date | undefined;
    const servicesBreakdown = {
      s3: { enabled: false, lastSavings: undefined as number | undefined },
      ec2: { enabled: false, lastSavings: undefined as number | undefined },
      ebs: { enabled: false, lastSavings: undefined as number | undefined },
      cloudformation: { enabled: false, lastSavings: undefined as number | undefined },
    };

    // Set enabled services
    services.forEach(service => {
      if (service.serviceType in servicesBreakdown) {
        (servicesBreakdown as any)[service.serviceType].enabled = service.isEnabled;
      }
    });

    // Get savings and recommendations from the latest completed run
    let recommendations: { s3: S3Recommendation[]; ec2: EC2Recommendation[]; ebs: EBSRecommendation[]; } | undefined;
    const [latestCompletedRun] = analysisHistory.filter(run => run.status === 'completed');
    if (latestCompletedRun) {
      lastRunDate = latestCompletedRun.completedAt || undefined;
      recommendations = { s3: [], ec2: [], ebs: [] };

      if (latestCompletedRun.s3ResultsId) {
        const [s3Result] = await db
          .select()
          .from(s3AnalysisResults)
          .where(eq(s3AnalysisResults.id, latestCompletedRun.s3ResultsId));
        const s3Savings = Number(s3Result?.potentialSavings || 0);
        servicesBreakdown.s3.lastSavings = s3Savings;
        totalPotentialSavings += s3Savings;

        if (s3Result?.recommendations) {
          recommendations.s3 = s3Result.recommendations as S3Recommendation[];
        }
      }

      if (latestCompletedRun.ec2ResultsId) {
        const [ec2Result] = await db
          .select()
          .from(ec2AnalysisResults)
          .where(eq(ec2AnalysisResults.id, latestCompletedRun.ec2ResultsId));
        const ec2Savings = Number(ec2Result?.potentialSavings || 0);
        servicesBreakdown.ec2.lastSavings = ec2Savings;
        totalPotentialSavings += ec2Savings;

        if (ec2Result?.utilizationRecommendations) {
          recommendations.ec2 = ec2Result.utilizationRecommendations as EC2Recommendation[];
        }
        if (ec2Result?.unusedEBSVolumes) {
          recommendations.ebs = ec2Result.unusedEBSVolumes as EBSRecommendation[];
        }
      }
    }

    // Convert analysis history to summary format
    const analysisRunSummaries: AnalysisRunSummary[] = [];
    for (const run of analysisHistory) {
      let s3Savings = 0;
      let ec2Savings = 0;

      if (run.s3ResultsId) {
        const [s3Result] = await db
          .select()
          .from(s3AnalysisResults)
          .where(eq(s3AnalysisResults.id, run.s3ResultsId));
        s3Savings = Number(s3Result?.potentialSavings || 0);
      }

      if (run.ec2ResultsId) {
        const [ec2Result] = await db
          .select()
          .from(ec2AnalysisResults)
          .where(eq(ec2AnalysisResults.id, run.ec2ResultsId));
        ec2Savings = Number(ec2Result?.potentialSavings || 0);
      }

      analysisRunSummaries.push({
        id: run.id,
        status: run.status as any,
        startedAt: run.startedAt,
        completedAt: run.completedAt || undefined,
        s3Savings,
        ec2Savings,
        totalSavings: s3Savings + ec2Savings,
        errorMessage: run.errorMessage || undefined,
      });
    }

    const dashboardAccount: DashboardAccount = {
      id: account.id,
      accountId: account.accountId,
      roleArn: account.roleArn,
      regions: account.regions as string[],
      isActive: account.isActive,
      createdAt: account.createdAt,
      enabledServices: {
        s3: servicesBreakdown.s3.enabled,
        ec2: servicesBreakdown.ec2.enabled,
        ebs: servicesBreakdown.ebs.enabled,
        cloudformation: servicesBreakdown.cloudformation.enabled,
      },
    };

    return {
      account: dashboardAccount,
      analysisHistory: analysisRunSummaries,
      totalPotentialSavings,
      lastRunDate,
      servicesBreakdown,
      recommendations,
    };
  }

  /**
   * Get detailed analysis results for a specific run
   */
  async getAnalysisDetails(runId: string, userId: string) {
    // Get the analysis run and verify user access
    const [analysisRun] = await db
      .select({
        run: analysisRuns,
        account: awsAccounts,
      })
      .from(analysisRuns)
      .innerJoin(awsAccounts, eq(analysisRuns.accountId, awsAccounts.id))
      .where(and(
        eq(analysisRuns.id, runId),
        eq(awsAccounts.userId, userId)
      ));

    if (!analysisRun) {
      return null;
    }

    // Get S3 analysis results if available
    let s3Results = null;
    if (analysisRun.run.s3ResultsId) {
      const [s3Result] = await db
        .select()
        .from(s3AnalysisResults)
        .where(eq(s3AnalysisResults.id, analysisRun.run.s3ResultsId));
      s3Results = s3Result;
    }

    // Get EC2 analysis results if available
    let ec2Results = null;
    if (analysisRun.run.ec2ResultsId) {
      const [ec2Result] = await db
        .select()
        .from(ec2AnalysisResults)
        .where(eq(ec2AnalysisResults.id, analysisRun.run.ec2ResultsId));
      ec2Results = ec2Result;
    }

    return {
      analysisRun: analysisRun.run,
      account: analysisRun.account,
      s3Results,
      ec2Results,
    };
  }
}

export const dashboardService = new DashboardService();