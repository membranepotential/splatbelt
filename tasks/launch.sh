#!/bin/bash

INSTANCE_NAME=${1:-"splatbelt"}

if [ ! -z $S3_ENDPOINT ]; then
    S3_HOST=$(python -c "from urllib.parse import urlparse; print(urlparse('$S3_ENDPOINT').hostname)")
    S3_PORT_FWD="9000:$S3_HOST:9000"
    S3_PORT_FLAG="-R"
fi

# refresh brev ssh config
brev refresh

# Upload the repo key
rsync --perms --chmod="u=r,go=" ./deploy-key $INSTANCE_NAME:.ssh/id_ed25519

# Setup the instance
ssh $INSTANCE_NAME 'rm -rf splatbelt; git clone git@github.com:membranepotential/splatbelt.git; splatbelt/tasks/setup.sh'
if [ $? -ne 0 ]; then
    echo "Error: setup failed"
    exit 1
fi

# Run the project
ssh \
    -R 5432:$POSTGRES_HOST:5432 \
    $S3_PORT_FLAG $S3_PORT_FWD \
    $INSTANCE_NAME \
    'splatbelt/tasks/run-pending.sh'
