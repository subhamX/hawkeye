import ProtectedRoute from '@/components/auth/protected-route';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import RecommendationsList from '@/components/dashboard/recommendations-list';
import AnalysisTrigger from '@/components/dashboard/analysis-trigger';
import AccountConfigEditor from '@/components/dashboard/account-config-editor';
import { auth } from '@/lib/auth';
import { dashboardService } from '@/lib/db/dashboard';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Play,
  Settings,
  TrendingUp,
} from 'lucide-react';

interface AccountDashboardPageProps {
  params: {
    accountId: string;
  };
}

export default async function AccountDashboardPage({
  params,
}: AccountDashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get account dashboard data
  const dashboardData = await dashboardService.getAccountDashboard(
    params.accountId,
    session.user.id
  );

  if (!dashboardData) {
    notFound();
  }

  const {
    account,
    analysisHistory,
    totalPotentialSavings,
    lastRunDate,
    servicesBreakdown,
    recommendations,
  } = dashboardData;
  const latestRun = analysisHistory[0];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout 
        title={`AWS Account ${account.accountId}`}
        subtitle={`${account.regions.length} regions monitored`}
        showBackButton={true}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
        user={session?.user}
      >
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Potential Savings
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${totalPotentialSavings.toFixed(2)}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Per month based on last analysis
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Last Analysis
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {lastRunDate
                    ? `${Math.floor((Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24))}d ago`
                    : 'Never'}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {latestRun && (
                    <span className="flex items-center gap-1">
                      {getStatusIcon(latestRun.status)}
                      {latestRun.status}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active Services
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {Object.values(servicesBreakdown).filter(s => s.enabled).length}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Services being monitored
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Analysis Runs
                </CardTitle>
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analysisHistory.length}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Total analysis runs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Control */}
          <AnalysisTrigger
            accountId={account.id}
            currentStatus={latestRun?.status}
            lastRunId={latestRun?.id}
          />

          {/* Account Configuration */}
          <AccountConfigEditor account={account} />

          {/* Recommendations */}
          {recommendations && (
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">
                  Cost Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecommendationsList
                  s3Recommendations={recommendations.s3}
                  ec2Recommendations={recommendations.ec2}
                  ebsRecommendations={recommendations.ebs}
                />
              </CardContent>
            </Card>
          )}

          {/* Services Breakdown */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Service Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(servicesBreakdown).map(
                  ([service, config]) => (
                    <div key={service} className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize text-slate-900 dark:text-white">{service}</h4>
                        <Badge
                          variant={config.enabled ? 'default' : 'secondary'}
                          className={config.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}
                        >
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {config.enabled && config.lastSavings !== undefined ? (
                        <div>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${config.lastSavings.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Monthly savings
                          </p>
                        </div>
                      ) : config.enabled ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No analysis data yet
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Service disabled
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis History */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <CardTitle className="text-slate-900 dark:text-white">Analysis History</CardTitle>
                <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analysisHistory.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">No Analysis Runs Yet</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Run your first analysis to start getting cost optimization
                    recommendations.
                  </p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href={`/dashboard/account/${account.id}/run`}>
                      <Play className="h-4 w-4 mr-2" />
                      Run First Analysis
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysisHistory.map((run) => (
                    <div
                      key={run.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-lg space-y-4 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(run.status)}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            Analysis Run {run.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Started {run.startedAt.toLocaleString()}
                            {run.completedAt &&
                              ` • Completed ${run.completedAt.toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge variant={getStatusColor(run.status) as any}>
                          {run.status}
                        </Badge>
                        {(run.totalSavings && run.totalSavings > 0) ? (
                          <div className="text-right">
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              ${run.totalSavings.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              savings found
                            </p>
                          </div>
                        ): null}
                        <Button variant="outline" size="sm" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <Link
                            href={`/dashboard/account/${account.id}/analysis/${run.id}`}
                          >
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
