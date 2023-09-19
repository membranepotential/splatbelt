#!/bin/bash
cd $(dirname $(realpath -s $0))

DATE=$(date -Is)
UPLOADS=$(tr -d '\n' < uploads.json)
MODELS=$(tr -d '\n' < models.json)

psql postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST <<EOF
DELETE FROM api.projects WHERE id = 1;
COPY api.projects (id, created, updated, name, uploads, models) FROM stdin;
1	$DATE	$DATE	'Dev Project'	$UPLOADS	$MODELS
\.
EOF

aws s3 --endpoint $S3_ENDPOINT rm --recursive s3://$S3_BUCKET/1/
aws s3 --endpoint $S3_ENDPOINT cp sun-tube.scaled.mp4 s3://$S3_BUCKET/1/sun-tube.scaled.mp4
