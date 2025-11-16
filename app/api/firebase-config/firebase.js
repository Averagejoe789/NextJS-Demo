// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Server environments must not import analytics; it is browser-only.
// https://firebase.google.com/docs/analytics/get-started?platform=web

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyBfy2x5ZX7MpreSQOGe-oedHqJdjpi6kWw",
	authDomain: "menuai-d0ab5.firebaseapp.com",
	projectId: "menuai-d0ab5",
	storageBucket: "menuai-d0ab5.firebasestorage.app",
	messagingSenderId: "1014406042856",
	appId: "1:1014406042856:web:3fe7bcc7bb9da67f52255d",
	measurementId: "G-JCXTV1QMNW"
};

// Initialize Firebase (safe on server)
export const firebaseApp = initializeApp(firebaseConfig);
// Explicitly export the API key for server-side REST calls
export const firebaseApiKey = firebaseConfig.apiKey;