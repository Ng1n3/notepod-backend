#!/bin/bash
set -e  # Exit on any error

echo "Waiting for PostgreSQL to start..."
until pg_isready -h db -U ${POSTGRES_USER}; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Database setup completed successfully!"
