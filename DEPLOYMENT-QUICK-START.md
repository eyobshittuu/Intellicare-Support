# Quick Deployment Guide - Choose Your Path

## 🎯 Quick Decision Guide

### Path A: PostgreSQL on Render (EASIEST - FREE)
**Time:** 20 minutes  
**Cost:** FREE  
**Changes needed:** Yes (I'll help)  
**Best for:** Testing, MVP, Low traffic

➡️ **Choose this if:** You want free hosting and don't mind code changes

### Path B: MySQL on PlanetScale (EASY - FREE)
**Time:** 25 minutes  
**Cost:** FREE  
**Changes needed:** None (keep MySQL)  
**Best for:** Keep existing code, MySQL preference

➡️ **Choose this if:** You want to keep MySQL code unchanged

### Path C: MySQL on Render (PAID)
**Time:** 20 minutes  
**Cost:** $7/month  
**Changes needed:** None  
**Best for:** Production, Better performance

➡️ **Choose this if:** You have budget and want everything on Render

---

## Path A: PostgreSQL on Render (Recommended)

### Changes I Need to Make:

#### 1. Update `server/config/database.js`
```javascript
// Change from:
const sequelize = new Sequelize(/*MySQL config*/);

// To:
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});
```

#### 2. Update `server/package.json`
Add PostgreSQL drivers:
```json
"dependencies": {
  "pg": "^8.11.3",
  "pg-hstore": "^2.3.4"
}
```

#### 3. Create `server/build.sh`
```bash
#!/usr/bin/env bash
npm install
node scripts/migrate.js
```

**That's it!** All your models work the same. Sequelize handles the differences.

### Steps After Changes:

1. **Create PostgreSQL Database on Render**
   - New + → PostgreSQL
   - Name: intellicare-support-db
   - Copy the "Internal Database URL"

2. **Create Web Service on Render**
   - New + → Web Service
   - Connect GitHub: eyobshittuu/Intellicare-Support
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`

3. **Add Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=[Internal Database URL from step 1]
   JWT_SECRET=[Generate: 32 random chars]
   CLIENT_URL=http://localhost:5173
   ```

4. **Deploy!**
   - Click "Create Web Service"
   - Wait 3-5 minutes
   - Get URL: https://intellicare-support-api.onrender.com

---

## Path B: MySQL on PlanetScale

### No Code Changes Needed! ✅

### Steps:

1. **Create PlanetScale Account**
   - Go to https://planetscale.com
   - Sign up (Free: 5GB storage)
   - Create database: intellicare-ticketing

2. **Get Connection String**
   - Click "Connect"
   - Copy MySQL connection details:
     - Host
     - Username  
     - Password
     - Database name

3. **Import Schema**
   ```bash
   # Connect and import
   mysql -h [host] -u [user] -p[password] [database] < server/setup.sql
   ```

4. **Deploy to Render**
   - New + → Web Service
   - Connect GitHub
   - Root: `server`
   - Build: `npm install`
   - Start: `npm start`

5. **Environment Variables:**
   ```
   NODE_ENV=production
   DB_HOST=[PlanetScale host]
   DB_USER=[PlanetScale user]
   DB_PASSWORD=[PlanetScale password]
   DB_NAME=intellicare_ticketing
   DB_PORT=3306
   JWT_SECRET=[Generate: 32 random chars]
   CLIENT_URL=http://localhost:5173
   ```

6. **Deploy!**

---

## Path C: MySQL on Render (Paid)

### No Code Changes Needed! ✅

### Steps:

1. **Create MySQL Database on Render** ($7/month)
   - New + → MySQL
   - Choose paid plan
   - Copy connection details

2. **Import Schema**
   - Use Render's database shell
   - Or connect remotely and import

3. **Deploy Backend**
   - Same as Path B
   - Use Render MySQL credentials

---

## Generate JWT Secret

### Windows PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Or use online:
https://generate-secret.vercel.app/32

---

## Testing Deployed API

```bash
# Health check
curl https://your-api.onrender.com/api/health

# Should return:
# {"status":"OK","message":"IntelliCare Support API is running"}
```

---

## Free Tier Limitations

### Render Web Service (Free)
- ✅ 512 MB RAM
- ✅ Unlimited bandwidth
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Takes 30-50s to wake up
- ⚠️ Limited to 750 hours/month

### Render PostgreSQL (Free)
- ✅ 1 GB storage
- ✅ Daily backups (7 days)
- ⚠️ Limited to 97 hours/month
- ⚠️ May expire data after 90 days

### PlanetScale (Free)
- ✅ 5 GB storage
- ✅ 1 billion row reads/month
- ✅ 10 million row writes/month
- ✅ No time limits

---

## What Do You Need?

**Please tell me:**
1. Which path do you prefer? (A, B, or C)
2. If Path A: Can I make the database changes?
3. Your frontend deployment plan (Netlify? Vercel? Other?)

Then we'll proceed with deployment! 🚀
