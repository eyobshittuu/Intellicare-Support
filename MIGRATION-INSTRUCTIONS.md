# Database Migration Instructions - User Approval System

## ⚠️ IMPORTANT: Run This Migration First!

The user approval system requires a database migration to add new columns. **You must run this migration before the approval system will work.**

---

## Quick Fix for Login Error

If you're getting a **500 error on login**, it means the migration hasn't been run yet. The code is now backward compatible, but you should run the migration as soon as possible.

### Temporary Status
- ✅ Login will work for existing users (backward compatible)
- ⚠️ Approval system won't work until migration is run
- ⚠️ New registrations may fail without migration

---

## Migration Steps

### Option 1: Using Migration Script (Recommended)

```bash
# SSH into your server or use Render shell
cd server

# Run the migration
node migrations/run.js add-account-approval-fields
```

### Option 2: Manual SQL Execution

If the migration script doesn't work, run this SQL directly on your database:

```sql
-- Add account_status column
ALTER TABLE users 
ADD COLUMN account_status ENUM('pending', 'approved', 'rejected') 
DEFAULT 'pending' 
COMMENT 'Account approval status by super admin';

-- Add approved_by column
ALTER TABLE users 
ADD COLUMN approved_by BIGINT UNSIGNED NULL
COMMENT 'Super admin who approved/rejected the account';

-- Add approved_at column
ALTER TABLE users 
ADD COLUMN approved_at DATETIME NULL
COMMENT 'Timestamp when account was approved/rejected';

-- Add rejection_reason column
ALTER TABLE users 
ADD COLUMN rejection_reason TEXT NULL
COMMENT 'Reason for account rejection';

-- Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_approved_by 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- IMPORTANT: Auto-approve all existing users
UPDATE users 
SET account_status = 'approved', 
    approved_at = created_at 
WHERE account_status IS NULL OR account_status = 'pending';
```

### Option 3: Using Render Dashboard

1. Go to your Render dashboard
2. Select your database
3. Click "Connect" → "External Connection"
4. Use a SQL client (TablePlus, DBeaver, etc.)
5. Connect and run the SQL from Option 2

---

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns exist
DESCRIBE users;

-- Check existing users are approved
SELECT id, email, account_status, approved_at 
FROM users 
LIMIT 10;
```

Expected results:
- All columns should exist
- All existing users should have `account_status = 'approved'`

---

## What the Migration Does

1. **Adds 4 new columns** to the `users` table
2. **Auto-approves all existing users** (they won't be locked out)
3. **Sets up foreign key** for tracking who approved accounts
4. **Enables the approval system** for new registrations

---

## After Migration

Once the migration is complete:

### For Existing Users
- ✅ All existing users are automatically approved
- ✅ They can log in immediately
- ✅ No action required

### For New Users
- 📝 New registrations will have status "pending"
- ⏳ They cannot log in until approved
- 👨‍💼 Super admin must approve from "Registrations" page

### For Super Admins
- 🎛️ New "Registrations" menu will appear
- 📊 Can view pending/approved/rejected users
- ✅ Can approve or reject registrations
- 🗑️ Can delete unwanted registrations

---

## Troubleshooting

### "Column 'account_status' doesn't exist"
**Problem**: Migration not run yet  
**Solution**: Run the migration using one of the options above

### "Can't login after migration"
**Problem**: User not approved  
**Solution**: Check user's account_status:
```sql
SELECT email, account_status FROM users WHERE email = 'user@example.com';
```

If status is 'pending', manually approve:
```sql
UPDATE users 
SET account_status = 'approved', approved_at = NOW() 
WHERE email = 'user@example.com';
```

### "Registrations page is empty"
**Problem**: No pending registrations  
**Solution**: This is normal if:
- All users are approved
- No new registrations yet
- Try registering a test account

### Migration fails with foreign key error
**Problem**: MySQL/MariaDB foreign key constraints  
**Solution**: Run without foreign key first:
```sql
-- Add columns without constraints
ALTER TABLE users ADD COLUMN account_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE users ADD COLUMN approved_by BIGINT UNSIGNED NULL;
ALTER TABLE users ADD COLUMN approved_at DATETIME NULL;
ALTER TABLE users ADD COLUMN rejection_reason TEXT NULL;

-- Update existing users
UPDATE users SET account_status = 'approved', approved_at = created_at;

-- Add constraint separately (optional)
ALTER TABLE users 
ADD CONSTRAINT fk_users_approved_by 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
```

---

## Rollback (If Needed)

To remove the approval system:

```sql
-- Remove foreign key first (if it exists)
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_approved_by;

-- Remove columns
ALTER TABLE users DROP COLUMN IF EXISTS rejection_reason;
ALTER TABLE users DROP COLUMN IF EXISTS approved_at;
ALTER TABLE users DROP COLUMN IF EXISTS approved_by;
ALTER TABLE users DROP COLUMN IF EXISTS account_status;
```

Or use the migration script:
```bash
node migrations/rollback.js add-account-approval-fields
```

---

## Production Deployment Checklist

- [ ] Backup database before migration
- [ ] Run migration on staging/dev first
- [ ] Test login with existing user
- [ ] Test new registration flow
- [ ] Verify super admin can access Registrations page
- [ ] Test approve/reject functionality
- [ ] Run migration on production
- [ ] Verify all existing users can still login
- [ ] Monitor logs for any errors

---

## Support

If you encounter issues:

1. Check server logs: `tail -f logs/combined.log`
2. Check database connection
3. Verify migration SQL syntax for your database version
4. Contact support with error messages

---

**Status**: Migration Required  
**Priority**: High  
**Estimated Time**: 2-5 minutes
