// Client-side Firebase configuration for Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: "AIzaSyBfy2x5ZX7MpreSQOGe-oedHqJdjpi6kWw",
	authDomain: "menuai-d0ab5.firebaseapp.com",
	projectId: "menuai-d0ab5",
	storageBucket: "menuai-d0ab5.firebasestorage.app",
	messagingSenderId: "1014406042856",
	appId: "1:1014406042856:web:3fe7bcc7bb9da67f52255d",
	measurementId: "G-JCXTV1QMNW"
};

// Initialize Firebase (client-side only)
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

