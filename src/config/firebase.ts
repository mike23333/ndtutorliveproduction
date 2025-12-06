/**
 * Firebase Configuration and Initialization
 *
 * Required environment variables (.env):
 * VITE_FIREBASE_API_KEY=your_api_key
 * VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=your_project_id
 * VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
 * VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * VITE_FIREBASE_APP_ID=your_app_id
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validate configuration
const validateConfig = (): boolean => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
  );

  if (missingKeys.length > 0) {
    console.error(
      `Missing Firebase configuration keys: ${missingKeys.join(', ')}`
    );
    console.error('Please ensure all VITE_FIREBASE_* environment variables are set');
    return false;
  }

  return true;
};

// Initialize Firebase only if config is valid
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (validateConfig()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Use the named database - try both ways
    db = getFirestore(app);
    storage = getStorage(app);

    console.log('Firebase initialized successfully');
  } else {
    console.warn('Firebase not initialized due to missing configuration');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Export Firebase instances
export { app, auth, db, storage };

// Export configuration status
export const isFirebaseConfigured = (): boolean => {
  return app !== null && auth !== null && db !== null;
};
