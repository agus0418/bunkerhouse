import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaUndo } from 'react-icons/fa';
import { settingsUtils } from '@/lib/settings';
import { Settings as SettingsType } from '@/types/firebase';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType>({
    restaurantName: 'Bunker House',
    enableRatings: true,
    enableWaiterRatings: true,
    requireTableNumber: true,
    darkMode: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Cargar configuraciones iniciales
    const loadSettings = async () => {
      try {
        const savedSettings = await settingsUtils.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error('Error al cargar configuraciones:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Suscribirse a cambios en tiempo real
    const unsubscribe = settingsUtils.subscribeToSettings((newSettings) => {
      if (newSettings) {
        setSettings(newSettings);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await settingsUtils.saveSettings(settings);
      if (success) {
        toast.success('Configuración guardada exitosamente');
      } else {
        toast.error('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const defaultSettings = await settingsUtils.getSettings();
      if (defaultSettings) {
        setSettings(defaultSettings);
        toast.success('Configuración restablecida');
      }
    } catch (error) {
      console.error('Error al restablecer configuraciones:', error);
      toast.error('Error al restablecer la configuración');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Configuración</h2>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Restaurante */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Información del Restaurante</h3>
            
            <div>
              <label className="block text-gray-400 mb-2">Nombre del Restaurante</label>
              <input
                type="text"
                name="restaurantName"
                value={settings.restaurantName}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* Preferencias */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Preferencias</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enableRatings"
                  checked={settings.enableRatings}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-400">Habilitar valoraciones de productos</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enableWaiterRatings"
                  checked={settings.enableWaiterRatings}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-400">Habilitar valoraciones de mozos</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requireTableNumber"
                  checked={settings.requireTableNumber}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-400">Requerir número de mesa en valoraciones</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-400">Modo oscuro</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FaSave />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
          <button
            onClick={handleReset}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FaUndo />
            <span>Restablecer</span>
          </button>
        </div>
      </div>
    </div>
  );
} 