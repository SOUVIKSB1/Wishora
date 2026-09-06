import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, UserCredential } from 'firebase/auth';

// Firebase web configuration using Vite env vars with fallback to configured project keys
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyD0i2lQvAaUmid5qb4n3xUd0uNDACI1xfo',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'wishora-ea7db.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'wishora-ea7db',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'wishora-ea7db.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '535942142332',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:535942142332:web:b12e52c71c792a15a1ecf9',
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || 'G-3BQQ5BLL9X',
};

// Initialize Firebase App singleton safely
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
