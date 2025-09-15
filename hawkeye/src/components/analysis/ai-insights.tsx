'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  Target,
  DollarSign,
  Clock,
} from 'lucide-react';

interface AIInsightsProps {
  s3Results?: any;
  ec2Results?: any;
  analysisRun: any;
}

export default function AIInsights({ s3Results, ec2Results, analysisRun }: AIInsightsProps) {
  const generateInsights = () => {
    const insights = [];
    
    // S3 Insights
    if (s3Results) {
      const totalSavings = parseFloat(s3Results.potentialSavings || '0');
      const emptyBuckets = s3Results.bucketSummaries?.filter((b: any) => b.isEmpty) || [];
      const totalStorage = parseFloat(s3Results.totalStorageGB || '0');
      
      if (totalSavings > 100) {
        insights.push({
          type: 'opportunity',
          title: 'Significant Cost Optimization Potential',
          description: `Your S3 storage has ${totalSavings.toFixed(0)} in monthly savings potential. Focus on implementing lifecycle policies and storage class transitions for maximum impact.`,
          impact: 'High',
          category: 'Cost Optimization'
        });
      }
      
      if (emptyBuckets.length > 0) {
        insights.push({
          type: 'action',
          title: 'Empty Bucket Cleanup Opportunity',
          description: `Found ${emptyBuckets.length} empty bucket${emptyBuckets.length > 1 ? 's' : ''} that can be deleted immediately. This will reduce management overhead and eliminate unnecessary costs.`,
          impact: 'Medium',
          category: 'Resource Cleanup'
        });
      }
      
      if (totalStorage > 1000) {
        insights.push({
          type: 'strategy',
          title: 'Large-Scale Storage Optimization',
          description: `With ${totalStorage.toFixed(0)}GB of storage, implementing automated lifecycle policies and intelligent tiering could yield substantial ongoing savings.`,
          impact: 'High',
          category: 'Automation'
        });
      }
      
      // Age analysis insights
      if (s3Results.ageAnalysis) {
        const oldObjects = s3Results.ageAnalysis.ageDistribution.moreThan365Days;
        if (oldObjects > 1000) {
          insights.push({
            type: 'optimization',
            title: 'Archive Old Objects',
            description: `${oldObjects.toLocaleString()} objects are over 1 year old. Moving these to Glacier or Deep Archive could reduce costs by up to 80%.`,
            impact: 'High',
            category: 'Storage Tiering'
          });
        }
      }
    }
    
    // EC2 Insights
    if (ec2Results) {
      const unusedVolumes = ec2Results.unusedEBSVolumes?.length || 0;
      const utilizationIssues = ec2Results.utilizationRecommendations?.length || 0;
      
      if (unusedVolumes > 0) {
        insights.push({
          type: 'action',
          title: 'Unused EBS Volume Cleanup',
          description: `${unusedVolumes} unused EBS volume${unusedVolumes > 1 ? 's' : ''} detected. These can be safely removed to eliminate ongoing storage costs.`,
          impact: 'Medium',
          category: 'Resource Cleanup'
        });
      }
      
      if (utilizationIssues > 0) {
        insights.push({
          type: 'optimization',
          title: 'EC2 Right-sizing Opportunities',
          description: `${utilizationIssues} instance${utilizationIssues > 1 ? 's' : ''} show optimization potential. Right-sizing can reduce compute costs while maintaining performance.`,
          impact: 'High',
          category: 'Right-sizing'
        });
      }
    }
    
    // General insights
    const analysisAge = Math.floor((Date.now() - analysisRun.startedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (analysisAge > 30) {
      insights.push({
        type: 'maintenance',
        title: 'Regular Analysis Recommended',
        description: `This analysis is ${analysisAge} days old. Running monthly analyses helps identify new optimization opportunities as your infrastructure evolves.`,
        impact: 'Low',
        category: 'Best Practice'
      });
    }
    
    return insights;
  };

  const insights = generateInsights();
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'action':
        return <Target className="h-5 w-5 text-orange-600" />;
      case 'optimization':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'strategy':
        return <Lightbulb className="h-5 w-5 text-purple-600" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <Brain className="h-5 w-5 text-primary" />;
    }
  };
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalPotentialSavings = 
    (parseFloat(s3Results?.potentialSavings || '0') + 
     parseFloat(ec2Results?.potentialSavings || '0'));

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ${totalPotentialSavings.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Savings Potential</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {insights.length}
              </div>
              <div className="text-sm text-muted-foreground">AI-Generated Insights</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {insights.filter(i => i.impact === 'High').length}
              </div>
              <div className="text-sm text-muted-foreground">High-Impact Opportunities</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                </div>
                <Badge className={getImpactColor(insight.impact)}>
                  {insight.impact} Impact
                </Badge>
              </div>
              <Badge variant="outline" className="w-fit">
                {insight.category}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights
              .filter(i => i.type === 'action' || i.impact === 'High')
              .slice(0, 5)
              .map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Analysis Started:</span> {analysisRun.startedAt.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Analysis Completed:</span> {analysisRun.completedAt?.toLocaleString() || 'In Progress'}
            </div>
            <div>
              <span className="font-medium">Services Analyzed:</span> 
              {s3Results && ' S3'}
              {ec2Results && ' EC2/EBS'}
            </div>
            <div>
              <span className="font-medium">Analysis Status:</span> 
              <Badge variant={analysisRun.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                {analysisRun.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}