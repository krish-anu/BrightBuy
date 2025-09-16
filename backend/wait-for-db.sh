#!/bin/sh
# wait-for-db.sh

host="$1"
shift
cmd="$@"

until mysqladmin ping -h "$host" --silent; do
  echo "Waiting for MySQL at $host..."
  sleep 2
done

exec $cmd
