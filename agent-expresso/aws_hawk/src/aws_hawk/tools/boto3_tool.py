from crewai.tools import BaseTool
from typing import Type
from pydantic import BaseModel, Field
import boto3

class Boto3ToolInput(BaseModel):
    """Input schema for Boto3Tool."""
    service: str = Field(..., description="The AWS service to use.")
    action: str = Field(..., description="The action to perform.")
    arguments: dict = Field(..., description="The arguments to pass to the action.")

class Boto3Tool(BaseTool):
    name: str = "Boto3Tool"
    description: str = (
        "Use this tool to make API calls to AWS services. Only READ operations are supported. No write operations are supported. By default, the tool will perform actions in us-east-1 region only."
    )
    args_schema: Type[BaseModel] = Boto3ToolInput

    def _run(self, service: str, action: str, arguments: dict) -> str:
        client = boto3.client(service)
        print(f"Calling {service}.{action} with arguments: {arguments}")
        response = getattr(client, action)(**arguments)
        return response
