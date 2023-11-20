ARG PYTHON_VERSION="3.9"
ARG TORCH_VERSION="2.1.1"
ARG TORCH_CUDA_VERSION="121"
ARG CUDA_ARCHITECTURES="75;86"
ARG TORCH_CUDA_ARCH_LIST="7.5;8.6+PTX"

# Download libtorch in separate build step
FROM alpine:3.14 as libtorch
RUN apk add --no-cache curl unzip
ARG TORCH_VERSION
ARG TORCH_CUDA_VERSION
ARG URL="https://download.pytorch.org/libtorch/cu${TORCH_CUDA_VERSION}/libtorch-cxx11-abi-shared-with-deps-${TORCH_VERSION}%2Bcu${TORCH_CUDA_VERSION}.zip"
RUN curl $URL -o /tmp/libtorch.zip && \
    unzip  /tmp/libtorch.zip -d / && \
    rm /tmp/libtorch.zip

# colmap is based on nvidia/cuda:12.2.2-devel-ubuntu22.04
FROM colmap/colmap:20231103.5 as colmap-torch
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    software-properties-common \
    python3-launchpadlib \
    python3-pip \
    python-is-python3

RUN add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    python3.9 \
    python3.9-dev \
    python3.9-distutils

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.9 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1 

RUN apt-mark hold python-is-python3 python3-pip && \
    apt-get remove -y --purge software-properties-common python3-launchpadlib && \
    apt autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ARG TORCH_VERSION
RUN pip install -U --no-cache setuptools pip psutil numpy sympy networkx
RUN pip install -U --no-cache torch==${TORCH_VERSION} torchvision

# Build gaussian-splatting-cuda
FROM colmap-torch as gs-cuda
WORKDIR /gaussian-splatting-cuda
RUN git clone --recursive https://github.com/MrNeRF/gaussian-splatting-cuda.git .
COPY --from=libtorch /libtorch ./external/libtorch

RUN apt-get update && apt-get install -y --no-install-recommends build-essential git ninja-build libtbb-dev
RUN pip install -U --no-cache cmake

ARG CUDA_ARCHITECTURES
ARG TORCH_CUDA_ARCH_LIST
RUN sed -i "s/native/\"${CUDA_ARCHITECTURES}\"/" CMakeLists.txt && \
    sed -i "s/native/\"${CUDA_ARCHITECTURES}\"/" external/CMakeLists.txt && \
    cmake -B build -DTORCH_CUDA_ARCH_LIST=${TORCH_CUDA_ARCH_LIST} -DCMAKE_BUILD_TYPE=Release -G Ninja
RUN cmake --build build


# Build hloc
FROM colmap-torch as hloc
WORKDIR /hloc
RUN git clone --branch master --recursive https://github.com/cvg/Hierarchical-Localization.git .
RUN python setup.py bdist_wheel

# Compose worker
FROM colmap-torch as worker

RUN apt-get update && \
    apt-get install -y make awscli jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=hloc /hloc/dist/hloc-*.whl /tmp/
RUN pip install --no-cache /tmp/hloc-*.whl && rm /tmp/hloc-*.whl

COPY --from=libtorch /libtorch/lib /usr/lib
COPY --from=gs-cuda /gaussian-splatting-cuda/build/gaussian_splatting_cuda /usr/bin
COPY --from=gs-cuda /gaussian-splatting-cuda/parameter /usr/parameter

ADD requirements.txt /tmp/requirements.txt
RUN pip install -U --no-cache -r /tmp/requirements.txt

WORKDIR /workspace
ENV PATH="/root/bin:$PATH"
ADD bin/ /bin/
ADD Makefile /Makefile
