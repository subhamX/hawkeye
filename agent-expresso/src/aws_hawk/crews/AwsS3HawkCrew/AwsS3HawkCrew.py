from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task, before_kickoff
from aws_hawk.tools.boto3_tool import Boto3Tool
import os
from crewai.knowledge.source.json_knowledge_source import JSONKnowledgeSource
from aws_hawk.models.s3_agent import S3Analysis
from typing import Any
import shutil

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
llmxx = LLM(
    # model="gemini/gemini-2.5-flash-preview-04-17",
    model="gemini/gemini-2.0-flash",
    api_key=GEMINI_API_KEY,
)

# llmxx = LLM(
#     model="o3-mini",
# )


@CrewBase
class AwsS3Hawk():
    """AwsS3Hawk crew"""
    identifier = None

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'
    
    
    def __init__(self, identifier: str):
        self.identifier = identifier
        

    @agent
    def s3_researcher(self) -> Agent:
        return Agent(
            config=self.agents_config['s3_researcher'],
            tools=[Boto3Tool()],
            verbose=True,
            llm=llmxx,
        )

    @task
    def analyze_s3_bucket_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_s3_bucket_task'],
            output_json=S3Analysis,
            output_file=f'./output/awss3hawk/analyze_s3_bucket_{self.identifier}.md',
        )

    @crew
    def crew(self) -> Crew:
        """Creates the AwsHawk crew"""
        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            memory=False,
        )
