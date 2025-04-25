

from pydantic import BaseModel


class S3StorageRecommendation(BaseModel):
    optimization_strategy: str
    details: str
    data_used: str
    estimated_impact_or_cost_savings: str


# Define the Pydantic model for the blog
class S3SecurityRecommendations(BaseModel):
    bucket_name: str
    recommendations: list[S3StorageRecommendation]
    


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
    