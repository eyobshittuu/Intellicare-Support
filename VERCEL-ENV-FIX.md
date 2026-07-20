# Fix Vercel Environment Variable

## Problem
Your Vercel deployment is still using `localhost:5000` instead of your Render backend URL.

## Why This Happened
- `.env` files are NOT automatically used by Vercel deployments
- Environment variables must be set in Vercel Dashboard
- Build-time variables (like `VITE_API_URL`) need to be set before deployment

## ⚠️ URGENT: Set Environment Variable on Vercel

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Login if needed

2. **Select Your Project**
   - Click on `intellicare-support` project
   - (Or whatever your project name is)

3. **Go to Settings**
   - Click "Settings" tab at the top

4. **Go to Environment Variables**
   - Click "Environment Variables" in left sidebar

5. **Add the Variable**
   - Click "Add New" or "Add Environment Variable"
   - **Name**: `VITE_API_URL`
   - **Value**: `https://intellicare-support-1.onrender.com/api`
   - **Environment**: Select ALL (Production, Preview, Development)
   - Click "Save"

6. **Redeploy**
   - Go back to "Deployments" tab
   - Find the latest deployment
   - Click the "..." menu (three dots)
   - Click "Redeploy"
   - Check "Use existing Build Cache" → **UNCHECK IT**
   - Click "Redeploy"

### Screenshot of What to Enter:
```
Name:  VITE_API_URL
Value: https://intellicare-support-1.onrender.com/api

☑ Production
☑ Preview  
☑ Development
```

## Alternative: Use Vercel CLI (Faster)

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variable
vercel env add VITE_API_URL production
# When prompted, enter: https://intellicare-support-1.onrender.com/api

vercel env add VITE_API_URL preview
# When prompted, enter: https://intellicare-support-1.onrender.com/api

# Trigger redeploy
vercel --prod
```

## Verification

After redeploying, check:

1. **Check Build Logs**:
   - Go to deployment details
   - Look for: `VITE_API_URL=https://intellicare-support-1.onrender.com/api`
   - Should appear in build logs

2. **Test in Browser**:
   - Visit your Vercel URL
   - Open DevTools (F12) → Network tab
   - Try to login
   - Request should go to: `https://intellicare-support-1.onrender.com/api/auth/login`
   - NOT `localhost:5000`

3. **Check Deployed Code**:
   - In browser console, run:
     ```javascript
     console.log(import.meta.env.VITE_API_URL)
     ```
   - Should show: `https://intellicare-support-1.onrender.com/api`

## Common Mistakes to Avoid

❌ **Don't**: Just push `.env` file and expect it to work  
✅ **Do**: Set environment variable in Vercel Dashboard

❌ **Don't**: Only set for "Production" environment  
✅ **Do**: Set for ALL environments (Production, Preview, Development)

❌ **Don't**: Redeploy with cached build  
✅ **Do**: Clear build cache when redeploying

❌ **Don't**: Forget the `/api` at the end  
✅ **Do**: Use full URL: `https://intellicare-support-1.onrender.com/api`

## Still Getting localhost in Requests?

If you still see `localhost:5000` after setting the variable:

1. **Hard refresh** browser (CTRL + SHIFT + R)
2. **Clear browser cache** completely
3. **Check the deployment timestamp** - make sure you're viewing the latest deployment
4. **Try incognito/private mode** to avoid cached files
5. **Verify variable is set** in Vercel Dashboard → Settings → Environment Variables

## Timeline

After setting the variable and redeploying:
- ⏱️ Build time: 1-2 minutes
- ⏱️ Deployment: 30 seconds
- ⏱️ DNS propagation: Instant (Vercel)
- **Total**: ~3 minutes

Then your app should work! 🚀

## Next: Also Update Render

Don't forget to also update Render backend:
- Go to Render Dashboard
- Update `CLIENT_URL=https://intellicare-support.vercel.app`
- (Or your actual Vercel production URL)
