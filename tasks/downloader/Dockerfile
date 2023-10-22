FROM mambaorg/micromamba:1.5.1-alpine

ADD environment.yml /tmp
RUN micromamba install -y -n base -f /tmp/environment.yml && \
    micromamba clean --all --yes

ENV S3_ENDPOINT ""
ENV S3_BUCKET ""
ENV AWS_REGION ""
ENV AWS_ACCESS_KEY_ID ""
ENV AWS_SECRET_ACCESS_KEY ""
ENV PROJECT_ID ""
ENV SOURCES ""

USER root
RUN mkdir /workspace && chown $MAMBA_USER:$MAMBA_USER /workspace
WORKDIR /workspace

ADD entrypoint.sh download.py /bin/
USER $MAMBA_USER

CMD entrypoint.sh
