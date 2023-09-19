#!/bin/bash

JOB_NAME=$1
PROJECT_ID=$2

# cd to the directory of this script, which has workspace.yaml
cd $(dirname "$0")

# Rebuild the worker image
docker build -t worker -f Dockerfile.worker .

export DAGSTER_HOME=$PWD

TAGS=\{\"dagster/partition\":\"${PROJECT_ID}\"\}
dagster job launch -w workspace.yaml -j $JOB_NAME --config config.yaml --tags $TAGS
