// HawkEye AWS Account ID for cross-account role assumption
export const HAWKEYE_ACCOUNT_ID = '123456789012'; // Replace with actual HawkEye AWS account ID

// AWS Regions with metadata
export const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)', popular: true },
  { value: 'us-east-2', label: 'US East (Ohio)', popular: true },
  { value: 'us-west-1', label: 'US West (N. California)', popular: false },
  { value: 'us-west-2', label: 'US West (Oregon)', popular: true },
  { value: 'eu-west-1', label: 'Europe (Ireland)', popular: true },
  { value: 'eu-west-2', label: 'Europe (London)', popular: false },
  { value: 'eu-west-3', label: 'Europe (Paris)', popular: false },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)', popular: true },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)', popular: true },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)', popular: true },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)', popular: true },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)', popular: false },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)', popular: false },
  { value: 'ca-central-1', label: 'Canada (Central)', popular: false },
  { value: 'sa-east-1', label: 'South America (São Paulo)', popular: false },
] as const;

export type AWSRegion = typeof AWS_REGIONS[number]['value'];