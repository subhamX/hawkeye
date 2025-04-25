#!/usr/bin/env python
import boto3

from pydantic import BaseModel
from crewai.flow import Flow, listen, start
from mypy_boto3_s3.client import S3Client
from mypy_boto3_ec2.client import EC2Client
from aws_hawk.crew import AwsHawk
from typing import Any
import json
import os
from datetime import datetime




class S3InsightsState(BaseModel):
    s3_buckets: list[dict[str, str]] = [] # [{"Name": "bucket-name", "CreationDate": "datetime.datetime"}]
    s3_prefixes_by_bucket: dict[str, list[dict[str, Any]]] = {} # {bucket_name: [{key: str, size: int, last_modified: datetime.datetime, storage_class: str}]}

class S3InsightsFlow(Flow[S3InsightsState]):
    run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    knowledge_base_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'knowledge')
    s3_knowledge_dir_path = 'run_20250425_212604' #None


    def __init__(self):
        super().__init__()
        if not self.s3_knowledge_dir_path:
            print(f"Using knowledge from {self.s3_knowledge_dir_path}")
        else:
            print(f"We shall be building knowledge from scratch")

    def get_file_path_relative_to_knowledge_dir(self, bucket_name):
        return os.path.join(self.run_id if not self.s3_knowledge_dir_path else self.s3_knowledge_dir_path, f"{bucket_name}.json")
    

    
    @start()
    def fetch_s3_buckets(self):
        if self.s3_knowledge_dir_path:
            print("knowledge directory found, skipping S3 buckets fetch.. instead getting buckets from knowledge directory")
            buckets = [f for f in os.listdir(os.path.join(self.knowledge_base_dir, self.s3_knowledge_dir_path)) if f.endswith('.json')]
            s3_buckets_with_too_much_info = [json.load(open(os.path.join(self.knowledge_base_dir, self.s3_knowledge_dir_path, f))) for f in buckets]
            
            for bucket in s3_buckets_with_too_much_info:
                self.state.s3_buckets = [{'Name': bucket['bucket_name'], 'CreationDate': bucket['creation_date']}]
                self.state.s3_prefixes_by_bucket[bucket['bucket_name']] = bucket['prefixes']

            print(f"Found {len(self.state.s3_buckets)} buckets in knowledge directory. {self.state.s3_buckets}")
            return

        print("Fetching S3 buckets with regions")
        client = boto3.client("s3")
        response = client.list_buckets()
        self.state.s3_buckets = response['Buckets'][1:5] # TODO: for testing...


    @listen(fetch_s3_buckets)
    def fetch_s3_prefixes_for_all_buckets(self):
        if self.s3_knowledge_dir_path:
            print("knowledge directory found, skipping S3 prefixes fetch..")
            return

        print("Fetching S3 prefixes for all buckets")
        
        # Initialize the structure to store bucket -> prefix -> keys mapping
        bucket_prefix_keys = {}
        
        for bucket_dict in self.state.s3_buckets:
            bucket_name = bucket_dict['Name']
            creation_date = bucket_dict['CreationDate']
            print(f"Processing bucket: {bucket_name} created on {creation_date}")
            client: S3Client = boto3.client("s3")
            
            # Initialize the bucket entry
            bucket_prefix_keys[bucket_name] = {}
            
            # Get all objects in the bucket
            response = client.list_objects_v2(Bucket=bucket_name)
            
            # Process the contents
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    size = obj['Size']
                    last_modified = obj['LastModified']
                    storage_class = obj['StorageClass']
                    # Get the prefix (everything before the last '/')
                    prefix = '/'.join(key.split('/')[:-1]) + '/' if '/' in key else ''
                    
                    # Initialize the prefix list if it doesn't exist
                    if prefix not in bucket_prefix_keys[bucket_name]:
                        bucket_prefix_keys[bucket_name][prefix] = []
                    
                    # Add the key to the appropriate prefix list
                    bucket_prefix_keys[bucket_name][prefix].append({
                        'key': key,
                        'size': size,
                        'last_modified': last_modified.isoformat(),
                        'storage_class': storage_class
                    })
            
            # Continue fetching if there are more pages
            while response.get('IsTruncated', False):
                response = client.list_objects_v2(
                    Bucket=bucket_name,
                    ContinuationToken=response['NextContinuationToken']
                )
                if 'Contents' in response:
                    print(f"Found {len(response['Contents'])} objects in bucket {bucket_name}")
                    for obj in response['Contents']:
                        key = obj['Key']
                        prefix = '/'.join(key.split('/')[:-1]) + '/' if '/' in key else ''
                        
                        if prefix not in bucket_prefix_keys[bucket_name]:
                            bucket_prefix_keys[bucket_name][prefix] = []
                        
                        bucket_prefix_keys[bucket_name][prefix].append(key)
            
            # store the data in a json file in ./knowledge/aws_hawk_{timestamp}/{bucket_name}.json
            
            file_path_relative = os.path.join(self.knowledge_base_dir, self.get_file_path_relative_to_knowledge_dir(bucket_name))

            os.makedirs(os.path.dirname(file_path_relative), exist_ok=True)
            with open(file_path_relative, 'w') as f:
                json.dump({'bucket_name': bucket_name, 'prefixes': bucket_prefix_keys[bucket_name], 'creation_date': creation_date.isoformat()}, f)        

        

    @listen(fetch_s3_prefixes_for_all_buckets)
    def analyze_s3_buckets(self):
        print("Analyzing S3 buckets", self.state.s3_buckets)
        for bucket_dict in self.state.s3_buckets:
            bucket_name = bucket_dict['Name']
            creation_date = bucket_dict['CreationDate']
            print(f"Analyzing bucket: {bucket_name} created on {creation_date}")
            result = AwsHawk().crew().kickoff(inputs={
                'bucket_name': bucket_name,
                'prefixes': self.state.s3_prefixes_by_bucket[bucket_name]
            })
            print(result)
            
            # TODO: use the agent..


# def kickoff():
#     s3_insights_flow = S3InsightsFlow()
#     s3_insights_flow.kickoff()


# def plot():
#     s3_insights_flow = S3InsightsFlow()
#     s3_insights_flow.plot()


# if __name__ == "__main__":
#     kickoff()
