#!/usr/bin/env python
import boto3

from pydantic import BaseModel
from crewai.flow import Flow, listen, start
from mypy_boto3_s3.client import S3Client
from mypy_boto3_ec2.client import EC2Client
from aws_hawk.crew import AwsHawk
from typing import Any


class S3InsightsState(BaseModel):
    s3_buckets: list[dict[str, str]] = [] # [{"Name": "bucket-name", "CreationDate": "datetime.datetime"}]
    s3_prefixes_by_bucket: dict[str, list[dict[str, Any]]] = {} # {bucket_name: [{key: str, size: int, last_modified: datetime.datetime, storage_class: str}]}

class S3InsightsFlow(Flow[S3InsightsState]):
    @start()
    def fetch_s3_buckets(self):
        print("Fetching S3 buckets with regions")
        client = boto3.client("s3")
        response = client.list_buckets()
        self.state.s3_buckets = response['Buckets'][:2] # TODO: for testing...

    @listen(fetch_s3_buckets)
    def fetch_s3_prefixes_for_all_buckets(self):
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
                    print(obj)
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
                        'last_modified': last_modified,
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
        
        # Update the state with the new structure
        self.state.s3_prefixes_by_bucket = bucket_prefix_keys

    @listen(fetch_s3_prefixes_for_all_buckets)
    def analyze_s3_buckets(self):
        for bucket_dict in self.state.s3_buckets:
            bucket_name = bucket_dict['Name']
            creation_date = bucket_dict['CreationDate']
            print(f"Analyzing bucket: {bucket_name} created on {creation_date}")
            prefixes = self.state.s3_prefixes_by_bucket[bucket_name]
            
            result = AwsHawk().crew().kickoff(inputs={
                'bucket_name': bucket_name,
                'prefixes': prefixes
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
