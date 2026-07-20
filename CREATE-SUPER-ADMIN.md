# 🔐 Create Super Admin User

## Quick Guide - 3 Methods

### ✅ Method 1: Quick Admin Script (Easiest)

**Default Credentials**:
- Email: `admin@intellicare.com`
- Password: `Admin@123`

**Steps**:
1. Go to **Render Dashboard** → Your backend service
2. Click **"Shell"** tab
3. Click **"Launch Shell"**
4. Run:
   ```bash
   npm run admin:quick
   ```
5. You'll see: `✅ Super Admin created successfully!`
6. **Login** with:
   - Email: `admin@intellicare.com`
   - Password: `Admin@123`
7. **⚠️ Change the password** after first login!

---

### Method 2: Interactive Admin Creation

**For custom email/password during creation**:

1. Go to **Render Shell**
2. Run:
   ```bash
   npm run admin:create
   ```
3. Enter your details when prompted:
   - Email address
   - Password
   - First name
   - Last name
4. Done!

---

### Method 3: One-Line Command

**Customize everything in one command**:

1. Go to **Render Shell**
2. Copy this and **modify the values**:

```bash
node -e "const { User } = require('./models'); User.create({ email: 'YOUR_EMAIL@example.com', password: 'YOUR_PASSWORD', first_name: 'Your', last_name: 'Name', role: 'super_admin', is_active: true }).then(() => console.log('✅ Admin created!')).catch(console.error);"
```

**Replace**:
- `YOUR_EMAIL@example.com` → Your email
- `YOUR_PASSWORD` → Your password
- `Your` → Your first name
- `Name` → Your last name

3. Hit Enter

---

## 🎯 Recommended: Method 1 (Quick Admin)

The easiest way:

```bash
# In Render Shell:
npm run admin:quick
```

Then login with:
- **Email**: `admin@intellicare.com`
- **Password**: `Admin@123`

**⚠️ Important**: Change password immediately after first login!

---

## After Creating Admin

### 1. Login to Your App
1. Go to: https://intellicare-support.vercel.app
2. Click "Login"
3. Enter admin credentials
4. Should login successfully ✅

### 2. Change Password
1. Go to Profile or Settings
2. Change password to something secure
3. Save

### 3. Create Other Users
As super admin, you can:
- Create other admin users
- Manage user roles
- View all tickets
- Access admin panel

---

## Verify Admin Was Created

**Check in Render Shell**:
```bash
node -e "const { User } = require('./models'); User.findOne({ where: { role: 'super_admin' } }).then(u => console.log(u ? 'Admin exists: ' + u.email : 'No admin found')).catch(console.error);"
```

Should show: `Admin exists: admin@intellicare.com`

---

## Troubleshooting

### "Admin already exists"
If you see this message, the admin was already created. Try logging in with:
- Email: `admin@intellicare.com`
- Password: `Admin@123`

### "Error: User validation failed"
Make sure password is at least 6 characters long.

### "Cannot find module './models'"
Make sure you're in the correct directory:
```bash
cd /opt/render/project/src/server
npm run admin:quick
```

### Still Can't Create Admin?
Use the one-line command (Method 3) with your own credentials.

---

## Security Best Practices

1. ✅ Change default password immediately
2. ✅ Use strong passwords (mix of letters, numbers, symbols)
3. ✅ Don't share admin credentials
4. ✅ Create separate admin accounts for team members
5. ✅ Deactivate admin accounts when team members leave

---

## Summary

**Fastest way to get started**:
```bash
# 1. Open Render Shell
# 2. Run this:
npm run admin:quick

# 3. Login with:
# Email: admin@intellicare.com
# Password: Admin@123

# 4. Change password after login!
```

🎉 Done! You now have a super admin account!
