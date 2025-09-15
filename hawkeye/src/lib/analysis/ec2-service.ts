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
    
    const prompt = `Analyze the EC2 infrastructure for security, performance, and cost optimization.
- Check instance type, state, security groups, and attached EBS volumes.
- Identify unattached EBS volumes, overprovisioned instances, etc.
- Provide actionable recommendations.
- Adhere strictly to the EC2InstanceAnalysisSchema for the output JSON.

1. **executiveSummary**: Write a 2-4 paragraph executive summary about the EC2 health.
2. **overallStatistics**: Calculate aggregate stats: total instances, volumes, findings by priority/category.
3. **strategicRecommendations**: Formulate 2-4 high-level strategic recommendations.
- Keep the recommendations short and concise.
- Give actionable recommendations, and keep them short and concise.
- Don't give generic recommendations. Give specific recommendations backed by data. Like X%/Y of objects should be done ZZ etc.

Infrastructure Data:
Instances (${instances.length}): ${JSON.stringify(instances.slice(0, 10), null, 2)}
Volumes (${volumes.length}): ${JSON.stringify(volumes.slice(0, 10), null, 2)}
Security Groups (${securityGroups.length}): ${JSON.stringify(securityGroups.slice(0, 5), null, 2)}
Metrics: ${JSON.stringify(instanceMetrics, null, 2)}`;

    const result = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: EC2InstanceAnalysisSchema,
      prompt,
    });

    return result.object;
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
      if (instance.state === 'running') {
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
          
          const avgCPU = response.Datapoints?.reduce((sum, dp) => sum + (dp.Average || 0), 0) / (response.Datapoints?.length || 1);
          metrics[instance.instanceId] = {
            avgCPUUtilization: avgCPU || 0
          };
        } catch (error) {
          console.error(`Failed to get metrics for ${instance.instanceId}:`, error);
          metrics[instance.instanceId] = { avgCPUUtilization: 0 };
        }
      }
    }
    
    return metrics;
  }
}