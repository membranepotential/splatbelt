FROM colmap/colmap:latest

ENV DEBIAN_FRONTEND=noninteractive
SHELL ["/bin/bash", "-c"]

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    zip \
    unzip \
    git \
    software-properties-common \
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

RUN git clone --branch master --recursive https://github.com/cvg/Hierarchical-Localization.git
RUN pip install --no-cache -e Hierarchical-Localization

ADD requirements.txt /tmp/requirements.txt
RUN pip install -U --no-cache -r /tmp/requirements.txt

ADD bin /bin

RUN mkdir -p /workspace
WORKDIR /workspace

ENV S3_ENDPOINT ""
ENV S3_BUCKET ""
ENV AWS_REGION ""
ENV AWS_ACCESS_KEY_ID ""
ENV AWS_SECRET_ACCESS_KEY ""

ENV PROJECT_ID ""

# Sources follow the format
# image_name;video_1_name,num,50;video_2_name,list,1,5,7,20
# video_1 will have 50 frames in equal intervals extracted
# video_2 will have frames 1, 5, 7, 20 extracted 
ENV SOURCES ""

# Pairing is either 'exhaustive'
# or a mix of n sequential pairs and n pairs determined by retrieval:
# complex:seq=10,retr=10
ENV PAIRING exhaustive

ENV FEATURE_TYPE superpoint_max
ENV MATCHER superpoint+lightglue

ADD entrypoint.sh /bin
CMD entrypoint.sh
