'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { analysisRuns, awsAccounts } from '../../../drizzle-db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function triggerAnalysis(accountId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  try {
    // Verify the account belongs to the user
    const [account] = await db
      .select()
      .from(awsAccounts)
      .where(and(
        eq(awsAccounts.id, accountId),
        eq(awsAccounts.userId, session.user.id)
      ));

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Check if there's already a running analysis
    const [existingRun] = await db
      .select()
      .from(analysisRuns)
      .where(and(
        eq(analysisRuns.accountId, accountId),
        eq(analysisRuns.status, 'running')
      ));

    if (existingRun) {
      return { 
        success: false, 
        error: 'An analysis is already running for this account' 
      };
    }

    // Create a new analysis run
    const [newRun] = await db
      .insert(analysisRuns)
      .values({
        accountId,
        status: 'pending',
        startedAt: new Date(),
      })
      .returning();

    // The analysis will be processed by the Heimdall engine (scripts/analyse-heimdall.ts)
    // which now includes inventory-based S3 analysis with:
    // - Object age analysis for lifecycle policy recommendations
    // - Parquet file compaction detection
    // - Partitioning analysis for performance optimization
    // - Cross-region bucket access error handling
    
    // Revalidate the dashboard pages to show the new run
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/account/${accountId}`);

    return { 
      success: true, 
      runId: newRun.id,
      message: 'Analysis started successfully. The system will now use S3 inventory reports for comprehensive analysis including object age, parquet compaction, and partitioning recommendations.' 
    };

  } catch (error) {
    console.error('Failed to trigger analysis:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start analysis' 
    };
  }
}

export async function getAnalysisStatus(runId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    const [run] = await db
      .select({
        id: analysisRuns.id,
        status: analysisRuns.status,
        startedAt: analysisRuns.startedAt,
        completedAt: analysisRuns.completedAt,
        errorMessage: analysisRuns.errorMessage,
      })
      .from(analysisRuns)
      .innerJoin(awsAccounts, eq(analysisRuns.accountId, awsAccounts.id))
      .where(and(
        eq(analysisRuns.id, runId),
        eq(awsAccounts.userId, session.user.id)
      ));

    return run || null;
  } catch (error) {
    console.error('Failed to get analysis status:', error);
    return null;
  }
}

export async function updateAccountConfig(
  accountId: string, 
  config: {
    roleArn: string;
    regions: string[];
    enabledServices: {
      s3: boolean;
      ec2: boolean;
      ebs: boolean;
      cloudformation: boolean;
    };
    isActive: boolean;
  }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  try {
    // Verify the account belongs to the user
    const [account] = await db
      .select()
      .from(awsAccounts)
      .where(and(
        eq(awsAccounts.id, accountId),
        eq(awsAccounts.userId, session.user.id)
      ));

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Update account configuration
    await db
      .update(awsAccounts)
      .set({
        roleArn: config.roleArn,
        regions: config.regions,
        isActive: config.isActive,
      })
      .where(eq(awsAccounts.id, accountId));

    // Update service configurations
    const { serviceConfigurationService } = await import('@/lib/db/service-configurations');
    
    for (const [service, enabled] of Object.entries(config.enabledServices)) {
      await serviceConfigurationService.updateServiceConfiguration(
        accountId,
        service as any,
        { isEnabled: enabled }
      );
    }

    // Revalidate the dashboard pages
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/account/${accountId}`);

    return { 
      success: true, 
      message: 'Account configuration updated successfully' 
    };

  } catch (error) {
    console.error('Failed to update account config:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update configuration' 
    };
  }
}