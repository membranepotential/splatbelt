#!/bin/bash

change_gid() {
  local gid=$1
  local group_name

  # Check if the given GID is already taken
  group_name=$(getent group "$gid" | cut -d: -f1)

  if [[ -z "$group_name" ]]; then
    # The GID is free, so we just return success
    return 0
  fi

  # If we're here, it means the GID is taken by $group_name
  # Find a free GID to assign to $group_name
  local new_gid=$((gid + 1))
  while getent group "$new_gid" &>/dev/null; do
    new_gid=$((new_gid + 1))
  done

  # Change the GID of $group_name to the new GID
  sudo groupmod --gid "$new_gid" "$group_name"
}

# Sync docker group GID with host
# Dangerous: privileged access to the docker socket
DOCKER_HOST_GID=$(stat -c '%g' /var/run/docker.sock)
sudo groupmod --gid "$DOCKER_HOST_GID" docker 2>/dev/null

# If the operation failed (likely due to GID conflict), handle the conflict
if [[ $? -ne 0 ]]; then
  change_gid "$DOCKER_HOST_GID"
  sudo groupmod --gid "$DOCKER_HOST_GID" docker
fi

# Execute whatever commands were passed in (if any). This allows us
# to set this script to ENTRYPOINT while still executing the default CMD.
# set +e
# exec "\$@"

sleep infinity
