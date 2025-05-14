'use client';

import { useState, useEffect } from 'react';
import { initializeDatabase } from '@/scripts/initDb';

export default function InitPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleInitialize = async () => {
    if (!isMounted) return;
    
    try {
      setIsLoading(true);
      setMessage(null);
      
      const result = await initializeDatabase();
      
      setMessage({
        type: 'success',
        text: result.message
      });
    } catch (error) {
      console.error('Error durante la inicialización:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error desconocido durante la inicialización'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizado del servidor
  if (!isMounted) {
    return null;
  }

  // Renderizado del cliente
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Inicialización de Base de Datos
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Este proceso inicializará la base de datos con datos predefinidos.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-900/50 text-green-200' 
                : 'bg-red-900/50 text-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleInitialize}
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
              isLoading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gray-700 hover:bg-gray-600'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Inicializando...
              </div>
            ) : (
              'Inicializar Base de Datos'
            )}
          </button>

          <div className="text-sm text-gray-400 text-center">
            <p>Este proceso es seguro y solo se ejecutará si la base de datos está vacía.</p>
            <p className="mt-1">Los datos existentes no serán modificados.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 