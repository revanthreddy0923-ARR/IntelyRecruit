import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBTmhqGVRf3QPVBfCpUgcbP7u3r5BA2zc4",
  authDomain: "nice-compass-898sv.firebaseapp.com",
  projectId: "nice-compass-898sv",
  storageBucket: "nice-compass-898sv.firebasestorage.app",
  messagingSenderId: "149227208978",
  appId: "1:149227208978:web:395c4da3528f518df1b3cb"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Connect to Cloud Firestore instance
let db: ReturnType<typeof getFirestore>;
const FIRESTORE_DB_ID = "ai-studio-8b7a6edd-e115-48fd-abf3-8871371356c5";

try {
  db = getFirestore(app, FIRESTORE_DB_ID);
} catch (err) {
  console.warn(`[Firestore Init Warning] Could not connect to database "${FIRESTORE_DB_ID}", falling back to default instance:`, err);
  db = getFirestore(app);
}

export { app, auth, db };
export default app;
