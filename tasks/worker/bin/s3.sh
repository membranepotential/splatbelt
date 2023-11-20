#!/bin/bash
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
    ENDPOINT_ARG="--endpoint-url=$S3_ENDPOINT"
fi

KEY=${3:-"."}

case $OP in
load)
    # echo "Load ${PROJECT_ID}/${KEY}"
    aws s3 sync --no-progress "$ENDPOINT_ARG" "s3://$S3_BUCKET/$PROJECT_ID/$KEY" "$KEY"
    ;;
store)
    # echo "Store ${PROJECT_ID}/${KEY}"
    aws s3 sync --no-progress "$ENDPOINT_ARG" "$KEY" "s3://$S3_BUCKET/$PROJECT_ID/$KEY"
    ;;
*)
    usage
    exit 1
    ;;
esac
