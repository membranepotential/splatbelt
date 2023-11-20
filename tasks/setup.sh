#!/bin/bash
cd $(dirname $(realpath -s $0))

# Join docker group (will be applied in run script)
sudo usermod -aG docker $USER

# Get CUDA version from worker image
COLMAP_IMAGE=$(grep -m 1 -o 'colmap/colmap:[0-9\.]+' worker/Dockerfile)
CUDA_VERSION=$(sudo docker inspect $COLMAP_IMAGE | jq -r '.[].Config.Env[]|select(match("^CUDA_VERSION"))|.[index("=")+1:]')

# update cuda and install dependencies
# Nvidia keyring for CUDA
source /etc/os-release
ARCH=$(arch)
wget -q -P /tmp https://developer.download.nvidia.com/compute/cuda/repos/$ID${VERSION_ID//./}/$ARCH/cuda-keyring_1.1-1_all.deb
sudo dpkg -i /tmp/cuda-keyring_1.1-1_all.deb

# Nvidia repo for nvidia-docker
curl -sL https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -sL https://nvidia.github.io/nvidia-docker/$ID$VERSION_ID/nvidia-docker.list |
    sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update -q
sudo apt-get -q -y install awscli postgresql-client cuda=$CUDA_VERSION nvidia-container-toolkit

# Build worker image
DOCKER_BUILDKIT=1 sudo docker build -t worker worker/

if [ $? -ne 0 ]; then
    echo "Error: failed to build worker image"
    exit 1
fi
