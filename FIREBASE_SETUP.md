# Firebase Admin SDK Setup Instructions

## Problem
The Firebase Admin SDK requires service account credentials to authenticate with Firestore on the server side.

## Solution
You need to provide Firebase service account credentials via environment variables.

## Steps to Get Your Service Account Key

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `menuai-d0ab5`

2. **Navigate to Service Accounts**
   - Go to Project Settings (gear icon) → Service Accounts tab
   - OR go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=menuai-d0ab5

3. **Generate a New Private Key**
   - Click on "Generate new private key" button
   - A JSON file will be downloaded (e.g., `menuai-d0ab5-xxxxx.json`)

4. **Set Up Environment Variables**

   **Option A: Using .env.local file (Recommended)**
   
   Create a `.env.local` file in the root of your project:
   ```bash
   # Copy the entire JSON content from the downloaded file and paste it as a single-line string
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"menuai-d0ab5",...}'
   ```
   
   To convert the JSON file to a single line:
   ```bash
   cat path/to/your-service-account-key.json | jq -c
   ```
   
   Then copy the output and paste it as the value of `FIREBASE_SERVICE_ACCOUNT` in `.env.local`.

   **Option B: Using GOOGLE_APPLICATION_CREDENTIALS**
   
   Set the path to your service account key file:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"
   ```
   
   Or add to `.env.local`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json
   ```

5. **Restart Your Next.js Dev Server**
   ```bash
   npm run dev
   ```

## Security Notes

- ⚠️ **NEVER commit your service account key to Git**
- The `.env.local` file is already in `.gitignore`
- Keep your service account key secure and never share it publicly
- If you accidentally commit it, rotate the key immediately in Firebase Console

## Verification

After setting up the credentials, try sending a message through your chat interface. The error should be resolved and messages should save to Firestore successfully.

