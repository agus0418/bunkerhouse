import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { waiters } from '@/data/waiters';

export const initializeWaiters = async () => {
  try {
    const waitersRef = collection(db, 'waiters');
    
    // Crear cada mozo en Firestore
    for (const waiter of waiters) {
      const waiterRef = doc(waitersRef, waiter.id);
      await setDoc(waiterRef, {
        name: waiter.name,
        photo: waiter.photo,
        ratings: waiter.ratings,
        averageRating: waiter.averageRating,
        isActive: waiter.isActive
      });
    }
    
    console.log('Mozos inicializados correctamente');
  } catch (error) {
    console.error('Error al inicializar mozos:', error);
    throw error;
  }
}; 