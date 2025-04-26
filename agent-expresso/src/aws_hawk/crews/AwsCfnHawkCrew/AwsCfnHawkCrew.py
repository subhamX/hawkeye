from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task, before_kickoff
from aws_hawk.tools.boto3_tool import Boto3Tool
import os
from crewai.knowledge.source.json_knowledge_source import JSONKnowledgeSource
from aws_hawk.models.cfn_agent import CfnAnalysis
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
class AwsCfnHawk():
    """AwsCfnHawk crew for analyzing CloudFormation templates"""
    identifier = None

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'
    
    
    def __init__(self, identifier: str):
        self.identifier = identifier
        

    @agent
    def cfn_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['cfn_analyst'],
            tools=[Boto3Tool()],
            verbose=True,
            llm=llmxx,
        )

    @task
    def analyze_cfn_stack_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_cfn_stack_task'],
            output_json=CfnAnalysis,
            output_file=f'./output/awscfnhawk/analyze_cfn_stack_{self.identifier}.md',
        )

    @crew
    def crew(self) -> Crew:
        """Creates the AwsCfnHawk crew"""
        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            memory=False,
        )
