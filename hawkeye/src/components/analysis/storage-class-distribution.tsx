'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { BucketSummary } from '../../../drizzle-db/schema/app';
import { formatBytesToMB, bytesToMB } from '@/lib/utils/format';

interface StorageClassDistributionProps {
  buckets: BucketSummary[];
}

const STORAGE_CLASS_COLORS = {
  STANDARD: '#3b82f6',
  STANDARD_IA: '#10b981',
  ONEZONE_IA: '#f59e0b',
  GLACIER: '#8b5cf6',
  DEEP_ARCHIVE: '#ef4444',
  REDUCED_REDUNDANCY: '#6b7280',
  INTELLIGENT_TIERING: '#06b6d4',
};

export default function StorageClassDistribution({ buckets }: StorageClassDistributionProps) {
  // Aggregate storage class data across all buckets
  const storageClassTotals: { [key: string]: { sizeBytes: number; objectCount: number } } = {};

  buckets.forEach(bucket => {
    if (bucket.storageClasses) {
      Object.entries(bucket.storageClasses).forEach(([storageClass, data]) => {
        if (!storageClassTotals[storageClass]) {
          storageClassTotals[storageClass] = { sizeBytes: 0, objectCount: 0 };
        }
        storageClassTotals[storageClass].sizeBytes += data.sizeBytes;
        storageClassTotals[storageClass].objectCount += data.objectCount;
      });
    }
  });

  const data = Object.entries(storageClassTotals).map(([storageClass, totals]) => ({
    name: storageClass.replace(/_/g, ' '),
    value: bytesToMB(totals.sizeBytes),
    objectCount: totals.objectCount,
    color: STORAGE_CLASS_COLORS[storageClass as keyof typeof STORAGE_CLASS_COLORS] || '#6b7280',
  })).filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        value: number;
        objectCount: number;
        color: string;
      };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Size: {data.value.toFixed(2)} MB
          </p>
          <p className="text-sm text-muted-foreground">
            Objects: {data.objectCount.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No storage class data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => `${name} ${((typeof value === 'number' ? value : Number(value)) * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}