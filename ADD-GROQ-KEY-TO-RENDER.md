# 🔑 Add GROQ_API_KEY to Render - Step by Step

## Current Issue
You're seeing this error:
```
AI service is not configured. Please add GROQ_API_KEY to environment variables.
```

This means the Groq API key needs to be added to Render's environment variables.

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Render Dashboard
1. Open your browser
2. Go to: https://dashboard.render.com
3. Login with your account

### Step 2: Select Your Backend Service
1. You should see your services listed
2. Click on **intellicare-support-1** (or your backend service name)
3. This opens the service details page

### Step 3: Navigate to Environment Variables
1. On the left sidebar, click **"Environment"**
2. You'll see a list of existing environment variables (like `DATABASE_URL`, `JWT_SECRET`, etc.)

### Step 4: Add the GROQ_API_KEY
1. Click the **"Add Environment Variable"** button (usually top right)
2. A form will appear with two fields:
   - **Key (left field):** Type exactly: `GROQ_API_KEY`
   - **Value (right field):** Use the API key from your local `server/.env` file
3. Click **"Save Changes"** button

**Note:** The API key value starts with `gsk_` and is stored in your local `server/.env` file for reference.

### Step 5: Wait for Deployment
1. Render will show: "Environment variables updated"
2. It will automatically trigger a new deployment
3. Watch the **"Logs"** tab to see deployment progress
4. Wait for the message: **"Your service is live"** (usually 2-3 minutes)

### Step 6: Verify It Works
1. Go back to your app: https://intellicare-support.vercel.app
2. Login as admin or super admin
3. Click the **purple AI bot button** (bottom-right corner)
4. Send a test message like "Hello"
5. You should get an AI response within seconds! 🎉

---

## ⚠️ Common Issues

### Issue 1: "Still seeing the error after adding key"
**Solution:** Make sure you clicked "Save Changes" and waited for the deployment to complete. Check the Logs tab.

### Issue 2: "Can't find Environment tab"
**Solution:** Make sure you're on the backend service page (intellicare-support-1), not the frontend.

### Issue 3: "Deployment failed"
**Solution:** Check the logs for errors. The key format should be exactly as shown (no extra spaces).

---

## ✅ Verification Checklist

Before testing:
- [ ] Logged into Render dashboard
- [ ] Selected correct backend service
- [ ] Clicked "Environment" tab
- [ ] Added `GROQ_API_KEY` with the correct value
- [ ] Clicked "Save Changes"
- [ ] Waited for deployment to complete (green "Live" status)
- [ ] Refreshed your app in browser

---

## 🎯 What to Expect After Setup

Once configured correctly:
- Purple AI bot button appears (bottom-right)
- Click to open chat widget
- Type any question
- Get instant AI response
- AI understands healthcare IT context
- Super fast responses (powered by Groq)

---

## 📞 Need Help?

If you're still having issues:
1. Check Render logs for error messages
2. Verify the API key is exactly as provided (no typos)
3. Make sure the service finished deploying (check "Events" tab)

---

**Ready? Let's add that key!** 🚀
