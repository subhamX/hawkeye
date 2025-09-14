'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Shield, 
  Info, 
  ChevronDown, 
  ChevronUp,
  TrendingUp 
} from 'lucide-react';
import { useState } from 'react';
import type { S3Recommendation, EC2Recommendation, EBSRecommendation } from '../../../drizzle-db/schema';

interface RecommendationsListProps {
  s3Recommendations?: S3Recommendation[];
  ec2Recommendations?: EC2Recommendation[];
  ebsRecommendations?: EBSRecommendation[];
}

type AllRecommendations = (S3Recommendation | EC2Recommendation | EBSRecommendation) & {
  type: 'S3' | 'EC2' | 'EBS';
};

export default function RecommendationsList({ 
  s3Recommendations = [], 
  ec2Recommendations = [], 
  ebsRecommendations = [] 
}: RecommendationsListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    cost: true,
    security: false,
    general: false,
  });

  // Combine all recommendations with type information
  const allRecommendations: AllRecommendations[] = [
    ...s3Recommendations.map(rec => ({ ...rec, type: 'S3' as const })),
    ...ec2Recommendations.map(rec => ({ ...rec, type: 'EC2' as const })),
    ...ebsRecommendations.map(rec => ({ ...rec, type: 'EBS' as const })),
  ];

  // Group recommendations by category
  const categorizedRecommendations = {
    cost: allRecommendations.filter(rec => rec.category === 'cost'),
    security: allRecommendations.filter(rec => rec.category === 'security'),
    general: allRecommendations.filter(rec => rec.category === 'general'),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cost': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'security': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'general': return <Info className="h-4 w-4 text-gray-600" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cost': return 'text-green-600';
      case 'security': return 'text-blue-600';
      case 'general': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getRecommendationTitle = (rec: AllRecommendations) => {
    switch (rec.type) {
      case 'S3':
        const s3Rec = rec as S3Recommendation;
        return `${s3Rec.bucketName} - Storage Class Optimization`;
      case 'EC2':
        const ec2Rec = rec as EC2Recommendation;
        return `${ec2Rec.instanceId} - ${ec2Rec.recommendationType}`;
      case 'EBS':
        const ebsRec = rec as EBSRecommendation;
        return `${ebsRec.volumeId} - Unused Volume`;
      default:
        return 'Recommendation';
    }
  };

  const getRecommendationDescription = (rec: AllRecommendations) => {
    switch (rec.type) {
      case 'S3':
        const s3Rec = rec as S3Recommendation;
        return `Change from ${s3Rec.currentStorageClass} to ${s3Rec.recommendedStorageClass} for ${s3Rec.objectCount} objects`;
      case 'EC2':
        const ec2Rec = rec as EC2Recommendation;
        return `${ec2Rec.instanceType} instance optimization`;
      case 'EBS':
        const ebsRec = rec as EBSRecommendation;
        return `${ebsRec.size}GB ${ebsRec.volumeType} volume not attached`;
      default:
        return '';
    }
  };

  if (allRecommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations Available</h3>
          <p className="text-muted-foreground">
            Run an analysis to get cost optimization recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(categorizedRecommendations).map(([category, recommendations]) => {
        if (recommendations.length === 0) return null;

        const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);
        const isExpanded = expandedCategories[category];

        return (
          <Card key={category}>
            <CardHeader>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(category)}
                  <div>
                    <CardTitle className={`capitalize ${getCategoryColor(category)}`}>
                      {category} Recommendations
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {recommendations.length} recommendations • ${totalSavings.toFixed(2)}/month potential savings
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {recommendations.length}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {rec.type}
                            </Badge>
                            <h4 className="font-medium">
                              {getRecommendationTitle(rec)}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getRecommendationDescription(rec)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            ${rec.potentialSavings.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>
                      
                      {rec.aiGeneratedReport && (
                        <div className="bg-muted/50 rounded-md p-3 mt-3">
                          <h5 className="text-sm font-medium mb-2">AI Analysis</h5>
                          <p className="text-sm text-muted-foreground">
                            {rec.aiGeneratedReport}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}