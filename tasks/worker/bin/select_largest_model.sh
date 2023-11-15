#!/bin/bash

max_images=0
best_model_path=""

for model_path in colmap/sparse/*; do
    if [[ -d $model_path ]]; then
        n_images=$(colmap model_analyzer --path "$model_path" | grep -Po "Registered images: \K\d+")

        if ((n_images > max_images)); then
            max_images=$n_images
            best_model_path=$model_path
        fi
    fi
done

echo $best_model_path
