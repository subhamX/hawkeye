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
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
            <Settings className="h-5 w-5" />
            <span>Account Configuration</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {message && (
              <div className={`px-3 py-1 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {message.text}
              </div>
            )}
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
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
                  className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Status</Label>
            <p className="text-sm text-slate-600 dark:text-slate-400">
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
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">IAM Role ARN</Label>
          <Input
            value={config.roleArn}
            onChange={(e) => setConfig(prev => ({ ...prev, roleArn: e.target.value }))}
            disabled={!isEditing}
            placeholder="arn:aws:iam::148761646029:role/HawkEyeRole"
            className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600"
          />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The IAM role ARN that HawkEye uses to access your AWS account
          </p>
        </div>

        {/* Regions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monitored Regions</Label>
          <div className="flex flex-wrap gap-2">
            {config.regions.map((region) => (
              <Badge key={region} variant="secondary" className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
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
                className="flex-1 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600"
              />
              <Button size="sm" onClick={addRegion} disabled={!newRegion} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Enabled Services */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Enabled Services</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(config.enabledServices).map(([service, enabled]) => (
              <div key={service} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                <div>
                  <p className="font-medium capitalize text-slate-900 dark:text-white">{service}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
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
        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Account ID</p>
              <p className="text-slate-600 dark:text-slate-400">{account.accountId}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Created</p>
              <p className="text-slate-600 dark:text-slate-400">{account.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}