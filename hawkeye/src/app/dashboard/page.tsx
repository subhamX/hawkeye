import ProtectedRoute from '@/components/auth/protected-route';
import UserProfile from '@/components/auth/user-profile';
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
  Plus
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  
  // Check if user has completed onboarding
  if (session?.user?.id) {
    const hasAccounts = await awsAccountService.hasAWSAccounts(session.user.id);
    if (!hasAccounts) {
      redirect('/onboarding');
    }
  }

  // Get dashboard data
  const accounts = await dashboardService.getUserDashboardAccounts(session!.user!.id);
  
  // Calculate totals
  const totalAccounts = accounts.length;
  const totalSavings = accounts.reduce((sum, account) => 
    sum + (account.lastAnalysisRun?.totalSavings || 0), 0
  );
  const enabledServicesCount = accounts.reduce((sum, account) => 
    sum + Object.values(account.enabledServices).filter(Boolean).length, 0
  );

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
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AWS Accounts</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAccounts}</div>
                  <p className="text-xs text-muted-foreground">
                    Connected accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enabled Services</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{enabledServicesCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Services being monitored
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalSavings.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Monthly potential savings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Analysis</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {accounts.some(a => a.lastAnalysisRun) ? 
                      Math.max(...accounts
                        .filter(a => a.lastAnalysisRun?.completedAt)
                        .map(a => Math.floor((Date.now() - new Date(a.lastAnalysisRun!.completedAt!).getTime()) / (1000 * 60 * 60 * 24)))
                      ) + 'd' : 'Never'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Days since last run
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AWS Accounts List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">AWS Accounts</h2>
                <Button asChild>
                  <Link href="/onboarding">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Link>
                </Button>
              </div>

              <div className="grid gap-6">
                {accounts.map((account) => (
                  <Card key={account.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            AWS Account {account.accountId}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {account.regions.length} regions • Created {account.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {account.lastAnalysisRun && (
                            <Badge 
                              variant={
                                account.lastAnalysisRun.status === 'completed' ? 'default' :
                                account.lastAnalysisRun.status === 'running' ? 'secondary' :
                                account.lastAnalysisRun.status === 'failed' ? 'destructive' : 'outline'
                              }
                            >
                              {account.lastAnalysisRun.status}
                            </Badge>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/account/${account.id}`}>
                              <Settings className="h-4 w-4 mr-2" />
                              Manage
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium">Enabled Services</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(account.enabledServices)
                              .filter(([_, enabled]) => enabled)
                              .map(([service]) => (
                                <Badge key={service} variant="secondary" className="text-xs">
                                  {service.toUpperCase()}
                                </Badge>
                              ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Regions</p>
                          <p className="text-sm text-muted-foreground">
                            {account.regions.slice(0, 2).join(', ')}
                            {account.regions.length > 2 && ` +${account.regions.length - 2} more`}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Last Analysis</p>
                          <p className="text-sm text-muted-foreground">
                            {account.lastAnalysisRun?.completedAt ? 
                              new Date(account.lastAnalysisRun.completedAt).toLocaleDateString() : 
                              'Never'
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Potential Savings</p>
                          <p className="text-sm font-semibold text-green-600">
                            ${account.lastAnalysisRun?.totalSavings?.toFixed(2) || '0.00'}/month
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center space-x-4">
                          {account.lastAnalysisRun?.status === 'running' || account.lastAnalysisRun?.status === 'pending' ? (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                              Analysis in progress...
                            </div>
                          ) : (
                            <Button size="sm" asChild>
                              <Link href={`/dashboard/account/${account.id}`}>
                                <Play className="h-4 w-4 mr-2" />
                                Run Analysis
                              </Link>
                            </Button>
                          )}
                        </div>
                        
                        <Button variant="ghost" size="sm" asChild>
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
            </div>

            {accounts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No AWS Accounts Connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your first AWS account to start optimizing your cloud costs.
                  </p>
                  <Button asChild>
                    <Link href="/onboarding">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Account
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* More Services Coming */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>More Services Coming Soon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We're continuously expanding HawkEye to support more AWS services for comprehensive cloud optimization.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">RDS Optimization</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Database instance rightsizing and storage optimization
                    </p>
                    <Badge variant="outline">Q2 2025</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Lambda Cost Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Function performance and cost optimization recommendations
                    </p>
                    <Badge variant="outline">Q2 2025</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">CloudFront Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      CDN usage patterns and caching optimization
                    </p>
                    <Badge variant="outline">Q3 2025</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">ELB Optimization</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Load balancer efficiency and cost recommendations
                    </p>
                    <Badge variant="outline">Q3 2025</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Reserved Instances</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      RI recommendations and utilization tracking
                    </p>
                    <Badge variant="outline">Q4 2025</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Cost Anomaly Detection</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      AI-powered unusual spending pattern alerts
                    </p>
                    <Badge variant="outline">Q4 2025</Badge>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Have a specific AWS service you'd like us to prioritize? 
                    <Link href="mailto:feedback@hawkeye.com" className="text-primary hover:underline ml-1">
                      Let us know!
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}