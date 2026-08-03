# Groq AI Chat Integration Setup Guide

## Overview

This guide will help you set up the Groq AI Chat assistant for admins and super admins in your IntelliCare Support system.

## Features

✨ **AI Assistant Capabilities:**
- Real-time IT support and troubleshooting
- Healthcare technology expertise (EMR, PACS, HL7, DICOM)
- Best practices for ticket management
- Fast responses powered by Groq's LLaMA model
- Conversation history for context-aware responses
- Beautiful, user-friendly chat interface

🎯 **Admin-Only Access:**
- Only admins and super admins can access the AI assistant
- Regular users do not see the AI chat widget
- Secure API authentication required

## Step 1: Get Your Groq API Key

1. **Visit Groq Console:**
   - Go to https://console.groq.com

2. **Sign Up / Sign In:**
   - Create a free account or sign in
   - Free tier includes generous usage limits

3. **Generate API Key:**
   - Navigate to API Keys section
   - Click "Create API Key"
   - Give it a name (e.g., "IntelliCare Production")
   - Copy the key (you won't see it again!)

## Step 2: Configure Backend

### Local Development

1. **Add to `.env` file:**
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   ```

2. **Restart your server:**
   ```bash
   cd server
   npm run dev
   ```

### Production (Render)

1. **Add Environment Variable:**
   - Go to your Render dashboard
   - Select your backend service
   - Click "Environment" tab
   - Add new environment variable:
     - **Key:** `GROQ_API_KEY`
     - **Value:** `gsk_your_actual_groq_api_key_here`
   - Click "Save Changes"

2. **Render will automatically redeploy** with the new environment variable

## Step 3: Verify Installation

### 1. Check Backend Health

Test the AI endpoint:
```bash
curl -X POST https://your-backend-url.onrender.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, can you help me?"}
    ]
  }'
```

### 2. Check Frontend

1. **Login as Admin or Super Admin**
2. **Look for the purple AI button** in the bottom-right corner
3. **Click to open** the AI chat widget
4. **Send a test message** like "Hello"

## How to Use

### For Admins & Super Admins

1. **Open AI Assistant:**
   - Click the purple bot icon (bottom-right corner)
   - The chat widget will open

2. **Ask Questions:**
   - Type your question or issue
   - Press Enter or click Send
   - AI responds in seconds

3. **Example Questions:**
   - "How do I troubleshoot a printer connection issue?"
   - "What's the best priority for urgent hardware failures?"
   - "How do I escalate a critical EMR system issue?"
   - "What are best practices for ticket documentation?"

4. **Clear Chat:**
   - Click "Clear chat" to start fresh
   - Conversation history is maintained per session

5. **Minimize/Close:**
   - Use minimize button to collapse while keeping open
   - Use X button to close completely

## AI Model Information

- **Model:** LLaMA 3.3 70B Versatile
- **Speed:** ~300 tokens/second
- **Context:** Maintains last 10 messages for continuity
- **Specialization:** Healthcare IT support
- **Compliance:** HIPAA-aware responses

## Pricing & Limits

### Groq Free Tier (as of 2024)
- **14,400 requests per day**
- **No credit card required**
- **Generous token limits**

This is sufficient for most small to medium-sized support teams.

### Upgrade Options
If you need more:
- **Pro Plan:** Higher limits
- **Enterprise:** Custom pricing
- Visit https://groq.com/pricing

## API Endpoints

### 1. Chat with AI
```
POST /api/ai/chat
Authorization: Bearer <admin_token>
Body: {
  "messages": [
    {"role": "user", "content": "Your question"}
  ]
}
```

### 2. Get Ticket Suggestion
```
POST /api/ai/suggest
Authorization: Bearer <admin_token>
Body: {
  "title": "Ticket title",
  "description": "Ticket description",
  "category": "Technical Issue"
}
```

## Troubleshooting

### "AI service is not configured" Error

**Cause:** GROQ_API_KEY is not set

**Solution:**
1. Check if `GROQ_API_KEY` is in your `.env` file (local)
2. Check if environment variable is set on Render (production)
3. Restart the server after adding the key

### "Authentication failed" Error

**Cause:** Invalid API key

**Solution:**
1. Verify your API key is correct
2. Generate a new key from Groq console
3. Update environment variables

### "Rate limit exceeded" Error

**Cause:** Too many requests in short time

**Solution:**
1. Wait a few minutes before trying again
2. Consider upgrading to Pro plan if this happens frequently

### Widget Not Showing

**Cause:** User is not an admin

**Solution:**
- AI widget only appears for users with role 'admin' or 'super_admin'
- Regular users cannot see or access the AI assistant

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to git
- Never share your API key publicly
- API key is server-side only (not exposed to frontend)
- All AI requests require admin authentication
- AI cannot access user data or tickets directly

## Customization

### Change AI Behavior

Edit `server/controllers/aiChatController.js`:

```javascript
const SYSTEM_PROMPT = `Your custom instructions here...`;
```

### Change AI Model

Edit `server/controllers/aiChatController.js`:

```javascript
model: 'llama-3.3-70b-versatile', // Try: mixtral-8x7b-32768
```

Available models:
- `llama-3.3-70b-versatile` (Fastest, recommended)
- `llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`
- `gemma2-9b-it`

### Customize Widget Appearance

Edit `client/src/components/AIChatWidget.jsx`:
- Colors: Search for `purple-600` and `blue-600`
- Size: Change `w-[400px]` and `max-h-[500px]`
- Position: Change `bottom-6 right-6`

## Support

For issues or questions:
1. Check this documentation first
2. Review Groq documentation: https://console.groq.com/docs
3. Check server logs for error details

## Version History

- **v1.0** - Initial Groq AI integration
  - Chat widget for admins
  - Conversational AI assistant
  - Healthcare IT specialization
  - Fast response times with Groq

---

**Enjoy your AI-powered IT support assistant! 🤖✨**
