# Scripts

## Create Sample Restaurant

There are multiple ways to create the sample restaurant:

### Option 1: Use the Web Interface (Easiest)

1. Visit: `http://localhost:3000/admin/init`
2. Click "Create Sample Restaurant" button
3. Wait for completion

### Option 2: Use Browser Console Script

1. Open `http://localhost:3000` in your browser
2. Open browser console (F12 or Cmd+Option+I)
3. Copy the contents of `scripts/create-restaurant-client.js`
4. Paste into console and press Enter

### Option 3: Use Node.js Script (Requires Firebase Admin Credentials)

**Prerequisites:**
- Firebase Admin service account credentials

**Setup Firebase Admin credentials (choose one):**

1. **Environment Variable (Recommended):**
   ```bash
   export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"menuai-d0ab5",...}'
   ```

2. **Service Account File:**
   - Download service account key from Firebase Console
   - Save as `service-account-key.json` in project root
   - Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable to file path

3. **Run the script:**
   ```bash
   npm run create-restaurant
   ```
   or
   ```bash
   node scripts/create-restaurant.js
   ```

**What gets created:**
- Restaurant: Pizza Palace (ID: `sample-restaurant-001`)
- 6 Menu items (Pizzas, Salads, Appetizers, Desserts, Pasta)
- 5 Tables (Table 1-5)

**Note:** The script will check if the restaurant already exists and skip creation if it does.

