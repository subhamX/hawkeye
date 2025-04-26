from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CfnRecommendation(BaseModel):
    """Base recommendation model for CloudFormation analysis"""
    category: str  # "Template", "Security", "Cost"
    subcategory: str  # e.g., "IAM", "Storage", "Compute" for cost; "Structure", "Best Practices" for template; "Vulnerability", "Compliance" for security
    description: str
    impact: str
    recommendation: str
    affected_resources: List[str]
    priority: str  # "Critical", "High", "Medium", "Low"
    current_cost: Optional[float]
    estimated_savings: Optional[float]
    remediation_steps: Optional[List[str]]
    compliance_impact: Optional[List[str]]
    payback_period: Optional[str]

class CfnAnalysis(BaseModel):
    """Complete CloudFormation analysis results"""
    stack_name: str
    template_version: str
    analysis_date: str
    recommendations: List[CfnRecommendation]
    summary: str
    
    # Statistics
    total_recommendations: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    
    # Cost metrics
    total_current_cost: Optional[float]
    total_estimated_savings: Optional[float]
    overall_payback_period: Optional[str]
    
    # Security metrics
    security_vulnerabilities_count: int
    compliance_issues_count: int
    
    # Template metrics
    template_improvements_count: int
    best_practices_violations_count: int 