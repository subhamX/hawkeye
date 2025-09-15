'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BucketSummary } from '../../../drizzle-db/schema/app';
import { formatBytesToMB, bytesToMB } from '@/lib/utils/format';

interface S3BucketChartProps {
  buckets: BucketSummary[];
}

export default function S3BucketChart({ buckets }: S3BucketChartProps) {
  const data = buckets.map(bucket => ({
    name: bucket.bucketName.length > 20 
      ? bucket.bucketName.substring(0, 20) + '...' 
      : bucket.bucketName,
    fullName: bucket.bucketName,
    sizeMB: bytesToMB(bucket.totalSizeBytes),
    objectCount: bucket.objectCount,
    isEmpty: bucket.isEmpty,
  })).sort((a, b) => b.sizeMB - a.sizeMB);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        fullName: string;
        sizeMB: number;
        objectCount: number;
        isEmpty: boolean;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">
            Size: {data.sizeMB.toFixed(2)} MB
          </p>
          <p className="text-sm text-muted-foreground">
            Objects: {data.objectCount.toLocaleString()}
          </p>
          {data.isEmpty && (
            <p className="text-sm text-orange-600 font-medium">Empty Bucket</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (buckets.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No bucket data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="name" 
            className="text-xs fill-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="sizeMB" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}