# Hospital Assignment System

## Overview

Users are now assigned to their hospital by super admins during the registration approval process. Users can no longer select the wrong hospital - it's automatically applied to all their tickets.

---

## How It Works

### 1. **User Registration**
- User fills out registration form
- **Does NOT select a hospital** (removed from registration)
- Account status: **Pending**
- Cannot login yet

### 2. **Super Admin Approval**
- Super admin goes to "Registrations" page
- Reviews pending user
- Clicks "Approve"
- **New**: Modal appears asking for hospital assignment
- **Required field**: Must enter hospital name
- Clicks "Approve" to complete

### 3. **User Creates Tickets**
- User logs in (now approved)
- Goes to "Create Ticket"
- **Hospital field is read-only** showing their assigned hospital
- Hospital automatically included in ticket
- No dropdown, no selection needed

---

## Benefits

✅ **No Wrong Hospital Selection**
- Users can't accidentally select wrong hospital
- Super admin controls hospital assignment

✅ **Consistent Data**
- All tickets from a user have the same hospital
- No data entry errors

✅ **Better Organization**
- Easy to filter tickets by hospital
- Clear ownership of tickets

✅ **Simplified User Experience**
- One less field to fill when creating tickets
- Faster ticket creation

---

## Database Changes

### New Field in `users` Table

```sql
hospital VARCHAR(200) NULL
```

- Stores the hospital/facility name
- Assigned by super admin during approval
- Can be updated later by super admin (future feature)

---

## API Changes

### Approve Registration Endpoint

**Endpoint**: `PUT /api/registrations/:id/approve`

**Request Body** (New):
```json
{
  "hospital": "Hallelujah General Hospital"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registration approved successfully",
  "user": {
    "id": 5,
    "email": "john@example.com",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "hospital": "Hallelujah General Hospital",
    "account_status": "approved"
  }
}
```

**Validation**:
- ✅ Hospital is required
- ✅ Must be non-empty string
- ❌ Returns 400 if hospital missing

---

## User Interface Changes

### 1. **Registrations Page** (Super Admin)

#### Before
```
[Approve] [Reject]
```

#### After
```
[Approve] → Opens modal with hospital input
[Reject]  → Same as before
```

#### New Approve Modal
```
┌─────────────────────────────────────┐
│ Approve Registration                 │
├─────────────────────────────────────┤
│ You are about to approve John Doe's  │
│ registration. Please assign hospital:│
│                                       │
│ Hospital Name *                      │
│ ┌─────────────────────────────────┐ │
│ │ Enter hospital name...          │ │
│ └─────────────────────────────────┘ │
│                                       │
│ This will be used for all tickets    │
│ created by this user                 │
│                                       │
│  [Cancel]  [Approve]                 │
└─────────────────────────────────────┘
```

#### New Table Column
```
| User | Contact | Hospital | Status | Registered | Actions |
```

Shows assigned hospital for approved users, "Not assigned" for pending.

---

### 2. **Create Ticket Page** (Users)

#### Before (Wrong)
```
Hospital/Location *
[Dropdown with 30+ hospitals to choose from]
```

#### After (Correct)
```
Hospital/Location
┌─────────────────────────────────────┐
│ Hallelujah General Hospital         │ (Read-only, gray background)
└─────────────────────────────────────┘
Your hospital is assigned by the administrator
during account approval
```

If hospital NOT assigned:
```
┌─────────────────────────────────────┐
│ No hospital assigned. Please        │ (Red text)
│ contact an administrator.           │
└─────────────────────────────────────┘
```

And user cannot submit the ticket (validation error).

---

## User Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    User Registers                         │
│              (No hospital selection)                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ Status: Pending    │
          │ Hospital: NULL     │
          └────────────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ Super Admin        │
          │ Reviews & Approves │
          └────────────────────┘
                     │
                     ▼
          ┌────────────────────────┐
          │ Approval Modal Opens   │
          │ "Enter hospital name:" │
          └────────────────────────┘
                     │
                     ▼
          ┌──────────────────────────┐
          │ Super Admin Types:       │
          │ "Hallelujah General      │
          │  Hospital"               │
          └──────────────────────────┘
                     │
                     ▼
          ┌────────────────────────┐
          │ Status: Approved       │
          │ Hospital: Hallelujah   │
          │          General       │
          │          Hospital      │
          └────────────────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ User Creates Ticket │
          │ Hospital auto-filled│
          └────────────────────┘
```

---

## Migration

### Run Migration to Add Hospital Column

Visit this URL in your browser:
```
https://your-backend.onrender.com/api/migrate/add-user-approval
```

This will:
- ✅ Add `hospital` column to users table
- ✅ Set to NULL for existing users (they can still create tickets)
- ✅ New approvals will require hospital assignment

### For Existing Approved Users

If you have existing approved users without hospitals:

**Option 1**: Super admins can update via Users page (future feature)

**Option 2**: Update manually via SQL:
```sql
UPDATE users 
SET hospital = 'Hospital Name Here' 
WHERE id = 123;
```

---

## Validation Rules

### Backend Validation
```javascript
// Approval requires hospital
if (!hospital || !hospital.trim()) {
  return 400: 'Hospital assignment is required'
}
```

### Frontend Validation
```javascript
// Ticket creation checks user.hospital
if (!user?.hospital) {
  toast.error('Your hospital has not been assigned yet. 
               Please contact an administrator.')
  return false
}
```

---

## Testing Checklist

### Super Admin Workflow
- [ ] Go to Registrations page
- [ ] Find a pending user
- [ ] Click "Approve"
- [ ] Modal opens
- [ ] Try to approve without hospital (should fail)
- [ ] Enter hospital name
- [ ] Click "Approve"
- [ ] User shows in table with hospital name
- [ ] User's status is "Approved"

### User Workflow
- [ ] Login as approved user with hospital
- [ ] Go to "Create Ticket"
- [ ] See hospital displayed (read-only)
- [ ] Cannot change hospital
- [ ] Create ticket
- [ ] Ticket shows correct hospital

### Edge Cases
- [ ] User without hospital tries to create ticket
- [ ] Should see error message
- [ ] Should not be able to submit
- [ ] Super admin approves with empty hospital
- [ ] Should see validation error

---

## Common Hospitals List (Reference)

These are the hospitals that were previously in the dropdown:

```
- Hallelujah General Hospital
- Negele Arsi General Hospital
- Zway General Hospital
- Silk Road General Hospital
- Soddo General Hospital
- Axon Neurology Specialty Center
- Bethesda American Medical Plaza
- St. Urael Internal Medicine Specialty Clinic
- Bishoftu General Hospital
- British Hospital
- Wollo Medium Clinic
- Wellspring Multispecialty Medical Center
- Lobe Medium Clinic
- Butajira General Hospital
- Nile — Sululta General Hospital
- Oasis General Hospital
- Pinnacle Medium Clinic
- Michael Medium Clinic
- Alia Diagnostic Center
- Ethiotebib General Hospital
- Vital Medium Clinic
- Lukas Medium Clinic
- Liyu Medium Clinic
- Summit General Hospital
- Abnet General Hospital
- Gara Medium Clinic
- Eftu General Hospital
- Bethel General Hospital
- Ethiocare General Hospital
- Newleaf General Hospital
- Mosaic General Hospital
```

Super admins can copy-paste from this list or type custom names.

---

## Future Enhancements

### Hospital Management Page
- [ ] Create hospital master list
- [ ] Add/edit/delete hospitals
- [ ] Hospital dropdown in approval modal
- [ ] Autocomplete for hospital names

### User Management
- [ ] Allow super admin to update user's hospital
- [ ] Bulk hospital assignment
- [ ] Hospital change history/audit log

### Reports & Analytics
- [ ] Tickets by hospital report
- [ ] User distribution by hospital
- [ ] Hospital performance metrics

### Validation
- [ ] Standardized hospital names
- [ ] Hospital code/ID system
- [ ] Address/location validation

---

## Troubleshooting

### User can't create ticket (hospital error)
**Problem**: User's hospital field is NULL  
**Solution**: Super admin needs to:
1. Go to Users page
2. Find the user
3. Edit and add hospital (future) OR
4. Run SQL: `UPDATE users SET hospital = 'Name' WHERE id = X`

### Approval fails with "Hospital required"
**Problem**: Modal submitted without hospital  
**Solution**: Enter hospital name before clicking Approve

### Hospital not showing on ticket
**Problem**: User object not updated  
**Solution**: User needs to logout and login again

---

## Files Modified

### Backend
1. `server/models/User.js` - Added hospital field
2. `server/controllers/registrationController.js` - Hospital required for approval
3. `server/routes/migrationRoutes.js` - Added hospital to migration

### Frontend
1. `client/src/pages/admin/PendingRegistrations.jsx` - Approval modal with hospital
2. `client/src/pages/CreateTicket.jsx` - Read-only hospital field
3. `client/src/services/registrationService.js` - Send hospital with approval

---

## Status

- ✅ Backend implementation complete
- ✅ Frontend implementation complete
- ✅ Migration updated
- ✅ Build successful
- ✅ Ready for deployment
- ⏳ Testing pending

---

**Version**: 1.0.0  
**Date**: December 2024  
**Impact**: High - Changes user registration and ticket creation flow
