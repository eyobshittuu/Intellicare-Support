# ⚠️ IMPORTANT: MySQL Password Required

## Current Issue
MySQL requires a password, but the `.env` file has it blank.

## Quick Fix Steps:

### Step 1: Find Your MySQL Password
You used this database before. Check:
- Do you remember setting a MySQL password during installation?
- Common defaults: blank, "root", "admin", "password"
- Check your previous project's `.env.local` file if you still have it

### Step 2: Update server/.env
Open `server/.env` and set:
```
DB_PASSWORD=your_actual_mysql_password
```

### Step 3: Create Database
**Option A - MySQL Workbench:**
1. Open MySQL Workbench
2. Connect (enter your password)
3. Run: `CREATE DATABASE intellicare_support;`

**Option B - Command Line:**
```bash
mysql -u root -p
# Enter password
CREATE DATABASE intellicare_support;
exit;
```

### Step 4: Run Migration
```bash
cd server
node scripts/migrate.js
```

This creates:
- ✅ All database tables
- ✅ Default admin account:
  - Email: admin@intellicare.com  
  - Password: admin123

### Step 5: Start Both Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Should show: "🚀 Server running on http://localhost:5000"

**Terminal 2 - Frontend:**
```bash
cd client  
npm run dev
```
Should show: "http://localhost:5173"

### Step 6: Open Application
Open browser: **http://localhost:5173**

Login with:
- Email: admin@intellicare.com
- Password: admin123

---

## 🆘 Need Help?

**If you don't know your MySQL password:**
1. Open "Services" in Windows
2. Stop "MySQL80" service
3. Follow MySQL password reset guide
4. Or reinstall MySQL with a known password

**Can't create database?**
- Make sure MySQL service is running
- Check if database already exists: `SHOW DATABASES;`
- Verify password in server/.env matches MySQL

---

## ✅ Everything Installed:
- ✅ Backend dependencies (148 packages)
- ✅ Frontend dependencies (161 packages)  
- ✅ .env files created
- ⏳ Need: Database setup + password configuration

**After fixing the password and running migration, everything will work!**
