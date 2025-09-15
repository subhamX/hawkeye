import ProtectedRoute from '@/components/auth/protected-route';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { auth } from '@/lib/auth';
import { awsAccountService } from '@/lib/db/aws-accounts';
import { dashboardService } from '@/lib/db/dashboard';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Server,
  Database,
  Clock,
  TrendingUp,
  Play,
  Settings,
  Plus,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  console.log(`dashboard`, session?.user);

  // Check if user has completed onboarding
  if (session?.user?.id) {
    const hasAccounts = await awsAccountService.hasAWSAccounts(session.user.id);
    if (!hasAccounts) {
      redirect('/onboarding');
    }
  }

  // Get dashboard data
  const accounts = await dashboardService.getUserDashboardAccounts(
    session!.user!.id
  );

  // Calculate totals
  const totalAccounts = accounts.length;
  const totalSavings = accounts.reduce(
    (sum, account) => sum + (account.lastAnalysisRun?.totalSavings || 0),
    0
  );
  const enabledServicesCount = accounts.reduce(
    (sum, account) =>
      sum + Object.values(account.enabledServices).filter(Boolean).length,
    0
  );

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Dashboard"
        subtitle="Manage your AWS accounts and cost optimization"
        user={session?.user}
      >
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  AWS Accounts
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalAccounts}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Connected accounts
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Enabled Services
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Database className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {enabledServicesCount}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Services being monitored
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Potential Savings
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${totalSavings.toFixed(2)}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Monthly potential savings
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Last Analysis
                </CardTitle>
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {accounts.some((a) => a.lastAnalysisRun)
                    ? Math.max(
                        ...accounts
                          .filter((a) => a.lastAnalysisRun?.completedAt)
                          .map((a) =>
                            Math.floor(
                              (Date.now() -
                                new Date(
                                  a.lastAnalysisRun!.completedAt!
                                ).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )
                      ) + 'd'
                    : 'Never'}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Days since last run
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AWS Accounts List */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                AWS Accounts
              </h2>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link href="/onboarding">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Link>
              </Button>
            </div>

            <div className="grid gap-6">
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200"
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-white">
                          AWS Account {account.accountId}
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {account.regions.length} regions • Created{' '}
                          {account.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {account.lastAnalysisRun && (
                          <Badge
                            variant={
                              account.lastAnalysisRun.status === 'completed'
                                ? 'default'
                                : account.lastAnalysisRun.status === 'running'
                                  ? 'secondary'
                                  : account.lastAnalysisRun.status === 'failed'
                                    ? 'destructive'
                                    : 'outline'
                            }
                          >
                            {account.lastAnalysisRun.status}
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Link href={`/dashboard/account/${account.id}`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Enabled Services
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(account.enabledServices)
                            .filter(([_, enabled]) => enabled)
                            .map(([service]) => (
                              <Badge
                                key={service}
                                variant="secondary"
                                className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              >
                                {service.toUpperCase()}
                              </Badge>
                            ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Regions
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {account.regions.slice(0, 2).join(', ')}
                          {account.regions.length > 2 &&
                            ` +${account.regions.length - 2} more`}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Last Analysis
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {account.lastAnalysisRun?.completedAt
                            ? new Date(
                                account.lastAnalysisRun.completedAt
                              ).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Potential Savings
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          $
                          {account.lastAnalysisRun?.totalSavings?.toFixed(2) ||
                            '0.00'}
                          /month
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        {account.lastAnalysisRun?.status === 'running' ||
                        account.lastAnalysisRun?.status === 'pending' ? (
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Analysis in progress...
                          </div>
                        ) : null}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white"
                      >
                        <Link href={`/dashboard/account/${account.id}`}>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {accounts.length === 0 && (
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <Server className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                    No AWS Accounts Connected
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Connect your first AWS account to start optimizing your
                    cloud costs.
                  </p>
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href="/onboarding">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Account
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* More Services Coming */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <TrendingUp className="h-5 w-5" />
                <span>More Services Coming Soon</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                We're continuously expanding HawkEye to support more AWS
                services for comprehensive cloud optimization.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-white">
                    RDS Optimization
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Database instance rightsizing and storage optimization
                  </p>
                  <Badge variant="outline">Q2 2025</Badge>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-white">
                    Lambda Cost Analysis
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Function performance and cost optimization recommendations
                  </p>
                  <Badge variant="outline">Q2 2025</Badge>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-white">
                    CloudFront Analytics
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    CDN usage patterns and caching optimization
                  </p>
                  <Badge variant="outline">Q3 2025</Badge>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-white">
                    ELB Optimization
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Load balancer efficiency and cost recommendations
                  </p>
                  <Badge variant="outline">Q3 2025</Badge>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-white">
                    Reserved Instances
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    RI recommendations and utilization tracking
                  </p>
                  <Badge variant="outline">Q4 2025</Badge>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-white">
                    Cost Anomaly Detection
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    AI-powered unusual spending pattern alerts
                  </p>
                  <Badge variant="outline">Q4 2025</Badge>
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Have a specific AWS service you'd like us to prioritize?
                  <Link
                    href="mailto:feedback@hawkeye.com"
                    className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    Let us know!
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
