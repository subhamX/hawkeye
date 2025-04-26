#!/usr/bin/env python
import boto3

from pydantic import BaseModel
from crewai.flow import Flow, listen, start
from aws_hawk.crews.AwsCfnHawkCrew.AwsCfnHawkCrew import AwsCfnHawk
from typing import Any
import json
import os
from datetime import datetime
import shutil


class CfnInsightsState(BaseModel):
    stacks: list[dict[str, Any]] = [] # [{"StackName": "stack-name", "CreationTime": "datetime.datetime", "StackStatus": "str"}]
    templates_by_stack: dict[str, dict[str, Any]] = {} # {stack_name: template}


class CfnInsightsFlow(Flow[CfnInsightsState]):
    run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    knowledge_base_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'knowledge')
    cfn_knowledge_dir_path = None

    def __init__(self):
        super().__init__()
        if not self.cfn_knowledge_dir_path:
            print(f"Using knowledge from {self.cfn_knowledge_dir_path}")
        else:
            print(f"We shall be building knowledge from scratch")
            
        # delete the output directory
        if os.path.exists('./output/awscfnhawk'):
            shutil.rmtree('./output/awscfnhawk')

    def get_file_path_relative_to_knowledge_dir(self, stack_name):
        return os.path.join(self.run_id if not self.cfn_knowledge_dir_path else self.cfn_knowledge_dir_path, f"{stack_name}.json")

    @start()
    def fetch_cfn_stacks(self):
        if self.cfn_knowledge_dir_path:
            print("knowledge directory found, skipping CloudFormation stacks fetch.. instead getting stacks from knowledge directory")
            stacks = [f for f in os.listdir(os.path.join(self.knowledge_base_dir, self.cfn_knowledge_dir_path)) if f.endswith('.json')]
            cfn_stacks_with_too_much_info = [json.load(open(os.path.join(self.knowledge_base_dir, self.cfn_knowledge_dir_path, f))) for f in stacks]
            
            for stack in cfn_stacks_with_too_much_info:
                self.state.stacks.append({
                    'StackName': stack['stack_name'],
                    'CreationTime': stack['creation_time'],
                    'StackStatus': stack['stack_status']
                })
                self.state.templates_by_stack[stack['stack_name']] = stack['template']

            print(f"Found {len(self.state.stacks)} stacks in knowledge directory. {self.state.stacks}")
            return

        print("Fetching CloudFormation stacks")
        client = boto3.client("cloudformation")
        response = client.list_stacks()
        
        # filter out, and only keep the stacks in the ALLOWLISTED_STACKS environment variable
        self.state.stacks = [stack for stack in response['StackSummaries'] 
                           if stack['StackName'] in os.environ.get('ALLOWLISTED_STACKS', '').split(',')]
        
        print(f"Found {len(self.state.stacks)} stacks in AWS. {self.state.stacks}")

    @listen(fetch_cfn_stacks)
    def fetch_cfn_templates_for_all_stacks(self):
        if self.cfn_knowledge_dir_path:
            print("knowledge directory found, skipping CloudFormation templates fetch..")
            return

        print("Fetching CloudFormation templates for all stacks")
        
        # Initialize the structure to store stack -> template mapping
        stack_templates = {}
        
        for stack_dict in self.state.stacks:
            stack_name = stack_dict['StackName']
            creation_time = stack_dict['CreationTime']
            stack_status = stack_dict['StackStatus']
            print(f"Processing stack: {stack_name} created on {creation_time} with status {stack_status}")
            
            try:
                # Get the template for the stack
                client = boto3.client("cloudformation")
                response = client.get_template(StackName=stack_name)
                template = response['TemplateBody']
                
                # Store the template
                stack_templates[stack_name] = template
                
                # Save to knowledge base
                file_path_relative = os.path.join(self.knowledge_base_dir, self.get_file_path_relative_to_knowledge_dir(stack_name))
                os.makedirs(os.path.dirname(file_path_relative), exist_ok=True)
                with open(file_path_relative, 'w') as f:
                    json.dump({
                        'stack_name': stack_name,
                        'template': template,
                        'creation_time': creation_time.isoformat(),
                        'stack_status': stack_status
                    }, f)
            except Exception as e:
                print(f"Error fetching template for stack {stack_name}: {str(e)}")
                continue

        self.state.templates_by_stack = stack_templates

    @listen(fetch_cfn_templates_for_all_stacks)
    def analyze_cfn_stacks(self):
        print("Analyzing CloudFormation stacks", self.state.stacks)
        for stack_dict in self.state.stacks:
            stack_name = stack_dict['StackName']
            creation_time = stack_dict['CreationTime']
            stack_status = stack_dict['StackStatus']
            print(f"Analyzing stack: {stack_name} created on {creation_time} with status {stack_status}")
           
           
            template = self.state.templates_by_stack.get(stack_name, {})
            print(f"Template for stack {stack_name}: {template}")
            # use the agent..
            AwsCfnHawk(identifier=stack_name).crew().kickoff(inputs={
                'stack_name': stack_name,
                'template': template
            })
            print('Next stack...', self.state.stacks)


def kickoff():
    cfn_insights_flow = CfnInsightsFlow()
    cfn_insights_flow.kickoff()


def plot():
    cfn_insights_flow = CfnInsightsFlow()
    cfn_insights_flow.plot()


if __name__ == "__main__":
    kickoff()
