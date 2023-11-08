#!/bin/sh
# Reload the postgrest schema cache
# Necessary after changing database schema
docker ps --format "{{.Names}}" | grep postgrest | xargs docker kill -s SIGUSR1
