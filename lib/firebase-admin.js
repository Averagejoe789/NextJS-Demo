// Server-side Firebase Admin configuration
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to use service account credentials from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      // Parse the JSON string from environment variable
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'menuai-d0ab5',
        storageBucket: 'menuai-d0ab5.firebasestorage.app'
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use the path to service account key file
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'menuai-d0ab5',
        storageBucket: 'menuai-d0ab5.firebasestorage.app'
      });
    } else {
      // Fallback: try to use application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'menuai-d0ab5',
        storageBucket: 'menuai-d0ab5.firebasestorage.app'
      });
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw new Error('Failed to initialize Firebase Admin SDK. Please check your credentials configuration.');
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminAuth = admin.auth();
export default admin;

