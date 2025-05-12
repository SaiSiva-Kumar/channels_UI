// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDajoXXWLlbxYrYw7P95JvmOFHbPAQrB30',
  authDomain: 'sign-in-or-sign-up-58b7f.firebaseapp.com',
  projectId: 'sign-in-or-sign-up-58b7f',
  storageBucket: 'sign-in-or-sign-up-58b7f.firebasestorage.app',
  messagingSenderId: '205024559787',
  appId: '1:205024559787:web:8474feff30dcf97890adee',
  measurementId: 'G-WMGY86PNJW',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
