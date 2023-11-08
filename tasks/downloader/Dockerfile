FROM amazon/aws-cli:2.13.32

ENV S3_ENDPOINT ""
ENV S3_BUCKET ""
ENV AWS_REGION ""
ENV AWS_ACCESS_KEY_ID ""
ENV AWS_SECRET_ACCESS_KEY ""
ENV PROJECT_ID ""

RUN mkdir /home/$USER/workspace
WORKDIR /home/$USER/workspace

ADD *.sh /bin/
