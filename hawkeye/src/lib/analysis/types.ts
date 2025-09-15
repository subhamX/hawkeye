export interface AnalysisJob {
  id: string;
  accountId: string;
  status: string;
  startedAt: Date;
  account: {
    id: string;
    accountId: string;
    roleArn: string;
    regions: string[];
    userId: string;
  };
  enabledServices: {
    s3: boolean;
    ec2: boolean;
    ebs: boolean;
    cloudformation: boolean;
  };
  monitoredBuckets: MonitoredBucket[];
}

export interface MonitoredBucket {
  id: string;
  bucketName: string;
  region: string;
  analyticsEnabled: boolean;
  inventoryEnabled: boolean;
}

export interface S3Object {
  Key?: string;
  LastModified?: Date;
  Size?: number;
  StorageClass?: string;
}

export interface S3BucketConfig {
  bucketName: string;
  versioning: string;
  encryption: string;
  publicAccessBlock: string;
  lifecycle: string;
  logging: string;
  tagging: string;
}

export interface EC2Instance {
  instanceId?: string;
  instanceType?: string;
  state?: string;
  launchTime?: Date;
  securityGroups?: Array<{
    GroupId?: string;
    GroupName?: string;
  }>;
  tags?: Array<{
    Key?: string;
    Value?: string;
  }>;
  volumes?: Array<{
    DeviceName?: string;
    Ebs?: {
      VolumeId?: string;
    };
  }>;
}

export interface EBSVolume {
  volumeId?: string;
  size?: number;
  volumeType?: string;
  state?: string;
  attachments?: Array<{
    InstanceId?: string;
    Device?: string;
    State?: string;
  }>;
  createTime?: Date;
  tags?: Array<{
    Key?: string;
    Value?: string;
  }>;
}

export interface SecurityGroup {
  groupId?: string;
  groupName?: string;
  description?: string;
  inboundRules?: Array<{
    IpProtocol?: string;
    FromPort?: number;
    ToPort?: number;
    IpRanges?: Array<{
      CidrIp?: string;
    }>;
  }>;
  outboundRules?: Array<{
    IpProtocol?: string;
    FromPort?: number;
    ToPort?: number;
    IpRanges?: Array<{
      CidrIp?: string;
    }>;
  }>;
}

export interface InstanceMetrics {
  [instanceId: string]: {
    avgCPUUtilization: number;
  };
}