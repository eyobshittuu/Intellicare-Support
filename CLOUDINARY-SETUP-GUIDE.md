# Cloudinary Setup Guide for Image Uploads

## 🎯 What is Cloudinary?

Cloudinary is a cloud-based image and video management service that provides:
- ✅ **Permanent storage** (images never lost)
- ✅ **CDN delivery** (fast loading worldwide)
- ✅ **Free tier** (25 GB storage, 25 GB bandwidth/month)
- ✅ **Image optimization** (automatic compression)
- ✅ **Easy integration** (works perfectly with Render)

---

## 📋 Step-by-Step Setup

### Step 1: Create Cloudinary Account (FREE)

1. **Go to**: https://cloudinary.com/users/register_free
2. **Sign up** with:
   - Email
   - Password
   - Choose "Developer" as your role
3. **Verify email** (check inbox)
4. **Login** to dashboard

---

### Step 2: Get Your Credentials

After logging in, you'll see your **Dashboard**.

**Find these credentials:**

```
Cloud Name:  your-cloud-name
API Key:     123456789012345
API Secret:  abcdefghijklmnopqrstuvwxyz
```

**Location**: Dashboard → Account Details (top right) → API Keys

---

### Step 3: Add Credentials to Local Environment

1. **Open**: `server/.env`
2. **Add** these lines at the end:

```env
# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

3. **Replace** the values with your actual credentials
4. **Save** the file

**Example**:
```env
CLOUDINARY_CLOUD_NAME=intellicare
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abCdEfGhIjKlMnOpQrStUvWxYz123
```

---

### Step 4: Add to Production (Render)

1. **Go to**: https://dashboard.render.com
2. **Select**: Your service (`intellicare-support-1`)
3. **Click**: "Environment" tab
4. **Add** three environment variables:

```
Key: CLOUDINARY_CLOUD_NAME
Value: your-cloud-name

Key: CLOUDINARY_API_KEY
Value: your-api-key

Key: CLOUDINARY_API_SECRET
Value: your-api-secret
```

5. **Save Changes**
6. Render will auto-redeploy

---

## 🧪 Test Locally

### Step 1: Restart Server

```bash
# Stop server (Ctrl+C if running)
# Start again
cd server
npm run dev
```

### Step 2: Test Upload

1. Open: http://localhost:5173
2. Login
3. Create new ticket
4. Upload an image
5. Submit

### Step 3: Verify

**Check Cloudinary Dashboard:**
1. Go to: https://cloudinary.com/console
2. Click: "Media Library"
3. Look for: "intellicare-tickets" folder
4. Your uploaded image should be there! ✅

**Check Ticket:**
1. Open the ticket you created
2. See the image displayed
3. Click to view full size
4. Image URL should be: `https://res.cloudinary.com/...`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Added credentials to `server/.env`
- [ ] Server restarts without errors
- [ ] Can upload image
- [ ] Image appears in Cloudinary dashboard
- [ ] Image displays in ticket
- [ ] Image URL is Cloudinary URL (`res.cloudinary.com`)
- [ ] Full-size image opens correctly

---

## 📊 What Cloudinary Provides:

### Free Tier Limits:
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Images**: Unlimited

### This is enough for:
- ~25,000 images (assuming 1MB each)
- ~500 tickets with 5 images each
- Great for development and small/medium production

---

## 🎨 Features You Get:

### Automatic Optimization:
- ✅ Images automatically compressed
- ✅ Format conversion (WebP for modern browsers)
- ✅ Responsive images
- ✅ Lazy loading support

### Image Transformations:
- ✅ Resize to max 1500x1500 (already configured)
- ✅ Quality optimization
- ✅ Format conversion
- ✅ Watermarking (if needed)

### CDN Delivery:
- ✅ Fast worldwide loading
- ✅ Cached images
- ✅ HTTPS by default
- ✅ 99.99% uptime

---

## 🔒 Security:

### Credentials Security:
- ✅ API Secret kept in environment variables
- ✅ Never committed to git
- ✅ Different credentials for dev/production
- ✅ Can regenerate anytime

### Upload Security:
- ✅ Server-side validation
- ✅ File type restrictions
- ✅ Size limits (5MB)
- ✅ Authentication required

---

## 📂 Folder Structure in Cloudinary:

```
Your Cloudinary Account
└── intellicare-tickets/
    ├── screenshot-1706543210123-987654321
    ├── error-1706543210124-123456789
    ├── diagram-1706543210125-456789123
    └── ... (all ticket images)
```

Each image has:
- **Public ID**: Unique identifier
- **URL**: Direct link to image
- **Metadata**: Size, format, dimensions
- **Transformations**: Applied automatically

---

## 🔧 Advanced Configuration (Optional):

### Custom Transformations:

Update `server/middleware/upload.js`:

```javascript
transformation: [
  { width: 1500, height: 1500, crop: 'limit' }, // Max dimensions
  { quality: 'auto:good' }, // Auto quality
  { fetch_format: 'auto' } // Auto format (WebP)
]
```

### Custom Folder Structure:

```javascript
folder: (req, file) => {
  const ticketId = req.body.ticketId || 'temp';
  return `intellicare-tickets/${ticketId}`;
}
```

### Secure URLs:

```javascript
type: 'authenticated', // Requires signed URLs
```

---

## 🐛 Troubleshooting:

### Error: "Must supply api_key"

**Solution**: Check `.env` file has correct credentials

### Error: "Invalid cloud_name"

**Solution**: Verify cloud name matches Cloudinary dashboard

### Images not uploading?

1. Check Cloudinary credentials
2. Verify server restarted after adding credentials
3. Check server console for errors
4. Test with small image (<1MB)

### Images not displaying?

1. Check Cloudinary dashboard - image should be there
2. Verify image URL in database
3. Check browser console for CORS errors
4. Try opening image URL directly

---

## 💰 Cost Estimation:

### Free Tier (Current):
- **Cost**: $0/month
- **Good for**: Development, testing, small production
- **Limits**: 25 GB storage, 25 GB bandwidth

### If You Exceed Free Tier:

**Paid Plans** (only if needed later):
- **Plus**: $99/month (85 GB storage, 200 GB bandwidth)
- **Advanced**: $224/month (200 GB storage, 500 GB bandwidth)

**Note**: Most small to medium apps never exceed free tier!

---

## 🎯 Production Checklist:

Before going to production:

- [ ] Cloudinary account created
- [ ] Credentials added to Render environment
- [ ] Test upload on production
- [ ] Verify images persist after Render restart
- [ ] Check Cloudinary usage (should be minimal)
- [ ] Setup usage alerts (optional)
- [ ] Enable backup (optional)

---

## 📚 Additional Resources:

**Cloudinary Documentation:**
- Dashboard: https://cloudinary.com/console
- Docs: https://cloudinary.com/documentation
- Node.js Guide: https://cloudinary.com/documentation/node_integration
- Support: https://support.cloudinary.com

**Our Configuration:**
- Upload middleware: `server/middleware/upload.js`
- Ticket controller: `server/controllers/ticketController.js`
- Environment: `server/.env`

---

## 🎉 Benefits Summary:

### Before (Local Storage):
- ❌ Images lost on Render restart
- ❌ No CDN (slow loading)
- ❌ No optimization
- ❌ Manual backups needed
- ❌ Scaling issues

### After (Cloudinary):
- ✅ Permanent storage
- ✅ Global CDN (fast everywhere)
- ✅ Automatic optimization
- ✅ Automatic backups
- ✅ Infinite scaling
- ✅ **FREE for most use cases!**

---

## 🚀 Next Steps:

1. **Create Cloudinary account** (5 minutes)
2. **Copy credentials** (1 minute)
3. **Add to `.env`** (1 minute)
4. **Test locally** (2 minutes)
5. **Add to Render** (3 minutes)
6. **Test production** (2 minutes)

**Total time**: ~15 minutes to permanent image storage! 🎊

---

## ⚡ Quick Start Commands:

```bash
# 1. Get credentials from Cloudinary
# Copy from: https://cloudinary.com/console

# 2. Add to local .env
echo "CLOUDINARY_CLOUD_NAME=your-cloud-name" >> server/.env
echo "CLOUDINARY_API_KEY=your-api-key" >> server/.env
echo "CLOUDINARY_API_SECRET=your-api-secret" >> server/.env

# 3. Restart server
cd server
npm run dev

# 4. Test by uploading an image
# Open: http://localhost:5173

# 5. Verify in Cloudinary
# Check: https://cloudinary.com/console/media_library
```

---

**Status**: ✅ Cloudinary integration complete - just need credentials!

**Action Required**: Create Cloudinary account and add credentials to test!
