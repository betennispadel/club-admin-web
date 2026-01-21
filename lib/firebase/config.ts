import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD-veeTPZJ0uHJ6USoaZS6Yspw52yYRrZo",
  authDomain: "reservations-mvp-version.firebaseapp.com",
  projectId: "reservations-mvp-version",
  storageBucket: "reservations-mvp-version.firebasestorage.app",
  messagingSenderId: "673196880853",
  appId: "1:673196880853:web:7a34f0cf9eab02ba57c35c",
  measurementId: "G-EJNSW4B9FD"
};

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Secondary app for creating users without signing out current admin
const secondaryApp = getApps().find(a => a.name === 'secondary')
  || initializeApp(firebaseConfig, 'secondary');

export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const functions = getFunctions(app);
export const storage = getStorage(app);

export default app;
