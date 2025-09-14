'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Database, 
  Server, 
  HardDrive, 
  ArrowRight,
  Clock,
  Zap
} from 'lucide-react';

interface OnboardingCompleteProps {
  onboardingData: {
    awsAccount?: {
      accountId: string;
      roleArn: string;
      regions: string[];
    };
    s3Config?: {
      enabled: boolean;
      selectedBuckets: string[];
    };
    ec2Config?: {
      enabled: boolean;
      monitoredRegions: string[];
    };
    ebsConfig?: {
      enabled: boolean;
      monitoredRegions: string[];
    };
    cloudformationConfig?: {
      enabled: boolean;
      monitoredStacks: string[];
    };
  };
  onFinish: () => void;
}

export default function OnboardingComplete({ onboardingData, onFinish }: OnboardingCompleteProps) {
  const enabledServices = [
    onboardingData.s3Config?.enabled && { id: 's3', name: 'Amazon S3' },
    onboardingData.ec2Config?.enabled && { id: 'ec2', name: 'Amazon EC2' },
    onboardingData.ebsConfig?.enabled && { id: 'ebs', name: 'Amazon EBS' },
    onboardingData.cloudformationConfig?.enabled && { id: 'cloudformation', name: 'AWS CloudFormation' },
  ].filter(Boolean) as Array<{ id: string; name: string }>;
  
  const s3BucketCount = onboardingData.s3Config?.selectedBuckets?.length || 0;

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 's3': return <Database className="w-5 h-5" />;
      case 'ec2': return <Server className="w-5 h-5" />;
      case 'ebs': return <HardDrive className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          🎉 Setup Complete!
        </h3>
        <p className="text-muted-foreground text-lg">
          Your AWS account is now connected and ready for cost optimization analysis.
        </p>
      </div>

      {/* Configuration Summary */}
      <div className="grid gap-4 md:grid-cols-2 text-left">
        {/* AWS Account */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              AWS Account Connected
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Account ID:</span>
              <span className="ml-2 font-mono">{onboardingData.awsAccount?.accountId}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Regions:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {onboardingData.awsAccount?.regions?.map((region) => (
                  <Badge key={region} variant="secondary" className="text-xs">
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Services Enabled ({enabledServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {enabledServices.map((service) => (
                <div key={service.id} className="flex items-center gap-2">
                  {getServiceIcon(service.id)}
                  <span className="text-sm">{service.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Configurations */}
        {s3BucketCount > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                S3 Buckets Configured ({s3BucketCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {onboardingData.s3Config?.selectedBuckets?.slice(0, 6).map((bucket) => (
                  <Badge key={bucket} variant="secondary" className="text-xs">
                    {bucket}
                  </Badge>
                ))}
                {s3BucketCount > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{s3BucketCount - 6} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* EC2 Configuration */}
        {onboardingData.ec2Config?.enabled && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                EC2 Monitoring Enabled
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Instance optimization enabled for all configured regions
              </p>
            </CardContent>
          </Card>
        )}

        {/* EBS Configuration */}
        {onboardingData.ebsConfig?.enabled && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                EBS Monitoring Enabled
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Volume optimization enabled for all configured regions
              </p>
            </CardContent>
          </Card>
        )}

        {/* CloudFormation Configuration */}
        {onboardingData.cloudformationConfig?.enabled && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                CloudFormation Analysis Enabled
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Template analysis configured (coming soon)
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Next Steps */}
      <Card className="text-left">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Initial Data Collection</p>
                <p className="text-sm text-muted-foreground">
                  HawkEye will start collecting data from your AWS services. This process runs in the background.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Analysis & Recommendations</p>
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze your usage patterns and generate personalized cost optimization recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Dashboard Ready</p>
                <p className="text-sm text-muted-foreground">
                  Your dashboard will be populated with insights and actionable recommendations within 24-48 hours.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Pro Tip:</strong> You can run your first analysis immediately from the dashboard, 
              though some recommendations may be limited until more data is collected.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="pt-6">
        <Button onClick={onFinish} size="lg" className="px-8">
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}