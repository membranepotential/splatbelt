#!/bin/bash

# cd to the directory of this script
cd $(dirname $(realpath -s $0))

# drop database
psql "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}" -c "drop schema api cascade;"

# init database
psql "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}" -f ./schema.sql

# Reload PostgREST schema cache
./reload-postgrest-schema-cache.sh

# Replace dev data
./../data/hydrate.sh
