// Authentication utilities for restaurant owners
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
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
 * Get the current authenticated user
 * TEMPORARY: Returns mock user when auth is bypassed
 */
export function getCurrentUser() {
  // TEMPORARY: Bypass auth - return mock user
  return { uid: 'temp-user', email: 'test@example.com' };
  
  // Original code (commented out for now)
  // return auth.currentUser;
}

/**
 * Listen to authentication state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

