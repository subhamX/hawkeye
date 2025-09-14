'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  rightsizingEnabled: boolean;
  reservedInstanceRecommendations: boolean;
  spotInstanceRecommendations: boolean;
}



export default function EC2Onboarding({ awsAccount, onNext, onBack }: EC2OnboardingProps) {
  const [enabled, setEnabled] = useState(true);

  const [rightsizingEnabled, setRightsizingEnabled] = useState(true);
  const [reservedInstanceRecommendations, setReservedInstanceRecommendations] = useState(true);
  const [spotInstanceRecommendations, setSpotInstanceRecommendations] = useState(true);






  const handleNext = () => {
    const config: EC2OnboardingConfig = {
      enabled,
      rightsizingEnabled: enabled ? rightsizingEnabled : false,
      reservedInstanceRecommendations: enabled ? reservedInstanceRecommendations : false,
      spotInstanceRecommendations: enabled ? spotInstanceRecommendations : false,
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

              {/* Monitored Regions Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Monitored Regions ({awsAccount.regions.length})</h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    EC2 monitoring will be enabled for all regions configured in your AWS account:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {awsAccount.regions.map((regionValue) => {
                      const region = AWS_REGIONS.find(r => r.value === regionValue);
                      return (
                        <span
                          key={regionValue}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                        >
                          {region?.label || regionValue}
                        </span>
                      );
                    })}
                  </div>
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