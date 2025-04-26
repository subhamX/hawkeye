#!/usr/bin/env python

from aws_hawk.entrypoint import entrypoint
import logging
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run():
    await entrypoint(account_id='123456789012', work_scope='Do not check for anything in Route53 and Kinesis.', logger=logger)
    

if __name__ == "__main__":
    asyncio.run(run())