#!/bin/bash

echo "🎯 Manual Supabase setup - step by step"

# Load environment
export $(cat .env.production | grep -v '^#' | xargs)

echo "1️⃣  Generate Prisma client only..."
npx prisma generate --no-engine

echo "2️⃣  Create tables manually (faster)..."
echo "   Go to Supabase Dashboard → SQL Editor"
echo "   Run this command to get SQL:"
echo ""
echo "   npx prisma migrate diff \\"
echo "     --from-empty \\"
echo "     --to-schema-datamodel prisma/schema.prisma \\"
echo "     --script > create-tables.sql"
echo ""
echo "   Then copy SQL to Supabase SQL Editor and run"
echo ""
echo "3️⃣  After creating tables manually, run seeding:"
echo "   npm run seed"
echo ""

echo "🚀 Or try the automatic way:"
echo "   ./setup-supabase-fast.sh"