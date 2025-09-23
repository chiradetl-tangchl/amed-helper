#!/bin/bash

echo "🚛 Migration from Railway to Supabase Singapore"
echo "==============================================="

echo "📊 Step 1: Export data from Railway"
echo "-----------------------------------"
echo "npx prisma db pull"
echo "npx prisma db seed --preview-feature"
echo ""

echo "🏗️  Step 2: Setup Supabase"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Create project in Singapore region"
echo "3. Copy connection string"
echo ""

echo "📦 Step 3: Data migration commands"
echo "1. Export Railway data:"
echo "   npm run export-data"
echo ""
echo "2. Update .env with Supabase URL"
echo "3. Push schema to Supabase:"
echo "   npx prisma db push"
echo ""
echo "4. Import data:"
echo "   npm run import-data"
echo ""

echo "⚡ Expected speed improvement:"
echo "Railway: ~400ms → Supabase SG: ~80ms"