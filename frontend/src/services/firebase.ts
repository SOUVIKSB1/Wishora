import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, UserCredential } from 'firebase/auth';

// Firebase web configuration strictly loaded from environment variables
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase App singleton safely (only when apiKey is present)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request profile info including birthday if authorized by Google scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}> {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Director',
      photoURL: user.photoURL || '',
    };
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    // If popup was closed by user
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    }
    // If invalid API key / demo key in preview environment
    if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid' || error.message?.includes('API key')) {
      throw new Error('Firebase API Key not configured yet. Please configure your Firebase credentials or register with email.');
    }
    throw error;
  }
}

/**
 * Sign out of Firebase session
 */
export async function logOutOfFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Firebase signout warning:', err);
  }
}
