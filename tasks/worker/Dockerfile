ARG CUDA_VERSION="12.1.1"
ARG TORCH_CUDA_VERSION="121"
ARG TORCH_VERSION="2.1.0"

FROM nvidia/cuda:${CUDA_VERSION}-devel-ubuntu22.04 as gs-cuda

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

RUN git clone --recursive https://github.com/MrNeRF/gaussian-splatting-cuda.git /gaussian-splatting-cuda
WORKDIR /gaussian-splatting-cuda

ARG TORCH_CUDA_VERSION
ARG TORCH_VERSION
ARG TORCH_DOWNLOAD_URL="https://download.pytorch.org/libtorch/cu${TORCH_CUDA_VERSION}/libtorch-cxx11-abi-shared-with-deps-${TORCH_VERSION}%2Bcu${TORCH_CUDA_VERSION}.zip"
RUN curl ${TORCH_DOWNLOAD_URL} -o /tmp/libtorch.zip && \
    unzip  /tmp/libtorch.zip -d ./external/ && \
    rm /tmp/libtorch.zip

ARG CUDA_ARCHITECTURES="75;86"
ARG TORCH_CUDA_ARCH_LIST="7.5;8.6+PTX"
RUN sed -i "s/native/\"${CUDA_ARCHITECTURES}\"/" CMakeLists.txt && \
    sed -i "s/native/\"${CUDA_ARCHITECTURES}\"/" external/CMakeLists.txt && \
    cmake -B build -DTORCH_CUDA_ARCH_LIST=${TORCH_CUDA_ARCH_LIST} -DCMAKE_BUILD_TYPE=Release -G Ninja

RUN cmake --build build


FROM colmap/colmap:20231009.2

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    zip \
    unzip \
    git \
    software-properties-common \
    jq \
    python3 \
    python3-pip \
    python3-dev \
    python3-setuptools \
    python-is-python3 \
    ninja-build \
    libtbb-dev \
    && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache -U pip setuptools cmake

ARG TORCH_VERSION
RUN pip install --no-cache torch==${TORCH_VERSION}

RUN git clone --branch master --recursive https://github.com/cvg/Hierarchical-Localization.git
RUN pip install --no-cache -e Hierarchical-Localization

ADD requirements.txt /tmp/requirements.txt
RUN pip install -U --no-cache -r /tmp/requirements.txt

COPY --from=gs-cuda /gaussian-splatting-cuda/external/libtorch/lib /usr/lib
COPY --from=gs-cuda /gaussian-splatting-cuda/build/gaussian_splatting_cuda /usr/bin
COPY --from=gs-cuda /gaussian-splatting-cuda/parameter /usr/parameter

RUN mkdir -p /workspace
WORKDIR /workspace

ADD bin/ entrypoint.sh /bin/
ENTRYPOINT ["/bin/entrypoint.sh"]
