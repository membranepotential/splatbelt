#!/bin/bash

INSTANCE_NAME=${1:-"splatbelt"}

if [ ! -z $S3_ENDPOINT ]; then
    S3_HOST=$(python -c "from urllib.parse import urlparse; print(urlparse('$S3_ENDPOINT').hostname)")
    S3_PORT_FWD="80:$S3_HOST:80"
    S3_PORT_FLAG="-R"
fi

# refresh brev ssh config
brev refresh

# Upload the repo key
rsync --perms --chmod="u=r,go=" ./deploy-key $INSTANCE_NAME:.ssh/id_ed25519

# Setup the instance
ssh $INSTANCE_NAME "sh -c 'sudo usermod -aG docker \$USER'"
ssh $INSTANCE_NAME 'git clone git@github.com:membranepotential/splatbelt.git;  splatbelt/tasks/setup.sh'

# Run the project
ssh \
    -R 5432:$POSTGRES_HOST:5432 \
    ${S3_PORT_FWD+"-R"} $S3_PORT_FWD \
    $INSTANCE_NAME \
    'splatbelt/tasks/run.sh'
