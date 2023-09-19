#!/bin/bash

# Sync docker group GID with host
DOCKER_HOST_GID=$(stat -c '%g' /var/run/docker.sock)
sudo groupmod --gid $DOCKER_HOST_GID docker

# Execute whatever commands were passed in (if any). This allows us
# to set this script to ENTRYPOINT while still executing the default CMD.
# set +e
# exec "\$@"

sleep infinity
