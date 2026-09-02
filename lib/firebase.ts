import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Tenta obter as variáveis com prefixo NEXT_PUBLIC_ (exigido pelo Next.js no navegador)
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey: apiKey || 'demo-key',
  authDomain: authDomain || 'demo-project.firebaseapp.com',
  projectId: projectId || 'demo-project',
  storageBucket: storageBucket || 'demo-project.appspot.com',
  messagingSenderId: messagingSenderId || '123456789',
  appId: appId || '1:123456789:web:abcdef',
};

// Verifica se há credenciais válidas configuradas
export const isFirebaseConfigured = Boolean(
  projectId && projectId !== 'demo-project'
);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
