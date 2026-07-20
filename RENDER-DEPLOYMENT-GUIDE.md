# Render Deployment Guide for IntelliCare Support Backend

## 🚨 Important: Database Decision Required

Before deploying, you need to decide on your database hosting:

### Option 1: Render PostgreSQL (Recommended - FREE)
- ✅ Free tier available
- ✅ Fully managed by Render
- ✅ Automatic backups
- ⚠️ **Requires code changes** (MySQL → PostgreSQL)
- ⚠️ I need your permission to update the code

### Option 2: External MySQL Service
- ✅ Keep current MySQL code (no changes)
- ✅ Free tiers available (PlanetScale, Railway)
- ⚠️ Requires separate setup
- ⚠️ Need to manage credentials

### Option 3: Render MySQL (PAID)
- ✅ Keep current MySQL code
- ✅ Fully managed
- ❌ Requires paid plan ($7+/month)

**👉 Please choose an option before proceeding!**

---

## Option 1: Deploy with Render PostgreSQL (Recommended)

This is the easiest and FREE option, but requires converting from MySQL to PostgreSQL.

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account (recommended)
3. Verify your email

### Step 2: Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure database:
   - **Name**: `intellicare-support-db`
   - **Database**: `intellicare_ticketing`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Instance Type**: **Free** (0.1 GB RAM, 1 GB Storage)
3. Click **"Create Database"**
4. Wait for database to be created (2-3 minutes)
5. **Save these credentials** (shown on dashboard):
   - Internal Database URL
   - External Database URL
   - Username
   - Password

### Step 3: Prepare Backend for Deployment

I'll need to make these changes:

#### A. Update Database Configuration
- Change Sequelize dialect from `mysql` to `postgres`
- Update database connection settings
- Add PostgreSQL dependency

#### B. Add Build Script
- Create script to run migrations on deployment

#### C. Update Environment Variables
- Configure for production

**⚠️ DO YOU WANT ME TO MAKE THESE CHANGES NOW?**

If yes, I'll:
1. Update `server/config/database.js` for PostgreSQL
2. Update `server/package.json` to include `pg` and `pg-hstore`
3. Create a `build.sh` script for migrations
4. All your data models will work the same way (Sequelize handles both MySQL and PostgreSQL)

---

## Option 2: Deploy with External MySQL

### Using PlanetScale (FREE MySQL - Recommended)

#### Step 1: Create PlanetScale Account
1. Go to https://planetscale.com
2. Sign up (free tier: 5GB storage, 1 billion reads/month)
3. Create new database: `intellicare-ticketing`
4. Get connection string from dashboard

#### Step 2: Configure Connection
1. Copy connection string (format: `mysql://user:pass@host/database`)
2. Save for later use in Render

#### Step 3: Import Database Schema
```bash
# From your local machine
mysql -h [planetscale-host] -u [user] -p[password] [database] < server/setup.sql
```

Or use PlanetScale's web console to run your SQL schema.

---

## Step 4: Deploy Backend to Render

### A. Push Code to GitHub (Already Done ✅)
Your code is already at: https://github.com/eyobshittuu/Intellicare-Support

### B. Create Web Service on Render

1. Go to Render Dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository:
   - Select: `eyobshittuu/Intellicare-Support`
   - Click **"Connect"**

4. Configure Web Service:

   **Basic Settings:**
   - **Name**: `intellicare-support-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** (512 MB RAM, shared CPU)

5. Click **"Advanced"** to add environment variables

### C. Add Environment Variables

Click **"Add Environment Variable"** for each:

#### Required Variables (for PostgreSQL):
```
NODE_ENV=production
PORT=5000
DATABASE_URL=[Render PostgreSQL Internal URL]
JWT_SECRET=[Generate strong secret - use: openssl rand -base64 32]
JWT_EXPIRE=30d
CLIENT_URL=https://your-frontend-url.netlify.app
```

#### Required Variables (for MySQL):
```
NODE_ENV=production
PORT=5000
DB_HOST=[Your MySQL host]
DB_USER=[Your MySQL user]
DB_PASSWORD=[Your MySQL password]
DB_NAME=intellicare_ticketing
DB_PORT=3306
JWT_SECRET=[Generate strong secret]
JWT_EXPIRE=30d
CLIENT_URL=https://your-frontend-url.netlify.app
```

**To generate JWT_SECRET:**
```bash
# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use an online generator:
# https://generate-secret.vercel.app/32
```

### D. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Start your server
3. Wait 2-5 minutes for first deployment
4. You'll get a URL like: `https://intellicare-support-api.onrender.com`

### E. Verify Deployment

Test your API:
```bash
# Health check
curl https://intellicare-support-api.onrender.com/api/health

# Should return:
# {"status":"OK","message":"IntelliCare Support API is running"}
```

---

## Step 5: Update Frontend Configuration

After backend is deployed, update your frontend:

1. Update `client/.env`:
```env
VITE_API_URL=https://intellicare-support-api.onrender.com/api
```

2. Update CORS in backend (already configured):
   - Go to Render Dashboard → Web Service → Environment
   - Update `CLIENT_URL` to your frontend URL

---

## Files to Add for Render Deployment

### Option 1: PostgreSQL Deployment

If you choose PostgreSQL, I'll create:

#### 1. `render.yaml` (Optional - Infrastructure as Code)
```yaml
services:
  - type: web
    name: intellicare-support-api
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    rootDir: server
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: intellicare-support-db
          property: connectionString
```

#### 2. `build.sh` (Database Migration)
```bash
#!/usr/bin/env bash
# Run migrations on deploy
npm install
node scripts/migrate.js
```

---

## Database Migration (Important!)

### For New PostgreSQL Database:

After backend deployment:
1. Go to Render Dashboard → Web Service → Shell
2. Run migration:
```bash
node scripts/migrate.js
```

### For Existing Data Migration (MySQL → PostgreSQL):

You'll need to:
1. Export data from local MySQL
2. Convert SQL syntax (MySQL → PostgreSQL)
3. Import to PostgreSQL
4. I can help with a migration script if needed

---

## Monitoring & Maintenance

### View Logs
1. Go to Render Dashboard
2. Click your web service
3. Click "Logs" tab
4. See real-time logs

### Restart Service
1. Go to web service dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"

### Update Environment Variables
1. Go to "Environment" tab
2. Update variables
3. Service auto-redeploys

### Database Backups
- **PostgreSQL on Render**: Automatic daily backups (retained 7 days on free tier)
- **External MySQL**: Check your provider's backup policy

---

## Troubleshooting

### Service Won't Start
1. Check logs in Render dashboard
2. Verify all environment variables are set
3. Check database connection string
4. Ensure `NODE_ENV=production`

### Database Connection Errors
1. Verify DATABASE_URL is correct
2. Check if database is running
3. Test connection from Render shell:
```bash
node -e "require('./config/database').authenticate().then(() => console.log('OK')).catch(e => console.error(e))"
```

### CORS Errors
1. Update `CLIENT_URL` in environment variables
2. Ensure frontend URL matches exactly (including https://)
3. Redeploy backend

### 502 Bad Gateway
- Service is starting up (wait 2-3 minutes)
- Or service crashed (check logs)

---

## Cost Breakdown

### Free Tier (Recommended for Testing)
- **Render Web Service**: Free
  - 512 MB RAM
  - Shared CPU
  - Auto-sleep after 15 min inactivity
  - Takes ~30s to wake up on first request
- **Render PostgreSQL**: Free
  - 1 GB Storage
  - 97 hours/month active time
  - Automatic backups (7 days)

### Paid Tier (For Production)
- **Render Web Service**: $7/month
  - 512 MB RAM
  - Shared CPU
  - No sleep/wake delays
  - Better uptime
- **Render PostgreSQL**: $7/month
  - 10 GB Storage
  - 24/7 uptime
  - Better performance

---

## Security Checklist

Before deploying:
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Use HTTPS for frontend (CLIENT_URL)
- [ ] Don't commit .env files
- [ ] Enable environment variable encryption (Render does this)
- [ ] Set NODE_ENV=production
- [ ] Review CORS settings
- [ ] Update default admin password after deployment

---

## Post-Deployment Steps

1. **Test API Endpoints**
   ```bash
   # Register test user
   curl -X POST https://your-api.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123","first_name":"Test","last_name":"User"}'
   
   # Login
   curl -X POST https://your-api.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   ```

2. **Create Super Admin**
   - Login to database
   - Update user role to 'super_admin'
   - Or use migration script

3. **Update Frontend**
   - Update API URL
   - Deploy frontend (Netlify/Vercel)
   - Test full integration

4. **Setup Monitoring**
   - Add Render's built-in monitoring
   - Setup email alerts
   - Monitor error logs

---

## Next: Frontend Deployment

After backend is deployed, you can deploy frontend to:
- **Netlify** (Recommended - Free, Easy)
- **Vercel** (Great for React apps)
- **Render** (Keep everything in one place)

Would you like a guide for frontend deployment too?

---

## Need Help?

Common issues and solutions:
1. **"Database connection failed"** → Check DATABASE_URL format
2. **"Build failed"** → Check package.json scripts
3. **"Application error"** → Check logs for specific error
4. **"CORS error"** → Verify CLIENT_URL matches frontend

---

## Summary

**Before deploying, you must:**
1. ✅ Choose database option (PostgreSQL/MySQL)
2. ✅ Let me know if code changes are needed
3. ✅ Generate JWT_SECRET
4. ✅ Have GitHub repo ready (done)

**Deployment time:**
- Database setup: 5 minutes
- Backend deployment: 10 minutes  
- Testing: 5 minutes
- **Total: ~20 minutes**

**Ready to proceed? Let me know which database option you prefer!**
