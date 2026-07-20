# Super Admin Ticket Visibility Fix

## Issue
Super admins were unable to see completed tickets (or any tickets) because the backend controller only checked for 'admin' role and not 'super_admin' role.

## Root Cause
In `server/controllers/ticketController.js`, the `getTickets` function had this check:

```javascript
// Non-admin users can only see their own tickets
if (req.user.role !== 'admin') {
  where.user_id = req.user.id;
}
```

This meant super admins were being treated as regular users and could only see tickets they created themselves (which is none, since super admins don't create tickets).

## Solution
Updated the role check to include both 'admin' and 'super_admin':

```javascript
// Non-admin users can only see their own tickets
if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
  where.user_id = req.user.id;
}
```

## Changes Made

### File: `server/controllers/ticketController.js`

#### 1. getTickets function (Line ~14)
**Before:**
```javascript
if (req.user.role !== 'admin') {
  where.user_id = req.user.id;
}
```

**After:**
```javascript
if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
  where.user_id = req.user.id;
}
```

#### 2. getTicket function (Line ~88)
**Before:**
```javascript
if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
  return res.status(403).json({
    success: false,
    message: 'Not authorized to view this ticket'
  });
}
```

**After:**
```javascript
if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && ticket.user_id !== req.user.id) {
  return res.status(403).json({
    success: false,
    message: 'Not authorized to view this ticket'
  });
}
```

## Result
Super admins can now:
- ✅ View all tickets in the system (including completed tickets)
- ✅ Filter tickets by status (pending, in_progress, completed, rejected)
- ✅ View individual ticket details
- ✅ Perform all admin functions (update status, add work logs, finalize tickets)
- ✅ See accurate ticket statistics on the Users page

## Testing
1. Log in as super admin (admin@intellicare.com)
2. Navigate to Tickets page
3. You should see all tickets from all users
4. Use the "Status" filter to select "Completed"
5. All completed tickets should now be visible

## Note
The frontend already had the correct logic:
- `isAdmin` in AuthContext returns `true` for both 'admin' and 'super_admin'
- This is why the UI was showing admin features to super admins
- Only the backend needed the fix

## Server Status
- Server automatically restarted with nodemon
- Changes are live and effective immediately
- No manual restart required
