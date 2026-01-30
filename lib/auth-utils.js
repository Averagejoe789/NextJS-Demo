// Authentication utilities for restaurant owners
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase-client';

/**
 * Sign up a new restaurant owner
 */
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign in an existing restaurant owner
 */
export async function signIn(email, password) {
  try {
    console.log('Firebase signIn called with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase signIn successful:', userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Firebase signIn error:', error.code, error.message);
    // Provide user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please sign up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Sign in or sign up with Google
 * Works for both new users (sign up) and existing users (sign in)
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { success: true, user: userCredential.user };
  } catch (error) {
    let errorMessage = error.message;
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in was cancelled.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup was blocked. Please allow popups and try again.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Sign-in was cancelled.';
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Sign out the current user
 */
export async function logOut() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Default restaurant ID - all users will use this restaurant
 */
export const DEFAULT_RESTAURANT_ID = 'sample-restaurant-001';

/**
 * Get the current authenticated user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Get the restaurant ID for the current user
 * Uses the user's UID as restaurant ID when authenticated; falls back to default for demo
 */
export function getRestaurantId() {
  const user = getCurrentUser();
  return user?.uid || DEFAULT_RESTAURANT_ID;
}

/**
 * Listen to authentication state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}







