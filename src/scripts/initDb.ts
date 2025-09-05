import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { products } from '@/data/products';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Categorías predefinidas
const categories = {
  BEBIDAS: [
    'VINOS TINTOS',
    'VINOS BLANCOS',
    'CHAMPAGNE',
    'CERVEZAS',
    'SIN ALCOHOL',
    'TRAGOS',
    'LIMONADAS'
  ],
  COMIDAS: [
    'FRIOS',
    'PICADAS',
    'ENTRE PANES CALIENTES',
    'BURGERS',
    'AL WOK (sin tacc)',
    'PAPAS',
    'PIZZAS',
    'DULCES'
  ]
};

export async function initializeDatabase() {
  try {
    // Inicializar Firebase solo si no hay instancias existentes
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    console.log('Iniciando inicialización de la base de datos...');

    // Verificar si ya existen categorías
    const categoriesRef = doc(db, 'categories', 'main');
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    
    if (categoriesSnap.empty) {
      console.log('Inicializando categorías...');
      await setDoc(categoriesRef, categories);
      console.log('Categorías inicializadas correctamente');
    } else {
      console.log('Las categorías ya existen, omitiendo inicialización...');
    }

    // Verificar si ya existen productos
    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(productsRef);

    if (productsSnap.empty) {
      console.log('Inicializando productos...');
      for (const product of products) {
        try {
          const productWithVariations = {
            ...product,
            variations: [],
            description: product.description || '',
          };
          await setDoc(doc(db, 'products', product.id.toString()), productWithVariations);
          console.log(`Producto ${product.name} inicializado correctamente`);
        } catch (error) {
          console.error(`Error al inicializar producto ${product.name}:`, error);
        }
      }
      console.log('Productos inicializados correctamente');
    } else {
      console.log('Los productos ya existen, omitiendo inicialización...');
    }

    console.log('Inicialización completada exitosamente');
    return { success: true, message: 'Base de datos inicializada correctamente' };
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    throw new Error('Error al inicializar la base de datos: ' + (error as Error).message);
  }
} 