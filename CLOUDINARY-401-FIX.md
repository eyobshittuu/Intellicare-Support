# Cloudinary 401 Error Fix

## Issue
Files (especially non-images like PDFs, Word, Excel) were returning 401 (Unauthorized) errors when trying to view them because Cloudinary `resource_type: 'raw'` files require authentication by default.

## Solution
Added `access_mode: 'public'` parameter to Cloudinary storage configuration in upload middleware.

## Changes Made

### File: `server/middleware/upload.js`

```javascript
return {
  folder: 'intellicare-tickets',
  resource_type: isImage ? 'image' : 'raw',
  access_mode: 'public', // ← Added this line
  public_id: `${nameWithoutExt}-${uniqueSuffix}`,
  // ...
};
```

## What This Does

- **For Images**: Already public by default
- **For Non-Images** (PDF, Word, Excel, etc.): Now set to public access
- Files can be accessed via URL without authentication
- Compatible with in-app document viewer

## Important Notes

### For Existing Files (Uploaded Before Fix):
- Old files may still show 401 errors
- They were uploaded without `access_mode: 'public'`
- **Solution**: Re-upload the files or update them manually in Cloudinary

### For New Files (After Fix):
- All new uploads will be publicly accessible
- Document viewer will work correctly
- No authentication required

## Manual Fix for Existing Files (Optional)

If you have existing files showing 401 errors, you can:

### Option 1: Re-upload Files
Ask users to re-upload affected attachments.

### Option 2: Update Cloudinary Settings
1. Go to Cloudinary Dashboard
2. Navigate to Media Library
3. Find files in `intellicare-tickets` folder
4. Update delivery type to "Upload" (public)

### Option 3: Use Signed URLs (More Complex)
Implement signed URL generation in the backend for authenticated access.

## Verification

After deploying this fix:
1. Upload a new PDF/Word/Excel file to a ticket
2. Click to view the file
3. File should open in the viewer without 401 error

## Status
✅ Fixed - All new uploads will be publicly accessible
⚠️ Existing uploads may need to be re-uploaded or manually fixed

## Date
July 29, 2026
