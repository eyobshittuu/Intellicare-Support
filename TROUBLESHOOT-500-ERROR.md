# Troubleshooting 500 Error on Production

## 🔍 Current Error:

```
GET /api/tickets 500 (Internal Server Error)
```

## 🎯 Most Likely Cause:

**Missing Cloudinary credentials on Render**

The new code uses Cloudinary, but if the environment variables aren't set, it will cause errors.

---

## ✅ SOLUTION: Add Cloudinary Credentials to Render

### Step-by-Step:

1. **Go to Render Dashboard**:
   - https://dashboard.render.com

2. **Select Your Service**:
   - Click on: `intellicare-support-1`

3. **Go to Environment Tab**:
   - Click "Environment" in the left sidebar

4. **Add These 3 Variables**:

   Click "Add Environment Variable" for each:

   ```
   Name: CLOUDINARY_CLOUD_NAME
   Value: Eyob
   ```

   ```
   Name: CLOUDINARY_API_KEY
   Value: 634737354918742
   ```

   ```
   Name: CLOUDINARY_API_SECRET
   Value: UVLmru84UY4xrq5Uc2_nlZfC2SE
   ```

5. **Save Changes**:
   - Click "Save Changes" at the bottom
   - Render will automatically redeploy (~10 minutes)

6. **Wait for Deployment**:
   - Check "Events" tab
   - Wait for "Deploy succeeded" ✅

7. **Test Again**:
   - Refresh your production site
   - Try accessing tickets
   - Should work now!

---

## 🔍 Alternative Causes:

### If Adding Credentials Doesn't Fix It:

### 1. Check Render Logs

**View Logs**:
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. Look for error messages

**Common errors**:
- Database connection error
- Missing environment variable
- Sequelize migration error

### 2. Database Migration Issue

The `attachments` field might not have been added to the database.

**Fix**:
1. Go to Render dashboard
2. Click "Shell" tab
3. Run:
   ```bash
   node -e "require('./models').sequelize.sync({alter:true})"
   ```

### 3. Rollback to Previous Version

If you need the site working immediately:

```bash
# Locally, revert to previous commit
git revert HEAD
git push origin main

# Wait for Render to redeploy
```

---

## 📊 Check Deployment Status:

### Render Dashboard Checklist:

- [ ] Service shows "Live" status
- [ ] Latest deployment shows "Deploy succeeded"
- [ ] Environment variables are set (3 Cloudinary vars)
- [ ] No errors in "Logs" tab
- [ ] Database connected (check logs)

---

## 🧪 Test Locally First:

If you want to verify the code works:

1. **Make sure local server is running**:
   ```bash
   cd server
   npm run dev
   ```

2. **Change client to local**:
   - Edit `client/.env`
   - Change to: `VITE_API_URL=http://localhost:5000/api`

3. **Restart client**:
   ```bash
   cd client
   npm run dev
   ```

4. **Test**:
   - Create ticket with image
   - Should work locally ✅

5. **Change back to production**:
   - Edit `client/.env`
   - Change back to: `VITE_API_URL=https://intellicare-support-1.onrender.com/api`

---

## 🔧 Quick Fixes:

### Fix 1: Environment Variables
```
Add Cloudinary credentials to Render
Wait 10 minutes for redeploy
Test again
```

### Fix 2: Database Sync
```
Go to Render Shell
Run: node models/index.js
Check for errors
```

### Fix 3: Clear Cache
```
Clear browser cache (Ctrl+Shift+Del)
Hard refresh (Ctrl+Shift+R)
Try again
```

---

## 📞 If Still Not Working:

### Check These:

1. **Render Logs** - Look for specific error
2. **Database** - Check if connected
3. **Environment** - Verify all variables set
4. **Deployment** - Confirm latest code deployed

### Temporary Workaround:

**Revert to working version**:
```bash
git log --oneline  # Find last working commit
git revert <commit-hash>
git push origin main
```

---

## ✅ Expected Behavior After Fix:

After adding Cloudinary credentials and redeploying:

- ✅ No 500 errors
- ✅ Tickets page loads
- ✅ Can create tickets
- ✅ Can upload images
- ✅ Socket connects successfully

---

## 📋 Action Items:

### Immediate:
1. Add Cloudinary credentials to Render
2. Wait for redeploy (~10 minutes)
3. Test production site

### If Doesn't Work:
1. Check Render logs for specific error
2. Share error message for troubleshooting
3. Consider rollback if urgent

---

## 💡 Prevention:

For future deployments:

1. **Always test locally first**
2. **Add environment variables before pushing**
3. **Check Render logs after deployment**
4. **Have rollback plan ready**

---

**Status**: ⚠️ Production error - needs Cloudinary credentials

**Action Required**: Add credentials to Render (see Step-by-Step above)

**ETA to Fix**: ~15 minutes after adding credentials
