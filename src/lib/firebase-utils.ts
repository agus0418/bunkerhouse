import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseCategories, Product, Variation as FirebaseVariationType } from '@/types/firebase';

export const firebaseUtils = {
  // Productos
  async getProducts(): Promise<Product[]> {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        image: data.image || '',
        category: data.category || '',
        type: data.type || '',
        variations: (data.variations || []).map((v: Partial<FirebaseVariationType>, index: number) => ({
          id: v.id || Date.now() + index,
          name: v.name || 'Nombre no disponible',
          price: v.price === undefined ? 0 : v.price,
          tags: v.tags || []
        })),
      } as Product;
    });
  },

  async getProductById(id: string): Promise<Product | null> {
    const productDocRef = doc(db, 'products', id);
    const docSnap = await getDoc(productDocRef);
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      description: data.description || '',
      price: data.price || 0,
      image: data.image || '',
      category: data.category || '',
      type: data.type || '',
      variations: (data.variations || []).map((v: Partial<FirebaseVariationType>, index: number) => ({
        id: v.id || Date.now() + index,
        name: v.name || 'Nombre no disponible',
        price: v.price === undefined ? 0 : v.price,
        tags: v.tags || []
      })),
    } as Product;
  },

  async saveProduct(product: Omit<Product, 'id'>): Promise<string> {
    const newProductRef = doc(collection(db, 'products'));
    await setDoc(newProductRef, product); 
    return newProductRef.id;
  },

  async updateProduct(id: string, data: Partial<Omit<Product, 'id'>>) {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, data);
  },

  async deleteProduct(id: string) {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  },

  // Categorías
  async getCategories(): Promise<FirebaseCategories | null> {
    const categoriesRef = doc(db, 'categories', 'main');
    const docSnap = await getDoc(categoriesRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as FirebaseCategories;
  },

  async saveCategories(categories: FirebaseCategories) {
    const categoriesRef = doc(db, 'categories', 'main');
    await setDoc(categoriesRef, categories);
  },

  async updateCategories(categories: Partial<FirebaseCategories>) {
    const categoriesRef = doc(db, 'categories', 'main');
    await updateDoc(categoriesRef, categories);
  }
}; 