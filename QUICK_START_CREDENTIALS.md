# Quick Start: Firebase Admin Credentials Setup

## 🎯 Your Project Information
- **Firebase Project ID:** `menu-ai-7888e`
- **Storage Bucket:** `menu-ai-7888e.firebasestorage.app`

## ⚡ Quick Setup (Choose ONE method)

### Method 1: Use service-account-key.json File (⭐ EASIEST)

**Step 1:** Get the service account key
1. Go to: https://console.firebase.google.com/project/menu-ai-7888e/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Click "Generate key"
4. A JSON file will download

**Step 2:** Place the file
1. Move the downloaded file to: `d:\hotel-project\NextJS-Demo\service-account-key.json`
2. Rename it to exactly: `service-account-key.json`
3. Make sure it's in `.gitignore` (it should be already)

**Step 3:** Restart your server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

**Done!** ✅ The code will automatically find and use this file.

---

### Method 2: Use .env.local File (Recommended for development)

**Step 1:** Get the service account key
- Same as Method 1, Step 1

**Step 2:** Convert to single line
1. Open the downloaded JSON file
2. Copy ALL the content (Ctrl+A, Ctrl+C)
3. Remove all line breaks (or use an online JSON minifier)
4. Or use PowerShell:
   ```powershell
   (Get-Content "C:\path\to\downloaded-file.json" -Raw) -replace "`r`n","" | Set-Clipboard
   ```

**Step 3:** Create .env.local
1. Create a file: `d:\hotel-project\NextJS-Demo\.env.local`
2. Add this line (replace with your actual JSON):
   ```bash
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"menu-ai-7888e",...}'
   ```
   Make sure the entire JSON is on ONE line inside single quotes.

**Step 4:** Restart your server
```bash
npm run dev
```

**Done!** ✅

---

## 📋 What Information You Need From Firebase

The service account JSON file contains everything you need:
- ✅ Project ID (already in your code: `menu-ai-7888e`)
- ✅ Private key (for authentication)
- ✅ Service account email
- ✅ Client ID
- ✅ All OAuth endpoints

**You don't need to manually extract anything** - the entire JSON file has everything!

---

## 🔍 How to Verify It's Working

1. **Check server console** - You should see:
   ```
   ✅ Firebase Admin initialized from service-account-key.json file
   ✅ Firebase Admin services initialized successfully
   ```

2. **Test the order page:**
   - Navigate to: `http://localhost:3000/admin/orders/[any-order-id]`
   - It should load without credential errors

3. **If you see errors:**
   - Make sure you restarted the dev server
   - Check that the file path is correct
   - Verify the JSON file isn't corrupted

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Could not load the default credentials" | Make sure the service account key file is in the correct location |
| "service-account-key.json not found" | Check the file is at: `d:\hotel-project\NextJS-Demo\service-account-key.json` |
| "FIREBASE_SERVICE_ACCOUNT is not valid JSON" | Make sure the JSON in `.env.local` is on one line with no line breaks |
| "Permission denied" | Make sure your service account has Editor or Owner role in Firebase Console |

---

## 📖 Detailed Instructions

For more detailed step-by-step instructions with screenshots, see:
- `FIREBASE_CREDENTIALS_SETUP.md` - Complete guide
- `FIREBASE_SETUP.md` - Original setup documentation

---

## ✅ What Happens After Setup

Once credentials are configured:
- ✅ Order fetching will work
- ✅ Admin operations will function
- ✅ API routes can access Firestore
- ✅ No more credential errors!

**That's it!** Choose the method that works best for you and you're all set! 🎉
