import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseProduct, FirebaseCategories } from '@/types/firebase';

export const firebaseUtils = {
  // Productos
  async getProducts() {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map(doc => ({
      id: Number(doc.id),
      ...doc.data()
    } as FirebaseProduct));
  },

  async getProductById(id: number) {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('id', '==', id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return {
      id: Number(snapshot.docs[0].id),
      ...snapshot.docs[0].data()
    } as FirebaseProduct;
  },

  async saveProduct(product: FirebaseProduct) {
    const productRef = doc(db, 'products', product.id.toString());
    await setDoc(productRef, product);
  },

  async updateProduct(id: number, data: Partial<FirebaseProduct>) {
    const productRef = doc(db, 'products', id.toString());
    await updateDoc(productRef, data);
  },

  async deleteProduct(id: number) {
    const productRef = doc(db, 'products', id.toString());
    await deleteDoc(productRef);
  },

  // Categorías
  async getCategories() {
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