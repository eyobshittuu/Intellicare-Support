# ⚡ Vercel Deployment - Quick Start

## 🚀 Deploy in 5 Steps (10 minutes)

### Step 1: Push Code (1 min)
```bash
cd "C:\Users\babbo\Desktop\Intellicare Tickting System"
git add .
git commit -m "feat: Add Vercel deployment configuration"
git push origin main
```

### Step 2: Sign Up Vercel (2 min)
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### Step 3: Import Project (2 min)
1. Dashboard → **"Add New..."** → **"Project"**
2. Find **"Intellicare-Support"**
3. Click **"Import"**

### Step 4: Configure (3 min)

**Root Directory:**
```
client
```
⚠️ Click "Edit" and set to `client`

**Environment Variable:**
```
Name:  VITE_API_URL
Value: https://your-backend-url.onrender.com/api
```
⚠️ Use YOUR actual Render backend URL!

### Step 5: Deploy (2 min)
1. Click **"Deploy"**
2. Wait 3-5 minutes
3. Get your URL!

---

## 🔧 After Deployment

### Update Backend CORS:
1. Render Dashboard → Your backend service
2. Environment → `CLIENT_URL`
3. Change to: `https://your-frontend.vercel.app`
4. Save (auto-redeploys)

---

## ✅ Test It!

Visit your Vercel URL:
- ✅ Login page loads
- ✅ Can register new user
- ✅ Can login
- ✅ Dashboard appears
- ✅ Can create ticket

---

## 📋 Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported
- [ ] Root directory set to `client`
- [ ] `VITE_API_URL` added with backend URL
- [ ] Deployed successfully
- [ ] Backend `CLIENT_URL` updated
- [ ] Tested login and registration

---

## 🆘 Quick Fixes

**Build Failed?**
- Check Root Directory is `client`
- Verify build command is `npm run build`

**Can't Connect to API?**
- Check `VITE_API_URL` value
- Must end with `/api`
- Must use `https://`
- Verify backend is running

**CORS Error?**
- Update backend `CLIENT_URL`
- Use exact Vercel URL
- Redeploy backend

---

## 🎯 What You Need

1. **Your Render backend URL:**
   ```
   https://intellicare-support-api-xxxx.onrender.com
   ```

2. **Add `/api` to it:**
   ```
   https://intellicare-support-api-xxxx.onrender.com/api
   ```

3. **Use this as `VITE_API_URL` in Vercel**

---

## 📱 Your Deployed URLs

**Frontend (Vercel):**
```
https://intellicare-support.vercel.app
```
or
```
https://intellicare-support-[random].vercel.app
```

**Backend (Render):**
```
https://your-backend.onrender.com
```

**API Endpoint:**
```
https://your-backend.onrender.com/api
```

---

## 🎊 Done!

Your app is now live on:
- Frontend: Vercel (fast global CDN)
- Backend: Render (cloud hosting)
- Database: PostgreSQL (managed)

**Total time:** ~10 minutes  
**Total cost:** FREE! 🆓

Ready to deploy? Follow the 5 steps above! 🚀
