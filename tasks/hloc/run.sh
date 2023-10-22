#!/bin/bash

SCRATCH=/tmp/scratch/
mkdir -p $SCRATCH

docker run \
    --gpus all \
    --rm \
    --shm-size 16G \
    -v $SCRATCH:/workspace \
    --network nerf_devcontainer \
    -e SOURCES="sun-tube.scaled.mp4,num,50" \
    -e PAIRING="exhaustive" \
    -e FEATURE_TYPE="superpoint_max" \
    -e MATCHER="superpoint+lightglue" \
    hloc
