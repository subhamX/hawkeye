'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { HAWKEYE_ACCOUNT_ID, AWS_REGIONS } from '../../../constants';
import { validateAWSRole } from '@/lib/actions/aws-actions';
import Link from 'next/link';

interface AWSAccountSetupProps {
  onNext: (data: AWSAccountData) => void;
  onBack?: () => void;
}

export interface AWSAccountData {
  roleArn: string;
  regions: string[];
  accountId: string;
}

export default function AWSAccountSetup({
  onNext,
  onBack,
}: AWSAccountSetupProps) {
  const [roleArn, setRoleArn] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(
    new Set(['us-east-1'])
  );
  const [isPending, startTransition] = useTransition();
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    accountId?: string;
    error?: string;
    missingPermissions?: string[];
  } | null>(null);

  const handleValidate = () => {
    if (!roleArn.trim()) {
      setValidationResult({
        isValid: false,
        error: 'Please enter a valid IAM Role ARN',
      });
      return;
    }

    setValidationResult(null);

    startTransition(async () => {
      try {
        const result = await validateAWSRole(
          roleArn,
          Array.from(selectedRegions)
        );
        setValidationResult(result);
      } catch (error) {
        setValidationResult({
          isValid: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        });
      }
    });
  };

  const handleNext = () => {
    if (validationResult?.isValid && validationResult.accountId) {
      onNext({
        roleArn,
        regions: Array.from(selectedRegions),
        accountId: validationResult.accountId,
      });
    }
  };

  const awsRegions = AWS_REGIONS;

  const handleRegionToggle = (regionValue: string, selected: boolean) => {
    const newSelected = new Set(selectedRegions);
    if (selected) {
      newSelected.add(regionValue);
    } else {
      newSelected.delete(regionValue);
    }
    setSelectedRegions(newSelected);
  };

  const handleSelectPopularRegions = () => {
    const popularRegions = new Set(
      AWS_REGIONS.filter((r) => r.popular).map((r) => r.value)
    );
    setSelectedRegions(popularRegions);
  };

  const handleSelectAllRegions = () => {
    const allRegions = new Set(AWS_REGIONS.map((r) => r.value));
    setSelectedRegions(allRegions);
  };

  const handleClearRegions = () => {
    setSelectedRegions(new Set());
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Connect Your AWS Account</h3>
        <p className="text-muted-foreground mb-6">
          To analyze your AWS resources, HawkEye needs access to your AWS
          account through an IAM role. This ensures secure, limited access to
          only the resources needed for cost optimization.
        </p>
      </div>

      {/* IAM Role Setup Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
            1
          </span>
          Create an IAM Role in AWS
        </h4>
        <div className="ml-7 space-y-2 text-sm text-muted-foreground">
          <p>1. Go to the AWS IAM Console → Roles → Create Role</p>
          <p>
            2. Select "Another AWS account" and enter Account ID:{' '}
            <code className="bg-background px-1 rounded">
              {HAWKEYE_ACCOUNT_ID}
            </code>
          </p>
          <p>3. Attach the following policies:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>AdministratorAccess (AWS managed policy)</li>
          </ul>
          <p>4. Name your role (e.g., "HawkEyeRole") and create it</p>
          <p>5. Copy the Role ARN from the role summary page</p>
        </div>
        <Link
          target="_blank"
          href="https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1#/roles"
        >
          <Button variant="outline" size="sm" className="ml-7">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open AWS IAM Console
          </Button>
        </Link>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="roleArn">IAM Role ARN *</Label>
          <Input
            id="roleArn"
            placeholder="arn:aws:iam::123456789012:role/HawkEyeRole"
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            The ARN of the IAM role you created for HawkEye
          </p>
        </div>

        <div>
          <Label>AWS Regions to Monitor *</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Select the AWS regions where you have resources that you want to
            monitor for cost optimization.
          </p>

          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectPopularRegions}
            >
              Select Popular Regions
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllRegions}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearRegions}
            >
              Clear All
            </Button>
          </div>

          {/* Selected Regions Summary */}
          {selectedRegions.size > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {selectedRegions.size} region
                  {selectedRegions.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedRegions)
                  .slice(0, 5)
                  .map((regionValue) => {
                    const region = AWS_REGIONS.find(
                      (r) => r.value === regionValue
                    );
                    return (
                      <Badge
                        key={regionValue}
                        variant="secondary"
                        className="text-xs"
                      >
                        {region?.label || regionValue}
                      </Badge>
                    );
                  })}
                {selectedRegions.size > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedRegions.size - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Region Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
            {AWS_REGIONS.map((region) => (
              <div
                key={region.value}
                className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                onClick={() =>
                  handleRegionToggle(
                    region.value,
                    !selectedRegions.has(region.value)
                  )
                }
              >
                <Checkbox
                  checked={selectedRegions.has(region.value)}
                  onCheckedChange={(checked) =>
                    handleRegionToggle(region.value, checked as boolean)
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {region.label}
                    </span>
                    {region.popular && (
                      <Badge variant="outline" className="text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {region.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleValidate}
          disabled={!roleArn.trim() || selectedRegions.size === 0 || isPending}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validating Role...
            </>
          ) : (
            'Validate AWS Role'
          )}
        </Button>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-3">
          {validationResult.isValid ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ AWS role validated successfully! Account ID:{' '}
                {validationResult.accountId}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationResult.error}
                {validationResult.missingPermissions && (
                  <div className="mt-2">
                    <p className="font-medium">Missing permissions:</p>
                    <ul className="list-disc list-inside ml-4">
                      {validationResult.missingPermissions.map(
                        (permission, index) => (
                          <li key={index}>{permission}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={handleNext} disabled={!validationResult?.isValid}>
          Continue to Service Selection
        </Button>
      </div>
    </div>
  );
}
