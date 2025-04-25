from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from aws_hawk.tools.boto3_tool import Boto3Tool
import os
from crewai.knowledge.source.json_knowledge_source import JSONKnowledgeSource

from typing import Any
# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
llmxx = LLM(
    model="gemini/gemini-2.5-flash-preview-04-17",
    api_key=GEMINI_API_KEY
)


@CrewBase
class AwsHawk():
    """AwsHawk crew"""
    file_path = None

    # Learn more about YAML configuration files here:
    # Agents: https://docs.crewai.com/concepts/agents#yaml-configuration-recommended
    # Tasks: https://docs.crewai.com/concepts/tasks#yaml-configuration-recommended
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    # If you would like to add tools to your agents, you can learn more about it here:
    # https://docs.crewai.com/concepts/agents#agent-tools
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
