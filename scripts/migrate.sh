#!/bin/sh
set -e

echo "Running database migrations..."
node_modules/.bin/drizzle-kit migrate

echo "Migrations completed successfully"
