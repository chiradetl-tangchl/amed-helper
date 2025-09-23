#!/bin/bash

echo "🚂 Simple Railway PostgreSQL setup..."

# Load production environment
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🔄 Pushing database schema to Railway..."
npx prisma db push

echo "✅ If no errors above, schema is ready!"

echo "🌱 Seeding initial data..."
npm run seed

echo "🎉 Railway PostgreSQL setup complete!"