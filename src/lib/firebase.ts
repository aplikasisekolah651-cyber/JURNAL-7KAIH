import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

let firebaseApp;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  // Try loading from config json if available
  const config = {
    projectId: "gen-lang-client-0840024627",
    appId: "1:63555815050:web:a44c0aaa90eefe53bc4f73",
    apiKey: "AIzaSyAEczPQ7sn2f_G4QxV4On9ot8N4sS7aNws",
    authDomain: "gen-lang-client-0840024627.firebaseapp.com",
    firestoreDatabaseId: "ai-studio-9cc42502-4cbb-4188-9c00-2efcfbb775f7",
    storageBucket: "gen-lang-client-0840024627.firebasestorage.app",
    messagingSenderId: "63555815050"
  };

  if (!getApps().length) {
    firebaseApp = initializeApp(config);
  } else {
    firebaseApp = getApp();
  }

  // Use configured database ID or default
  db = getFirestore(firebaseApp, config.firestoreDatabaseId || '(default)');
  auth = getAuth(firebaseApp);
} catch (error) {
  console.warn('Firebase initialization notice:', error);
}

export { db, auth, firebaseApp };
