/**
 * Firebase Config + Auth
 *
 * To enable:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Add the config values below to your .env file:
 *      VITE_FIREBASE_API_KEY=...
 *      VITE_FIREBASE_AUTH_DOMAIN=...
 *      VITE_FIREBASE_PROJECT_ID=...
 *      VITE_FIREBASE_APP_ID=...
 * 3. Uncomment the initialization block below.
 * 4. Replace the mock `signIn` / `signOut` stubs with real Firebase calls.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut as fbSignOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const hasFirebaseConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Initialize Firebase only if config is present
const app = hasFirebaseConfig
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth = app ? getAuth(app) : null;

const ALLOWED_EMAIL = "sivaprasath4173@gmail.com";

/**
 * Sign in with email + password.
 * Uses Firebase when configuration is present, falls back to demo stub otherwise.
 */
export async function signIn(email: string, password: string): Promise<{ uid: string; email: string }> {
  const targetEmail = email.trim().toLowerCase();
  if (targetEmail !== ALLOWED_EMAIL) {
    throw new Error(`Unauthorized email address. Only ${ALLOWED_EMAIL} is allowed to log in.`);
  }

  if (auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email ?? email,
    };
  }
  // Stub: accept credentials for demo mode.
  return { uid: `demo_${Date.now()}`, email };
}

/**
 * Sign in with Google Popup.
 */
export async function signInWithGoogle(): Promise<{ uid: string; email: string }> {
  if (auth) {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const email = userCredential.user.email ?? "";

    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
      await fbSignOut(auth);
      throw new Error(`Unauthorized email: ${email}. Only ${ALLOWED_EMAIL} is allowed to log in.`);
    }

    return {
      uid: userCredential.user.uid,
      email,
    };
  }
  // Stub for demo/dev mode
  return { uid: `demo_google_${Date.now()}`, email: ALLOWED_EMAIL };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
}

/**
 * Returns whether Firebase is properly configured via env vars.
 */
export function isFirebaseConfigured(): boolean {
  return hasFirebaseConfig;
}
