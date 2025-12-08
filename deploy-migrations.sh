#!/bin/bash

# Deploy Prisma migrations to Railway database
# This script should be run from the project root

echo "🚀 Deploying database migrations to Railway..."

cd server

# Run Prisma migrations
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations deployed successfully!"
else
    echo "❌ Migration deployment failed!"
    exit 1
fi

cd ..

echo "🎉 Database is up to date!"
