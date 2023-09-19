#!/bin/bash

JOB_NAME=$1
PROJECT_ID=$2

# cd to the directory of this script, which has workspace.yaml
cd $(dirname "$0")

# Rebuild the worker image
docker build -t hloc -f Dockerfile.hloc .
docker build -t gs-cuda -f Dockerfile.gs-cuda .

TAGS=\{\"dagster/partition\":\"${PROJECT_ID}\"\}
dagster job execute -m worker -j $JOB_NAME --config config.${JOB_NAME}.yaml --tags $TAGS
