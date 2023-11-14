FROM colmap/colmap:20231009.2

ARG TORCH_VERSION="2.1.0"

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

RUN pip install --no-cache torch==${TORCH_VERSION}

RUN git clone --branch master --recursive https://github.com/cvg/Hierarchical-Localization.git
RUN pip install --no-cache -e Hierarchical-Localization

ADD requirements.txt /tmp/requirements.txt
RUN pip install -U --no-cache -r /tmp/requirements.txt

COPY --from=gs-cuda /gaussian-splatting-cuda/external/libtorch/lib /usr/lib
COPY --from=gs-cuda /gaussian-splatting-cuda/build/gaussian_splatting_cuda /usr/bin
COPY --from=gs-cuda /gaussian-splatting-cuda/parameter /usr/parameter

RUN cd $(python -c "import torch; print(torch.__path__[0])") && \
    find lib -type f -exec sh -c \
    'if [ -f "/usr/lib/$(basename {})" ]; then rm "{}"; ln -s "/usr/lib/$(basename {})" "{}"; fi' \;

RUN mkdir -p /workspace
WORKDIR /workspace

ADD entrypoint.sh /bin
ENTRYPOINT "/bin/entrypoint.sh"
