#!/bin/sh

mkdir -p $3
cp -r $2/colmap $3/colmap
ns-process-data images \
    --data $1 \
    --output-dir $3 \
    --skip-colmap \
    --num-downscales 0

ns-train nerfacto \
    --data $3 \
    --output_dir . \
    --experiment_name model
