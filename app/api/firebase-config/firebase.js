// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Server environments must not import analytics; it is browser-only.
// https://firebase.google.com/docs/analytics/get-started?platform=web

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyDRwrNknRvSGRhMkw1R7LFl1eT2MDesT0o",
	authDomain: "menu-ai-7888e.firebaseapp.com",
	projectId: "menu-ai-7888e",
	storageBucket: "menu-ai-7888e.firebasestorage.app",
	messagingSenderId: "210487327318",
	appId: "1:210487327318:web:0d0904a9a4c9959db419f7",
	measurementId: "G-SVCP431RW4"
};

// Initialize Firebase (safe on server)
export const firebaseApp = initializeApp(firebaseConfig);
// Explicitly export the API key for server-side REST calls
export const firebaseApiKey = firebaseConfig.apiKey;