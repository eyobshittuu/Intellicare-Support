-- Migration: Make user_id nullable in tickets table
-- This allows ticket history to be preserved when users are deleted
--
-- Run this SQL directly in Render's PostgreSQL console or via psql:
-- psql $DATABASE_URL -f fix-user-id.sql

BEGIN;

-- Make user_id nullable
ALTER TABLE tickets ALTER COLUMN user_id DROP NOT NULL;

-- Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('user_id', 'assigned_to', 'finalized_by');

COMMIT;

-- Success message will be shown in console
