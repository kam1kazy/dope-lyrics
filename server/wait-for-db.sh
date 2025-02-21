#!/bin/sh
# wait-for-db.sh

set -e

host="$1"
shift
cmd="$@"

echo "wait-for-db.sh: Checking DB connection with:"
echo "Host: $host"
echo "User: $DB_USER"
echo "Database: $DB_NAME"

until PGPASSWORD="${DB_PASSWORD}" psql -h "$host" -U "${DB_USER}" -d "${DB_NAME}" -c '\l'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
eval "$cmd" 