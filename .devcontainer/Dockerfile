FROM node:current-bookworm

RUN apt update && apt -y upgrade

ADD library-scripts/*.sh /
RUN /bin/bash /common-debian.sh
RUN /bin/bash /install-docker.sh
RUN /bin/bash /install-diff-so-fancy.sh
RUN /bin/bash /install-brev-cli.sh

RUN apt -y install python3-full python3-pip python-is-python3
RUN apt -y install awscli postgresql-client
RUN apt -y install ffmpeg libsm6 libxext6

ENV PIP_BREAK_SYSTEM_PACKAGES=1
ADD requirements.txt /
RUN pip install -r /requirements.txt

ADD entrypoint.sh /
ENTRYPOINT /entrypoint.sh
