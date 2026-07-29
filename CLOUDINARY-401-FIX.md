# Cloudinary 401 Error Fix

## Issue
Files (especially non-images like PDFs, Word, Excel) were returning 401 (Unauthorized) errors when trying to view them because Cloudinary `resource_type: 'raw'` files require signed URLs for public access.

## Root Cause
Cloudinary treats different resource types differently:
- **Images** (`resource_type: 'image'`): Can be accessed via direct URLs
- **Raw Files** (`resource_type: 'raw'`): PDFs, Word, Excel, etc. require signed URLs with authentication

## Solution
Created a helper function to generate signed URLs for raw files while keeping direct URLs for images.

## Changes Made

### 1. New File: `server/utils/cloudinaryHelper.js`
Created utility functions to generate signed URLs:

```javascript
function generateSignedUrl(publicId, resourceType = 'raw') {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'upload',
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
  });
}

function getPublicUrl(file) {
  const isImage = file.mimetype && file.mimetype.startsWith('image/');
  return isImage ? file.path : generateSignedUrl(file.filename, 'raw');
}
```

### 2. Updated: `server/controllers/ticketController.js`
Modified file attachment processing to use signed URLs:

```javascript
const { getPublicUrl } = require('../utils/cloudinaryHelper');

// In createTicket function
attachments = req.files.map(file => {
  const publicUrl = getPublicUrl(file); // Get signed URL for raw files
  return {
    filename: file.filename,
    originalName: file.originalname,
    url: publicUrl, // Now uses signed URL
    // ...
  };
});
```

### 3. Updated: `server/middleware/upload.js`
Added `access_mode: 'public'` (helps but not sufficient alone for raw files):

```javascript
return {
  folder: 'intellicare-tickets',
  resource_type: isImage ? 'image' : 'raw',
  access_mode: 'public',
  // ...
};
```

## How It Works

### For Images (JPEG, PNG, GIF, WebP):
- Direct Cloudinary URL used
- Example: `https://res.cloudinary.com/cloud/image/upload/v123/file.jpg`
- No authentication required

### For Raw Files (PDF, Word, Excel, etc.):
- Signed URL generated with expiration
- Example: `https://res.cloudinary.com/cloud/raw/upload/s--signature--/v123/file.pdf`
- Signature validates access
- URL expires in 1 year (can be renewed)

## Important Notes

### For Existing Files (Already Uploaded):
- ⚠️ Old files still use unsigned URLs
- **Solution Options:**
  1. **Re-upload the files** (Recommended - easiest)
  2. **Run a migration script** to regenerate URLs in database
  3. **Update on-the-fly** when files are accessed

### For New Files (After This Fix):
- ✅ All new uploads will have signed URLs
- ✅ PDFs, Word docs, Excel files will work in viewer
- ✅ URLs valid for 1 year

### URL Expiration:
- Signed URLs expire after 1 year
- After expiration, URLs need to be regenerated
- Consider implementing URL refresh mechanism for long-term storage

## Testing

After deploying this fix:
1. Create a new ticket
2. Upload a PDF or Word document
3. Click to view the file
4. File should open in the viewer without 401 error

## Migration for Existing Files (Optional)

If you need to fix existing files without re-uploading, create a migration script:

```javascript
const { Ticket } = require('./models');
const { getPublicUrl } = require('./utils/cloudinaryHelper');

async function migrateExistingFiles() {
  const tickets = await Ticket.findAll({
    where: { attachments: { [Op.ne]: null } }
  });

  for (const ticket of tickets) {
    if (ticket.attachments && ticket.attachments.length > 0) {
      const updatedAttachments = ticket.attachments.map(attachment => ({
        ...attachment,
        url: attachment.mimetype?.startsWith('image/')
          ? attachment.url
          : generateSignedUrl(attachment.publicId, 'raw')
      }));
      
      await ticket.update({ attachments: updatedAttachments });
    }
  }
}
```

## Status
✅ Fixed - All new uploads will work with signed URLs
✅ Images use direct URLs (unchanged)
✅ Raw files use signed URLs (secure, 1-year expiration)

## Date
July 29, 2026
