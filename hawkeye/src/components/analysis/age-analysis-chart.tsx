'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AgeAnalysisResult } from '../../../drizzle-db/schema/app';

interface AgeAnalysisChartProps {
  ageAnalysis: AgeAnalysisResult;
}

export default function AgeAnalysisChart({ ageAnalysis }: AgeAnalysisChartProps) {
  const data = [
    {
      name: '< 30 days',
      count: ageAnalysis.ageDistribution.lessThan30Days,
      color: '#10b981',
    },
    {
      name: '30-90 days',
      count: ageAnalysis.ageDistribution.between30And90Days,
      color: '#f59e0b',
    },
    {
      name: '90-365 days',
      count: ageAnalysis.ageDistribution.between90And365Days,
      color: '#ef4444',
    },
    {
      name: '> 365 days',
      count: ageAnalysis.ageDistribution.moreThan365Days,
      color: '#7c3aed',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        count: number;
        color: string;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Objects: {data.count.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {ageAnalysis.ageDistribution.lessThan30Days.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Recent Objects</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {ageAnalysis.ageDistribution.between30And90Days.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Moderate Age</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {ageAnalysis.ageDistribution.between90And365Days.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Old Objects</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {ageAnalysis.ageDistribution.moreThan365Days.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Very Old</div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Lifecycle Policy Recommendation</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Transition to IA:</span> {ageAnalysis.recommendedLifecyclePolicy.transitionToIA} days
          </div>
          <div>
            <span className="font-medium">Transition to Glacier:</span> {ageAnalysis.recommendedLifecyclePolicy.transitionToGlacier} days
          </div>
          <div>
            <span className="font-medium">Estimated Monthly Savings:</span> ${ageAnalysis.recommendedLifecyclePolicy.estimatedMonthlySavings.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}