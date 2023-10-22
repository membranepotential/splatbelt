#!/bin/bash

mkdir -p model
gaussian_splatting_cuda \
    -d colmap-pinhole \
    -o model \
    -i $MAX_ITER
