# 🚨 URGENT: Quick Fix Steps

## Your Issue
Vercel is using `localhost:5000` instead of your Render backend.

## Root Cause
Environment variables in `.env` files are NOT used by Vercel. You MUST set them in Vercel Dashboard.

---

## ✅ DO THIS NOW (Takes 5 minutes):

### 1. Set Environment Variable on Vercel

**Go to**: https://vercel.com/dashboard

**Steps**:
1. Click your project: `intellicare-support`
2. Click **"Settings"** tab
3. Click **"Environment Variables"** (left sidebar)
4. Click **"Add New"**
5. Enter:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://intellicare-support-1.onrender.com/api`
   - **Check ALL boxes**: Production ✓ Preview ✓ Development ✓
6. Click **"Save"**

### 2. Redeploy on Vercel

**Still on Vercel Dashboard**:
1. Click **"Deployments"** tab
2. Find the latest deployment (top of list)
3. Click **"..."** (three dots menu)
4. Click **"Redeploy"**
5. **UNCHECK** "Use existing Build Cache" (important!)
6. Click **"Redeploy"**
7. Wait 2-3 minutes

### 3. Update Render Backend

**Go to**: https://dashboard.render.com

**Steps**:
1. Click your service: `intellicare-support-1`
2. Click **"Environment"** (left sidebar)
3. Find `CLIENT_URL` or click **"Add Environment Variable"**
4. Set value to your **production** Vercel URL:
   - Use: `https://intellicare-support.vercel.app`
   - NOT the preview URL (the one with random characters)
5. Click **"Save Changes"**
6. Wait 2-3 minutes for auto-redeploy

---

## 🧪 Test After Deployment

1. **Clear browser cache**: CTRL + SHIFT + DELETE → Clear everything
2. **Visit**: https://intellicare-support.vercel.app (your production URL)
3. **Open DevTools**: Press F12
4. **Go to Network tab**
5. **Try to login**
6. **Check the request URL** - should be:
   - ✅ `https://intellicare-support-1.onrender.com/api/auth/login`
   - ❌ NOT `localhost:5000/api/auth/login`

---

## 📋 Checklist

Before testing:
- [ ] Set `VITE_API_URL` on Vercel Dashboard
- [ ] Redeployed Vercel (without cache)
- [ ] Set `CLIENT_URL` on Render Dashboard  
- [ ] Waited for both deployments to complete (~3-5 minutes total)
- [ ] Cleared browser cache
- [ ] Using production URL, not preview URL

---

## 🔍 How to Find Your Production URL

Your Vercel URLs:
- **Production**: `https://intellicare-support.vercel.app` (use this!)
- **Preview**: `https://intellicare-support-xxxxx.vercel.app` (temporary, for testing)

**Use the production URL** for the `CLIENT_URL` on Render!

---

## ⚡ TL;DR

```bash
# What you need to set:

# On Vercel Dashboard:
VITE_API_URL=https://intellicare-support-1.onrender.com/api

# On Render Dashboard:
CLIENT_URL=https://intellicare-support.vercel.app
```

Then redeploy both, wait, clear cache, and test! 🚀
