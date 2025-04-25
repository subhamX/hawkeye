from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from aws_hawk.tools.boto3_tool import Boto3Tool
import os

# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

llm = LLM(
    model="gemini/gemini-2.5-flash-preview-04-17",
    api_key=os.getenv("GEMINI_API_KEY")
)


@CrewBase
class AwsHawk():
    """AwsHawk crew"""

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
            # tools=[Boto3Tool()],
            verbose=True,
            llm=llm,
        )

    # @agent
    # def reporting_analyst(self) -> Agent:
    #     return Agent(
    #         config=self.agents_config['reporting_analyst'],
    #         verbose=True
    #     )

    # To learn more about structured task outputs,
    # task dependencies, and task callbacks, check out the documentation:
    # https://docs.crewai.com/concepts/tasks#overview-of-a-task
    # @task
    # def fetch_all_s3_buckets_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['fetch_all_s3_buckets_task'],
    #     )


    # @task
    # def fetch_all_prefixes_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['fetch_all_prefixes_task'],
    #         context=[self.fetch_all_s3_buckets_task()]
    #     )



    @task
    def analyze_s3_bucket_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_s3_bucket_task'],
        )


    # @task
    # def reporting_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['reporting_task'],
    #         output_file='report.md'
    #     )

    @crew
    def crew(self) -> Crew:
        """Creates the AwsHawk crew"""
        # To learn how to add knowledge sources to your crew, check out the documentation:
        # https://docs.crewai.com/concepts/knowledge#what-is-knowledge

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.hierarchical,
            manager_llm="gemini/gemini-2.5-flash-preview-04-17",
            verbose=True,
            # process=Process.hierarchical, # In case you wanna use that instead https://docs.crewai.com/how-to/Hierarchical/
        )
