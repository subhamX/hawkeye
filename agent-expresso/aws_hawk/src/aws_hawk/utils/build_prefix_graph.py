import boto3
from datetime import datetime
from typing import Dict, Any, List
from collections import Counter
from itertools import groupby

# def run_command_sync(command):
#     return subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


s3_client = boto3.client("s3")

def get_total_size(contents):
    return sum(obj['Size'] for obj in contents if 'Size' in obj)

def get_extension_counts(contents):
    """
    Count file extensions in the contents.
    """
    # print(contents)
    extensions = []
    for obj in contents:
        key = obj['Key']
        if '.' in key:
            ext = key.split('.')[-1].lower()
            extensions.append(ext)
    return dict(Counter(extensions))

def get_all_objects(bucket_name: str) -> List[Dict]:
    """
    Get all objects in the bucket in one go.
    """
    objects = []
    paginator = s3_client.get_paginator('list_objects_v2')
    
    for page in paginator.paginate(Bucket=bucket_name):
        if 'Contents' in page:
            objects.extend(page['Contents'])
    
    return objects

def build_prefix_graph(bucket_name: str) -> Dict[str, Any]:
    """
    Build the complete prefix graph for a bucket by first getting all objects
    and then processing them to build the graph.
    """
    # Get all objects in one go
    all_objects = get_all_objects(bucket_name)
    
    # Initialize the root node
    root = {
        'LastModified': None,
        'TotalSize': 0,
        'children': {},
        'extension_counts': {}
    }
    
    # Group objects by their prefix
    def get_prefix(key):
        parts = key.split('/')
        return '/'.join(parts[:-1]) + '/' if len(parts) > 1 else ''
    
    # Sort objects by key to ensure proper grouping
    all_objects.sort(key=lambda x: x['Key'])
    
    # Group objects by their prefix
    for prefix, group in groupby(all_objects, key=lambda x: get_prefix(x['Key'])):
        group_list = list(group)
        
        # Create or update the prefix node
        if prefix not in root['children']:
            root['children'][prefix] = {
                'LastModified': None,
                'TotalSize': 0,
                'children': {},
                'extension_counts': {}
            }
        
        # Update the prefix node with the group's data
        prefix_node = root['children'][prefix]
        prefix_node['TotalSize'] = get_total_size(group_list)
        prefix_node['extension_counts'] = get_extension_counts(group_list)
        
        # Update LastModified
        latest_modified = max(obj['LastModified'] for obj in group_list)
        if prefix_node['LastModified'] is None or latest_modified > datetime.fromisoformat(prefix_node['LastModified']):
            prefix_node['LastModified'] = latest_modified.isoformat()
    
    # Process the root node
    if all_objects:
        root['TotalSize'] = get_total_size(all_objects)
        root['extension_counts'] = get_extension_counts(all_objects)
        root['LastModified'] = max(obj['LastModified'] for obj in all_objects).isoformat()
    
    return root

# Example usage
if __name__ == "__main__":
    bucket_name = 'cpm-selected-customers-logs-output-iad-local-621947758064'
    graph = build_prefix_graph(bucket_name)
    print(graph)




