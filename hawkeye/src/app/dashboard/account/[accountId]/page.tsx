import ProtectedRoute from '@/components/auth/protected-route';
import UserProfile from '@/components/auth/user-profile';
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
  ArrowLeft,
  DollarSign,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Play,
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
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    AWS Account {account.accountId}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {account.regions.length} regions monitored
                  </p>
                </div>
              </div>
              <UserProfile />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Potential Savings
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${totalPotentialSavings.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per month based on last analysis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Last Analysis
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {lastRunDate
                      ? `${Math.floor((Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24))}d ago`
                      : 'Never'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {latestRun && (
                      <span className="flex items-center gap-1">
                        {getStatusIcon(latestRun.status)}
                        {latestRun.status}
                      </span>
                    )}
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
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Cost Optimization Recommendations
                </h2>
                <RecommendationsList
                  s3Recommendations={recommendations.s3}
                  ec2Recommendations={recommendations.ec2}
                  ebsRecommendations={recommendations.ebs}
                />
              </div>
            )}

            {/* Services Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Service Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(servicesBreakdown).map(
                    ([service, config]) => (
                      <div key={service} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">{service}</h4>
                          <Badge
                            variant={config.enabled ? 'default' : 'secondary'}
                          >
                            {config.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        {config.enabled && config.lastSavings !== undefined ? (
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              ${config.lastSavings.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Monthly savings
                            </p>
                          </div>
                        ) : config.enabled ? (
                          <p className="text-sm text-muted-foreground">
                            No analysis data yet
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Analysis History</CardTitle>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {analysisHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Analysis Runs Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Run your first analysis to start getting cost optimization
                      recommendations.
                    </p>
                    <Button asChild>
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
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(run.status)}
                          <div>
                            <p className="font-medium">
                              Analysis Run {run.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
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
                              <p className="font-semibold text-green-600">
                                ${run.totalSavings.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                savings found
                              </p>
                            </div>
                          ): null}
                          <Button variant="outline" size="sm" asChild>
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
