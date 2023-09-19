#!/bin/bash
echo "image_dir: $1"
echo "export_dir $2"

mkdir -p $2/colmap/sparse

logger=$(dirname $0)/mapper_logger.py
echo $logger

colmap mapper \
    --image_path $1 \
    --database_path $2/colmap/database.db \
    --output_path $2/colmap/sparse \
    2>&1 | $logger

colmap image_undistorter \
    --image_path $1 \
    --input_path $2/colmap/sparse/0 \
    --output_path $2/colmap-pinhole \
    --output_type COLMAP

mv $2/colmap-pinhole/sparse $2/colmap-pinhole/0
mkdir $2/colmap-pinhole/sparse
mv $2/colmap-pinhole/0 $2/colmap-pinhole/sparse/0
