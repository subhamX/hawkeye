'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  FileText, 
  AlertTriangle, 
  Trash2,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { BucketSummary } from '../../../drizzle-db/schema/app';
import { formatBytesToMB, formatNumber } from '@/lib/utils/format';

interface BucketSummaryCardsProps {
  buckets: BucketSummary[];
}

export default function BucketSummaryCards({ buckets }: BucketSummaryCardsProps) {

  const emptyBuckets = buckets.filter(b => b.isEmpty);
  const nonEmptyBuckets = buckets.filter(b => !b.isEmpty);

  return (
    <div className="space-y-6">
      {/* Empty Buckets Alert */}
      {emptyBuckets.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Empty Buckets Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              Found {emptyBuckets.length} empty bucket{emptyBuckets.length > 1 ? 's' : ''} that can be deleted to reduce costs and management overhead.
            </p>
            <div className="flex flex-wrap gap-2">
              {emptyBuckets.map(bucket => (
                <Badge key={bucket.bucketName} variant="outline" className="border-orange-300">
                  <Trash2 className="h-3 w-3 mr-1" />
                  {bucket.bucketName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bucket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => (
          <Card key={bucket.bucketName} className={bucket.isEmpty ? 'border-orange-200' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-medium truncate">
                  {bucket.bucketName}
                </CardTitle>
                {bucket.isEmpty && (
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    Empty
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {bucket.region}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {formatBytesToMB(bucket.totalSizeBytes)}
                    </div>
                    <div className="text-xs text-muted-foreground">Storage</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {formatNumber(bucket.objectCount)}
                    </div>
                    <div className="text-xs text-muted-foreground">Objects</div>
                  </div>
                </div>
              </div>

              {bucket.lastModified && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Last modified: {new Date(bucket.lastModified).toLocaleDateString()}
                </div>
              )}

              {/* Storage Classes */}
              {bucket.storageClasses && Object.keys(bucket.storageClasses).length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Storage Classes:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(bucket.storageClasses).map(([storageClass, data]) => (
                      <Badge 
                        key={storageClass} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {storageClass.replace(/_/g, ' ')}: {formatBytesToMB(data.sizeBytes)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {bucket.recommendDeletion && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-orange-700">
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">Recommended for deletion</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This empty bucket can be safely removed to reduce costs.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{buckets.length}</div>
            <p className="text-xs text-muted-foreground">Total Buckets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{nonEmptyBuckets.length}</div>
            <p className="text-xs text-muted-foreground">Active Buckets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{emptyBuckets.length}</div>
            <p className="text-xs text-muted-foreground">Empty Buckets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatBytesToMB(buckets.reduce((sum, b) => sum + b.totalSizeBytes, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total Storage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}