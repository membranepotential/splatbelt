FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

ARG TORCH_CUDA_VERSION="121"
ARG TORCH_VERSION="2.1.0"
ARG TORCH_DOWNLOAD_URL="https://download.pytorch.org/libtorch/cu${TORCH_CUDA_VERSION}/libtorch-cxx11-abi-shared-with-deps-${TORCH_VERSION}%2Bcu${TORCH_CUDA_VERSION}.zip"

ARG CUDA_ARCHITECTURES="61;70;86"
ARG TORCH_CUDA_ARCH_LIST="6.1;7.0;8.6+PTX"

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    zip \
    unzip \
    ninja-build \
    python3 \
    python3-dev \
    python3-pip \
    python-is-python3 \
    libtbb-dev \
    && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache -U pip setuptools cmake

RUN git clone --recursive https://github.com/MrNeRF/gaussian-splatting-cuda.git

RUN curl ${TORCH_DOWNLOAD_URL} -o libtorch.zip && \
    unzip  libtorch.zip -d gaussian-splatting-cuda/external/ && \
    rm libtorch.zip

RUN cd gaussian-splatting-cuda && \
    sed -i "s/native/\"${CUDA_ARCHITECTURES}\"/" CMakeLists.txt && \
    sed -i "s/native/\"${CUDA_ARCHITECTURES}\"/" external/CMakeLists.txt && \
    cmake -B build \
    -DTORCH_CUDA_ARCH_LIST=${TORCH_CUDA_ARCH_LIST} \
    -DCMAKE_BUILD_TYPE=Release -G Ninja

RUN cmake --build build
