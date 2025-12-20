# Supabase Database Setup Guide

## ✅ Migration Complete

Your project has been successfully migrated from Neon to Supabase PostgreSQL.

## 📋 Next Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: Choose a name (e.g., "kiyumart-db")
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project" and wait for setup to complete

### 2. Get Your Connection String

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Navigate to **Database** in the sidebar
3. Scroll to **Connection string** section
4. Select **URI** mode
5. Copy the connection string (it looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the database password you created

### 3. Update Your .env File

Open your `.env` file and replace the `DATABASE_URL` with your Supabase connection string:

```env
DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
```

### 4. Push Your Database Schema

Run the following command to create your tables in Supabase:

```bash
npm run db:push
```

### 5. Seed Your Database (Optional)

If you want to populate your database with initial data:

```bash
npm run db:seed
```

### 6. Start Your Application

```bash
npm run dev
```

## 🔧 Changes Made

1. **Database Connection** ([db/index.ts](db/index.ts))
   - Replaced Neon serverless driver with standard PostgreSQL driver
   - Using `postgres-js` for better compatibility with Supabase

2. **Dependencies** ([package.json](package.json))
   - Removed: `@neondatabase/serverless`, `ws`
   - Added: `postgres` (PostgreSQL client)

3. **Environment Variables** ([.env](.env))
   - Updated DATABASE_URL placeholder with Supabase-specific instructions

## 📊 Supabase Features You Can Use

- **Auto-generated REST API**: Access your data via REST endpoints
- **Realtime subscriptions**: Listen to database changes in real-time
- **Auth**: Built-in authentication (optional upgrade from your current setup)
- **Storage**: File storage for images/documents
- **Edge Functions**: Serverless functions
- **SQL Editor**: Run queries directly in the dashboard
- **Database Backups**: Automatic daily backups (on paid plans)

## 🔍 Verifying the Connection

After setting up your DATABASE_URL, you can verify the connection by running:

```bash
npm run db:push
```

If successful, you'll see output confirming that tables were created in your Supabase database.

## 🆘 Troubleshooting

### Connection Issues
- Ensure your DATABASE_URL is correctly formatted
- Check that your database password is correct
- Verify that your IP is allowed (Supabase allows all IPs by default)

### SSL Errors
If you encounter SSL errors, add `?sslmode=require` to your connection string:
```
postgresql://postgres:password@host:5432/postgres?sslmode=require
```

### Schema Not Pushing
- Make sure your Supabase project is fully initialized (usually takes 1-2 minutes)
- Check that the connection string is correct
- Verify there are no syntax errors in your schema files

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Drizzle ORM with Supabase](https://orm.drizzle.team/docs/get-started-postgresql)

---

**Need help?** Check the Supabase community at [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
