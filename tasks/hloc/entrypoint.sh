#!/bin/bash

set -e

show_usage() {
    echo "Usage: $0 <project-id> <config>"
}

get_config() {
    jq -r ".$1" <<<$CONFIG
}

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
    show_usage
    exit 1
fi

CONFIG=$2
if [ -z "$CONFIG" ]; then
    show_usage
    exit 1
fi

FRAME_DIR=/workspace/images

# Process images and videos
process_uploads.py -f $(get_config "frames") -o $FRAME_DIR

# Create pairing
pairing.py \
    -i $FRAME_DIR \
    -c $(get_config "pairing") \
    -o pairs.txt

# Extract features
extract_features.py \
    -i $FRAME_DIR \
    -f features.h5 \
    -c $(get_config "features")

# Match features
match_features.py \
    -p pairs.txt \
    -f features.h5 \
    -m matches.h5 \
    -c $(get_config "matcher")

# Prepare database for colmap
prepare_db.py \
    -i $FRAME_DIR \
    -p pairs.txt \
    -f features.h5 \
    -m matches.h5

# Colmap mapping
mkdir -p colmap/sparse
colmap mapper \
    --image_path $FRAME_DIR \
    --database_path colmap/database.db \
    --output_path colmap/sparse \
    2>&1 | mapper_logger.py

# select largest model
best_model=$(select_largest_model.sh)

# Colmap undistort
colmap image_undistorter \
    --image_path $FRAME_DIR \
    --input_path $best_model \
    --output_path colmap-pinhole \
    --output_type COLMAP

mv colmap-pinhole/sparse colmap-pinhole/0
mkdir colmap-pinhole/sparse
mv colmap-pinhole/0 colmap-pinhole/sparse/0

# Gaussian splatting
mkdir -p model
gaussian_splatting_cuda -d colmap-pinhole -o model -i $(get_config "numIter")
