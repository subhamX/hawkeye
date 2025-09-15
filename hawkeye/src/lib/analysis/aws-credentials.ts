import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

/**
 * Assume AWS role and get credentials
 */
export async function getAWSCredentials(roleArn: string, region: string): Promise<AWSCredentials> {
  const stsClient = new STSClient({ region });
  
  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: `hawkeye-analysis-${Date.now()}`,
    DurationSeconds: 3600, // 1 hour
  });

  const response = await stsClient.send(command);
  
  if (!response.Credentials) {
    throw new Error('Failed to assume AWS role');
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId!,
    secretAccessKey: response.Credentials.SecretAccessKey!,
    sessionToken: response.Credentials.SessionToken!,
    region,
  };
}