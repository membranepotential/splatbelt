#!/bin/bash

SCRATCH=/tmp/scratch/
mkdir -p $SCRATCH

docker run \
    --gpus all \
    --rm \
    --shm-size 16G \
    -v $SCRATCH:/workspace \
    --network nerf_devcontainer \
    -e MAX_ITER=7000 \
    gs-cuda
