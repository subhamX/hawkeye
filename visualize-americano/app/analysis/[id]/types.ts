export interface Recommendation {
    category: string;
    subcategory: string;
    description: string;
    impact: string;
    recommendation: string;
    affected_resources?: string[];
    affected_prefixes?: string[];
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    current_cost?: number;
    estimated_savings?: number;
    remediation_steps?: string[];
    performance_impact?: string;
    compliance_impact?: string[];
    payback_period?: string;
    object_count?: number;
    total_size?: number;
}

export interface Ec2InstanceAnalysis {
    instance_id: string;
    instance_type: string;
    state: string;
    vpc_id: string;
    subnet_id: string;
    recommendations: Recommendation[];
    current_monthly_cost: number;
    estimated_monthly_savings: number;
    security_score: number;
    performance_score: number;
}

export interface EbsVolumeAnalysis {
    volume_id: string;
    volume_type: string;
    size: number;
    iops?: number;
    throughput?: number;
    encrypted: boolean;
    recommendations: Recommendation[];
    current_monthly_cost: number;
    estimated_monthly_savings: number;
    performance_score: number;
}

export interface Ec2Analysis {
    instances: Ec2InstanceAnalysis[];
    volumes: EbsVolumeAnalysis[];
    analysis_date: string;
    total_instances: number;
    total_volumes: number;
    total_recommendations: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    total_current_monthly_cost: number;
    total_estimated_monthly_savings: number;
    overall_security_score: number;
    security_vulnerabilities_count: number;
    overall_performance_score: number;
    performance_issues_count: number;
    summary: string;
    recommendations: Recommendation[];
}

export interface S3Analysis {
    bucket_name: string;
    creation_date: string;
    analysis_date: string;
    recommendations: Recommendation[];
    summary: string;
    total_objects: number;
    total_size: number;
    total_cost: number;
    total_recommendations: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    total_current_cost: number;
    total_estimated_savings: number;
    security_vulnerabilities_count: number;
    compliance_issues_count: number;
    storage_optimizations_count: number;
    lifecycle_improvements_count: number;
}

export interface CfnAnalysis {
    stack_name: string;
    template_version: string;
    analysis_date: string;
    recommendations: Recommendation[];
    summary: string;
    total_recommendations: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    total_current_cost?: number;
    total_estimated_savings?: number;
    overall_payback_period?: string;
    security_vulnerabilities_count: number;
    compliance_issues_count: number;
    template_improvements_count: number;
    best_practices_violations_count: number;
}

export interface SuperJson {
    awsec2hawk?: Ec2Analysis[];
    awscfnhawk?: CfnAnalysis[];
    awss3hawk?: S3Analysis[];
} 