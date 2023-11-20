#!/bin/bash
set -e
TASK_DIR=$(dirname $(realpath -s $0))
ENV_FILE="$TASK_DIR/.env"

WORKSPACE=${WORKSPACE:-"$HOME/workspace"}
docker run --rm \
    --gpus=all \
    --shm-size=16g \
    --network host \
    --env-file=$ENV_FILE \
    -v $WORKSPACE:/workspace \
    -v $HOME/.cache:/root/.cache \
    worker process_projects.py
