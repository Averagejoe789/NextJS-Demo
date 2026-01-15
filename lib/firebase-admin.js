// Server-side Firebase Admin configuration
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

let initialized = false;

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let credentialsFound = false;
    
    // Option 1: Try to use service account credentials from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || 'menu-ai-7888e',
          storageBucket: 'menu-ai-7888e.firebasestorage.app'
        });
        credentialsFound = true;
        console.log('✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT environment variable');
      } catch (parseError) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', parseError.message);
      }
    }
    
    // Option 2: Try to use GOOGLE_APPLICATION_CREDENTIALS if available
    if (!credentialsFound && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: 'menu-ai-7888e',
          storageBucket: 'menu-ai-7888e.firebasestorage.app'
        });
        credentialsFound = true;
        console.log('✅ Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS');
      } catch (credError) {
        console.error('❌ Error using GOOGLE_APPLICATION_CREDENTIALS:', credError.message);
      }
    }
    
    // Option 3: Try to load from local service-account-key.json file
    if (!credentialsFound) {
      try {
        const serviceAccountPath = join(process.cwd(), 'service-account-key.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || 'menu-ai-7888e',
          storageBucket: 'menu-ai-7888e.firebasestorage.app'
        });
        credentialsFound = true;
        console.log('✅ Firebase Admin initialized from service-account-key.json file');
      } catch (fileError) {
        // File doesn't exist or can't be read - that's okay, we'll try next option
        if (fileError.code !== 'ENOENT') {
          console.error('❌ Error reading service-account-key.json:', fileError.message);
        }
      }
    }
    
    // Option 4: Last resort - try application default credentials
    // WARNING: This is often a false positive - initializeApp() succeeds but Firestore fails
    // We'll try it but the error will be caught when Firestore is actually used
    if (!credentialsFound) {
      try {
        console.warn('⚠️ Attempting to use application default credentials (this may fail when actually using Firestore)');
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: 'menu-ai-7888e',
          storageBucket: 'menu-ai-7888e.firebasestorage.app'
        });
        // Mark as found, but note that this is tentative
        // Real validation happens when Firestore is used (will fail if credentials invalid)
        credentialsFound = true;
        console.warn('⚠️ Firebase Admin initialized with application default credentials');
        console.warn('   ⚠️ WARNING: Credentials will be validated when Firestore is first used.');
        console.warn('   ⚠️ If you see errors later, credentials are invalid - configure FIREBASE_SERVICE_ACCOUNT or service-account-key.json');
      } catch (defaultError) {
        // This is expected to fail if no credentials are configured
        console.error('❌ Error using application default credentials:', defaultError.message);
        credentialsFound = false;
      }
    }
    
    // Set initialized based on whether credentials were found
    initialized = credentialsFound;
    
    // If no credentials were found, log error but don't throw (allows app to start)
    if (!credentialsFound) {
      const errorMessage = 
        'Firebase Admin credentials not found. Please configure one of the following:\n' +
        '1. Set FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON\n' +
        '2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to your service account key file\n' +
        '3. Place service-account-key.json file in the project root\n' +
        '4. Configure Google Cloud SDK with application default credentials\n' +
        'See FIREBASE_SETUP.md for detailed instructions.';
      console.error('❌', errorMessage);
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    initialized = false;
    // Don't throw here - let it fail gracefully when adminDb is accessed
    // This allows the app to start even if Firebase Admin isn't configured
  }
} else {
  // Firebase is already initialized (probably by another file)
  // Try to access adminDb to verify it works
  try {
    admin.firestore();
    initialized = true;
    console.log('✅ Firebase Admin already initialized');
  } catch (error) {
    console.error('❌ Firebase Admin is initialized but cannot access Firestore:', error.message);
    initialized = false;
  }
}

// Export adminDb with error handling
let adminDb = null;
let adminStorage = null;
let adminAuth = null;

if (initialized) {
  try {
    // Try to access Firestore - this will actually validate credentials
    adminDb = admin.firestore();
    
    // Test that we can actually use it by trying a simple operation
    // Note: We can't use get() without async, but creating the instance validates credentials
    // The real validation happens when we try to use adminDb in the API routes
    
    adminStorage = admin.storage();
    adminAuth = admin.auth();
    
    console.log('✅ Firebase Admin services initialized successfully');
  } catch (error) {
    console.error('❌ Error accessing Firebase Admin services:', error.message);
    console.error('⚠️ This usually means credentials are invalid or not properly configured.');
    console.error('📖 Please check FIREBASE_SETUP.md for configuration instructions.');
    
    // Set to null so routes can check for !adminDb
    adminDb = null;
    adminStorage = null;
    adminAuth = null;
    initialized = false;
  }
} else {
  console.warn('⚠️ Firebase Admin is not initialized. Admin operations will fail. See FIREBASE_SETUP.md for configuration instructions.');
}

export { adminDb, adminStorage, adminAuth };
export default admin;

