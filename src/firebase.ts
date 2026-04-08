import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import localConfig from './firebase-applet-config.json';

// NOTE: Automatic Firebase setup failed. 
// Please provide your own Firebase configuration here or in firebase-applet-config.json.
// You can get these values from the Firebase Console (Settings > Project Settings).

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Use localConfig if it's not the placeholder
const config = localConfig.apiKey !== "TODO_KEYHERE" ? localConfig : firebaseConfig;

export const isFirebaseConfigured = config.apiKey !== "YOUR_API_KEY" && config.apiKey !== "TODO_KEYHERE";

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
