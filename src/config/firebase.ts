import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyC8waGDF_XqRdJbQrs_PbHHhaoshXrjR5w',
  appId: '1:930972135321:ios:629e462eebe2b3f788ed08',
  messagingSenderId: '930972135321',
  projectId: 'mulist-sionuu',
  storageBucket: 'mulist-sionuu.firebasestorage.app',
} as const;

const existingApp = getApps().length > 0;
export const firebaseApp = existingApp
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth = existingApp
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
export const firestore = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);
export const firebaseFunctions = getFunctions(firebaseApp, 'asia-northeast3');

if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? '127.0.0.1';
  connectAuthEmulator(firebaseAuth, `http://${host}:9099`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(firestore, host, 8080);
  connectStorageEmulator(firebaseStorage, host, 9199);
  connectFunctionsEmulator(firebaseFunctions, host, 5001);
}
