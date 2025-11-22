# Production Setup Guide

## Environment Variables Required

For the AI chat feature to work in production, you need to set the following environment variables:

### 1. OpenAI API Key (Required for AI Chat)

```bash
OPENAI_API_KEY=sk-proj-...
```

**Where to set:**
- **Vercel:** Settings → Environment Variables → Add New
- **Other platforms:** Check your deployment platform's environment variable settings

**How to get:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste it into your environment variables

### 2. Firebase Service Account (Required for Admin Operations)

```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"menuai-d0ab5",...}
```

**Where to set:**
- **Vercel:** Settings → Environment Variables → Add New
- **Important:** The value should be the entire JSON object as a string

**How to get:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the entire JSON content
4. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT` (as a string)

### 3. Other Environment Variables

These should already be set from your `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Verifying Environment Variables

After setting environment variables, you need to:

1. **Redeploy your application** (or wait for automatic redeployment)
2. **Test the AI chat** by visiting: `https://amanath.in/order?restaurantId=sample-restaurant-001&tableId=table-1`

## Common Errors

### "AI service configuration error"
- **Cause:** `OPENAI_API_KEY` is not set or invalid
- **Solution:** Check that the environment variable is set correctly in your deployment platform

### "Failed to initialize Firebase Admin SDK"
- **Cause:** `FIREBASE_SERVICE_ACCOUNT` is not set or invalid
- **Solution:** Make sure the entire JSON service account key is set as the environment variable

### "Rate limit exceeded"
- **Cause:** Too many requests to OpenAI API
- **Solution:** Wait a moment and try again, or check your OpenAI usage limits

## Testing

To test if everything is working:

1. Visit: `https://amanath.in/order?restaurantId=sample-restaurant-001&tableId=table-1`
2. Click on "AI Assistant" tab
3. Type "hello" in the chat
4. You should get a response from the AI

If you see an error, check:
1. Environment variables are set correctly
2. Application has been redeployed after setting variables
3. Check browser console and server logs for detailed error messages

