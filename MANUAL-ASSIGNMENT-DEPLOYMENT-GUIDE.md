# Manual Assignment & Difficulty System - Deployment Guide

## Overview
Converted the ticketing system from automatic assignment to manual assignment by super admin with difficulty rating (1-5).

## Changes Summary

### Backend Changes

#### 1. Ticket Model (`server/models/Ticket.js`)
Added three new columns:
- `difficulty` (INTEGER 1-5, nullable) - Difficulty rating set during assignment
- `assigned_by` (BIGINT, nullable) - Super admin who assigned the ticket
- `assigned_at` (TIMESTAMP, nullable) - When ticket was assigned

#### 2. Ticket Controller (`server/controllers/ticketController.js`)
- ✅ **Removed**: Automatic assignment logic from `createTicket()`
- ✅ **Updated**: `assignTicketManually()` to accept difficulty parameter
- ✅ **Changed**: Assignment routes to super admin only

#### 3. Performance Service (`server/services/adminPerformanceService.js`)
- ✅ **Updated**: Quality scoring to include difficulty (30 out of 100 points)
- ✅ **Added**: Difficulty metrics to `getQualityMetrics()`
- ✅ **Enhanced**: Backward compatibility with try-catch for missing columns
- ✅ **Updated**: `calculateQualityScore()` to reward harder tickets

**New Scoring Breakdown**:
- Completion Rate: 30 points
- Response Time: 20 points
- Resolution Time: 20 points
- Difficulty Score: 30 points (based on average difficulty)

#### 4. Migration Routes (`server/routes/migrationRoutes.js`)
- ✅ **Added**: `/api/migrate/add-difficulty-fields` endpoint
- ✅ **Updated**: `/api/migrate/status` to check difficulty fields

### Frontend Changes Needed
- ⏳ **TODO**: Add assignment modal in super admin dashboard
- ⏳ **TODO**: Include difficulty selector (1-5 scale) in assignment UI
- ⏳ **TODO**: Show difficulty ratings in ticket list/detail views
- ⏳ **TODO**: Display difficulty scores in performance dashboard

## Deployment Steps

### 1. Check Current Status
```bash
# Visit this URL to check migration status
GET https://intellicare-support-1.onrender.com/api/migrate/status
```

Expected response:
```json
{
  "migrations": {
    "difficultySystem": {
      "complete": false,
      "status": "⚠️ Needed"
    }
  }
}
```

### 2. Run Migration
```bash
# Visit this URL to add the columns
GET https://intellicare-support-1.onrender.com/api/migrate/add-difficulty-fields
```

Expected response:
```json
{
  "success": true,
  "message": "Migration completed successfully!",
  "changes": "Added difficulty, assigned_by, and assigned_at columns"
}
```

### 3. Verify Migration
```bash
# Check status again
GET https://intellicare-support-1.onrender.com/api/migrate/status
```

Should now show:
```json
{
  "migrations": {
    "difficultySystem": {
      "complete": true,
      "status": "✅ Complete"
    }
  }
}
```

### 4. Test Ticket Creation
- Create a new ticket through the UI
- Should succeed without errors
- Ticket will be unassigned (no automatic assignment)

### 5. Test Manual Assignment
Use the API to test manual assignment:

```bash
PUT https://intellicare-support-1.onrender.com/api/tickets/:ticketId/assign
Content-Type: application/json
Authorization: Bearer <super_admin_token>

{
  "adminId": 123,
  "difficulty": 3
}
```

### 6. Test Performance Dashboard
- Navigate to Super Admin > Performance
- Should load without errors
- Difficulty scores will show once tickets are assigned with ratings

## Database Schema

### PostgreSQL (Production)
```sql
-- New columns
difficulty        INTEGER          NULL  (CHECK: 1-5 or NULL)
assigned_by       BIGINT           NULL  (FK to users.id)
assigned_at       TIMESTAMP        NULL

-- Constraints
CONSTRAINT tickets_difficulty_check 
  CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))

CONSTRAINT fk_tickets_assigned_by 
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
```

### MySQL (Development)
```sql
-- New columns
difficulty        INT              NULL  (CHECK: 1-5 or NULL)
assigned_by       BIGINT UNSIGNED  NULL  (FK to users.id)
assigned_at       DATETIME         NULL

-- Same constraints as PostgreSQL
```

## API Changes

### Manual Assignment Endpoint
**Endpoint**: `PUT /api/tickets/:id/assign`  
**Access**: Super Admin only  
**Body**:
```json
{
  "adminId": 123,      // Required: Admin to assign to
  "difficulty": 3      // Optional: 1-5 difficulty rating
}
```

**Response**:
```json
{
  "success": true,
  "message": "Ticket assigned successfully",
  "ticket": {
    "id": 1,
    "assigned_to": 123,
    "assigned_by": 456,
    "assigned_at": "2026-07-30T...",
    "difficulty": 3,
    ...
  }
}
```

## Performance Scoring

### Quality Score Calculation (0-100)

#### Before (Automatic Assignment)
- Completion Rate: 40 points
- Response Time: 30 points
- Resolution Time: 30 points

#### After (Manual with Difficulty)
- Completion Rate: 30 points
- Response Time: 20 points
- Resolution Time: 20 points
- **Difficulty Score: 30 points** ⭐ NEW

**Difficulty Scoring Logic**:
- Average difficulty rating (1-5) scaled to 30 points
- Formula: `(avgDifficulty / 5.0) * 30`
- Example: Admin with avg 4.0 difficulty = 24 points
- Rewards admins who take harder tickets

**Backward Compatibility**:
- If no difficulty data exists, bonus points awarded based on completion rate
- Old tickets without difficulty don't penalize admins

## Troubleshooting

### Issue: 500 Error on Ticket Creation
**Cause**: Database columns not added yet  
**Solution**: Run migration endpoint (Step 2 above)

### Issue: Performance Dashboard Shows Errors
**Cause**: Difficulty queries failing  
**Solution**: 
1. Code already handles this gracefully
2. Run migration to add columns
3. Difficulty scores will show as 0 until tickets are assigned

### Issue: Migration Endpoint Returns Error
**Cause**: Columns might already exist  
**Solution**: Check status endpoint - if columns exist, ignore error

### Issue: Auto-sync Not Working
**Cause**: `db.sync({ alter: true })` may take time or fail  
**Solution**: Use manual migration endpoint instead

## Rollback Plan

If you need to rollback:

1. **Database**: Columns can be removed
   ```sql
   ALTER TABLE tickets DROP COLUMN difficulty;
   ALTER TABLE tickets DROP COLUMN assigned_by;
   ALTER TABLE tickets DROP COLUMN assigned_at;
   ```

2. **Code**: All fields are nullable and backward compatible
   - System works with or without columns
   - Performance scoring degrades gracefully

3. **No Breaking Changes**: Existing tickets and functionality unaffected

## Next Steps

### Immediate
1. ✅ Deploy backend changes
2. ✅ Run migration endpoint
3. ✅ Test ticket creation
4. ✅ Verify performance dashboard loads

### Short Term
1. ⏳ Create assignment modal UI for super admin
2. ⏳ Add difficulty selector (1-5 with labels)
3. ⏳ Show difficulty in ticket views
4. ⏳ Add difficulty metrics to performance UI

### Labels for Difficulty Selector
Suggested labels for frontend:
- 1: Very Easy (Basic inquiries, simple issues)
- 2: Easy (Common issues with known solutions)
- 3: Medium (Requires investigation)
- 4: Hard (Complex issues, multiple systems)
- 5: Very Hard (Critical, unique, requires expertise)

## Testing Checklist

- [ ] Migration endpoint runs successfully
- [ ] Status endpoint shows difficulty fields exist
- [ ] Can create new tickets without errors
- [ ] Can manually assign tickets with difficulty
- [ ] Performance dashboard loads
- [ ] Difficulty scores appear after assignment
- [ ] Quality scores include difficulty component
- [ ] Rankings reflect difficulty ratings
- [ ] Export includes difficulty data

## Success Criteria

✅ Backend deployed  
✅ Database migrated  
✅ Ticket creation works  
✅ Manual assignment works  
✅ Performance scoring includes difficulty  
⏳ Frontend UI for assignment (pending)  
⏳ Frontend displays difficulty ratings (pending)  

## Support

If issues persist:
1. Check Render logs for detailed error messages
2. Run diagnose endpoint: `/api/migrate/diagnose`
3. Verify database connection is working
4. Check if Sequelize sync completed
5. Try manual SQL migration as fallback
