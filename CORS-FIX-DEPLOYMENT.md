# CORS Fix for Deployed Application

## Problem
Your Vercel frontend (`https://intellicare-support.vercel.app`) cannot connect to your Render backend (`https://intellicare-support-1.onrender.com`) due to CORS policy blocking.

## What I Fixed

### 1. ✅ Updated Frontend API URL
**File**: `client/.env`
```env
VITE_API_URL=https://intellicare-support-1.onrender.com/api
```

### 2. ✅ Updated Server CORS Configuration
**File**: `server/server.js`
- Now accepts multiple origins including:
  - `http://localhost:5173` (local development)
  - `http://localhost:3000`
  - `https://intellicare-support.vercel.app` (your Vercel deployment)

### 3. ✅ Updated Local Server Environment
**File**: `server/.env`
```env
CLIENT_URL=https://intellicare-support.vercel.app
```

## ⚠️ CRITICAL: What You Need to Do on Render

You MUST update the environment variable on Render:

### Steps to Update Render Environment Variable:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your backend service**: `intellicare-support-1`
3. **Click "Environment" tab** (left sidebar)
4. **Find or add `CLIENT_URL` variable**:
   - If it exists: Click "Edit" and change the value
   - If it doesn't exist: Click "Add Environment Variable"
5. **Set the value to**:
   ```
   CLIENT_URL=https://intellicare-support.vercel.app
   ```
6. **Click "Save Changes"**
7. **Render will automatically redeploy** (takes 2-3 minutes)

### Alternative: Add All Allowed Origins

If you want to support multiple origins on Render, you could also:

1. Keep the code as-is (it already supports multiple origins)
2. Just ensure `CLIENT_URL` is set to your main production frontend
3. The server code will automatically allow:
   - Your Vercel frontend
   - Local development URLs
   - Any additional URL in CLIENT_URL

## Next Steps: Deploy Frontend Changes

After updating Render, you need to redeploy your Vercel frontend with the new API URL:

### Option 1: Automatic Deployment (If GitHub is connected)
1. Commit and push the changes:
   ```bash
   git add client/.env
   git commit -m "Update API URL for production"
   git push origin main
   ```
2. Vercel will automatically detect and redeploy

### Option 2: Manual Deployment
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `intellicare-support`
3. Go to "Settings" → "Environment Variables"
4. Add or update:
   ```
   VITE_API_URL=https://intellicare-support-1.onrender.com/api
   ```
5. Go to "Deployments" tab
6. Click "Redeploy" on the latest deployment

## Testing After Deployment

Once both are updated:

1. **Clear browser cache** (CTRL + SHIFT + DELETE)
2. Visit: https://intellicare-support.vercel.app
3. Try to login
4. Check browser console (F12) - CORS error should be gone

### Expected Flow:
✅ Frontend (Vercel) → Makes request to Backend (Render)  
✅ Backend checks CORS → Sees Vercel URL in allowed origins  
✅ Backend responds with proper CORS headers  
✅ Frontend receives data successfully

## Verification Commands

### Test Backend Health:
```bash
curl https://intellicare-support-1.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "IntelliCare Support API is running",
  "timestamp": "2024-..."
}
```

### Test CORS from Frontend Domain:
Open browser console on your Vercel site and run:
```javascript
fetch('https://intellicare-support-1.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Should return health check data without CORS error.

## Troubleshooting

### Still Getting CORS Error After Changes?

1. **Check Render Environment Variable**:
   - Confirm `CLIENT_URL` is set correctly
   - No typos (must be exact: `https://intellicare-support.vercel.app`)
   - Render has redeployed (check deployment logs)

2. **Check Vercel Environment Variable**:
   - Confirm `VITE_API_URL` is set correctly
   - Vercel has redeployed with new env var
   - Clear cache and hard reload (CTRL + SHIFT + R)

3. **Check Browser Cache**:
   - Clear all browser cache
   - Try incognito/private mode
   - Try different browser

4. **Check Render Logs**:
   - Go to Render Dashboard → Logs
   - Look for CORS-related errors
   - Check if requests are reaching the server

### CORS Error Persists?

If CORS still fails after all updates:

1. **Verify the frontend is making requests to the right URL**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to login
   - Check the request URL - should be `https://intellicare-support-1.onrender.com/api/auth/login`

2. **Check request origin**:
   - In Network tab, click the failed request
   - Look at "Request Headers"
   - Origin should be: `https://intellicare-support.vercel.app`

3. **Check response headers**:
   - If you see a response, check "Response Headers"
   - Should include: `Access-Control-Allow-Origin: https://intellicare-support.vercel.app`

## Summary of Changes

| File | Change | Status |
|------|--------|--------|
| `client/.env` | Updated API URL to Render backend | ✅ Done |
| `server/.env` | Updated CLIENT_URL to Vercel frontend | ✅ Done |
| `server/server.js` | Updated CORS to allow multiple origins | ✅ Done |
| **Render Environment** | Update CLIENT_URL variable | ⚠️ **YOU NEED TO DO THIS** |
| **Vercel Deployment** | Redeploy with new API URL | ⚠️ **YOU NEED TO DO THIS** |

## Ready to Deploy!

Once you:
1. ✅ Update `CLIENT_URL` on Render
2. ✅ Redeploy Vercel (or push to GitHub)
3. ✅ Clear browser cache

Your application should work perfectly! 🚀
