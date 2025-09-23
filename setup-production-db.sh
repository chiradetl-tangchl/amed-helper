#!/bin/bash

echo "🚀 Setting up production database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your Supabase connection string:"
    echo 'export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"'
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