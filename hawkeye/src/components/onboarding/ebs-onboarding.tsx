'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { HardDrive, Settings, DollarSign } from 'lucide-react';
import { AWS_REGIONS } from '../../../constants';
import { type AWSAccountData } from './aws-account-setup';

interface EBSOnboardingProps {
  awsAccount: AWSAccountData;
  onNext: (config: EBSOnboardingConfig) => void;
  onBack: () => void;
}

export interface EBSOnboardingConfig {
  enabled: boolean;
  unusedVolumeDetection: boolean;
  volumeTypeOptimization: boolean;
  snapshotCleanup: boolean;
  minimumVolumeSize: number;
}

export default function EBSOnboarding({ awsAccount, onNext, onBack }: EBSOnboardingProps) {
  const [enabled, setEnabled] = useState(true);

  const [unusedVolumeDetection, setUnusedVolumeDetection] = useState(true);
  const [volumeTypeOptimization, setVolumeTypeOptimization] = useState(true);
  const [snapshotCleanup, setSnapshotCleanup] = useState(true);
  const [minimumVolumeSize, setMinimumVolumeSize] = useState(1);



  const handleNext = () => {
    const config: EBSOnboardingConfig = {
      enabled,
      unusedVolumeDetection: enabled ? unusedVolumeDetection : false,
      volumeTypeOptimization: enabled ? volumeTypeOptimization : false,
      snapshotCleanup: enabled ? snapshotCleanup : false,
      minimumVolumeSize: enabled ? minimumVolumeSize : 0,
    };

    onNext(config);
  };

  return (
    <div className="space-y-6">
      {/* Service Enable/Disable */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <HardDrive className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold">Amazon EBS Volume Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Monitor EBS volumes and get optimization recommendations to reduce storage costs
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="ebs-enabled">Enable EBS Monitoring</Label>
          <Switch
            id="ebs-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      {enabled ? (
        <>
          {/* Potential Savings */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Potential EBS Savings</span>
            </div>
            <p className="text-sm text-blue-700">
              EBS optimization typically saves 10-30% on storage costs by identifying unused volumes,
              optimizing volume types, and cleaning up old snapshots.
            </p>
          </div>

          {/* Configuration Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                EBS Monitoring Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Optimization Features */}
              <div className="space-y-4">
                <h4 className="font-medium">Optimization Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="unused-volumes">Unused Volume Detection</Label>
                      <p className="text-xs text-muted-foreground">
                        Find unattached and unused EBS volumes
                      </p>
                    </div>
                    <Switch
                      id="unused-volumes"
                      checked={unusedVolumeDetection}
                      onCheckedChange={setUnusedVolumeDetection}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="volume-type">Volume Type Optimization</Label>
                      <p className="text-xs text-muted-foreground">
                        Recommend optimal volume types (gp3, io2, etc.)
                      </p>
                    </div>
                    <Switch
                      id="volume-type"
                      checked={volumeTypeOptimization}
                      onCheckedChange={setVolumeTypeOptimization}
                    />
                  </div>

                  <div className="flex items-center justify-between md:col-span-2">
                    <div>
                      <Label htmlFor="snapshot-cleanup">Snapshot Cleanup</Label>
                      <p className="text-xs text-muted-foreground">
                        Identify old and unused snapshots for cleanup
                      </p>
                    </div>
                    <Switch
                      id="snapshot-cleanup"
                      checked={snapshotCleanup}
                      onCheckedChange={setSnapshotCleanup}
                    />
                  </div>
                </div>
              </div>

              {/* Volume Size Filter */}
              <div className="space-y-3">
                <h4 className="font-medium">Volume Size Filter</h4>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="min-size" className="whitespace-nowrap">
                    Minimum volume size to monitor:
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="min-size"
                      type="number"
                      min="1"
                      max="1000"
                      value={minimumVolumeSize}
                      onChange={(e) => setMinimumVolumeSize(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">GB</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only monitor volumes larger than this size to focus on significant cost savings
                </p>
              </div>

              {/* Monitored Regions Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Monitored Regions ({awsAccount.regions.length})</h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    EBS monitoring will be enabled for all regions configured in your AWS account:
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
            <HardDrive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">EBS Monitoring Disabled</h3>
            <p className="text-muted-foreground">
              EBS volume optimization is disabled. You can enable it later from your dashboard
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
          Continue to CloudFormation Setup
        </Button>
      </div>
    </div>
  );
}