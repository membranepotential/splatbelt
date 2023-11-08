#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

DB_URI=${1:-"postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}"}
DB_NAME="test"
TEST_URI="${DB_URI}/${DB_NAME}"

# cd to the directory of this script
cd $(dirname $(realpath -s $0))

# Create test database 
psql "$DB_URI" -q -c "DROP DATABASE ${DB_NAME};" 2>/dev/null
psql "$DB_URI" -q -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null

# Load schema
psql "$TEST_URI" -q -f schema.sql
if [ $? -ne 0 ]; then
    echo "Error creating schema"
    psql "$DB_URI" -q -c "DROP DATABASE ${DB_NAME};"
    exit 1
fi

# Run tests
PASSED=0
FAILED=0

for f in tests/*.sql; do
    test_name=$(basename "$f" .sql)
    
    output=$(psql "$TEST_URI" -v ON_ERROR_STOP=1 --single-transaction -f "$f" 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}PASS $test_name${NC}"
        let PASSED+=1
    else
        echo -e "${RED}FAIL $test_name${NC}"
        let FAILED+=1
        echo "$output"
    fi
done

echo "$PASSED/$((PASSED + FAILED)) tests passed"

# Drop test database
psql "$DB_URI" -q -c "DROP DATABASE ${DB_NAME};"

# Exit with failure if any tests failed
exit $FAILED
