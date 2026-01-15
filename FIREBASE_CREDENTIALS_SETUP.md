# Firebase Admin Credentials Setup Guide

## Step-by-Step Instructions

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Sign in with your Google account
3. Select your Firebase project (or create a new one if needed)

### Step 2: Navigate to Service Accounts
You have two ways to get there:

**Method A: Through Firebase Console**
1. Click the gear icon (⚙️) next to "Project Overview" in the left sidebar
2. Click "Project settings"
3. Click on the "Service accounts" tab at the top

**Method B: Direct Link**
1. Go directly to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Make sure you select your Firebase project at the top

### Step 3: Generate Service Account Key
1. You should see a list of service accounts
2. Look for one that says "App Engine default service account" or create a new one:
   - Click "+ CREATE SERVICE ACCOUNT" (if no service account exists)
   - Give it a name (e.g., "nextjs-admin")
   - Click "CREATE AND CONTINUE"
   - Skip the optional steps and click "DONE"
3. Click on the service account you want to use
4. Go to the "KEYS" tab
5. Click "+ ADD KEY" → "Create new key"
6. Select "JSON" as the key type
7. Click "CREATE"
8. A JSON file will automatically download to your computer

**⚠️ IMPORTANT:** 
- Keep this file secure! Never commit it to Git or share it publicly
- If you accidentally commit it, delete it immediately and rotate the key

### Step 4: Configure Your Project

You have **3 options** - choose the one that works best for you:

#### **Option A: Use Environment Variable (Recommended for Development)**

1. Open the downloaded JSON file in a text editor (e.g., Notepad, VS Code)
2. Copy the **entire content** of the JSON file (everything from `{` to `}`)
3. In your project root (`d:\hotel-project\NextJS-Demo\`), create a file named `.env.local`
4. Add this line to `.env.local`:
   ```bash
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
   ```
   
   **Important Notes:**
   - The entire JSON must be on ONE line
   - Remove all line breaks and formatting
   - Make sure there are no extra spaces
   - The JSON should be wrapped in single quotes
   
   **Example of what it looks like:**
   ```bash
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"menu-ai-7888e","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@menu-ai-7888e.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}'
   ```

5. **Tip:** If you want to convert the JSON file to a single line, you can:
   - Use a JSON formatter online to compress it
   - Or use this PowerShell command (Windows):
     ```powershell
     (Get-Content "path\to\your-service-account-key.json" -Raw) -replace "`r`n","" | Out-File "single-line.json"
     ```
   - Then copy the content and wrap it in quotes

#### **Option B: Use service-account-key.json File (Easiest)**

1. Copy the downloaded JSON file to your project root directory:
   - Location: `d:\hotel-project\NextJS-Demo\service-account-key.json`
   
2. **IMPORTANT:** Make sure this file is in `.gitignore`:
   - Open `.gitignore` in your project root
   - If it doesn't exist, create it
   - Add this line:
     ```
     service-account-key.json
     .env.local
     ```

3. That's it! The code will automatically find and use this file.

#### **Option C: Use GOOGLE_APPLICATION_CREDENTIALS Environment Variable**

1. Copy the downloaded JSON file to a secure location on your computer
   - Example: `C:\Users\YourName\.credentials\firebase-service-account.json`
   
2. Set the environment variable:
   
   **Windows (PowerShell):**
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\YourName\.credentials\firebase-service-account.json"
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set GOOGLE_APPLICATION_CREDENTIALS=C:\Users\YourName\.credentials\firebase-service-account.json
   ```
   
   **To make it permanent (Windows):**
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "User variables", click "New"
   - Variable name: `GOOGLE_APPLICATION_CREDENTIALS`
   - Variable value: Full path to your JSON file
   - Click OK

   **For Next.js specifically, add to `.env.local`:**
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=C:\Users\YourName\.credentials\firebase-service-account.json
   ```

### Step 5: Verify Your Setup

1. Restart your Next.js development server:
   ```bash
   # Stop the server (Ctrl+C)
   # Then start it again
   npm run dev
   ```

2. Check the console output. You should see one of these messages:
   - ✅ `Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT environment variable`
   - ✅ `Firebase Admin initialized from service-account-key.json file`
   - ✅ `Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS`
   - ✅ `Firebase Admin services initialized successfully`

3. Test by navigating to an order detail page:
   - Go to: `http://localhost:3000/admin/orders/[any-order-id]`
   - It should load without the credentials error

## What Information the Code Needs

The Firebase Admin SDK needs these pieces of information from your service account JSON:

1. **project_id** - Your Firebase project ID (e.g., "menu-ai-7888e")
2. **private_key** - The private key for authentication
3. **client_email** - The service account email (usually looks like: `firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com`)
4. **client_id** - Unique identifier for the service account
5. **auth_uri** and **token_uri** - OAuth endpoints (usually standard Google URLs)

All of this information is contained in the JSON file you download.

## Security Best Practices

1. ✅ **DO:**
   - Keep your service account key file secure
   - Add it to `.gitignore`
   - Use environment variables in production
   - Rotate keys if they're ever exposed

2. ❌ **DON'T:**
   - Commit service account keys to Git
   - Share keys publicly
   - Use the same key in development and production
   - Leave keys in public folders

## Troubleshooting

### Error: "Could not load the default credentials"
- **Cause:** Service account key not found or invalid
- **Solution:** Make sure you've completed Step 4 and restarted your dev server

### Error: "FIREBASE_SERVICE_ACCOUNT is not a valid JSON"
- **Cause:** The JSON in your `.env.local` file has formatting issues
- **Solution:** Make sure it's all on one line with no extra spaces or line breaks

### Error: "service-account-key.json not found"
- **Cause:** File is in the wrong location or named incorrectly
- **Solution:** Make sure the file is exactly at: `d:\hotel-project\NextJS-Demo\service-account-key.json`

### Still having issues?
1. Check that your service account has the correct permissions in Firebase Console
2. Verify your Firebase project ID matches (`menu-ai-7888e`)
3. Make sure you restarted the dev server after adding credentials
4. Check the server console for any error messages

## Next Steps

Once credentials are configured:
1. Your API routes will be able to access Firestore
2. Order fetching should work
3. Admin operations should function properly

If you need help, check the server console logs for specific error messages!
