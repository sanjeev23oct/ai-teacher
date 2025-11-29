#!/bin/bash

echo "🚀 Setting up AI Teacher Database..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start PostgreSQL
echo "📦 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is healthy
if docker ps | grep -q "ai-teacher-db"; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ Failed to start PostgreSQL"
    exit 1
fi

echo ""

# Run Prisma migrations
echo "🔄 Running database migrations..."
cd server
npx prisma migrate dev --name init

echo ""

# Generate Prisma Client
echo "⚙️  Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 To view your database, run:"
echo "   cd server && npx prisma studio"
echo ""
echo "🚀 To start the server, run:"
echo "   cd server && npm run dev"
echo ""
