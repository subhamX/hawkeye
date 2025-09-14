'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Database, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { listS3Buckets } from '@/lib/actions/aws-actions';
import { type AWSAccountData } from './aws-account-setup';

interface S3OnboardingProps {
  awsAccount: AWSAccountData;
  onNext: (config: S3OnboardingConfig) => void;
  onBack: () => void;
}

export interface S3OnboardingConfig {
  enabled: boolean;
  selectedBuckets: string[];
  enableStorageAnalytics: boolean;
  enableInventory: boolean;
  lifecyclePolicyRecommendations: boolean;
}

interface S3Bucket {
  name: string;
  region: string;
  creationDate?: string;
  estimatedSize?: string;
}

export default function S3Onboarding({ awsAccount, onNext, onBack }: S3OnboardingProps) {
  const [enabled, setEnabled] = useState(true);
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<Set<string>>(new Set());
  const [enableStorageAnalytics, setEnableStorageAnalytics] = useState(true);
  const [enableInventory, setEnableInventory] = useState(true);
  const [lifecyclePolicyRecommendations, setLifecyclePolicyRecommendations] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (enabled) {
      loadS3Buckets();
    }
  }, [enabled]);

  const loadS3Buckets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await listS3Buckets(awsAccount.roleArn, awsAccount.regions);

      if (!result.success) {
        throw new Error(result.error || 'Failed to load S3 buckets');
      }

      setBuckets(result.buckets || []);

      // Auto-select all buckets by default
      const bucketNames = new Set(result.buckets?.map((b: S3Bucket) => b.name) || []);
      setSelectedBuckets(bucketNames);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load S3 buckets');
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
    const allBucketNames = new Set(buckets.map(b => b.name));
    setSelectedBuckets(allBucketNames);
  };

  const handleSelectNone = () => {
    setSelectedBuckets(new Set());
  };

  const handleNext = () => {
    const config: S3OnboardingConfig = {
      enabled,
      selectedBuckets: enabled ? Array.from(selectedBuckets) : [],
      enableStorageAnalytics: enabled ? enableStorageAnalytics : false,
      enableInventory: enabled ? enableInventory : false,
      lifecyclePolicyRecommendations: enabled ? lifecyclePolicyRecommendations : false,
    };

    onNext(config);
  };

  return (
    <div className="space-y-6">
      {/* Service Enable/Disable */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold">Amazon S3 Storage Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Monitor S3 buckets and get storage class recommendations to reduce costs
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="s3-enabled">Enable S3 Monitoring</Label>
          <Switch
            id="s3-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      {enabled ? (
        <>
          {/* Configuration Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                S3 Monitoring Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="storage-analytics">Storage Class Analytics</Label>
                    <p className="text-xs text-muted-foreground">
                      Analyze access patterns for storage class recommendations
                    </p>
                  </div>
                  <Switch
                    id="storage-analytics"
                    checked={enableStorageAnalytics}
                    onCheckedChange={setEnableStorageAnalytics}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="inventory">S3 Inventory</Label>
                    <p className="text-xs text-muted-foreground">
                      Generate detailed reports of objects and metadata
                    </p>
                  </div>
                  <Switch
                    id="inventory"
                    checked={enableInventory}
                    onCheckedChange={setEnableInventory}
                  />
                </div>

                <div className="flex items-center justify-between md:col-span-2">
                  <div>
                    <Label htmlFor="lifecycle">Lifecycle Policy Recommendations</Label>
                    <p className="text-xs text-muted-foreground">
                      Get AI-powered recommendations for lifecycle policies
                    </p>
                  </div>
                  <Switch
                    id="lifecycle"
                    checked={lifecyclePolicyRecommendations}
                    onCheckedChange={setLifecyclePolicyRecommendations}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bucket Selection */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your S3 buckets...</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button variant="outline" size="sm" onClick={loadS3Buckets} className="ml-2">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    <span className="font-medium">Found {buckets.length} S3 buckets</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{selectedBuckets.size} selected</div>
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
                      No S3 buckets were found in your selected regions. You can skip this step and
                      add buckets later from your dashboard.
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
                        onClick={() => handleBucketToggle(bucket.name, !selectedBuckets.has(bucket.name))}
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
                                <CardTitle className="text-base">{bucket.name}</CardTitle>
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
                </>
              )}
            </>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">S3 Monitoring Disabled</h3>
            <p className="text-muted-foreground">
              S3 storage optimization is disabled. You can enable it later from your dashboard
              or continue with other services.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={isPending}>
          Continue to EC2 Setup
        </Button>
      </div>
    </div>
  );
}