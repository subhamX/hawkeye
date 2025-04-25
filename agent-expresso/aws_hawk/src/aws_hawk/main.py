#!/usr/bin/env python
import sys
import warnings

from datetime import datetime
import os

from aws_hawk.crew import AwsHawk

from aws_hawk.s3_insights_flow import S3InsightsFlow


warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# This main file is intended to be a way for you to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

def run():
    """
    Run the crew.
    """
    account_id = os.environ.get('AWS_ACCOUNT_ID')
    
    if not account_id:
        raise Exception("Account ID is required.. Please set the AWS_ACCOUNT_ID environment variable")
    
    inputs = {
        'aws_account_id': account_id
    }
    
    try:
        # crew = AwsHawk().crew(service='s3', file_path='xxx')
        # crew.reset_memories('all')
        
        S3InsightsFlow().kickoff(inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")


# def train():
#     """
#     Train the crew for a given number of iterations.
#     """
#     inputs = {
#         "topic": "AI LLMs"
#     }
#     try:
#         AwsHawk().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

#     except Exception as e:
#         raise Exception(f"An error occurred while training the crew: {e}")

# def replay():
#     """
#     Replay the crew execution from a specific task.
#     """
#     try:
#         AwsHawk().crew().replay(task_id=sys.argv[1])

#     except Exception as e:
#         raise Exception(f"An error occurred while replaying the crew: {e}")

# def test():
#     """
#     Test the crew execution and returns the results.
#     """
#     inputs = {
#         "topic": "AI LLMs",
#         "current_year": str(datetime.now().year)
#     }
#     try:
#         AwsHawk().crew().test(n_iterations=int(sys.argv[1]), openai_model_name=sys.argv[2], inputs=inputs)

#     except Exception as e:
#         raise Exception(f"An error occurred while testing the crew: {e}")
