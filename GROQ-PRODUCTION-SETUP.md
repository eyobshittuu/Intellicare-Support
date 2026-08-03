# Groq AI - Production Setup Instructions

## ⚠️ Important: API Key Configuration

Your Groq API key has been configured locally in `server/.env` (this file is not committed to git for security).

## 🚀 Production Deployment (Render)

To enable AI chat in production, add the API key to Render:

### Steps:

1. **Go to Render Dashboard:**
   - Visit https://dashboard.render.com
   - Select your backend service (e.g., `intellicare-support-1`)

2. **Add Environment Variable:**
   - Click "Environment" in the left sidebar
   - Click "Add Environment Variable" button
   - Enter:
     - **Key:** `GROQ_API_KEY`
     - **Value:** `[The API key you provided - check your local server/.env file]`
   - Click "Save Changes"

3. **Wait for Deployment:**
   - Render will automatically redeploy (takes 2-3 minutes)
   - Watch the logs for "Groq AI integration is ready"

4. **Verify It Works:**
   - Login to your app as admin/super admin
   - Look for purple AI bot button (bottom-right corner)
   - Click and send a test message
   - You should get a fast AI response!

## 🧪 Testing Locally

To verify Groq integration works:

```bash
cd server
node test-groq.js
```

Expected output:
```
✅ SUCCESS! Groq API is working!
📝 AI Response: [AI greeting message]
🎉 Groq AI integration is ready to use!
```

## 📊 Monitoring Usage

- **Free Tier Limits:** 14,400 requests/day
- **Check Usage:** https://console.groq.com/usage
- **View Logs:** Check Render logs for AI chat activity

## 🔒 Security Notes

- ✅ API key is stored in environment variables only
- ✅ Never commit API keys to git
- ✅ AI endpoints require admin authentication
- ✅ Client cannot access API key directly

## 📖 Full Documentation

See `GROQ-AI-SETUP.md` for complete documentation including:
- Feature overview
- How to use the AI assistant
- Troubleshooting guide
- Customization options

## ✅ Checklist

- [x] Groq API key added to local `.env`
- [x] Local testing successful
- [ ] Add `GROQ_API_KEY` to Render environment variables
- [ ] Wait for Render deployment
- [ ] Test AI chat in production

---

**Need the API key?** Check your local `server/.env` file - it's already configured there!
