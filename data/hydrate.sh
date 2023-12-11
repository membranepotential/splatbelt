#!/bin/bash
cd $(dirname $(realpath -s $0))

DATE=$(date -Is)
MODEL_CONF=$(tr -d '\n' <model_conf.json)

# Replace test data
# Columns must be tab (\t) separated
psql postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST <<EOF
DELETE FROM api.projects WHERE id = 1;
COPY api.projects (id, name, state, config) FROM stdin;
1	Dev Project	complete	$MODEL_CONF
\.
EOF

aws s3 --endpoint $S3_ENDPOINT rm --recursive s3://$S3_BUCKET/1/
aws s3 --endpoint $S3_ENDPOINT cp sun-tube.scaled.mp4 s3://$S3_BUCKET/1/uploads/sun-tube.scaled.mp4
aws s3 --endpoint $S3_ENDPOINT cp point_cloud.ply s3://$S3_BUCKET/1/point_cloud.ply
