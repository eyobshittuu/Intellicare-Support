# Quick Reference Guide

## System Overview

### User Roles
1. **Super Admin** - System owner (create admins, finalize tickets)
2. **Admin** - Ticket managers (view all, update status, finalize)
3. **User** - Regular users (create and view own tickets)

## Login Credentials

### Super Admin (Keep Private!)
- **Email**: admin@intellicare.com
- **Password**: admin123
- **Access**: Everything

## Common Tasks

### Create a New Admin (Super Admin Only)
1. Login as super admin
2. Click "Users" in sidebar
3. Click "Create Admin" button
4. Fill in details:
   - Email (must be unique)
   - First name, Last name
   - Password (min 6 characters)
   - Confirm password
5. Click "Create Admin User"
6. New admin can now login

### Process a Ticket (Admin/Super Admin)
1. Login as admin
2. Click "Tickets" in sidebar
3. Click "View" on a ticket
4. Review ticket details
5. Click "Edit Status" to update:
   - Change status (Pending → In Progress → Completed)
   - Change priority if needed
   - Click "Save Changes"

### Finalize a Ticket (Admin/Super Admin)
1. Open ticket details
2. Click "Finalize Ticket" button
3. Write summary in textarea:
   - Describe the issue
   - Explain what was done
   - Document the resolution
4. Click "Finalize Ticket"
5. Ticket marked as completed with green badge

### Create a Ticket (Any User)
1. Click "Create Ticket" or "New Ticket"
2. Fill in form:
   - **Title**: Brief description
   - **Hospital**: Select from dropdown
   - **Category**: Type of issue
   - **Priority**: Low/Medium/High/Urgent
   - **Description**: Detailed explanation
3. Click "Create Ticket"
4. Redirected to tickets list

## URLs

- **Application**: http://localhost:5173/
- **API**: http://localhost:5000/
- **Create Admin**: http://localhost:5173/users/create-admin

## Features by Role

### Super Admin Can:
✅ Create admin users
✅ View all tickets
✅ Update ticket status
✅ Finalize tickets
✅ Delete tickets
✅ View all users
✅ Access admin dashboard

### Admin Can:
✅ View all tickets
✅ Update ticket status
✅ Finalize tickets
✅ Delete tickets
✅ View all users
✅ Access admin dashboard
❌ Cannot create admins

### Regular User Can:
✅ Create tickets
✅ View own tickets
✅ Update profile
❌ Cannot see other users' tickets
❌ Cannot access admin features
❌ Cannot finalize tickets

## Status Flow

```
Pending → In Progress → Completed (with summary)
                    ↓
                Rejected
```

## Priority Levels

1. **Low** - Can wait, non-urgent
2. **Medium** - Normal priority (default)
3. **High** - Important, needs attention soon
4. **Urgent** - Critical, immediate attention

## Color Coding

### Status
- **Pending**: Gray
- **In Progress**: Teal
- **Completed**: Green
- **Rejected**: Red

### Priority
- **Low**: Gray
- **Medium**: Blue
- **High**: Orange
- **Urgent**: Red

## Troubleshooting

### Can't Login
- Check email and password
- Ensure account is active
- Contact super admin

### Can't Create Admin
- Verify you're logged in as super admin
- Check if email already exists
- Ensure all required fields filled

### Can't Finalize Ticket
- Must be admin or super admin
- Summary field is required
- Ticket must exist

### Can't See Tickets
- Regular users see only their own
- Admins see all tickets
- Check filters aren't hiding tickets

## Support

For issues or questions:
1. Check this guide first
2. Review the full documentation
3. Contact system administrator

## Security Notes

⚠️ **Important:**
- Keep super admin credentials private
- Change default password after first login
- Only create admin accounts for trusted users
- Admin credentials should not be displayed publicly
- Regular password changes recommended
