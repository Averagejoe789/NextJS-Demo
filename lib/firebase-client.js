// Client-side Firebase configuration for Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: "AIzaSyDRwrNknRvSGRhMkw1R7LFl1eT2MDesT0o",
	authDomain: "menu-ai-7888e.firebaseapp.com",
	projectId: "menu-ai-7888e",
	storageBucket: "menu-ai-7888e.firebasestorage.app",
	messagingSenderId: "210487327318",
	appId: "1:210487327318:web:0d0904a9a4c9959db419f7",
	measurementId: "G-SVCP431RW4"
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

