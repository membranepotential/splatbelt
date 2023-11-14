#!/bin/bash
cd $(dirname $(realpath -s $0))

docker-build() {
    BUILD_CACHE=$HOME/.cache/docker

    if [ ! -d "$BUILD_CACHE" ]; then
        mkdir -p "$BUILD_CACHE"
        touch "$BUILD_CACHE/index.json"
    fi

    local image=$1
    echo "Building $image"
    docker buildx build --load -t $image $image/ \
        --cache-to "type=local,dest=$BUILD_CACHE" \
        --cache-from "type=local,src=$BUILD_CACHE"
}

# Build docker images
docker buildx create --name=splatbelt
docker buildx use splatbelt

docker-build gs-cuda
docker-build hloc

# Install dependencies
sudo apt-get update -y
sudo apt-get install -y awscli postgresql-client
