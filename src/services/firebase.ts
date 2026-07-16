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

// import { initializeApp } from "firebase/app";
// import { getAuth, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// };

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);

/**
 * Sign in with email + password.
 * Replace with real Firebase call once credentials are configured.
 */
export async function signIn(email: string, _password: string): Promise<{ uid: string; email: string }> {
  // Stub: accept any credentials for demo mode.
  return { uid: `demo_${Date.now()}`, email };
}

/**
 * Sign out the current user.
 * Replace with real Firebase call once credentials are configured.
 */
export async function signOut(): Promise<void> {
  // Stub: no-op in demo mode.
}

/**
 * Returns whether Firebase is properly configured via env vars.
 */
export function isFirebaseConfigured(): boolean {
  return false; // flip to true after adding env vars + uncommenting init block
}
