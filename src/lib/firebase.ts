import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA6jSrBZtyIHQ1awz-srvYiZdx-7R20qs0",
  authDomain: "bunkerhouse-794fd.firebaseapp.com",
  projectId: "bunkerhouse-794fd",
  storageBucket: "bunkerhouse-794fd.firebasestorage.app",
  messagingSenderId: "1056317163273",
  appId: "1:1056317163273:web:3b08b6c2097d7b25c335d8",
  measurementId: "G-23M9JJ0HM7"
};

// Inicializar Firebase
let app: FirebaseApp;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase inicializado correctamente');
  } else {
    app = getApps()[0];
    console.log('Usando instancia existente de Firebase');
  }
  
  db = getFirestore(app);
  console.log('Firestore inicializado correctamente');
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
  throw error;
}

export { db }; 