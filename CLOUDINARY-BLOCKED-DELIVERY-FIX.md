# Fix Cloudinary "Blocked for Delivery" Error

## Problem
Files uploaded to Cloudinary show **"Blocked for delivery"** status, preventing them from being accessed via URL. This is a Cloudinary account security setting.

## Root Cause
Cloudinary accounts have security settings that can block certain file types (especially raw files like PDFs) from being delivered publicly to prevent unauthorized access and bandwidth usage.

## Solutions

### Solution 1: Change Cloudinary Account Settings (RECOMMENDED)

#### Option A: Enable Raw File Delivery
1. Go to **Cloudinary Console**: https://cloudinary.com/console
2. Click **Settings** (gear icon)
3. Go to **Security** tab
4. Find **"Restricted media types"** section
5. **Uncheck "Raw"** or add your domain to allowed list
6. **Save changes**

#### Option B: Change Upload Settings
1. Go to **Settings** → **Upload**
2. Go to **Upload presets** tab
3. Click on your preset or create new one
4. Set **Type** to **"Upload"** (not "Authenticated" or "Private")
5. Enable **"Use filename"** if needed
6. **Save**

#### Option C: Security Settings
1. Go to **Settings** → **Security**
2. Look for **"Allowed fetch domains"**
3. Add your domains:
   - `intellicare-support.vercel.app`
   - `intellicare-support-1.onrender.com`
4. **Save changes**

### Solution 2: Manually Unblock Existing Files

For files already uploaded:

1. Go to **Media Library** in Cloudinary
2. Find the file in `intellicare-tickets` folder
3. Click on the file
4. Click **Edit** (pencil icon)
5. Change **Access control** from "Authenticated" to "Public"
6. **Save**

OR use the Cloudinary Admin API (from Node.js):

```javascript
const cloudinary = require('cloudinary').v2;

// Update specific file
cloudinary.api.update(
  'intellicare-tickets/filename',
  { 
    type: 'upload',
    resource_type: 'raw'
  },
  function(error, result) {
    console.log(result, error);
  }
);
```

### Solution 3: Use Different Resource Type (CODE FIX)

Update the upload middleware to avoid the "raw" resource type issue. I've already pushed a fix that:
- Uses `resource_type: 'auto'` instead of `'raw'`
- Explicitly sets `type: 'upload'`
- Adds `flags: 'attachment'` for non-images

This should work once deployed, **BUT** you still need to:
1. Re-upload files OR
2. Change Cloudinary settings above

---

## Quick Fix Steps

### Step 1: Unblock in Cloudinary (Right Now)
1. Login to Cloudinary: https://cloudinary.com/console
2. Go to **Media Library**
3. Navigate to `intellicare-tickets` folder
4. Click on your PDF file
5. Look for **Access control** or **Delivery type**
6. Change to **"Public"** or **"Upload type"**
7. Click **Save**

### Step 2: Test the File
1. Copy the Cloudinary URL from the file details
2. Try opening it in a new browser tab
3. If it works, the file is unblocked!

### Step 3: Prevent Future Blocks
1. Go to **Settings** → **Security**
2. Uncheck restrictions on **Raw files**
3. Or add your app domains to allowed list
4. **Save**

### Step 4: Deploy Code Update
Wait for Render to deploy the latest code that uses `resource_type: 'auto'`

---

## Alternative: Use Private Delivery with Signed URLs

If you want to keep files "private" but still accessible:

1. Keep `type: 'private'` in Cloudinary
2. Use our signed URL generation (already implemented)
3. Signed URLs will grant temporary access

This is more secure but requires our backend to generate URLs.

---

## Testing After Fix

1. **Unblock** the file in Cloudinary (Solution 1 or 2)
2. Wait for **Render to deploy** the code update
3. **Upload a new PDF** to a ticket
4. Try to **view it** - should work!

---

## Why This Happens

Cloudinary blocks raw file delivery by default on some accounts to:
- **Prevent bandwidth abuse**
- **Protect against unauthorized access**
- **Enforce usage limits**

You need to explicitly allow raw file delivery in your account settings.

---

## Status
⚠️ **Cloudinary account setting needs to be changed**
✅ Code fix pushed to use `resource_type: 'auto'`
🔄 Requires Cloudinary console access to unblock files

## Priority
**HIGH** - Files cannot be viewed until Cloudinary settings are updated
