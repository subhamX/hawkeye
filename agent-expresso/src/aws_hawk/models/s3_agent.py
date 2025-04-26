from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class S3SecurityRecommendation(BaseModel):
    optimization_strategy: str
    details: str
    data_used: str
    estimated_impact_or_cost_savings: str


# Define the Pydantic model for the blog
class S3SecurityRecommendations(BaseModel):
    bucket_name: str
    security_recommendations: list[S3SecurityRecommendation]
    
class S3DataUsedToInfer(BaseModel):
    prefixes: list[str]
    object_count: str
    total_size: str
    details: str
    
    
class S3EstimatedImpact(BaseModel):
    performance: str
    cost: str


class S3StorageRecommendation(BaseModel):
    strategy: str
    data_used_to_infer: S3DataUsedToInfer
    estimated_impact: S3EstimatedImpact

class S3StorageRecommendations(BaseModel):
    bucket_name: str
    storage_recommendations: list[S3StorageRecommendation]
    
class S3Recommendation(BaseModel):
    """Base recommendation model for S3 analysis"""
    category: str  # "Storage", "Security", "Cost"
    subcategory: str  # e.g., "Storage Class", "Lifecycle", "Access Control", "Encryption"
    description: str
    impact: str
    recommendation: str
    affected_prefixes: List[str]
    priority: str  # "Critical", "High", "Medium", "Low"
    current_cost: Optional[float]
    estimated_savings: Optional[float]
    object_count: Optional[int]
    total_size: Optional[int]
    remediation_steps: Optional[List[str]]
    compliance_impact: Optional[List[str]]

class S3Analysis(BaseModel):
    """Complete S3 bucket analysis results"""
    bucket_name: str
    creation_date: str
    analysis_date: str
    recommendations: List[S3Recommendation]
    summary: str
    
    # Statistics
    total_objects: int
    total_size: int
    total_cost: float
    total_recommendations: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    
    # Cost metrics
    total_current_cost: float
    total_estimated_savings: float
    
    # Security metrics
    security_vulnerabilities_count: int
    compliance_issues_count: int
    
    # Storage metrics
    storage_optimizations_count: int
    lifecycle_improvements_count: int
    