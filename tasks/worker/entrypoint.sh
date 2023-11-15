#!/bin/bash

set -e
export TQDM_DISABLE=1

show_usage() {
    echo "Called $0 $1 $2"
    echo "Usage: $0 <project-id> <config>"
}

get_config() {
    jq -cr ".$1" <<<$CONFIG
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
if [ ! -d $FRAME_DIR ]; then
    echo "Process uploads"
    process_uploads.py -f "$(get_config "frames")" -o $FRAME_DIR
else
    echo "Skip processing uploads"
fi

# Create pairing
echo "Create pairing"
pairing.py \
    -i $FRAME_DIR \
    -c "$(get_config "pairing")" \
    -o pairs.txt

# Extract features
echo "Extract features"
extract_features.py \
    -i $FRAME_DIR \
    -f features.h5 \
    -c $(get_config "features")

# Match features
echo "Match features"
match_features.py \
    -p pairs.txt \
    -f features.h5 \
    -m matches.h5 \
    -c $(get_config "matcher")

# Prepare database for colmap
echo "Prepare database"
prepare_db.py \
    -i $FRAME_DIR \
    -p pairs.txt \
    -f features.h5 \
    -m matches.h5

# Colmap mapping
echo "Colmap mapping"
mkdir -p colmap/sparse
colmap mapper \
    --image_path $FRAME_DIR \
    --database_path colmap/database.db \
    --output_path colmap/sparse \
    --Mapper.ba_global_function_tolerance=1e-6 \
    2>&1 | grep --line-buffered -E "^Registering|^Loading"

# select largest model
echo "Select largest model"
best_model=$(select_largest_model.sh)

# Colmap refine intrinsices
echo "Refine intrinsics"
colmap bundle_adjuster \
    --input_path $best_model \
    --output_path $best_model \
    --BundleAdjustment.refine_principal_point 1 \
    2>&1 >/dev/null

# Colmap undistort
echo "Undistort colmap model"
colmap image_undistorter \
    --image_path $FRAME_DIR \
    --input_path $best_model \
    --output_path colmap-pinhole \
    --output_type COLMAP \
    2>&1 >/dev/null

mv colmap-pinhole/sparse colmap-pinhole/0
mkdir colmap-pinhole/sparse
mv colmap-pinhole/0 colmap-pinhole/sparse/0

# Gaussian splatting
echo "Run gaussian splatting"
mkdir -p model
gaussian_splatting_cuda \
    -d colmap-pinhole \
    -o model \
    -i $(get_config "numIter") \
    2>&1 | stdbuf -i0 -o0 -e0 tr '\r' '\n'
