'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Server, Settings, DollarSign } from 'lucide-react';
import { AWS_REGIONS } from '../../../constants';
import { type AWSAccountData } from './aws-account-setup';

interface EC2OnboardingProps {
  awsAccount: AWSAccountData;
  onNext: (config: EC2OnboardingConfig) => void;
  onBack: () => void;
}

export interface EC2OnboardingConfig {
  enabled: boolean;
  monitoredRegions: string[];
  rightsizingEnabled: boolean;
  reservedInstanceRecommendations: boolean;
  spotInstanceRecommendations: boolean;
  instanceTypes: string[];
}

const COMMON_INSTANCE_TYPES = [
  't3.micro', 't3.small', 't3.medium', 't3.large',
  'm5.large', 'm5.xlarge', 'm5.2xlarge',
  'c5.large', 'c5.xlarge', 'c5.2xlarge',
  'r5.large', 'r5.xlarge', 'r5.2xlarge',
];

export default function EC2Onboarding({ awsAccount, onNext, onBack }: EC2OnboardingProps) {
  const [enabled, setEnabled] = useState(true);
  const [monitoredRegions, setMonitoredRegions] = useState<Set<string>>(
    new Set(awsAccount.regions)
  );
  const [rightsizingEnabled, setRightsizingEnabled] = useState(true);
  const [reservedInstanceRecommendations, setReservedInstanceRecommendations] = useState(true);
  const [spotInstanceRecommendations, setSpotInstanceRecommendations] = useState(true);
  const [selectedInstanceTypes, setSelectedInstanceTypes] = useState<Set<string>>(new Set());

  const handleRegionToggle = (regionValue: string, selected: boolean) => {
    const newSelected = new Set(monitoredRegions);
    if (selected) {
      newSelected.add(regionValue);
    } else {
      newSelected.delete(regionValue);
    }
    setMonitoredRegions(newSelected);
  };

  const handleInstanceTypeToggle = (instanceType: string, selected: boolean) => {
    const newSelected = new Set(selectedInstanceTypes);
    if (selected) {
      newSelected.add(instanceType);
    } else {
      newSelected.delete(instanceType);
    }
    setSelectedInstanceTypes(newSelected);
  };

  const handleSelectAllRegions = () => {
    setMonitoredRegions(new Set(awsAccount.regions));
  };

  const handleSelectAllInstanceTypes = () => {
    setSelectedInstanceTypes(new Set(COMMON_INSTANCE_TYPES));
  };

  const handleClearInstanceTypes = () => {
    setSelectedInstanceTypes(new Set());
  };

  const handleNext = () => {
    const config: EC2OnboardingConfig = {
      enabled,
      monitoredRegions: enabled ? Array.from(monitoredRegions) : [],
      rightsizingEnabled: enabled ? rightsizingEnabled : false,
      reservedInstanceRecommendations: enabled ? reservedInstanceRecommendations : false,
      spotInstanceRecommendations: enabled ? spotInstanceRecommendations : false,
      instanceTypes: enabled ? Array.from(selectedInstanceTypes) : [],
    };

    onNext(config);
  };

  return (
    <div className="space-y-6">
      {/* Service Enable/Disable */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <Server className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold">Amazon EC2 Instance Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Monitor EC2 instances and get right-sizing recommendations to reduce costs
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="ec2-enabled">Enable EC2 Monitoring</Label>
          <Switch
            id="ec2-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      {enabled ? (
        <>
          {/* Potential Savings */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Potential EC2 Savings</span>
            </div>
            <p className="text-sm text-green-700">
              EC2 optimization typically saves 15-40% on compute costs through right-sizing,
              Reserved Instance recommendations, and Spot Instance opportunities.
            </p>
          </div>

          {/* Configuration Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                EC2 Monitoring Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Optimization Features */}
              <div className="space-y-4">
                <h4 className="font-medium">Optimization Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="rightsizing">Instance Right-sizing</Label>
                      <p className="text-xs text-muted-foreground">
                        Analyze CPU, memory, and network utilization
                      </p>
                    </div>
                    <Switch
                      id="rightsizing"
                      checked={rightsizingEnabled}
                      onCheckedChange={setRightsizingEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reserved-instances">Reserved Instance Recommendations</Label>
                      <p className="text-xs text-muted-foreground">
                        Identify opportunities for Reserved Instances
                      </p>
                    </div>
                    <Switch
                      id="reserved-instances"
                      checked={reservedInstanceRecommendations}
                      onCheckedChange={setReservedInstanceRecommendations}
                    />
                  </div>

                  <div className="flex items-center justify-between md:col-span-2">
                    <div>
                      <Label htmlFor="spot-instances">Spot Instance Recommendations</Label>
                      <p className="text-xs text-muted-foreground">
                        Identify workloads suitable for Spot Instances
                      </p>
                    </div>
                    <Switch
                      id="spot-instances"
                      checked={spotInstanceRecommendations}
                      onCheckedChange={setSpotInstanceRecommendations}
                    />
                  </div>
                </div>
              </div>

              {/* Monitored Regions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Monitored Regions ({monitoredRegions.size})</h4>
                  <Button variant="outline" size="sm" onClick={handleSelectAllRegions}>
                    Select All Account Regions
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                  {awsAccount.regions.map((regionValue) => {
                    const region = AWS_REGIONS.find(r => r.value === regionValue);
                    return (
                      <div
                        key={regionValue}
                        className="flex items-center space-x-2 p-1"
                      >
                        <Checkbox
                          checked={monitoredRegions.has(regionValue)}
                          onCheckedChange={(checked) => 
                            handleRegionToggle(regionValue, checked as boolean)
                          }
                        />
                        <span className="text-sm truncate">
                          {region?.label || regionValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instance Type Filters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Instance Type Filters (Optional)</h4>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to monitor all instance types, or select specific types
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAllInstanceTypes}>
                      Select Common Types
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearInstanceTypes}>
                      Clear All
                    </Button>
                  </div>
                </div>
                
                {selectedInstanceTypes.size > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Array.from(selectedInstanceTypes).slice(0, 8).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                    {selectedInstanceTypes.size > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedInstanceTypes.size - 8} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                  {COMMON_INSTANCE_TYPES.map((instanceType) => (
                    <div
                      key={instanceType}
                      className="flex items-center space-x-2 p-1"
                    >
                      <Checkbox
                        checked={selectedInstanceTypes.has(instanceType)}
                        onCheckedChange={(checked) => 
                          handleInstanceTypeToggle(instanceType, checked as boolean)
                        }
                      />
                      <span className="text-sm font-mono">
                        {instanceType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">EC2 Monitoring Disabled</h3>
            <p className="text-muted-foreground">
              EC2 instance optimization is disabled. You can enable it later from your dashboard
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
        <Button onClick={handleNext}>
          Continue to EBS Setup
        </Button>
      </div>
    </div>
  );
}