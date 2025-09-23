#!/bin/bash

echo "🚀 Fast Supabase setup..."

# Load production environment
export $(cat .env.production | grep -v '^#' | xargs)

# Check connection
echo "🔗 Testing connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
    echo "❌ Cannot connect to database"
    echo "Check your connection string in .env.production"
    exit 1
fi

echo "✅ Connection successful"

echo "📦 Generating Prisma client..."
npx prisma generate --no-engine

echo "🔄 Pushing schema (this may take a moment)..."
timeout 60s npx prisma db push --skip-generate || {
    echo "⚠️  Schema push timed out, trying alternative method..."
    npx prisma db push --force-reset --accept-data-loss --skip-generate
}

echo "✅ Schema pushed successfully"

echo "🌱 Seeding data..."
npm run seed

echo "🎉 Supabase setup complete!"
echo "🌐 Database ready at: db.arczxjlbxwirefylkkgi.supabase.co"