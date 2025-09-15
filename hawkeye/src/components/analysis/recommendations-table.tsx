'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Info,
  ExternalLink,
  Trash2,
  Archive,
} from 'lucide-react';
import type { S3Recommendation, EC2Recommendation, EBSRecommendation } from '../../../drizzle-db/schema/app';

interface RecommendationsTableProps {
  recommendations: (S3Recommendation | EC2Recommendation | EBSRecommendation)[];
  type: 's3' | 'ec2' | 'ebs';
}

export default function RecommendationsTable({ recommendations, type }: RecommendationsTableProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cost':
        return <DollarSign className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cost':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'security':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getRecommendationIcon = (rec: any) => {
    if (type === 's3') {
      const s3Rec = rec as S3Recommendation;
      if (s3Rec.recommendedStorageClass === 'DELETE') {
        return <Trash2 className="h-4 w-4 text-orange-600" />;
      }
      if (s3Rec.recommendedStorageClass.includes('GLACIER')) {
        return <Archive className="h-4 w-4 text-blue-600" />;
      }
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recommendations available for this analysis.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Resource</TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Potential Savings</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recommendations.map((rec, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getRecommendationIcon(rec)}
                  <div>
                    <div className="font-medium">
                      {type === 's3' && (rec as S3Recommendation).bucketName}
                      {type === 'ec2' && (rec as EC2Recommendation).instanceId}
                      {type === 'ebs' && (rec as EBSRecommendation).volumeId}
                    </div>
                    {type === 's3' && (
                      <div className="text-sm text-muted-foreground">
                        {(rec as S3Recommendation).objectCount.toLocaleString()} objects
                      </div>
                    )}
                    {type === 'ec2' && (
                      <div className="text-sm text-muted-foreground">
                        {(rec as EC2Recommendation).instanceType}
                      </div>
                    )}
                    {type === 'ebs' && (
                      <div className="text-sm text-muted-foreground">
                        {(rec as EBSRecommendation).size} GB • {(rec as EBSRecommendation).volumeType}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-md">
                  {type === 's3' && (
                    <div className="space-y-1">
                      <div className="font-medium">
                        {(rec as S3Recommendation).currentStorageClass} → {(rec as S3Recommendation).recommendedStorageClass}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rec.aiGeneratedReport.split(':')[0]}
                      </div>
                    </div>
                  )}
                  {(type === 'ec2' || type === 'ebs') && (
                    <div className="space-y-1">
                      <div className="font-medium">
                        {type === 'ec2' && (rec as EC2Recommendation).recommendationType}
                        {type === 'ebs' && 'Remove unused volume'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rec.aiGeneratedReport.split(':')[0]}
                      </div>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getCategoryColor(rec.category)}>
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(rec.category)}
                    {rec.category}
                  </div>
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium text-green-600">
                  {formatCurrency(rec.potentialSavings)}
                </div>
                <div className="text-xs text-muted-foreground">per month</div>
              </TableCell>
              <TableCell>
                <div className={`font-medium ${getConfidenceColor((rec as any).confidence || 0.5)}`}>
                  {Math.round(((rec as any).confidence || 0.5) * 100)}%
                </div>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Total Potential Savings</h4>
            <p className="text-sm text-muted-foreground">
              {recommendations.length} recommendation{recommendations.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0))}
            </div>
            <div className="text-sm text-muted-foreground">per month</div>
          </div>
        </div>
      </div>
    </div>
  );
}