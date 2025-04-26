from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task, before_kickoff
from aws_hawk.tools.boto3_tool import Boto3Tool
import os
from aws_hawk.models.ec2_agent import Ec2Analysis
from typing import Any, Dict, List
import boto3
from datetime import datetime, UTC
import json
import shutil
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
llmxx = LLM(
    model="gemini/gemini-2.0-flash",
    api_key=GEMINI_API_KEY,
)

@CrewBase
class AwsEc2Hawk():
    """AwsEc2Hawk crew for analyzing EC2 instances and EBS volumes"""
    identifier = None

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'
    
    def __init__(self, identifier: str):
        self.identifier = identifier
        self.ec2_client = boto3.client('ec2')
        self.ec2_resource = boto3.resource('ec2')
        
        # delete the output directory
        if os.path.exists('./output/awsec2hawk'):
            shutil.rmtree('./output/awsec2hawk')        

    def fetch_ec2_instances(self) -> List[Dict[str, Any]]:
        """Fetch all EC2 instances with their details"""
        instances = []
        response = self.ec2_client.describe_instances()
        
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                print(instance)
                instance_info = {
                    'InstanceId': instance['InstanceId'],
                    'InstanceType': instance['InstanceType'],
                    'State': instance['State']['Name'],
                    'Platform': instance.get('Platform', 'linux'),
                    'VpcId': instance.get('VpcId', None),
                    'SubnetId': instance.get('SubnetId', None),
                    'SecurityGroups': [
                        {
                            'GroupId': sg['GroupId'],
                            'GroupName': sg['GroupName']
                        } for sg in instance['SecurityGroups']
                    ],
                    'Tags': instance.get('Tags', []),
                    'LaunchTime': instance['LaunchTime'].isoformat(),
                    'BlockDeviceMappings': instance.get('BlockDeviceMappings', []),
                    'IamInstanceProfile': instance.get('IamInstanceProfile', {}),
                    'Monitoring': instance.get('Monitoring', {}),
                    'Placement': instance.get('Placement', {}),
                }
                instances.append(instance_info)
        
        return instances

    def fetch_ebs_volumes(self) -> List[Dict[str, Any]]:
        """Fetch all EBS volumes with their details"""
        volumes = []
        response = self.ec2_client.describe_volumes()
        
        for volume in response['Volumes']:
            volume_info = {
                'VolumeId': volume['VolumeId'],
                'Size': volume['Size'],
                'VolumeType': volume['VolumeType'],
                'State': volume['State'],
                'Encrypted': volume['Encrypted'],
                'Iops': volume.get('Iops'),
                'Throughput': volume.get('Throughput'),
                'AvailabilityZone': volume['AvailabilityZone'],
                'Attachments': volume.get('Attachments', []),
                'Tags': volume.get('Tags', []),
                'CreateTime': volume['CreateTime'].isoformat(),
                'MultiAttachEnabled': volume.get('MultiAttachEnabled', False),
            }
            volumes.append(volume_info)
        
        return volumes

    def fetch_security_groups(self) -> List[Dict[str, Any]]:
        """Fetch security groups with their rules"""
        security_groups = []
        response = self.ec2_client.describe_security_groups()
        
        for sg in response['SecurityGroups']:
            sg_info = {
                'GroupId': sg['GroupId'],
                'GroupName': sg['GroupName'],
                'Description': sg['Description'],
                'VpcId': sg['VpcId'],
                'IpPermissions': sg['IpPermissions'],
                'IpPermissionsEgress': sg['IpPermissionsEgress'],
                'Tags': sg.get('Tags', []),
            }
            security_groups.append(sg_info)
        
        return security_groups

    @before_kickoff
    def prepare_data(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare data before crew execution"""
        # Create output directory if it doesn't exist
        os.makedirs('./output/awsec2hawk', exist_ok=True)
        
        # Fetch all required data
        instances = self.fetch_ec2_instances()
        volumes = self.fetch_ebs_volumes()
        security_groups = self.fetch_security_groups()
        
        # Save raw data for reference
        data = {
            'instances': instances,
            'volumes': volumes,
            'security_groups': security_groups,
            'timestamp': datetime.now(UTC).isoformat()
        }
        
        # Save to JSON file
        with open(f'./output/awsec2hawk/raw_data_{self.identifier}.json', 'w') as f:
            json.dump(data, f, indent=2)
        
        return inputs

    @agent
    def ec2_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['ec2_analyst'],
            tools=[Boto3Tool()],
            verbose=True,
            llm=llmxx,
        )

    @task
    def analyze_ec2_instances_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_ec2_instances_task'],
            output_json=Ec2Analysis,
            output_file=f'./output/awsec2hawk/analyze_ec2_instances_{self.identifier}.md',
        )

    @crew
    def crew(self) -> Crew:
        """Creates the AwsEc2Hawk crew"""
        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            memory=False,
        ) 