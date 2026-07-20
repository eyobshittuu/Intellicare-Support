# 🗄️ Database Setup Required

MySQL needs a password to create the database. Please follow these steps:

## Option 1: Using MySQL Workbench (Easiest)

1. **Open MySQL Workbench**
2. **Connect to your local MySQL server**
   - Click on your connection (usually "Local instance MySQL80")
   - Enter your MySQL root password
3. **Run this SQL:**
   ```sql
   CREATE DATABASE IF NOT EXISTS intellicare_support 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci;
   ```
4. **Update the server/.env file:**
   - Open `server/.env`
   - Set `DB_PASSWORD=your_mysql_password`

## Option 2: Using Command Line

Open Command Prompt and run:
```bash
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
mysql -u root -p
```

Enter your MySQL password, then run:
```sql
CREATE DATABASE IF NOT EXISTS intellicare_support 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
exit;
```

## Option 3: Using phpMyAdmin (if using XAMPP)

1. Open http://localhost/phpmyadmin
2. Click "New" in the left sidebar
3. Database name: `intellicare_support`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"

## After Creating Database

Run migrations to create tables:
```bash
cd server
node scripts/migrate.js
```

This will create all tables and a default admin account:
- Email: admin@intellicare.com
- Password: admin123

## Then Start the Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Open browser: http://localhost:5173
