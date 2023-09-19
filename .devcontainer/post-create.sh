#!/bin/sh

# create S3 bucket
aws s3 --endpoint-url http://minio:9000 mb s3://$S3_BUCKET

# init database
psql "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres" -f /workspace/.devcontainer/init-db.sql

# install node modules
cd /workspace/app
npm install

# install nerf-worker
echo "Install nerf-worker..."
cd /workspace/worker
pip install -e .
