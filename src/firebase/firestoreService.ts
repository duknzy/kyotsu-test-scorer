import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { MockExamSession, TargetUniversity } from '../types';

export async function saveExamSessionToFirestore(userId: string, session: MockExamSession): Promise<void> {
  if (!db || !userId) return;
  const sessionDocRef = doc(db, 'users', userId, 'sessions', session.id);
  await setDoc(sessionDocRef, {
    ...session,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExamSessionFromFirestore(userId: string, sessionId: string): Promise<void> {
  if (!db || !userId) return;
  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  await deleteDoc(sessionDocRef);
}

export async function saveUniversityToFirestore(userId: string, uni: TargetUniversity): Promise<void> {
  if (!db || !userId) return;
  const uniDocRef = doc(db, 'users', userId, 'universities', uni.id);
  await setDoc(uniDocRef, {
    ...uni,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUniversityFromFirestore(userId: string, uniId: string): Promise<void> {
  if (!db || !userId) return;
  const uniDocRef = doc(db, 'users', userId, 'universities', uniId);
  await deleteDoc(uniDocRef);
}

export async function fetchUserDataFromFirestore(userId: string): Promise<{
  sessions: MockExamSession[];
  universities: TargetUniversity[];
}> {
  if (!db || !userId) return { sessions: [], universities: [] };

  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const uniRef = collection(db, 'users', userId, 'universities');

  const [sessionsSnap, uniSnap] = await Promise.all([
    getDocs(sessionsRef),
    getDocs(uniRef),
  ]);

  const sessions: MockExamSession[] = [];
  sessionsSnap.forEach((d) => {
    sessions.push(d.data() as MockExamSession);
  });

  const universities: TargetUniversity[] = [];
  uniSnap.forEach((d) => {
    universities.push(d.data() as TargetUniversity);
  });

  return { sessions, universities };
}

export async function syncLocalDataToFirestore(
  userId: string,
  localSessions: MockExamSession[],
  localUniversities: TargetUniversity[]
): Promise<void> {
  if (!db || !userId) return;
  const batch = writeBatch(db);

  for (const sess of localSessions) {
    const sRef = doc(db, 'users', userId, 'sessions', sess.id);
    batch.set(sRef, {
      ...sess,
      updatedAt: serverTimestamp(),
    });
  }

  for (const uni of localUniversities) {
    const uRef = doc(db, 'users', userId, 'universities', uni.id);
    batch.set(uRef, {
      ...uni,
      updatedAt: serverTimestamp(),
    });
  }

  // Ensure user profile document exists
  const userRef = doc(db, 'users', userId);
  batch.set(
    userRef,
    {
      uid: userId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

export function subscribeFirestoreData(
  userId: string,
  onUpdate: (data: { sessions: MockExamSession[]; universities: TargetUniversity[] }) => void
): () => void {
  if (!db || !userId) return () => {};

  let currentSessions: MockExamSession[] = [];
  let currentUniversities: TargetUniversity[] = [];

  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const uniRef = collection(db, 'users', userId, 'universities');

  const unsubSessions = onSnapshot(sessionsRef, (snapshot) => {
    currentSessions = snapshot.docs.map((d) => d.data() as MockExamSession);
    onUpdate({ sessions: currentSessions, universities: currentUniversities });
  }, (err) => console.warn('Sessions snapshot error:', err));

  const unsubUni = onSnapshot(uniRef, (snapshot) => {
    currentUniversities = snapshot.docs.map((d) => d.data() as TargetUniversity);
    onUpdate({ sessions: currentSessions, universities: currentUniversities });
  }, (err) => console.warn('Universities snapshot error:', err));

  return () => {
    unsubSessions();
    unsubUni();
  };
}

