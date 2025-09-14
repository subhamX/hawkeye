import { ReactNode } from 'react';
import { Progress } from '@/components/ui/progress';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  description?: string;
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  title,
  description,
}: OnboardingLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to HawkEye
            </h1>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
}