import ProtectedRoute from '@/components/auth/protected-route';
import UserProfile from '@/components/auth/user-profile';
import { auth } from '@/lib/auth';
import { awsAccountService } from '@/lib/db/aws-accounts';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  
  // Check if user has completed onboarding
  if (session?.user?.id) {
    const hasAccounts = await awsAccountService.hasAWSAccounts(session.user.id);
    if (!hasAccounts) {
      redirect('/onboarding');
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">
                HawkEye Dashboard
              </h1>
              <UserProfile />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Welcome, {session?.user?.name}!
              </h2>
              <p className="text-muted-foreground">
                You have successfully authenticated with Google. This is your
                protected dashboard where you can manage your AWS cost optimization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  AWS Accounts
                </h3>
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">
                  No accounts connected yet
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  S3 Buckets
                </h3>
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">
                  No buckets monitored yet
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Potential Savings
                </h3>
                <p className="text-2xl font-bold text-green-600">$0</p>
                <p className="text-sm text-muted-foreground">
                  Run analysis to see savings
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Next Steps
              </h3>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  1. Connect your AWS account to start monitoring
                </p>
                <p className="text-muted-foreground">
                  2. Configure S3 buckets for optimization analysis
                </p>
                <p className="text-muted-foreground">
                  3. Run your first cost optimization analysis
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}