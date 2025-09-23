# Production Deployment Guide

## Supabase + Vercel Deployment Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: `amed-helper`
3. Set a strong database password
4. Wait for setup completion

### 2. Get Supabase Connection Details
1. In Supabase Dashboard → Settings → Database
2. Copy the connection string (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password

### 3. Set Vercel Environment Variables
In your Vercel project settings, add:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
```

### 4. Deploy Database Schema
After first deployment, run in your local terminal with production DATABASE_URL:

```bash
# Set production database URL temporarily
export DATABASE_URL="your-supabase-connection-string"

# Push schema to production
npx prisma db push

# Seed initial data
npm run seed
```

### 5. Test Your Deployment
1. Visit your Vercel URL
2. Go to `/admin/login`
3. Use your ADMIN_USERNAME and ADMIN_PASSWORD
4. Verify all functionality works

## Security Checklist
- [ ] Change default admin credentials
- [ ] Use a strong JWT_SECRET (32+ characters)
- [ ] Enable RLS (Row Level Security) in Supabase if needed
- [ ] Set up proper CORS if using Supabase client-side

## Troubleshooting
- If migration fails, check DATABASE_URL format
- If admin login fails, verify ADMIN_USERNAME/PASSWORD
- If JWT errors occur, ensure JWT_SECRET is set
- Check Vercel function logs for detailed errors