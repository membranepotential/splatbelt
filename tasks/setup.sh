#!/bin/bash
cd $(dirname $(realpath -s $0))

# Join docker group
sudo usermod -aG docker $USER

# update cuda and install dependencies
wget -q -P /tmp https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i /tmp/cuda-keyring_1.1-1_all.deb
sudo apt-get update -q
sudo apt-get -q -y install awscli postgresql-client cuda

# Build worker image
DOCKER_BUILDKIT=1 sudo docker build -t worker worker/

if [ $? -ne 0 ]; then
    echo "Error: failed to build worker image"
    exit 1
fi
