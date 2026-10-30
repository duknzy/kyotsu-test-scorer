import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEY_FIREBASE_CONFIG = 'kyotsu_nav_firebase_custom_config_v1';

// Pre-configured official project credentials for kyotsu-scorer-duknzy
const defaultProjectConfig: FirebaseConfig = {
  apiKey: "AIzaSyDtaCLxMbUCoBrYB0jruqStu68yzZLVLlc",
  authDomain: "kyotsu-scorer-duknzy.firebaseapp.com",
  projectId: "kyotsu-scorer-duknzy",
  storageBucket: "kyotsu-scorer-duknzy.firebasestorage.app",
  messagingSenderId: "209552579670",
  appId: "1:209552579670:web:b006b6c2f360f6efd1eff7",
};

// Fallback to env config if provided
const envConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultProjectConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultProjectConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultProjectConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultProjectConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultProjectConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultProjectConfig.appId,
};

export function getSavedFirebaseConfig(): FirebaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed as FirebaseConfig;
      }
    }
  } catch (e) {
    console.error('Failed to read saved Firebase config:', e);
  }

  return envConfig;
}

export function saveFirebaseConfig(config: FirebaseConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
    window.location.reload();
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
  }
}

export function clearFirebaseConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    window.location.reload();
  } catch (e) {
    console.error('Failed to clear Firebase config:', e);
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const activeConfig = getSavedFirebaseConfig();

if (activeConfig && activeConfig.apiKey && activeConfig.projectId) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

export { app, auth, db };
export const isFirebaseConfigured = !!(activeConfig && activeConfig.apiKey && activeConfig.projectId && auth && db);
