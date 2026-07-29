# Fix MySQL Connection Issue

## Current Problem
The server shows: `Access denied for user 'root'@'localhost' (using password: NO)`

## Solution Options

### Option 1: Set MySQL Password in .env (Recommended)

1. **Find your MySQL password**
   - If using XAMPP: Usually no password (empty) OR "root"
   - If using WAMP: Usually "root"
   - If using standalone MySQL: The password you set during installation

2. **Update server/.env file**
   ```env
   DB_PASSWORD=your_password_here
   ```

3. **Restart the server**
   - Server will auto-restart (nodemon is watching)
   - OR manually stop and start: `npm run dev`

### Option 2: Reset MySQL Root Password

If you don't remember your password:

#### For XAMPP/WAMP Users:
1. Open XAMPP/WAMP Control Panel
2. Stop MySQL
3. Click on MySQL "Config" → "my.ini"
4. Add under `[mysqld]`:
   ```
   skip-grant-tables
   ```
5. Save and restart MySQL
6. Open MySQL shell:
   ```sql
   mysql -u root
   USE mysql;
   UPDATE user SET password=PASSWORD("") WHERE User='root';
   FLUSH PRIVILEGES;
   ```
7. Remove `skip-grant-tables` from my.ini
8. Restart MySQL
9. Update server/.env: `DB_PASSWORD=`

#### For Windows MySQL Standalone:
1. Stop MySQL service:
   ```cmd
   net stop MySQL80
   ```

2. Start MySQL in safe mode (as Administrator):
   ```cmd
   mysqld --skip-grant-tables
   ```

3. In another terminal:
   ```cmd
   mysql -u root
   USE mysql;
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   FLUSH PRIVILEGES;
   exit;
   ```

4. Stop safe mode and restart service:
   ```cmd
   net start MySQL80
   ```

5. Update server/.env: `DB_PASSWORD=`

### Option 3: Start MySQL Service (If Not Running)

Run Command Prompt as Administrator:

```cmd
net start MySQL80
```

Or use Services:
1. Press `Win + R`
2. Type `services.msc`
3. Find "MySQL80"
4. Right-click → Start

### Option 4: Common Default Passwords to Try

Update `server/.env` and try these:

```env
# Try empty (no password)
DB_PASSWORD=

# Try "root"
DB_PASSWORD=root

# Try "password"
DB_PASSWORD=password

# Try "mysql"
DB_PASSWORD=mysql
```

After each change, the server will auto-restart.

## Verify MySQL is Working

### Check if MySQL is running:
```cmd
tasklist | findstr mysql
```

### Test MySQL connection:
```cmd
mysql -u root -p
```
(Enter your password when prompted)

### Check MySQL status via PowerShell:
```powershell
Get-Service MySQL80
```

## After Fixing

Once MySQL connection works:

1. Server will show:
   ```
   ✅ Database connected successfully
   ✅ Database tables synced
   ```

2. The `messages` table will be automatically created

3. Chat system will be fully functional!

## Still Having Issues?

### Create Database Manually:
```sql
mysql -u root -p
CREATE DATABASE intellicare_support CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### Check Database Exists:
```sql
mysql -u root -p
SHOW DATABASES;
```

Look for `intellicare_support` in the list.

## Current Status

✅ Server is running on http://localhost:5000
✅ Client is running on http://localhost:5173
❌ Database connection needs password configuration

Once database is connected, the chat system will be fully operational!
