'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import AWSAccountSetup, {
  type AWSAccountData,
} from '@/components/onboarding/aws-account-setup';
import S3Onboarding, {
  type S3OnboardingConfig,
} from '@/components/onboarding/s3-onboarding';
import EC2Onboarding, {
  type EC2OnboardingConfig,
} from '@/components/onboarding/ec2-onboarding';
import EBSOnboarding, {
  type EBSOnboardingConfig,
} from '@/components/onboarding/ebs-onboarding';
import CloudFormationOnboarding, {
  type CloudFormationOnboardingConfig,
} from '@/components/onboarding/cloudformation-onboarding';
import OnboardingComplete from '@/components/onboarding/onboarding-complete';
import { completeOnboarding } from '@/lib/actions/onboarding-actions';

type OnboardingStep =
  | 'aws-account'
  | 's3-setup'
  | 'ec2-setup'
  | 'ebs-setup'
  | 'cloudformation-setup'
  | 'complete';

interface OnboardingData {
  awsAccount?: AWSAccountData;
  s3Config?: S3OnboardingConfig;
  ec2Config?: EC2OnboardingConfig;
  ebsConfig?: EBSOnboardingConfig;
  cloudformationConfig?: CloudFormationOnboardingConfig;
}



export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('aws-account');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isPending, startTransition] = useTransition();

  const steps: Record<
    OnboardingStep,
    { title: string; description: string; stepNumber: number }
  > = {
    'aws-account': {
      title: 'Connect Your AWS Account',
      description:
        'Set up secure access to your AWS resources through an IAM role',
      stepNumber: 1,
    },
    's3-setup': {
      title: 'Configure S3 Storage Optimization',
      description:
        'Set up S3 bucket monitoring and storage class recommendations',
      stepNumber: 2,
    },
    'ec2-setup': {
      title: 'Configure EC2 Instance Optimization',
      description:
        'Set up EC2 instance monitoring and right-sizing recommendations',
      stepNumber: 3,
    },
    'ebs-setup': {
      title: 'Configure EBS Volume Optimization',
      description:
        'Set up EBS volume monitoring and optimization recommendations',
      stepNumber: 4,
    },
    'cloudformation-setup': {
      title: 'Configure CloudFormation Analysis',
      description:
        'Set up CloudFormation template analysis and cost optimization',
      stepNumber: 5,
    },
    complete: {
      title: 'Setup Complete!',
      description: 'Your account is ready for cost optimization analysis',
      stepNumber: 6,
    },
  };

  const handleAWSAccountNext = (data: AWSAccountData) => {
    setOnboardingData((prev) => ({ ...prev, awsAccount: data }));
    setCurrentStep('s3-setup');
  };

  const handleS3SetupNext = (config: S3OnboardingConfig) => {
    setOnboardingData((prev) => ({ ...prev, s3Config: config }));
    setCurrentStep('ec2-setup');
  };

  const handleEC2SetupNext = (config: EC2OnboardingConfig) => {
    setOnboardingData((prev) => ({ ...prev, ec2Config: config }));
    setCurrentStep('ebs-setup');
  };

  const handleEBSSetupNext = (config: EBSOnboardingConfig) => {
    setOnboardingData((prev) => ({ ...prev, ebsConfig: config }));
    setCurrentStep('cloudformation-setup');
  };

  const handleCloudFormationSetupNext = (
    config: CloudFormationOnboardingConfig
  ) => {
    setOnboardingData((prev) => ({ ...prev, cloudformationConfig: config }));
    console.log('Onboarding dataxxx:', onboardingData);
    handleComplete();
  };

  const handleComplete = async () => {
    console.log('Onboarding data:', onboardingData);
    try {
      console.log('hh')
      // Save onboarding data to the backend
      await completeOnboarding(onboardingData);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      // Handle error - maybe show a toast or error message
    }
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 's3-setup':
        setCurrentStep('aws-account');
        break;
      case 'ec2-setup':
        setCurrentStep('s3-setup');
        break;
      case 'ebs-setup':
        setCurrentStep('ec2-setup');
        break;
      case 'cloudformation-setup':
        setCurrentStep('ebs-setup');
        break;
      default:
        break;
    }
  };

  const currentStepInfo = steps[currentStep];
  const totalSteps = 6;

  return (
    <OnboardingLayout
      currentStep={currentStepInfo.stepNumber}
      totalSteps={totalSteps}
      title={currentStepInfo.title}
      description={currentStepInfo.description}
    >
      {currentStep === 'aws-account' && (
        <AWSAccountSetup onNext={handleAWSAccountNext} />
      )}

      {currentStep === 's3-setup' && (
        <S3Onboarding
          awsAccount={onboardingData.awsAccount!}
          onNext={handleS3SetupNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'ec2-setup' && (
        <EC2Onboarding
          awsAccount={onboardingData.awsAccount!}
          onNext={handleEC2SetupNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'ebs-setup' && (
        <EBSOnboarding
          awsAccount={onboardingData.awsAccount!}
          onNext={handleEBSSetupNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'cloudformation-setup' && (
        <CloudFormationOnboarding
          awsAccount={onboardingData.awsAccount!}
          onNext={handleCloudFormationSetupNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'complete' && (
        <OnboardingComplete
          onboardingData={onboardingData}
          onFinish={handleFinish}
        />
      )}
    </OnboardingLayout>
  );
}
