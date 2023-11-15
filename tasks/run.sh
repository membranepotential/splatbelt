#!/bin/bash
set -e
cd $(dirname $(realpath -s $0))

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 <project-id>"
    exit 1
fi

if [ -z "$POSTGRES_URL" ]; then
    echo "Environment variable POSTGRES_URL not set"
    exit 1
fi

psql_exec() {
    psql "$POSTGRES_URL" -qtA -c "$1"
}

update_state() {
    local ret
    ret=${2:+"RETURNING $2"}

    psql_exec "UPDATE api.projects SET state='$1' WHERE id=$PROJECT_ID $ret;"
}

run_project() {
    local state

    state=$(psql_exec "SELECT state FROM api.projects WHERE id=$PROJECT_ID;")
    if [ "$state" != "pending" ]; then
        echo "Error: project state must be pending, is currently $state"
        exit 1
    fi

    update_state "running" "config"
}

complete_project() {
    update_state "complete"
    echo "Project $PROJECT_ID complete"
}

fail_project() {
    update_state "failed"
    echo "Project $PROJECT_ID failed"
}

run_worker() {
    # Load uploaded files
    if [ ! -d "uploads" ]; then
        ./s3.sh load "$PROJECT_ID" uploads

        if [ $? -ne 0 ]; then
            echo "Error: failed to load uploads"
            return $?
        fi
    fi

    # Run docker container
    WORKSPACE=${WORKSPACE:-"/home/$USER/workspace/$PROJECT_ID"}
    docker run \
        --rm \
        --gpus=all \
        --shm-size=16g \
        --env-file=.env \
        -v "$WORKSPACE:/workspace" \
        worker "$PROJECT_ID" "$CONFIG"

    if [ $? -ne 0 ]; then
        echo "Error: docker run failed"
        return $?
    fi

    # Store results
    ./s3.sh store "$PROJECT_ID" model || return $?

    if [ $? -ne 0 ]; then
        echo "Error: failed to store model"
        return $?
    fi

    return 0
}

logger() {
    while read line; do
        if [ -z "$line" ]; then
            continue
        fi

        echo "$line" >/dev/tty
        echo "SELECT api.append_log_entry(${PROJECT_ID}, "'$$'$line'$$);'
    done | psql -q "$POSTGRES_URL" -f - 2>&1 >/dev/null
}

trap 'fail_project' EXIT

# Load config and set project state to running
CONFIG=$(run_project)

run_worker 2>&1 | logger

EXIT_CODE=${PIPESTATUS[0]}
if [ $EXIT_CODE -eq 0 ]; then
    complete_project
else
    fail_project
fi

trap - EXIT
