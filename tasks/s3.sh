#!/bin/bash
cd $(dirname $(realpath -s $0))

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

usage() {
    echo "Usage: $0 (load|store) <project-id> [<key>]"
}

OP=$1
if [ -z "$OP" ]; then
    usage
    exit 1
fi

PROJECT_ID=$2
if [ -z "$PROJECT_ID" ]; then
    usage
    exit 1
fi

if [ ! -z $S3_ENDPOINT ]; then
    ENDPOINT_ARG="--endpoint=${S3_ENDPOINT}"
fi

KEY=$3

# Prepare workspace
WORKSPACE=${WORKSPACE:-"/home/$USER/workspace/$PROJECT_ID"}
mkdir -p "$WORKSPACE" 2>/dev/null

case $OP in
load)
    echo "Load ${PROJECT_ID}/${KEY}"
    aws s3 "$ENDPOINT_ARG" sync "s3://${S3_BUCKET}/${PROJECT_ID}/${KEY}" "${WORKSPACE}/${KEY}"
    ;;
store)
    echo "Store ${PROJECT_ID}/${KEY}"
    aws s3 "$ENDPOINT_ARG" sync "${WORKSPACE}/${KEY}" "s3://${S3_BUCKET}/${PROJECT_ID}/${KEY}"
    ;;
*)
    usage
    exit 1
    ;;
esac
