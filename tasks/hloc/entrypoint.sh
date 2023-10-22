#!/bin/bash

set -e

FRAME_DIR=/workspace/images

# Process images and videos
process_sources.py -p $PROJECT_ID -s $SOURCES -o $FRAME_DIR

# Create pairing
pairing.py \
    -i $FRAME_DIR \
    -c $PAIRING \
    -o pairs.txt

# Extract features
extract_features.py \
    -i $FRAME_DIR \
    -f features.h5 \
    -c $FEATURE_TYPE

# Match features
match_features.py \
    -p pairs.txt \
    -f features.h5 \
    -m matches.h5 \
    -c $MATCHER

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


# Colmap undistort
colmap image_undistorter \
    --image_path $FRAME_DIR \
    --input_path colmap/sparse/0 \
    --output_path colmap-pinhole \
    --output_type COLMAP

mv colmap-pinhole/sparse colmap-pinhole/0
mkdir colmap-pinhole/sparse
mv colmap-pinhole/0 colmap-pinhole/sparse/0
