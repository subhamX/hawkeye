'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Settings, Clock, AlertTriangle } from 'lucide-react';
import { type AWSAccountData } from './aws-account-setup';

interface CloudFormationOnboardingProps {
  awsAccount: AWSAccountData;
  onNext: (config: CloudFormationOnboardingConfig) => void;
  onBack: () => void;
}

export interface CloudFormationOnboardingConfig {
  enabled: boolean;
  monitoredStacks: string[];
  templateAnalysis: boolean;
  resourceOptimization: boolean;
  costEstimation: boolean;
}

export default function CloudFormationOnboarding({ 
  awsAccount, 
  onNext, 
  onBack 
}: CloudFormationOnboardingProps) {
  const [enabled, setEnabled] = useState(false); // Default to disabled as it's coming soon
  const [templateAnalysis, setTemplateAnalysis] = useState(true);
  const [resourceOptimization, setResourceOptimization] = useState(true);
  const [costEstimation, setCostEstimation] = useState(true);
  const [stackNameFilter, setStackNameFilter] = useState('');

  const handleNext = () => {
    const config: CloudFormationOnboardingConfig = {
      enabled,
      monitoredStacks: enabled && stackNameFilter ? [stackNameFilter] : [],
      templateAnalysis: enabled ? templateAnalysis : false,
      resourceOptimization: enabled ? resourceOptimization : false,
      costEstimation: enabled ? costEstimation : false,
    };

    onNext(config);
  };

  return (
    <div className="space-y-6">
      {/* Service Enable/Disable */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              AWS CloudFormation Analysis
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Analyze CloudFormation templates for cost optimization opportunities
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="cfn-enabled">Enable CloudFormation Analysis</Label>
          <Switch
            id="cfn-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span className="font-medium text-amber-800">Feature Preview</span>
        </div>
        <p className="text-sm text-amber-700">
          CloudFormation analysis is currently in development. You can configure it now,
          but the actual analysis will be available in a future release. We'll notify you
          when this feature becomes available.
        </p>
      </div>

      {enabled ? (
        <>
          {/* Configuration Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                CloudFormation Analysis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Analysis Features */}
              <div className="space-y-4">
                <h4 className="font-medium">Analysis Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="template-analysis">Template Analysis</Label>
                      <p className="text-xs text-muted-foreground">
                        Analyze CloudFormation templates for best practices
                      </p>
                    </div>
                    <Switch
                      id="template-analysis"
                      checked={templateAnalysis}
                      onCheckedChange={setTemplateAnalysis}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="resource-optimization">Resource Optimization</Label>
                      <p className="text-xs text-muted-foreground">
                        Identify over-provisioned resources in stacks
                      </p>
                    </div>
                    <Switch
                      id="resource-optimization"
                      checked={resourceOptimization}
                      onCheckedChange={setResourceOptimization}
                    />
                  </div>

                  <div className="flex items-center justify-between md:col-span-2">
                    <div>
                      <Label htmlFor="cost-estimation">Cost Estimation</Label>
                      <p className="text-xs text-muted-foreground">
                        Estimate costs for CloudFormation stacks
                      </p>
                    </div>
                    <Switch
                      id="cost-estimation"
                      checked={costEstimation}
                      onCheckedChange={setCostEstimation}
                    />
                  </div>
                </div>
              </div>

              {/* Stack Filters */}
              <div className="space-y-3">
                <h4 className="font-medium">Stack Filters (Optional)</h4>
                <div className="space-y-2">
                  <Label htmlFor="stack-filter">Stack Name Pattern</Label>
                  <Input
                    id="stack-filter"
                    placeholder="e.g., prod-*, my-app-*"
                    value={stackNameFilter}
                    onChange={(e) => setStackNameFilter(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use wildcards (*) to match multiple stacks. Leave empty to monitor all stacks.
                  </p>
                </div>
              </div>

              {/* Preview Features */}
              <div className="space-y-3">
                <h4 className="font-medium">Planned Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm">Template Validation</h5>
                    <p className="text-xs text-muted-foreground">
                      Validate templates against AWS best practices
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm">Drift Detection</h5>
                    <p className="text-xs text-muted-foreground">
                      Identify resources that have drifted from templates
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm">Cost Forecasting</h5>
                    <p className="text-xs text-muted-foreground">
                      Predict future costs based on stack growth
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm">Security Analysis</h5>
                    <p className="text-xs text-muted-foreground">
                      Identify security issues in templates
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">CloudFormation Analysis Disabled</h3>
            <p className="text-muted-foreground">
              CloudFormation analysis is disabled. You can enable it later when the feature
              becomes available, or continue to complete your setup.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Complete Setup
        </Button>
      </div>
    </div>
  );
}