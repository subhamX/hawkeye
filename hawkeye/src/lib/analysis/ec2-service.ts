import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import type { AWSCredentials } from './aws-credentials';
import { EC2InstanceAnalysisSchema, type EC2InstanceAnalysis } from './schemas';
import type { EC2Instance, EBSVolume, SecurityGroup, InstanceMetrics } from './types';

export class EC2AnalysisService {
  private ec2Client: EC2Client;
  private cloudWatchClient: CloudWatchClient;

  constructor(credentials: AWSCredentials) {
    const clientConfig = {
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    };

    this.ec2Client = new EC2Client(clientConfig);
    this.cloudWatchClient = new CloudWatchClient(clientConfig);
  }

  /**
   * Run complete EC2/EBS analysis
   */
  async analyzeInfrastructure(): Promise<EC2InstanceAnalysis> {
    // Get all instances and volumes
    const instances = await this.getEC2Instances();
    const volumes = await this.getEBSVolumes();
    const securityGroups = await this.getSecurityGroups();

    // Analyze with AI
    return await this.analyzeEC2Infrastructure(instances, volumes, securityGroups);
  }

  /**
   * Get EC2 instances
   */
  private async getEC2Instances(): Promise<EC2Instance[]> {
    try {
      const response = await this.ec2Client.send(new DescribeInstancesCommand({}));
      const instances: EC2Instance[] = [];

      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          instances.push({
            instanceId: instance.InstanceId,
            instanceType: instance.InstanceType,
            state: instance.State?.Name,
            launchTime: instance.LaunchTime,
            securityGroups: instance.SecurityGroups,
            tags: instance.Tags,
            volumes: instance.BlockDeviceMappings
          });
        }
      }

      return instances;
    } catch (error) {
      console.error('Failed to get EC2 instances:', error);
      return [];
    }
  }

  /**
   * Get EBS volumes
   */
  private async getEBSVolumes(): Promise<EBSVolume[]> {
    try {
      const response = await this.ec2Client.send(new DescribeVolumesCommand({}));
      return response.Volumes?.map(volume => ({
        volumeId: volume.VolumeId,
        size: volume.Size,
        volumeType: volume.VolumeType,
        state: volume.State,
        attachments: volume.Attachments,
        createTime: volume.CreateTime,
        tags: volume.Tags
      })) || [];
    } catch (error) {
      console.error('Failed to get EBS volumes:', error);
      return [];
    }
  }

  /**
   * Get security groups
   */
  private async getSecurityGroups(): Promise<SecurityGroup[]> {
    try {
      const response = await this.ec2Client.send(new DescribeSecurityGroupsCommand({}));
      return response.SecurityGroups?.map(sg => ({
        groupId: sg.GroupId,
        groupName: sg.GroupName,
        description: sg.Description,
        inboundRules: sg.IpPermissions,
        outboundRules: sg.IpPermissionsEgress
      })) || [];
    } catch (error) {
      console.error('Failed to get security groups:', error);
      return [];
    }
  }

  /**
   * Analyze EC2 infrastructure using AI
   */
  private async analyzeEC2Infrastructure(
    instances: EC2Instance[],
    volumes: EBSVolume[],
    securityGroups: SecurityGroup[]
  ): Promise<EC2InstanceAnalysis> {
    // Get CloudWatch metrics for instances (simplified)
    const instanceMetrics = await this.getInstanceMetrics(instances);

    // Calculate current costs
    const totalInstanceCost = instances
      .filter(i => i.state === 'running' && i.instanceType)
      .reduce((sum, i) => sum + this.calculateInstanceMonthlyCost(i.instanceType!), 0);

    const totalVolumeCost = volumes
      .filter(v => v.volumeType)
      .reduce((sum, v) => sum + this.calculateVolumeMonthlyCost(v.volumeType!, v.size || 0), 0);

    const unattachedVolumeCost = volumes
      .filter(v => (!v.attachments || v.attachments.length === 0) && v.volumeType)
      .reduce((sum, v) => sum + this.calculateVolumeMonthlyCost(v.volumeType!, v.size || 0), 0);

    // Calculate GP2 to GP3 migration savings
    const gp2Volumes = volumes.filter(v => v.volumeType === 'gp2');
    const gp2ToGp3Savings = gp2Volumes
      .reduce((sum, v) => {
        const currentCost = this.calculateVolumeMonthlyCost('gp2', v.size || 0);
        const newCost = this.calculateVolumeMonthlyCost('gp3', v.size || 0);
        return sum + (currentCost - newCost);
      }, 0);

    // Calculate right-sizing opportunities
    const rightSizingOpportunities = instances
      .filter(i => i.state === 'running' && i.instanceId && i.instanceType && instanceMetrics[i.instanceId])
      .map(i => ({
        instanceId: i.instanceId,
        instanceType: i.instanceType,
        avgCPU: instanceMetrics[i.instanceId!].avgCPUUtilization,
        rightSizing: this.suggestRightSizing(i.instanceType!, instanceMetrics[i.instanceId!].avgCPUUtilization)
      }))
      .filter(i => i.rightSizing);

    const totalRightSizingSavings = rightSizingOpportunities
      .reduce((sum, opp) => sum + (opp.rightSizing?.savings || 0), 0);

    // Calculate Reserved Instance opportunities
    const longRunningInstances = instances.filter(i => i.state === 'running' && i.instanceType);
    const totalReservedInstanceSavings = longRunningInstances
      .reduce((sum, i) => sum + this.calculateReservedInstanceSavings(i.instanceType!), 0);

    console.log(`💰 Current monthly costs: Instances $${totalInstanceCost.toFixed(2)}, Volumes $${totalVolumeCost.toFixed(2)}`);
    console.log(`💸 Unattached volume waste: $${unattachedVolumeCost.toFixed(2)}/month`);
    console.log(`📉 Right-sizing potential: $${totalRightSizingSavings.toFixed(2)}/month`);
    console.log(`🏦 Reserved Instance potential: $${totalReservedInstanceSavings.toFixed(2)}/month`);
    console.log(`💾 GP2→GP3 migration savings: $${gp2ToGp3Savings.toFixed(2)}/month`);

    const prompt = `You are a senior AWS cost optimization consultant with 10+ years of experience. Analyze the EC2/EBS infrastructure and provide aggressive, high-confidence cost optimization recommendations with immediate financial impact.

CRITICAL COST ANALYSIS DATA:
- Total EC2 Instances: ${instances.length}
- Total EBS Volumes: ${volumes.length}
- Running Instances: ${instances.filter(i => i.state === 'running').length} (Monthly Cost: $${totalInstanceCost.toFixed(2)})
- Stopped Instances: ${instances.filter(i => i.state === 'stopped').length}
- Total EBS Volume Cost: $${totalVolumeCost.toFixed(2)}/month
- Unattached Volumes: ${volumes.filter(v => !v.attachments || v.attachments.length === 0).length} (WASTING $${unattachedVolumeCost.toFixed(2)}/month)

DETAILED INFRASTRUCTURE ANALYSIS:
- Instance Types: ${JSON.stringify([...new Set(instances.map(i => i.instanceType))], null, 2)}
- Volume Types: ${JSON.stringify([...new Set(volumes.map(v => v.volumeType))], null, 2)}
- Total EBS Storage: ${volumes.reduce((sum, v) => sum + (v.size || 0), 0)} GB
- GP2 Volumes (can migrate to GP3): ${gp2Volumes.length} volumes (${gp2Volumes.reduce((sum, v) => sum + (v.size || 0), 0)} GB)
- Security Groups: ${securityGroups.length} configured

PERFORMANCE METRICS (HIGH CONFIDENCE DATA):
${JSON.stringify(instanceMetrics, null, 2)}

RIGHT-SIZING ANALYSIS:
${JSON.stringify(rightSizingOpportunities, null, 2)}

COST OPTIMIZATION OPPORTUNITIES:
1. **Unattached EBS Volumes**: ${volumes.filter(v => !v.attachments || v.attachments.length === 0).length} volumes wasting $${unattachedVolumeCost.toFixed(2)}/month
2. **Right-sizing Opportunities**: ${rightSizingOpportunities.length} instances can be downsized (SAVE $${totalRightSizingSavings.toFixed(2)}/month)
3. **Reserved Instance Savings**: ${longRunningInstances.length} running instances (SAVE $${totalReservedInstanceSavings.toFixed(2)}/month with 1-year RI)
4. **Stopped Instances**: ${instances.filter(i => i.state === 'stopped').length} instances still incurring EBS costs
5. **Volume Type Optimization**: ${gp2Volumes.length} GP2 volumes can migrate to GP3 (SAVE $${gp2ToGp3Savings.toFixed(2)}/month)
6. **Total Monthly Savings Potential**: $${(unattachedVolumeCost + totalRightSizingSavings + gp2ToGp3Savings).toFixed(2)} in immediate savings available

INSTRUCTIONS FOR HIGH-IMPACT RECOMMENDATIONS:
1. Be AGGRESSIVE with cost savings estimates - use real AWS pricing data provided above
2. Prioritize HIGH impact recommendations (>$100/month savings)
3. Use MEDIUM impact for $25-100/month savings  
4. Only use LOW impact for <$25/month savings
5. Calculate MONTHLY savings for immediate impact (not annual)
6. Focus on the biggest opportunities first:
   - Unattached EBS volumes (immediate deletion = instant savings)
   - Right-sizing underutilized instances (CPU < 25%)
   - Reserved Instances for long-running workloads (60-75% savings)
   - GP2 → GP3 volume migrations (20% savings + better performance)
7. Provide specific dollar amounts in potentialSavings (monthly values)
8. Be confident and specific - this is real infrastructure data with actual costs
9. For instanceRecommendations: focus on right-sizing and Reserved Instances
10. For volumeRecommendations: focus on unattached volumes and type optimization
11. IMPORTANT: Include confidence scores (0.0-1.0) for each recommendation:
    - 0.95+ for unattached volumes (definitive waste)
    - 0.90+ for clear right-sizing opportunities (CPU < 10%)
    - 0.85+ for moderate right-sizing (CPU < 25%)
    - 0.80+ for Reserved Instance recommendations (long-running instances)

Generate recommendations that will save significant money immediately. Every recommendation should have a clear monthly dollar impact and high confidence score.

Infrastructure Data:
Instances: ${JSON.stringify(instances.slice(0, 10), null, 2)}
Volumes: ${JSON.stringify(volumes.slice(0, 10), null, 2)}
Security Groups: ${JSON.stringify(securityGroups.slice(0, 5), null, 2)}`;

    const result = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: EC2InstanceAnalysisSchema,
      prompt,
    });

    return result.object;
  }

  /**
   * Calculate monthly cost for EC2 instance
   */
  private calculateInstanceMonthlyCost(instanceType: string): number {
    // Simplified pricing for common instance types (us-east-1 on-demand)
    const pricing: Record<string, number> = {
      't2.micro': 8.47,
      't2.small': 16.93,
      't2.medium': 33.87,
      't2.large': 67.74,
      't3.micro': 7.59,
      't3.small': 15.18,
      't3.medium': 30.37,
      't3.large': 60.74,
      'm5.large': 70.08,
      'm5.xlarge': 140.16,
      'm5.2xlarge': 280.32,
      'c5.large': 62.78,
      'c5.xlarge': 125.57,
      'r5.large': 91.98,
      'r5.xlarge': 183.96,
    };

    return pricing[instanceType] || 50; // Default estimate for unknown types
  }

  /**
   * Calculate monthly cost for EBS volume
   */
  private calculateVolumeMonthlyCost(volumeType: string, sizeGB: number): number {
    // AWS EBS pricing per GB/month
    const pricing: Record<string, number> = {
      'gp2': 0.10,
      'gp3': 0.08, // 20% cheaper than gp2
      'io1': 0.125,
      'io2': 0.125,
      'st1': 0.045,
      'sc1': 0.025,
      'standard': 0.05
    };

    const pricePerGB = pricing[volumeType] || 0.10;
    return sizeGB * pricePerGB;
  }

  /**
   * Calculate potential savings from right-sizing instance
   */
  private calculateRightSizingSavings(currentType: string, recommendedType: string): number {
    const currentCost = this.calculateInstanceMonthlyCost(currentType);
    const newCost = this.calculateInstanceMonthlyCost(recommendedType);
    return Math.max(0, currentCost - newCost);
  }

  /**
   * Suggest right-sizing based on CPU utilization
   */
  private suggestRightSizing(instanceType: string, avgCPU: number): { recommendedType: string; savings: number } | null {
    // Right-sizing logic based on CPU utilization
    if (avgCPU < 10) {
      // Very low utilization - downsize significantly
      const downsizeMap: Record<string, string> = {
        't3.large': 't3.medium',
        't3.medium': 't3.small',
        't3.small': 't3.micro',
        'm5.xlarge': 'm5.large',
        'm5.large': 't3.large',
        'c5.xlarge': 'c5.large',
        'c5.large': 't3.large',
        'r5.xlarge': 'r5.large',
        'r5.large': 'm5.large'
      };

      const recommended = downsizeMap[instanceType];
      if (recommended) {
        return {
          recommendedType: recommended,
          savings: this.calculateRightSizingSavings(instanceType, recommended)
        };
      }
    } else if (avgCPU < 25) {
      // Low utilization - downsize moderately
      const downsizeMap: Record<string, string> = {
        't3.large': 't3.medium',
        'm5.xlarge': 'm5.large',
        'c5.xlarge': 'c5.large',
        'r5.xlarge': 'r5.large'
      };

      const recommended = downsizeMap[instanceType];
      if (recommended) {
        return {
          recommendedType: recommended,
          savings: this.calculateRightSizingSavings(instanceType, recommended)
        };
      }
    }

    return null;
  }

  /**
   * Calculate Reserved Instance savings potential
   */
  private calculateReservedInstanceSavings(instanceType: string): number {
    const onDemandCost = this.calculateInstanceMonthlyCost(instanceType);
    // Reserved Instances typically save 60-75% for 1-year term
    return onDemandCost * 0.65; // 65% savings
  }

  /**
   * Get CloudWatch metrics for instances (simplified)
   */
  private async getInstanceMetrics(instances: EC2Instance[]): Promise<InstanceMetrics> {
    const metrics: InstanceMetrics = {};

    // Get CPU utilization for running instances (last 7 days)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const instance of instances.slice(0, 5)) { // Limit to avoid rate limits
      if (instance.state === 'running' && instance.instanceId) {
        try {
          const response = await this.cloudWatchClient.send(new GetMetricStatisticsCommand({
            Namespace: 'AWS/EC2',
            MetricName: 'CPUUtilization',
            Dimensions: [
              {
                Name: 'InstanceId',
                Value: instance.instanceId
              }
            ],
            StartTime: startTime,
            EndTime: endTime,
            Period: 3600, // 1 hour
            Statistics: ['Average']
          }));

          const datapoints = response.Datapoints || [];
          const avgCPU = datapoints.length > 0
            ? datapoints.reduce((sum, dp) => sum + (dp.Average || 0), 0) / datapoints.length
            : 0;

          if (instance.instanceId) {
            metrics[instance.instanceId] = {
              avgCPUUtilization: avgCPU
            };
          }
        } catch (error) {
          console.error(`Failed to get metrics for ${instance.instanceId}:`, error);
          if (instance.instanceId) {
            metrics[instance.instanceId] = { avgCPUUtilization: 0 };
          }
        }
      }
    }

    return metrics;
  }
}