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

    // TODO: Queue the actual analysis job (will be implemented in task 9)
    // For now, we'll just create the run record
    
    // Revalidate the dashboard pages to show the new run
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/account/${accountId}`);

    return { 
      success: true, 
      runId: newRun.id,
      message: 'Analysis started successfully' 
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