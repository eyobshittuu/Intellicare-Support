# User Registration Approval System

## Overview

A comprehensive user approval workflow has been implemented where new user registrations require super admin approval before users can sign in to the system.

---

## Features

### 1. **Registration Flow**
- ✅ Users can register with their information
- ✅ After registration, account status is set to "pending"
- ✅ No JWT token is issued on registration
- ✅ User receives a message that approval is required
- ✅ Redirected to login page with informational message

### 2. **Login Restrictions**
- ✅ Pending users cannot log in (403 Forbidden)
- ✅ Rejected users cannot log in (403 Forbidden)
- ✅ Only approved users can successfully log in
- ✅ Clear error messages for each status

### 3. **Super Admin Portal**
- ✅ New "Registrations" menu for super admins
- ✅ View all registrations with filters (pending/approved/rejected)
- ✅ Search by name, email, or username
- ✅ Statistics dashboard showing counts
- ✅ Approve/Reject/Delete actions

### 4. **Account Status States**
- **Pending**: Newly registered, awaiting approval
- **Approved**: Can log in and use the system
- **Rejected**: Cannot log in, with reason provided

---

## Database Schema Changes

### New Fields in `users` Table

```sql
-- Account approval status
account_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'

-- Who approved/rejected the account
approved_by BIGINT UNSIGNED (FK to users.id)

-- When was it approved/rejected
approved_at DATETIME

-- Reason for rejection (optional)
rejection_reason TEXT
```

### Self-Association
- User model now has `approver` association
- Links to the super admin who processed the registration

---

## API Endpoints

### Registration Management (Super Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registrations/pending` | Get all pending registrations |
| GET | `/api/registrations` | Get all registrations (with filters) |
| GET | `/api/registrations/stats` | Get statistics (pending/approved/rejected counts) |
| PUT | `/api/registrations/:id/approve` | Approve a registration |
| PUT | `/api/registrations/:id/reject` | Reject a registration (with reason) |
| DELETE | `/api/registrations/:id` | Delete pending/rejected registration |

### Query Parameters for `/api/registrations`

```javascript
{
  status: 'pending' | 'approved' | 'rejected' | 'all', // Filter by status
  search: 'string',  // Search by name, email, username
  page: number,      // Page number (default: 1)
  limit: number      // Items per page (default: 50)
}
```

### Example Responses

#### Approve Registration
```json
{
  "success": true,
  "message": "User registration approved successfully",
  "user": {
    "id": 5,
    "email": "john@example.com",
    "username": "john_doe",
    "first_name": "John",
    "middle_name": null,
    "last_name": "Doe",
    "account_status": "approved",
    "approved_at": "2024-12-20T10:30:00.000Z"
  }
}
```

#### Reject Registration
```json
{
  "success": true,
  "message": "User registration rejected",
  "user": {
    "id": 6,
    "email": "jane@example.com",
    "username": "jane_smith",
    "first_name": "Jane",
    "middle_name": null,
    "last_name": "Smith",
    "account_status": "rejected",
    "rejection_reason": "Invalid hospital credentials",
    "approved_at": "2024-12-20T10:35:00.000Z"
  }
}
```

---

## User Experience

### Registration Process

1. **User Registers**
   ```
   User fills registration form → Submits
   ```

2. **System Response**
   ```
   ✅ Registration successful!
   📩 "Your account is pending approval by an administrator"
   🔄 Redirected to login page
   ```

3. **Login Page**
   ```
   ℹ️ Info message displayed:
   "Registration successful! Your account is pending approval 
    by an administrator. You will be able to log in once approved."
   ```

### Login Attempts

#### Pending Account
```
❌ Login attempt
⚠️ "Your account is pending approval. Please wait for admin approval."
```

#### Rejected Account
```
❌ Login attempt
⚠️ "Your account registration was rejected. 
    Please contact support for more information."
```

#### Approved Account
```
✅ Login successful
🔄 Redirected to dashboard
```

---

## Super Admin Portal

### Navigation
- New menu item: **"Registrations"** (with UserCog icon)
- Only visible to super admins
- Located between "Users" and "Channels"

### Statistics Dashboard

Shows 4 key metrics:
- **Pending** (yellow) - Awaiting review
- **Approved** (green) - Active users
- **Rejected** (red) - Denied access
- **Total** (teal) - All registrations

### Filters

```javascript
// Status Filter
- All Status
- Pending
- Approved
- Rejected

// Search
- By name (first, middle, last)
- By email
- By username
```

### Actions

#### For Pending Registrations
- **Approve Button** (green) - Grants access
- **Reject Button** (red) - Denies with reason
- **Delete Button** (gray) - Permanently removes

#### For Rejected Registrations
- **Delete Button** (gray) - Permanently removes

#### For Approved Registrations
- No actions (use Users page for management)

### Rejection Modal

When rejecting a user:
```
┌─────────────────────────────────────┐
│ Reject Registration                  │
├─────────────────────────────────────┤
│ You are about to reject John Doe's   │
│ registration. Please provide reason: │
│                                       │
│ ┌─────────────────────────────────┐ │
│ │ Enter rejection reason...        │ │
│ │                                  │ │
│ └─────────────────────────────────┘ │
│                                       │
│  [Cancel]  [Reject]                  │
└─────────────────────────────────────┘
```

---

## Files Created/Modified

### Backend

#### New Files
1. **`server/controllers/registrationController.js`**
   - getPendingRegistrations
   - getAllRegistrations
   - approveRegistration
   - rejectRegistration
   - deleteRegistration
   - getRegistrationStats

2. **`server/routes/registrationRoutes.js`**
   - All registration management routes
   - Super admin protection

3. **`server/migrations/add-account-approval-fields.js`**
   - Database migration for new fields
   - Auto-approves existing users

#### Modified Files
1. **`server/models/User.js`**
   - Added account_status field
   - Added approved_by field
   - Added approved_at field
   - Added rejection_reason field
   - Added self-association for approver

2. **`server/controllers/authController.js`**
   - Updated register: No token, returns requiresApproval
   - Updated login: Check account_status
   - Added status checks (pending/rejected blocks)

3. **`server/server.js`**
   - Added registrationRoutes import
   - Registered `/api/registrations` endpoint

### Frontend

#### New Files
1. **`client/src/services/registrationService.js`**
   - API service for registration management
   - 6 methods for different operations

2. **`client/src/pages/admin/PendingRegistrations.jsx`**
   - Full registration management UI
   - Statistics, filters, search
   - Approve/Reject/Delete actions
   - Rejection modal with reason

#### Modified Files
1. **`client/src/pages/auth/Register.jsx`**
   - Handle requiresApproval response
   - Redirect to login with message
   - Show appropriate toast messages

2. **`client/src/pages/auth/Login.jsx`**
   - Display registration approval message
   - Show info toast from location state

3. **`client/src/services/authService.js`**
   - Updated register method
   - Only store token if provided

4. **`client/src/App.jsx`**
   - Added PendingRegistrations import
   - Added /registrations route
   - Super admin only protection

5. **`client/src/layouts/MainLayout.jsx`**
   - Added UserCog icon import
   - Added "Registrations" menu item
   - Positioned for super admins only

---

## Database Migration

### Run Migration

```bash
cd server
node migrations/run.js add-account-approval-fields
```

### What It Does

1. Adds 4 new columns to `users` table
2. Sets default status to 'pending'
3. **Important**: Automatically approves all existing users
4. Existing users are grandfathered in as 'approved'

### Rollback (if needed)

The migration includes a `down` function to remove the fields:

```javascript
// This removes all approval fields
await queryInterface.removeColumn('users', 'rejection_reason');
await queryInterface.removeColumn('users', 'approved_at');
await queryInterface.removeColumn('users', 'approved_by');
await queryInterface.removeColumn('users', 'account_status');
```

---

## Workflow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    User Registers                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ account_status =   │
          │    'pending'       │
          └────────────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │  No JWT Token      │
          │  Redirect to Login │
          └────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌────────────────┐      ┌────────────────┐
│ User tries to  │      │ Super Admin    │
│ login          │      │ reviews        │
└────────┬───────┘      └───────┬────────┘
         │                      │
         ▼                      ▼
   ❌ Access          ┌──────────────────┐
   Denied            │ Approve or Reject │
                     └─────────┬─────────┘
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
      ┌──────────────────┐       ┌──────────────────┐
      │ account_status = │       │ account_status = │
      │   'approved'     │       │   'rejected'     │
      └──────────────────┘       └──────────────────┘
                │                             │
                ▼                             ▼
         ✅ Can Login              ❌ Cannot Login
```

---

## Logging

All registration actions are logged:

```javascript
// Registration
logger.info('User registered', {
  userId, email, username, name, role, 
  account_status, action: 'USER_REGISTER'
});

// Approval
logger.info('User registration approved', {
  userId, email, name, approvedBy, 
  approverName, action: 'REGISTRATION_APPROVED'
});

// Rejection
logger.info('User registration rejected', {
  userId, email, name, rejectedBy, 
  rejectorName, reason, action: 'REGISTRATION_REJECTED'
});

// Deletion
logger.info('User registration deleted', {
  userId, email, name, deletedBy, 
  deleterName, action: 'REGISTRATION_DELETED'
});

// Login attempts
logger.warn('Login attempt on pending account', {
  userId, email, ip, action: 'LOGIN_PENDING_ACCOUNT'
});

logger.warn('Login attempt on rejected account', {
  userId, email, ip, action: 'LOGIN_REJECTED_ACCOUNT'
});
```

---

## Testing Checklist

### Registration Flow
- [ ] Register a new user
- [ ] Verify no immediate login
- [ ] Verify redirect to login with message
- [ ] Verify message shows on login page

### Login Restrictions
- [ ] Try logging in with pending account
- [ ] Verify error: "pending approval"
- [ ] Try logging in with rejected account
- [ ] Verify error: "rejected"
- [ ] Try logging in with approved account
- [ ] Verify successful login

### Super Admin Portal
- [ ] Access /registrations as super admin
- [ ] Verify statistics show correctly
- [ ] Filter by status (pending/approved/rejected)
- [ ] Search by name/email/username
- [ ] Approve a pending user
- [ ] Reject a pending user with reason
- [ ] Delete a rejected user
- [ ] Verify approved user can now log in

### Edge Cases
- [ ] Multiple pending registrations
- [ ] Approve all pending at once
- [ ] Reject with empty reason (should fail)
- [ ] Delete approved user (should fail)
- [ ] Non-super-admin access (should fail)

---

## Security Considerations

### Access Control
- ✅ Only super admins can access registration endpoints
- ✅ Protected with `authorize('super_admin')` middleware
- ✅ Regular admins cannot approve/reject users

### Data Protection
- ✅ Passwords never logged or exposed
- ✅ Rejection reasons stored securely
- ✅ Approval actions tracked with timestamps

### Rate Limiting
- ⚠️ Consider adding rate limiting for:
  - Registration endpoint (prevent spam)
  - Login attempts (prevent brute force)

---

## Future Enhancements

### Email Notifications
- [ ] Email to user when registration received
- [ ] Email to super admins when new registration
- [ ] Email to user when approved
- [ ] Email to user when rejected (with reason)

### Bulk Actions
- [ ] Approve multiple users at once
- [ ] Reject multiple users at once
- [ ] Export registration list to CSV

### Additional Filters
- [ ] Date range filter (registered date)
- [ ] Approved by specific admin
- [ ] Sort by various fields

### User Self-Service
- [ ] Check registration status page
- [ ] Resubmit rejected application
- [ ] Appeal rejection

---

## Troubleshooting

### User can't see "Registrations" menu
**Issue**: Menu item not appearing  
**Solution**: Ensure user role is `super_admin`, not just `admin`

### Pending user gets "Invalid credentials"
**Issue**: Wrong error message  
**Solution**: Check if account exists and verify status

### Existing users can't login after migration
**Issue**: Migration didn't auto-approve  
**Solution**: Run SQL manually:
```sql
UPDATE users SET account_status = 'approved', approved_at = NOW() 
WHERE account_status = 'pending';
```

### Statistics showing incorrect counts
**Issue**: Count mismatch  
**Solution**: Check database directly:
```sql
SELECT account_status, COUNT(*) 
FROM users 
GROUP BY account_status;
```

---

## Status

- ✅ Backend implementation complete
- ✅ Frontend implementation complete
- ✅ Database migration created
- ✅ Build successful
- ✅ Documentation created
- ⏳ Testing pending
- ⏳ Deployment pending

---

**Version**: 1.0.0  
**Date**: December 2024  
**Author**: Development Team
