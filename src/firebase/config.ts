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

// Default config from env if available
const envConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export function getSavedFirebaseConfig(): FirebaseConfig | null {
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

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
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
