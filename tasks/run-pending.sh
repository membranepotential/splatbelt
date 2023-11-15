#!/bin/bash
cd $(dirname $(realpath -s $0))

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

if [ -z "$POSTGRES_URL" ]; then
    echo "Environment variable POSTGRES_URL not set"
    exit 1
fi

psql_exec() {
    psql "$POSTGRES_URL" -qtA -c "$1"
}

project_ids=$(psql_exec "SELECT id FROM api.projects WHERE state='pending' ORDER BY updated;")
for project_id in $project_ids; do
    echo "Run project $project_id"
    ./run.sh $project_id
done
