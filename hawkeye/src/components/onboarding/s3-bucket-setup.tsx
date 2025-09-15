'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { listS3Buckets, configureS3Buckets } from '@/lib/actions/aws-actions';
import { type AWSAccountData } from './aws-account-setup';

interface S3BucketSetupProps {
  awsAccount: AWSAccountData;
  onNext: (selectedBuckets: string[]) => void;
  onBack: () => void;
}

interface S3Bucket {
  name: string;
  region: string;
  creationDate?: string;
  estimatedSize?: string;
}

export default function S3BucketSetup({
  awsAccount,
  onNext,
  onBack,
}: S3BucketSetupProps) {
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadS3Buckets();
  }, []);

  const loadS3Buckets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await listS3Buckets(
        awsAccount.roleArn,
        awsAccount.regions
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to load S3 buckets');
      }



      console.log(`hawkeye-${awsAccount.accountId}-artifacts`)

      setBuckets(result.buckets || []);

      // Auto-select all buckets by default
      const bucketNames = new Set(
        result.buckets?.map((b: S3Bucket) => b.name) || []
      );
      setSelectedBuckets(bucketNames);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to load S3 buckets'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBucketToggle = (bucketName: string, selected: boolean) => {
    const newSelected = new Set(selectedBuckets);
    if (selected) {
      newSelected.add(bucketName);
    } else {
      newSelected.delete(bucketName);
    }
    setSelectedBuckets(newSelected);
  };

  const handleSelectAll = () => {
    const allBucketNames = new Set(buckets.map((b) => b.name));
    setSelectedBuckets(allBucketNames);
  };

  const handleSelectNone = () => {
    setSelectedBuckets(new Set());
  };

  const handleNext = () => {
    startTransition(async () => {
      try {
        // Configure selected buckets for monitoring
        const result = await configureS3Buckets(
          awsAccount.roleArn,
          awsAccount.regions,
          Array.from(selectedBuckets)
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to configure S3 buckets');
        }

        onNext(Array.from(selectedBuckets));
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to configure S3 buckets'
        );
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your S3 buckets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={loadS3Buckets}>
              Retry
            </Button>
            <Button onClick={() => onNext([])}>Skip S3 Setup</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Configure S3 Bucket Monitoring
        </h3>
        <p className="text-muted-foreground">
          Select the S3 buckets you want to monitor for cost optimization.
          HawkEye will analyze storage patterns and recommend optimal storage
          classes to reduce costs.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <span className="font-medium">
              Found {buckets.length} S3 buckets
            </span>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {selectedBuckets.size} selected
            </div>
            <div className="text-xs text-muted-foreground">for monitoring</div>
          </div>
        </div>
      </div>

      {buckets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No S3 Buckets Found</h3>
            <p className="text-muted-foreground mb-4">
              No S3 buckets were found in your AWS account. You can skip this
              step and add buckets later from your dashboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Select buckets to monitor for cost optimization
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectNone}>
                Select None
              </Button>
            </div>
          </div>

          {/* Bucket List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {buckets.map((bucket) => (
              <Card
                key={bucket.name}
                className={`cursor-pointer transition-all ${
                  selectedBuckets.has(bucket.name)
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:shadow-md'
                }`}
                onClick={() =>
                  handleBucketToggle(
                    bucket.name,
                    !selectedBuckets.has(bucket.name)
                  )
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedBuckets.has(bucket.name)}
                        onCheckedChange={(checked) =>
                          handleBucketToggle(bucket.name, checked as boolean)
                        }
                      />
                      <div>
                        <CardTitle className="text-base">
                          {bucket.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {bucket.region}
                          </Badge>
                          {bucket.estimatedSize && (
                            <Badge variant="outline" className="text-xs">
                              ~{bucket.estimatedSize}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedBuckets.has(bucket.name) && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Configuration Info */}
          {selectedBuckets.size > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                HawkEye will enable Storage Class Analytics and S3 Inventory for
                the selected buckets. This allows us to analyze your storage
                patterns and provide optimization recommendations.
                <br />
                <strong>Note:</strong> It may take 24-48 hours for initial data
                to become available.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="space-x-2">
          {buckets.length > 0 && (
            <Button variant="outline" onClick={() => onNext([])}>
              Skip S3 Setup
            </Button>
          )}
          <Button onClick={handleNext} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configuring Buckets...
              </>
            ) : (
              `Complete Setup${selectedBuckets.size > 0 ? ` (${selectedBuckets.size} buckets)` : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
