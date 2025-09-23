#!/bin/bash

# Production deployment script for Vercel
echo "Running Prisma migrations..."

# Generate Prisma client
npx prisma generate

# Push database schema to production database
npx prisma db push

# Seed initial data if needed
npm run seed

echo "Database setup complete!"