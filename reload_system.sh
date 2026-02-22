#!/bin/bash
set -e

echo "==> Tearing down postgres (including volume)..."
docker compose down -v

echo "==> Starting fresh..."
docker compose up -d postgres

echo "==> Waiting for postgres to be ready..."
until docker exec database_postgres pg_isready -U postgres -d viernulvier > /dev/null 2>&1; do
  echo "   ...still waiting"
  sleep 1
done

echo "==> Postgres is ready. Schema has been applied."

docker exec -it database_postgres psql -U postgres -d viernulvier -c "\dt"