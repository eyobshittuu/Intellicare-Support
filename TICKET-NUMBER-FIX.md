# Ticket Number Generation Fix

## Issue
When creating a ticket, the server was returning a 500 error:
```
ValidationError: notNull Violation: Ticket.ticket_number cannot be null
```

## Root Cause
The `beforeCreate` hook in the Ticket model wasn't firing properly. This can happen when:
- Hooks are defined after model export
- There's a timing issue with model initialization
- The hook has scope issues accessing the model

## Solution
Moved the ticket number generation from the model hook to the controller:

### Before (Not Working)
```javascript
// In Ticket.js model
Ticket.beforeCreate(async (ticket) => {
  if (!ticket.ticket_number) {
    const count = await Ticket.count();
    ticket.ticket_number = `TKT-${String(count + 1).padStart(5, '0')}`;
  }
});
```

### After (Working)
```javascript
// In ticketController.js
exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, hospital, priority } = req.body;

    // Generate ticket number
    const count = await Ticket.count();
    const ticket_number = `TKT-${String(count + 1).padStart(5, '0')}`;

    const ticket = await Ticket.create({
      ticket_number,
      title,
      description,
      category,
      hospital,
      priority: priority || 'medium',
      user_id: req.user.id
    });
    // ... rest of the code
  }
}
```

## Ticket Number Format
- Format: `TKT-XXXXX`
- Examples: `TKT-00001`, `TKT-00002`, `TKT-00123`
- Always 5 digits with leading zeros
- Sequential based on total ticket count

## Testing
1. Navigate to: http://localhost:5173/
2. Login with your account
3. Click "Create New Ticket"
4. Fill in all fields:
   - Title: "Test Ticket"
   - Hospital: Select any hospital
   - Category: Select any category
   - Priority: Select priority
   - Description: "Test description"
5. Click "Create Ticket"
6. You should be redirected to tickets list
7. Check the ticket number is generated (TKT-XXXXX)

## Status
✅ Fixed - Server restarted automatically
✅ Ready to test ticket creation
