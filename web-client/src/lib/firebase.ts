'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyD05naA_3HPxZ17Qi7b9mqAhpA6UZ0O5DE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'mulist-sionuu.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'mulist-sionuu',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'mulist-sionuu.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '930972135321',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:930972135321:web:05d1b6c021dd626f88ed08',
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && !(globalThis as { __mulistEmulators?: boolean }).__mulistEmulators) {
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST ?? '127.0.0.1';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings:true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  (globalThis as { __mulistEmulators?: boolean }).__mulistEmulators = true;
}
