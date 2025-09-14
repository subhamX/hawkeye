'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  HardDrive, 
  Server, 
  FileText, 
  Shield, 
  Zap,
  DollarSign,
  Clock
} from 'lucide-react';

interface ServiceSelectionProps {
  onNext: (selectedServices: SelectedService[]) => void;
  onBack: () => void;
}

export interface SelectedService {
  id: string;
  name: string;
  enabled: boolean;
}

interface AWSService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'storage' | 'compute' | 'database' | 'security' | 'management';
  status: 'available' | 'coming-soon';
  benefits: string[];
  estimatedSavings?: string;
}

const awsServices: AWSService[] = [
  {
    id: 's3',
    name: 'Amazon S3',
    description: 'Optimize storage costs with intelligent storage class recommendations',
    icon: <Database className="w-6 h-6" />,
    category: 'storage',
    status: 'available',
    benefits: ['Storage class optimization', 'Lifecycle policy recommendations', 'Cost analysis'],
    estimatedSavings: '20-60%',
  },
  {
    id: 'ec2',
    name: 'Amazon EC2',
    description: 'Right-size instances and identify unused resources',
    icon: <Server className="w-6 h-6" />,
    category: 'compute',
    status: 'available',
    benefits: ['Instance right-sizing', 'Unused resource detection', 'Reserved instance recommendations'],
    estimatedSavings: '15-40%',
  },
  {
    id: 'ebs',
    name: 'Amazon EBS',
    description: 'Optimize EBS volumes and eliminate unused storage',
    icon: <HardDrive className="w-6 h-6" />,
    category: 'storage',
    status: 'available',
    benefits: ['Unattached volume detection', 'Volume type optimization', 'Snapshot cleanup'],
    estimatedSavings: '10-30%',
  },
  {
    id: 'cloudformation',
    name: 'AWS CloudFormation',
    description: 'Analyze infrastructure templates for cost optimization',
    icon: <FileText className="w-6 h-6" />,
    category: 'management',
    status: 'coming-soon',
    benefits: ['Template cost analysis', 'Resource optimization suggestions', 'Best practice recommendations'],
  },
  {
    id: 'iam',
    name: 'AWS IAM',
    description: 'Security and access optimization recommendations',
    icon: <Shield className="w-6 h-6" />,
    category: 'security',
    status: 'coming-soon',
    benefits: ['Unused role detection', 'Permission optimization', 'Security best practices'],
  },
  {
    id: 'lambda',
    name: 'AWS Lambda',
    description: 'Optimize serverless function costs and performance',
    icon: <Zap className="w-6 h-6" />,
    category: 'compute',
    status: 'coming-soon',
    benefits: ['Memory optimization', 'Execution time analysis', 'Cost per invocation insights'],
  },
];

export default function ServiceSelection({ onNext, onBack }: ServiceSelectionProps) {
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({
    s3: true, // Default enabled
    ec2: true, // Default enabled
    ebs: true, // Default enabled
  });

  const handleServiceToggle = (serviceId: string, enabled: boolean) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: enabled,
    }));
  };

  const handleNext = () => {
    const services: SelectedService[] = awsServices.map(service => ({
      id: service.id,
      name: service.name,
      enabled: selectedServices[service.id] || false,
    }));

    onNext(services);
  };

  const availableServices = awsServices.filter(s => s.status === 'available');
  const comingSoonServices = awsServices.filter(s => s.status === 'coming-soon');
  const selectedCount = Object.values(selectedServices).filter(Boolean).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'storage': return <Database className="w-4 h-4" />;
      case 'compute': return <Server className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'management': return <FileText className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select AWS Services to Monitor</h3>
        <p className="text-muted-foreground">
          Choose which AWS services you'd like HawkEye to analyze for cost optimization opportunities.
          You can change these settings later in your dashboard.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="font-medium">Potential Monthly Savings</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">15-60%</div>
            <div className="text-xs text-muted-foreground">Based on selected services</div>
          </div>
        </div>
      </div>

      {/* Available Services */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</span>
          Available Now ({selectedCount} selected)
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          {availableServices.map((service) => (
            <Card 
              key={service.id} 
              className={`cursor-pointer transition-all ${
                selectedServices[service.id] 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleServiceToggle(service.id, !selectedServices[service.id])}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {service.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{service.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryIcon(service.category)}
                          <span className="ml-1 capitalize">{service.category}</span>
                        </Badge>
                        {service.estimatedSavings && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            {service.estimatedSavings} savings
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedServices[service.id] || false}
                    onCheckedChange={(checked) => 
                      handleServiceToggle(service.id, checked as boolean)
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-3">
                  {service.description}
                </CardDescription>
                <div className="space-y-1">
                  {service.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon Services */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Coming Soon
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          {comingSoonServices.map((service) => (
            <Card key={service.id} className="opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {service.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{service.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryIcon(service.category)}
                          <span className="ml-1 capitalize">{service.category}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-3">
                  {service.description}
                </CardDescription>
                <div className="space-y-1">
                  {service.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedCount === 0}
        >
          Continue to S3 Setup ({selectedCount} services selected)
        </Button>
      </div>
    </div>
  );
}