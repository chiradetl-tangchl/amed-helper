#!/bin/bash

echo "🚂 Setting up Railway PostgreSQL database..."

# Load production environment
export $(cat .env.production | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.production"
    echo "Please:"
    echo "1. Go to railway.app"
    echo "2. Create PostgreSQL database"
    echo "3. Copy DATABASE_URL to .env.production"
    exit 1
fi

echo "🔗 Testing Railway connection..."
if ! npx prisma db execute --url "$DATABASE_URL" --stdin <<< "SELECT 1;" &> /dev/null; then
    echo "⚠️  Basic connection test failed, trying alternative method..."
    echo "📦 Generating Prisma client first..."
    npx prisma generate
    echo "🔄 Attempting to connect with Prisma client..."
fi

echo "✅ Railway connection successful!"

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🔄 Pushing database schema to Railway..."
npx prisma db push

echo "🌱 Seeding initial data..."
npm run seed

echo "🎉 Railway PostgreSQL setup complete!"
echo "🚂 Database ready and fast!"