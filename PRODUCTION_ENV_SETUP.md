# Production Environment Variables Setup Guide

## ✅ All Environment Variables Added to .env

Your `.env` file now contains all the necessary environment variables for production deployment.

## 📋 Environment Variables List

### 1. OpenAI Configuration
- `OPENAI_API_KEY` - Your OpenAI API key for AI chat features
- `OPENAI_MODEL` (Optional) - Model to use (default: gpt-4o)
- `OPENAI_FALLBACK_MODEL` (Optional) - Fallback model for simple queries

### 2. Firebase Admin SDK (Server-side)
- `FIREBASE_SERVICE_ACCOUNT` - Complete service account JSON as a single-line string
  - Used for server-side operations (API routes, admin operations)
  - Contains all authentication credentials

### 3. Firebase Client Configuration (Client-side)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase authentication domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Firebase analytics measurement ID

**Note:** The `NEXT_PUBLIC_` prefix makes these variables available in the browser (client-side).

### 4. Restaurant approval (optional)
- `APPROVER_EMAILS` - Comma-separated list of emails who can approve pending restaurants (e.g. `admin@example.com,owner@example.com`)
  - Used by API routes `/api/admin/am-i-approver`, `/api/admin/pending-restaurants`, `/api/admin/approve-restaurant`
  - If unset or empty, no one can approve; new restaurants stay in "pending" until you set this and an approver approves them

## 🚀 Production Deployment Steps

### For Vercel:

1. **Go to your Vercel project settings:**
   - Visit: https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables

2. **Add all environment variables:**
   - Click "Add New"
   - For each variable, add:
     - **Name:** The variable name (e.g., `FIREBASE_SERVICE_ACCOUNT`)
     - **Value:** The value from your `.env` file
     - **Environment:** Select "Production", "Preview", and "Development" (or just "Production" if you prefer)

3. **Important for FIREBASE_SERVICE_ACCOUNT:**
   - Copy the entire JSON string from your `.env` file
   - Paste it as the value (it should be on one line)
   - Make sure there are no extra spaces or line breaks

4. **Redeploy:**
   - After adding all variables, trigger a new deployment
   - Or push a new commit to trigger automatic deployment

### For Other Platforms (Netlify, Railway, etc.):

1. **Find Environment Variables section** in your platform's dashboard
2. **Add each variable** from your `.env` file
3. **Redeploy** your application

## 📝 Quick Copy-Paste Checklist

Copy these variable names and add them to your production environment:

```
✅ OPENAI_API_KEY
✅ FIREBASE_SERVICE_ACCOUNT
✅ NEXT_PUBLIC_FIREBASE_API_KEY
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
✅ NEXT_PUBLIC_FIREBASE_APP_ID
✅ NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

## ⚠️ Important Notes

1. **FIREBASE_SERVICE_ACCOUNT Format:**
   - Must be a single-line JSON string
   - No line breaks or extra spaces
   - The entire JSON object as one string

2. **Security:**
   - Never commit `.env` file to Git (it's already in `.gitignore`)
   - Never expose environment variables in client-side code
   - Only `NEXT_PUBLIC_*` variables are safe for client-side use

3. **Testing:**
   - After deployment, test:
     - Order fetching: `/admin/orders/[orderId]`
     - AI chat functionality
     - Firebase operations

## 🔍 Verifying Deployment

After deploying, check:

1. **Server logs** should show:
   ```
   ✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT environment variable
   ✅ Firebase Admin services initialized successfully
   ```

2. **Test endpoints:**
   - Order API: Should work without credential errors
   - AI Chat: Should work with OpenAI API

3. **Client-side:**
   - Firebase client should initialize properly
   - No console errors about missing Firebase config

## 🐛 Troubleshooting

### "Firebase Admin not initialized" in production
- **Check:** `FIREBASE_SERVICE_ACCOUNT` is set correctly
- **Verify:** JSON is on one line with no formatting issues
- **Solution:** Copy the exact value from your `.env` file

### "Firebase client config not found"
- **Check:** All `NEXT_PUBLIC_FIREBASE_*` variables are set
- **Verify:** Variables are available in Production environment
- **Solution:** Make sure to select "Production" when adding variables

### "OpenAI API key not found"
- **Check:** `OPENAI_API_KEY` is set in production
- **Verify:** Key is valid and has credits
- **Solution:** Regenerate key if needed

## 📚 Additional Resources

- See `FIREBASE_CREDENTIALS_SETUP.md` for detailed Firebase setup
- See `QUICK_START_CREDENTIALS.md` for quick reference
- See `PRODUCTION_SETUP.md` for general production setup

---

**Your `.env` file is ready!** Just copy all the variables to your production platform's environment variables section. 🎉
