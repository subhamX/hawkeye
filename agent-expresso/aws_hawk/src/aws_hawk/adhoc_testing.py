#!/usr/bin/env python

from aws_hawk.entrypoint import entrypoint
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run():
    entrypoint(account_id='123456789012', work_scope='Do not check for anything in Route53 and Kinesis.', logger=logger)