#!/bin/batch
aws-cli s3 --endpoint="${S3_ENDPOINT}" sync "s3://${S3_BUCKET}/${PROJECT_ID}/uploads" ./uploads
