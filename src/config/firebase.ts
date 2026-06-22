import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC8waGDF_XqRdJbQrs_PbHHhaoshXrjR5w',
  appId: '1:930972135321:ios:629e462eebe2b3f788ed08',
  messagingSenderId: '930972135321',
  projectId: 'mulist-sionuu',
  storageBucket: 'mulist-sionuu.firebasestorage.app',
} as const;

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);

if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? '127.0.0.1';
  connectAuthEmulator(firebaseAuth, `http://${host}:9099`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(firestore, host, 8080);
  connectStorageEmulator(firebaseStorage, host, 9199);
}
