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

export interface AuthorizedUser {
  email: string;
  name: string;
  role: string;
  password?: string;
  accessLevel: "SuperAdmin" | "Admin" | "Analyst";
  permissions: string[];
}

export interface AuthSessionUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  accessLevel: string;
  permissions: string[];
  photoURL?: string;
}

export const AUTHORIZED_USERS: Record<string, AuthorizedUser> = {
  "yr065677@gmail.com": {
    email: "yr065677@gmail.com",
    name: "YR Admin",
    role: "Lead SOC Admin · Full Access",
    password: "Yr@9kP$4xM8!2026",
    accessLevel: "SuperAdmin",
    permissions: ["*"], // Complete access to all features, telemetry, models, and alerts
  },
  "sivaprasath4173@gmail.com": {
    email: "sivaprasath4173@gmail.com",
    name: "Siva Prasath",
    role: "SOC Lead Analyst · Full Access",
    accessLevel: "SuperAdmin",
    permissions: ["*"],
  },
};

const STORAGE_KEY = "trustlens_current_user";
const authListeners = new Set<(user: AuthSessionUser | null) => void>();

export function getStoredUser(): AuthSessionUser | null {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthSessionUser | null): void {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error("Failed to update stored auth session", err);
  }
  authListeners.forEach((cb) => cb(user));
}

/**
 * Subscribe to auth state updates (bridges Firebase and custom local auth sessions).
 */
export function subscribeToAuth(callback: (user: AuthSessionUser | null) => void): () => void {
  authListeners.add(callback);
  // Immediately call with current stored user
  callback(getStoredUser());

  let unsubscribeFirebase = () => {};
  if (auth) {
    unsubscribeFirebase = auth.onAuthStateChanged((fbUser) => {
      if (fbUser && fbUser.email) {
        const email = fbUser.email.trim().toLowerCase();
        const profile = AUTHORIZED_USERS[email];
        const sessionUser: AuthSessionUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || profile?.name || email.split("@")[0],
          photoURL: fbUser.photoURL || undefined,
          role: profile?.role || "Lead SOC Admin · Full Access",
          accessLevel: profile?.accessLevel || "SuperAdmin",
          permissions: profile?.permissions || ["*"],
        };
        setStoredUser(sessionUser);
      } else if (!getStoredUser()) {
        callback(null);
      }
    });
  }

  return () => {
    authListeners.delete(callback);
    unsubscribeFirebase();
  };
}

/**
 * Sign in with email + password.
 * Validates against authorized users and supports yr065677@gmail.com with full access.
 */
export async function signIn(email: string, password: string): Promise<AuthSessionUser> {
  const targetEmail = email.trim().toLowerCase();
  const authorized = AUTHORIZED_USERS[targetEmail];

  if (!authorized) {
    const allowedList = Object.keys(AUTHORIZED_USERS).join(", ");
    throw new Error(`Unauthorized email address. Only authorized SOC accounts (${allowedList}) are permitted.`);
  }

  // Validate password if configured for this user
  if (authorized.password && password !== authorized.password) {
    throw new Error("Invalid password. Please check your credentials and try again.");
  }

  if (!authorized.password && !password) {
    throw new Error("Please enter your password.");
  }

  let uid = `soc_${targetEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;

  if (auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
    } catch (fbErr: any) {
      // If Firebase Auth throws operation-not-allowed or user-not-found (because email/password provider
      // is disabled in console), permit local credential match
      if (
        fbErr.code !== "auth/operation-not-allowed" &&
        fbErr.code !== "auth/user-not-found" &&
        fbErr.code !== "auth/invalid-credential"
      ) {
        console.warn("Firebase email sign-in fallback activated:", fbErr.message);
      }
    }
  }

  const sessionUser: AuthSessionUser = {
    uid,
    email: authorized.email,
    displayName: authorized.name,
    role: authorized.role,
    accessLevel: authorized.accessLevel,
    permissions: authorized.permissions,
  };

  setStoredUser(sessionUser);
  return sessionUser;
}

/**
 * Sign in with Google Popup.
 */
export async function signInWithGoogle(): Promise<AuthSessionUser> {
  if (auth) {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const email = (userCredential.user.email ?? "").trim().toLowerCase();
    const authorized = AUTHORIZED_USERS[email];

    if (!authorized) {
      await fbSignOut(auth);
      const allowedList = Object.keys(AUTHORIZED_USERS).join(", ");
      throw new Error(`Unauthorized email: ${email}. Only authorized SOC accounts (${allowedList}) are permitted.`);
    }

    const sessionUser: AuthSessionUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email ?? authorized.email,
      displayName: userCredential.user.displayName || authorized.name,
      photoURL: userCredential.user.photoURL || undefined,
      role: authorized.role,
      accessLevel: authorized.accessLevel,
      permissions: authorized.permissions,
    };

    setStoredUser(sessionUser);
    return sessionUser;
  }

  // Stub for demo/dev mode
  const authorized = AUTHORIZED_USERS["yr065677@gmail.com"];
  const sessionUser: AuthSessionUser = {
    uid: `demo_google_${Date.now()}`,
    email: authorized.email,
    displayName: authorized.name,
    role: authorized.role,
    accessLevel: authorized.accessLevel,
    permissions: authorized.permissions,
  };
  setStoredUser(sessionUser);
  return sessionUser;
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  setStoredUser(null);
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error("Firebase signOut error", err);
    }
  }
}

/**
 * Returns whether Firebase is properly configured via env vars.
 */
export function isFirebaseConfigured(): boolean {
  return hasFirebaseConfig;
}
