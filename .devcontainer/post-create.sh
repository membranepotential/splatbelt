#!/bin/sh

# Definitely this is needed on remote containers, but probably nowhere else
# Also could fuck with the host docker
# To test nvidia runtime: docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
# sudo nvidia-ctk runtime configure --runtime=docker
# sudo systemctl restart docker

# create S3 bucket
aws s3 --endpoint-url http://minio:9000 mb s3://$S3_BUCKET

# Login to brev
if [ -s ./brev-token.txt ]; then
	brev login --token $(cat ./brev-token.txt)
fi

# install node modules
cd /workspace/app
npm install

# for running e2e tests
npx playwright install --with-deps chromium
