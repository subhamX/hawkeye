'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw 
} from 'lucide-react';
import { triggerAnalysis } from '@/lib/actions/analysis';
import { useRouter } from 'next/navigation';

interface AnalysisTriggerProps {
  accountId: string;
  currentStatus?: 'pending' | 'running' | 'completed' | 'failed' | null;
  lastRunId?: string;
}

export default function AnalysisTrigger({ 
  accountId, 
  currentStatus, 
  lastRunId 
}: AnalysisTriggerProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleTriggerAnalysis = () => {
    startTransition(async () => {
      try {
        const result = await triggerAnalysis(accountId);
        
        if (result.success) {
          setMessage({ 
            type: 'success', 
            text: result.message || 'Analysis started successfully' 
          });
          // Refresh the page to show updated status
          router.refresh();
        } else {
          setMessage({ 
            type: 'error', 
            text: result.error || 'Failed to start analysis' 
          });
        }
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: 'An unexpected error occurred' 
        });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const isRunning = currentStatus === 'running' || currentStatus === 'pending';
  const canTrigger = !isRunning && !isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Analysis Control</span>
          {currentStatus && (
            <Badge variant={getStatusColor(currentStatus) as any}>
              <span className="flex items-center gap-1">
                {getStatusIcon(currentStatus)}
                {currentStatus}
              </span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {isRunning ? 'Analysis in Progress' : 'Ready to Analyze'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRunning 
                ? 'Your AWS resources are being analyzed for optimization opportunities'
                : 'Run a comprehensive analysis of your AWS resources to find cost savings'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {isRunning ? (
              <Button variant="outline" size="sm" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.refresh()}
                  disabled={isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  onClick={handleTriggerAnalysis}
                  disabled={!canTrigger}
                  size="sm"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isPending ? 'Starting...' : 'Run Analysis'}
                </Button>
              </>
            )}
          </div>
        </div>

        {isRunning && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-800">
                Analysis Progress
              </span>
            </div>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex items-center justify-between">
                <span>• Scanning S3 buckets and storage analytics</span>
                <span className="text-xs">In progress...</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Analyzing EC2 instances and EBS volumes</span>
                <span className="text-xs">Queued</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Generating AI-powered recommendations</span>
                <span className="text-xs">Queued</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}