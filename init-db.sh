#!/bin/bash

# echo "Waiting for PostgreSQL to start..."
# for i in {1..30}; do
#     if pg_isready -h db -U ${POSTGRES_USER}; then
#         echo "PostgreSQL is ready!"
#         break
#     fi
#     echo "Waiting for PostgreSQL... ${i}/30"
#     sleep 2
# done

# if ! pg_isready -h db -U ${POSTGRES_USER}; then
#     echo "PostgreSQL failed to become ready in time"
#     exit 1
# fi

# echo "Checking if the database exists..."
# DB_EXISTS=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h db -U ${POSTGRES_USER} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'")

# if [ -z "$DB_EXISTS" ]; then
#     echo "Database '${POSTGRES_DB}' does not exist. Creating it..."
#     PGPASSWORD=${POSTGRES_PASSWORD} psql -h db -U ${POSTGRES_USER} -c "CREATE DATABASE ${POSTGRES_DB};"
# else
#     echo "Database '${POSTGRES_DB}' already exists."
# fi

# echo "Running database migrations..."
# timeout 30s npx prisma migrate deploy || echo "Migrations timed out!"

# echo "Database setup completed successfully!"

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
