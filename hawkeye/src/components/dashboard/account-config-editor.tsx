'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Save, 
  Loader2, 
  Edit,
  X,
  Check
} from 'lucide-react';
import { updateAccountConfig } from '@/lib/actions/analysis';
import type { DashboardAccount } from '@/lib/db/dashboard';

interface AccountConfigEditorProps {
  account: DashboardAccount;
}

export default function AccountConfigEditor({ account }: AccountConfigEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [config, setConfig] = useState({
    roleArn: account.roleArn,
    regions: account.regions,
    enabledServices: { ...account.enabledServices },
    isActive: account.isActive,
  });

  const [newRegion, setNewRegion] = useState('');

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateAccountConfig(account.id, config);
        
        if (result.success) {
          setMessage({ 
            type: 'success', 
            text: result.message || 'Configuration updated successfully' 
          });
          setIsEditing(false);
        } else {
          setMessage({ 
            type: 'error', 
            text: result.error || 'Failed to update configuration' 
          });
        }
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: 'Failed to update configuration' 
        });
      }
    });
  };

  const handleCancel = () => {
    setConfig({
      roleArn: account.roleArn,
      regions: account.regions,
      enabledServices: { ...account.enabledServices },
      isActive: account.isActive,
    });
    setIsEditing(false);
    setMessage(null);
  };

  const addRegion = () => {
    if (newRegion && !config.regions.includes(newRegion)) {
      setConfig(prev => ({
        ...prev,
        regions: [...prev.regions, newRegion]
      }));
      setNewRegion('');
    }
  };

  const removeRegion = (regionToRemove: string) => {
    setConfig(prev => ({
      ...prev,
      regions: prev.regions.filter(region => region !== regionToRemove)
    }));
  };

  const toggleService = (service: keyof typeof config.enabledServices) => {
    setConfig(prev => ({
      ...prev,
      enabledServices: {
        ...prev.enabledServices,
        [service]: !prev.enabledServices[service]
      }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Account Configuration</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {message && (
              <div className={`px-3 py-1 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Config
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Status */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Account Status</Label>
            <p className="text-sm text-muted-foreground">
              Enable or disable monitoring for this account
            </p>
          </div>
          <Switch
            checked={config.isActive}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: checked }))}
            disabled={!isEditing}
          />
        </div>

        {/* IAM Role ARN */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">IAM Role ARN</Label>
          <Input
            value={config.roleArn}
            onChange={(e) => setConfig(prev => ({ ...prev, roleArn: e.target.value }))}
            disabled={!isEditing}
            placeholder="arn:aws:iam::148761646029:role/HawkEyeRole"
          />
          <p className="text-xs text-muted-foreground">
            The IAM role ARN that HawkEye uses to access your AWS account
          </p>
        </div>

        {/* Regions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Monitored Regions</Label>
          <div className="flex flex-wrap gap-2">
            {config.regions.map((region) => (
              <Badge key={region} variant="secondary" className="flex items-center gap-1">
                {region}
                {isEditing && (
                  <button
                    onClick={() => removeRegion(region)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Input
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="us-east-1"
                className="flex-1"
              />
              <Button size="sm" onClick={addRegion} disabled={!newRegion}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Enabled Services */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Enabled Services</Label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(config.enabledServices).map(([service, enabled]) => (
              <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium capitalize">{service}</p>
                  <p className="text-xs text-muted-foreground">
                    {service === 's3' && 'Storage optimization analysis'}
                    {service === 'ec2' && 'Instance utilization analysis'}
                    {service === 'ebs' && 'Volume optimization analysis'}
                    {service === 'cloudformation' && 'Stack resource analysis'}
                  </p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggleService(service as keyof typeof config.enabledServices)}
                  disabled={!isEditing}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Account ID</p>
              <p className="text-muted-foreground">{account.accountId}</p>
            </div>
            <div>
              <p className="font-medium">Created</p>
              <p className="text-muted-foreground">{account.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}