import ProtectedRoute from '@/components/auth/protected-route';
import UserProfile from '@/components/auth/user-profile';
import { auth } from '@/lib/auth';
import { dashboardService } from '@/lib/db/dashboard';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  DollarSign,
  Database,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Trash2,
  Archive,
  HardDrive,
} from 'lucide-react';
import { formatBytesToMB, formatNumber, formatCurrency } from '@/lib/utils/format';
import S3BucketChart from '@/components/analysis/s3-bucket-chart';
import StorageClassDistribution from '@/components/analysis/storage-class-distribution';
import AgeAnalysisChart from '@/components/analysis/age-analysis-chart';
import RecommendationsTable from '@/components/analysis/recommendations-table';
import BucketSummaryCards from '@/components/analysis/bucket-summary-cards';
import AIInsights from '@/components/analysis/ai-insights';

interface AnalysisDetailsPageProps {
  params: {
    accountId: string;
    runId: string;
  };
}

export default async function AnalysisDetailsPage({
  params,
}: AnalysisDetailsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get analysis details
  const analysisData = await dashboardService.getAnalysisDetails(
    params.runId,
    session.user.id
  );

  if (!analysisData) {
    notFound();
  }

  const {
    analysisRun,
    account,
    s3Results,
    ec2Results,
  } = analysisData;



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/account/${params.accountId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Account
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Analysis Report
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {analysisRun.startedAt.toLocaleDateString()} • AWS Account {account.accountId}
                  </p>
                </div>
              </div>
              <UserProfile />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Executive Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Potential Savings
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(
                      (parseFloat(s3Results?.potentialSavings || '0') + 
                       parseFloat(ec2Results?.potentialSavings || '0'))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Monthly savings potential
                  </p>
                </CardContent>
              </Card>

              {s3Results && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Storage
                      </CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatBytesToMB(parseFloat(s3Results.totalStorageBytes || '0'))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Across {s3Results.bucketSummaries?.length || 0} buckets
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Objects
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(s3Results.totalObjectCount || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Objects analyzed
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recommendations
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(s3Results?.recommendations?.length || 0) + 
                     (ec2Results?.utilizationRecommendations?.length || 0) +
                     (ec2Results?.unusedEBSVolumes?.length || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optimization opportunities
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Tabs */}
            <Tabs defaultValue="s3" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="s3" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  S3 Storage Analysis
                </TabsTrigger>
                <TabsTrigger value="ec2" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  EC2/EBS Analysis
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  AI Insights
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
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Storage Distribution by Bucket
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <S3BucketChart buckets={s3Results.bucketSummaries || []} />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Storage Class Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <StorageClassDistribution buckets={s3Results.bucketSummaries || []} />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Age Analysis */}
                    {s3Results.ageAnalysis && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
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
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
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
                  <Card>
                    <CardContent className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">No S3 Analysis Data</h3>
                      <p className="text-muted-foreground">
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
                      <Card>
                        <CardHeader>
                          <CardTitle>EC2 Utilization</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {ec2Results.utilizationRecommendations?.length || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Instances with optimization opportunities
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Unused EBS Volumes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-600">
                            {ec2Results.unusedEBSVolumes?.length || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Volumes that can be removed
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>EC2 Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RecommendationsTable 
                          recommendations={ec2Results.utilizationRecommendations || []}
                          type="ec2"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>EBS Recommendations</CardTitle>
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
                  <Card>
                    <CardContent className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">No EC2/EBS Analysis Data</h3>
                      <p className="text-muted-foreground">
                        EC2/EBS analysis was not performed or failed for this run.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                <AIInsights 
                  s3Results={s3Results}
                  ec2Results={ec2Results}
                  analysisRun={analysisRun}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}