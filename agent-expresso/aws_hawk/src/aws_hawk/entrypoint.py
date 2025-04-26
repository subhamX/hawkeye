#!/usr/bin/env python

from aws_hawk.flows.cfn_insights_flow import CfnInsightsFlow
from aws_hawk.flows.s3_insights_flow import S3InsightsFlow
from aws_hawk.crews.AwsEc2HawkCrew.AwsEc2HawkCrew import AwsEc2Hawk
import warnings
import os
from logging import Logger
from datetime import datetime
import boto3
import json
warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

async def entrypoint(
    account_id: str,
    work_scope: str,
    logger: Logger,
    job_id: str = f"aws_hawk_job_{datetime.now().strftime("%Y%m%d%H%M%S")}",
):
    """
    Run all crews and flows for a given account.
    """
    inputs = {
        'aws_account_id': account_id,
        'work_scope': work_scope
    }
    
    try:
        await S3InsightsFlow().kickoff_async(inputs=inputs)
        await AwsEc2Hawk(identifier='global').crew().kickoff_async(inputs=inputs)
        await CfnInsightsFlow().kickoff_async(inputs=inputs)
        
        # use boto3 to upload the files in ./output/aws*hawk to the s3 bucket
        s3 = boto3.client('s3',
            endpoint_url=os.getenv('S3_ENDPOINT'),
            aws_access_key_id=os.getenv('S3_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('S3_SECRET_KEY')
        )
        
        base_dir = os.path.join(os.path.dirname(__file__), "..", "output")
        
        target_dir = ['awsec2hawk', 'awscfnhawk', 'awss3hawk']
        super_json = {}
        for service in target_dir:
            for file in os.listdir(os.path.join(base_dir, service)):
                try:
                    file_path = os.path.join(base_dir, service, file)
                    print(f"Reading file: {file_path}")
                    with open(file_path, 'r') as f:
                        if service not in super_json:
                            super_json[service] = []
                        super_json[service].append(json.load(f))
                except json.JSONDecodeError as e:
                    print(f"Error reading JSON file {file_path}: {str(e)}")
                    print(f"File contents:")
                    with open(file_path, 'r') as f:
                        print(f.read())
                    raise
                except Exception as e:
                    print(f"Unexpected error reading file {file_path}: {str(e)}")
                    raise
        
        
        # upload the super_json to the s3 bucket
        print(f'Uploading super.json to s3 bucket aws-hawk-output')
        s3.put_object(Bucket='aws-hawk', Key=f'{job_id}/super.json', Body=json.dumps(super_json))
        
        print(f'Uploaded super.json to s3 bucket aws-hawk-output.. JobId: {job_id}')
        return {
            'job_id': job_id,
            'raw_recommendations': super_json
        }
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")

