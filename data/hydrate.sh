#!/bin/bash
cd $(dirname $(realpath -s $0))

DATE=$(date -Is)
CAMERA='("{5.99, 5.1, -12.77}", "{-0.07, -0.71, -0.7}", "{0.0, 0.0, 0.0}", 50.0)'
MODEL_CONF=$(tr -d '\n' <model_conf.json)

# Replace test data
# Columns must be tab (\t) separated
psql postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST <<EOF
DELETE FROM api.projects WHERE id = 1;
COPY api.projects (id, name, state, camera, config) FROM stdin;
1	Dev Project	COMPLETE	$CAMERA	$MODEL_CONF
\.
EOF

aws s3 --endpoint $S3_ENDPOINT rm --recursive s3://$S3_BUCKET/1/
aws s3 --endpoint $S3_ENDPOINT cp sun-tube.scaled.mp4 s3://$S3_BUCKET/1/uploads/sun-tube.scaled.mp4
aws s3 --endpoint $S3_ENDPOINT cp point_cloud.ply s3://$S3_BUCKET/1/point_cloud.ply
