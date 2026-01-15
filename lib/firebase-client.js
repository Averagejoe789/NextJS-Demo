// Client-side Firebase configuration for Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDRwrNknRvSGRhMkw1R7LFl1eT2MDesT0o",
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "menu-ai-7888e.firebaseapp.com",
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "menu-ai-7888e",
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "menu-ai-7888e.firebasestorage.app",
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "210487327318",
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:210487327318:web:0d0904a9a4c9959db419f7",
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SVCP431RW4"
};

// Initialize Firebase (client-side only)
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication
// Note: CONFIGURATION_NOT_FOUND error may appear if Firebase Auth is not enabled
// in Firebase Console. This is harmless if authentication is bypassed.
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

