from typing import List, Dict, Optional
from pydantic import BaseModel

class Ec2Recommendation(BaseModel):
    """Base recommendation model for EC2 and EBS analysis"""
    category: str  # "Instance", "Volume", "Security", "Cost", "Performance"
    subcategory: str  # e.g., "Instance Type", "Storage", "Network", "Security Groups"
    description: str
    impact: str
    recommendation: str
    affected_resources: List[str]
    priority: str  # "Critical", "High", "Medium", "Low"
    current_cost: Optional[float]
    estimated_savings: Optional[float]
    remediation_steps: Optional[List[str]]
    performance_impact: Optional[str]

class Ec2InstanceAnalysis(BaseModel):
    """Analysis results for a single EC2 instance"""
    instance_id: str
    instance_type: str
    state: str
    vpc_id: str
    subnet_id: str
    recommendations: List[Ec2Recommendation]
    current_monthly_cost: float
    estimated_monthly_savings: float
    security_score: float  # 0-100
    performance_score: float  # 0-100

class EbsVolumeAnalysis(BaseModel):
    """Analysis results for a single EBS volume"""
    volume_id: str
    volume_type: str
    size: int
    iops: Optional[int]
    throughput: Optional[int]
    encrypted: bool
    recommendations: List[Ec2Recommendation]
    current_monthly_cost: float
    estimated_monthly_savings: float
    performance_score: float  # 0-100

class Ec2Analysis(BaseModel):
    """Complete EC2 and EBS analysis results"""
    instances: List[Ec2InstanceAnalysis]
    volumes: List[EbsVolumeAnalysis]
    analysis_date: str
    
    # Statistics
    total_instances: int
    total_volumes: int
    total_recommendations: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    
    # Cost metrics
    total_current_monthly_cost: float
    total_estimated_monthly_savings: float
    
    # Security metrics
    overall_security_score: float  # 0-100
    security_vulnerabilities_count: int
    
    # Performance metrics
    overall_performance_score: float  # 0-100
    performance_issues_count: int
    
    # Summary
    summary: str