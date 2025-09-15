import ProtectedRoute from '@/components/auth/protected-route';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { auth } from '@/lib/auth';
import { dashboardService } from '@/lib/db/dashboard';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Database,
  FileText,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  Archive,
  HardDrive,
  Eye,
} from 'lucide-react';
import {
  formatBytesToMB,
  formatNumber,
  formatCurrency,
} from '@/lib/utils/format';
import S3BucketChart from '@/components/analysis/s3-bucket-chart';
import StorageClassDistribution from '@/components/analysis/storage-class-distribution';
import AgeAnalysisChart from '@/components/analysis/age-analysis-chart';
import RecommendationsTable from '@/components/analysis/recommendations-table';
import BucketSummaryCards from '@/components/analysis/bucket-summary-cards';
import AIInsights from '@/components/analysis/ai-insights';

interface AnalysisDetailsPageProps {
  params: Promise<{
    accountId: string;
    runId: string;
  }>;
}

export default async function AnalysisDetailsPage({
  params,
}: AnalysisDetailsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const { accountId, runId } = await params;

  // Get analysis details
  const analysisData = await dashboardService.getAnalysisDetails(
    runId,
    session.user.id
  );

  if (!analysisData) {
    notFound();
  }

  const { analysisRun, account, s3Results, ec2Results } = analysisData;

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Analysis Report"
        subtitle={`${analysisRun.startedAt.toLocaleDateString()} • AWS Account ${account.accountId}`}
        showBackButton={true}
        backHref={`/dashboard/account/${accountId}`}
        backLabel="Back to Account"
        user={session?.user}
      >
        <div className="space-y-8">
          {/* Executive Summary */}
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
                  {formatCurrency(
                    parseFloat(s3Results?.potentialSavings || '0') +
                      parseFloat(ec2Results?.potentialSavings || '0')
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Monthly savings potential
                </p>
              </CardContent>
            </Card>

            {s3Results && (
              <>
                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Total Storage
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatBytesToMB(
                        parseFloat(s3Results.totalStorageBytes || '0')
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Across {s3Results.bucketSummaries?.length || 0} buckets
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Total Objects
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatNumber(s3Results.totalObjectCount || 0)}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Objects analyzed
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Recommendations
                </CardTitle>
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {(s3Results?.recommendations?.length || 0) +
                    (ec2Results?.utilizationRecommendations?.length || 0) +
                    (ec2Results?.unusedEBSVolumes?.length || 0)}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Optimization opportunities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Tabs */}
          <Tabs defaultValue="s3" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <TabsTrigger
                value="s3"
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
              >
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">S3 Storage Analysis</span>
                <span className="sm:hidden">S3</span>
              </TabsTrigger>
              <TabsTrigger
                value="ec2"
                className="flex items-center gap-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300"
              >
                <HardDrive className="h-4 w-4" />
                <span className="hidden sm:inline">EC2/EBS Analysis</span>
                <span className="sm:hidden">EC2</span>
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="flex items-center gap-2 data-[state=active]:bg-cyan-100 dark:data-[state=active]:bg-cyan-900/30 data-[state=active]:text-cyan-700 dark:data-[state=active]:text-cyan-300"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">AI Insights</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
            </TabsList>

            {/* S3 Analysis Tab */}
            <TabsContent value="s3" className="space-y-6">
              {s3Results ? (
                <>
                  {/* Bucket Summary Cards */}
                  {s3Results.bucketSummaries && (
                    <BucketSummaryCards buckets={s3Results.bucketSummaries} />
                  )}

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                          <BarChart3 className="h-5 w-5" />
                          Storage Distribution by Bucket
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <S3BucketChart
                          buckets={s3Results.bucketSummaries || []}
                        />
                      </CardContent>
                    </Card>

                    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                          <PieChart className="h-5 w-5" />
                          Storage Class Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <StorageClassDistribution
                          buckets={s3Results.bucketSummaries || []}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Age Analysis */}
                  {s3Results.ageAnalysis && (
                    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                          <Archive className="h-5 w-5" />
                          Object Age Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AgeAnalysisChart ageAnalysis={s3Results.ageAnalysis} />
                      </CardContent>
                    </Card>
                  )}

                  {/* S3 Recommendations */}
                  <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <TrendingUp className="h-5 w-5" />
                        S3 Optimization Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RecommendationsTable
                        recommendations={s3Results.recommendations || []}
                        type="s3"
                      />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                  <CardContent className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                      No S3 Analysis Data
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      S3 analysis was not performed or failed for this run.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* EC2/EBS Analysis Tab */}
            <TabsContent value="ec2" className="space-y-6">
              {ec2Results ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">
                          EC2 Utilization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {ec2Results.utilizationRecommendations?.length || 0}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Instances with optimization opportunities
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">
                          Unused EBS Volumes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {ec2Results.unusedEBSVolumes?.length || 0}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Volumes that can be removed
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-slate-900 dark:text-white">
                        EC2 Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RecommendationsTable
                        recommendations={
                          ec2Results.utilizationRecommendations || []
                        }
                        type="ec2"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-slate-900 dark:text-white">
                        EBS Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RecommendationsTable
                        recommendations={ec2Results.unusedEBSVolumes || []}
                        type="ebs"
                      />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                  <CardContent className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                      No EC2/EBS Analysis Data
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      EC2/EBS analysis was not performed or failed for this run.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <AIInsights
                s3Results={
                  s3Results
                    ? {
                        potentialSavings:
                          s3Results.potentialSavings || undefined,
                        totalStorageGB: s3Results.totalStorageBytes
                          ? (
                              parseFloat(s3Results.totalStorageBytes) /
                              (1024 * 1024 * 1024)
                            ).toString()
                          : undefined,
                        bucketSummaries: s3Results.bucketSummaries || undefined,
                        ageAnalysis: s3Results.ageAnalysis
                          ? {
                              ageDistribution: {
                                moreThan365Days:
                                  s3Results.ageAnalysis.ageDistribution
                                    .moreThan365Days,
                              },
                            }
                          : undefined,
                      }
                    : undefined
                }
                ec2Results={
                  ec2Results
                    ? {
                        potentialSavings:
                          ec2Results.potentialSavings || undefined,
                        unusedEBSVolumes:
                          ec2Results.unusedEBSVolumes || undefined,
                        utilizationRecommendations:
                          ec2Results.utilizationRecommendations || undefined,
                      }
                    : undefined
                }
                analysisRun={{
                  startedAt: analysisRun.startedAt,
                  completedAt: analysisRun.completedAt || undefined,
                  status: analysisRun.status,
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
