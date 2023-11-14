#!/bin/bash
set -e
cd $(dirname $(realpath -s $0))

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
    ret=${x:+"RETURNING $x"}

    psql_exec "UPDATE api.projects SET state = '$1' WHERE id=$PROJECT_ID $ret;"
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
}

fail_project() {
    update_state "failed"
}

run_worker() {
    # Prepare workspace
    WORKSPACE="/home/$USER/workspace/$PROJECT_ID"
    mkdir -p "$WORKSPACE"

    # Load uploaded files
    ./s3.sh load "$PROJECT_ID" uploads || return $?

    # Run docker container
    docker run \
        --rm \
        --gpus=all \
        --shm-size=16g \
        --env-file=./.env \
        -v "$WORKSPACE:/workspace" \
        hloc "$PROJECT_ID" "$CONFIG" ||
        return $?

    # Store results
    ./s3.sh store "$PROJECT_ID" model || return $?

    return 0
}

logger() {
    while read line; do
        echo "SELECT api.append_log_entry($PROJECT_ID, '$line');"
    done | psql "$POSTGRES_URL" -f -
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
