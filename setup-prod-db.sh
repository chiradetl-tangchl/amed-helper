#!/bin/bash

echo "🚀 Setting up production database with production environment..."

# Load production environment
export $(cat .env.production | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.production"
    echo "Please update .env.production with your Supabase connection string"
    exit 1
fi

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🔄 Pushing database schema to production..."
npx prisma db push

echo "🌱 Seeding initial data..."
npm run seed

echo "✅ Production database setup complete!"
echo "🌐 Your app should now be fully functional at your Vercel URL"