import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDiiKqZWL3X880z1Lcy5_QGXgjSaOHUdhA",
  authDomain: "nytzer-vision.firebaseapp.com",
  projectId: "nytzer-vision",
  storageBucket: "nytzer-vision.firebasestorage.app",
  messagingSenderId: "924366104460",
  appId: "1:924366104460:web:efaed3a6bedd89c6db98a9",
  measurementId: "G-6JR9TFLKPX"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);
