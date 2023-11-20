FROM mambaorg/micromamba:1.5.1-focal-cuda-11.6.2

ARG TORCH_CUDA_ARCH_LIST="6.1;7.0;8.6+PTX"
WORKDIR /home/$MAMBA_USER

USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    ninja-build \
    git \
    && rm -rf /var/lib/apt/lists/*
USER $MAMBA_USER

RUN micromamba install -y -n base -c "nvidia/label/cuda-11.6.2" cuda-nvcc cuda-runtime cuda-cudart-dev

RUN git clone https://github.com/graphdeco-inria/gaussian-splatting --recursive
RUN micromamba install -y -n base -f gaussian-splatting/environment.yml && \
    micromamba clean --all --yes

USER root
RUN cp gaussian-splatting/train.py /bin/train.py && \
    chmod +x /bin/train.py

RUN mkdir /workspace && chown $MAMBA_USER:$MAMBA_USER /workspace
WORKDIR /workspace
USER $MAMBA_USER
