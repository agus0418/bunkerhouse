import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Settings } from '@/types/firebase';

const SETTINGS_DOC_ID = 'restaurant_settings';

export const settingsUtils = {
  // Obtener configuraciones
  async getSettings(): Promise<Settings | null> {
    try {
      const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Settings;
      }
      
      // Si no existe, crear con valores por defecto
      const defaultSettings: Settings = {
        restaurantName: 'Bunker House',
        enableRatings: true,
        enableWaiterRatings: true,
        requireTableNumber: true,
        darkMode: true,
        updatedAt: new Date()
      };
      
      await setDoc(settingsRef, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      return null;
    }
  },

  // Guardar configuraciones
  async saveSettings(settings: Settings): Promise<boolean> {
    try {
      const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      return false;
    }
  },

  // Suscribirse a cambios en las configuraciones
  subscribeToSettings(callback: (settings: Settings | null) => void): () => void {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    
    return onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Settings);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error en suscripción a configuraciones:', error);
      callback(null);
    });
  }
}; 