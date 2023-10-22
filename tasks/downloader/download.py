#!/usr/bin/env python3

import os
import click
import boto3

BUCKET = os.environ["S3_BUCKET"]


def get_s3_client():
    endpoint = os.environ.get("S3_ENDPOINT", "")
    if endpoint:
        return boto3.client("s3", endpoint_url=endpoint)
    else:
        region = os.environ["AWS_REGION"]
        return boto3.client("s3", region_name=region)


def download(name: str, project_id: str, client):
    name = name.strip()
    key = project_id + "/" + name
    client.download_file(BUCKET, key, name)
    print(f"Downloaded {name}")


@click.command()
@click.option("--project-id", "-p", required=True)
@click.option("--sources", "-s", required=True)
def main(project_id, sources):
    client = get_s3_client()

    for name in sources.split(","):
        download(name, project_id, client)


if __name__ == "__main__":
    main()
