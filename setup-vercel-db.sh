#!/bin/bash

echo "🚀 Setting up Vercel Postgres database..."

# Check if we're using Vercel environment
if [ -f ".env.vercel" ]; then
    echo "📦 Loading Vercel environment..."
    export $(cat .env.vercel | grep -v '^#' | xargs)
elif [ ! -z "$POSTGRES_PRISMA_URL" ]; then
    echo "📦 Using Vercel environment variables..."
else
    echo "❌ No Vercel Postgres environment found"
    echo "Please create Vercel Postgres database first"
    exit 1
fi

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🔄 Pushing database schema..."
npx prisma db push

echo "🌱 Seeding initial data..."
npm run seed

echo "✅ Vercel Postgres setup complete!"