import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

export type AuthStateChangeCallback = (user: User | null) => void;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebaseが設定されていません');
  const res = await signInWithPopup(auth, googleProvider);
  return res.user;
}

export async function signupWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  if (!auth) throw new Error('Firebaseが設定されていません');
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && res.user) {
    try {
      await updateProfile(res.user, { displayName });
    } catch (e) {
      console.warn('Failed to set displayName:', e);
    }
  }
  return res.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error('Firebaseが設定されていません');
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return res.user;
}

export async function loginAnonymously(): Promise<User> {
  if (!auth) throw new Error('Firebaseが設定されていません');
  const res = await signInAnonymously(auth);
  return res.user;
}

export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebaseが設定されていません');
  await sendPasswordResetEmail(auth, email);
}

export async function logout(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function subscribeAuth(callback: AuthStateChangeCallback): () => void {
  if (!auth || !isFirebaseConfigured) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
